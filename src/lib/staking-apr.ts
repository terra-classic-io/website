import { terraClassicEndpoints } from "../data/terra-classic-endpoints";
import bakedFallback from "../generated/staking-apr-fallback.json";

/**
 * Measured staking APR for Terra Classic (columbus-5).
 *
 * Measures the rewards actually credited to delegators over the last `windowBlocks` blocks,
 * using the distribution module's own F1 accounting: for one unchanged delegation per bonded
 * validator, pending rewards at the window end minus pending rewards at the window start
 * is exactly what each staked token earned. That includes both the oracle reward drip
 * (EndBlock) and block fee rewards (BeginBlock, after community tax).
 *
 * Rewards paid in uluna and uusd are counted; uusd is converted to LUNC at the on-chain
 * Terraswap LUNC/USTC pool price (the oracle uusd rate tracks USD, not USTC). Other legacy
 * denoms are a negligible share (< 0.05% APR) and are ignored.
 *
 * Every validator is measured (per-validator rates differ by up to ~5%, so sampling a few
 * large validators would bias the result). To stay within small per-request subrequest limits
 * (Cloudflare Workers Free: 50) the measurement is a resumable job: each call spends at most
 * `budget` HTTP requests, saves its progress in a state store, and always returns the last
 * good snapshot, falling back to a value baked in at build time. It never returns nothing.
 */

export const STAKING_APR_TTL_MS = 6 * 60 * 60 * 1000;
export const STAKING_APR_DEFAULT_WINDOW = 10_000;
/** Per-request HTTP budget used by the Worker; stays well below the 50-subrequest Free plan limit. */
export const STAKING_APR_WORKER_BUDGET = 40;
// Oracle rewards are paid once per 5-block vote period; windows are whole periods.
const VOTE_PERIOD = 5;
const TERRASWAP_LUNC_USTC_PAIR = "terra1tndcaqxkpc5ce9qee5ggqf430mr2z3pefe5wj6";
const MIN_COVERAGE = 0.9;
const DELEGATIONS_TO_TRY = 5;
const JOB_MAX_AGE_MS = 2 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 12_000;
const SECONDS_PER_YEAR = 365.25 * 24 * 60 * 60;
// Start of a job: latest header, two window headers, LUNC/USTC pool, bonded validator list.
const JOB_START_COST = 5;
// Minimum budget to attempt one validator: delegation list + one candidate (3 requests).
const VALIDATOR_MIN_COST = 4;

export type StakingAprSnapshot = {
  readonly apr: number;
  readonly aprPostCommission: number;
  readonly basis: "pre-commission";
  readonly method: "measured-delegation-rewards";
  readonly windowBlocks: number;
  readonly fromHeight: number;
  readonly toHeight: number;
  readonly blockTimeSec: number;
  readonly bondedCoverage: number;
  readonly ustcToLunc: number;
  readonly computedAt: string;
};

export type StakingAprResult = StakingAprSnapshot & {
  /** "fresh": measured within the TTL; "stale": older last-good value; "baked": build-time fallback. */
  readonly freshness: "fresh" | "stale" | "baked";
  /** Validators measured so far in a refresh that is still running, if any. */
  readonly refreshProgress?: string;
  /** HTTP requests spent by this call. */
  readonly subrequests: number;
};

type ValidatorInfo = { readonly op: string; readonly tokens: number; readonly shares: number; readonly commission: number };

type Job = {
  readonly startedAt: number;
  readonly window: number;
  readonly fromHeight: number;
  readonly toHeight: number;
  readonly blockTimeSec: number;
  readonly ustcToLunc: number;
  readonly validators: readonly ValidatorInfo[];
  /** Earned uluna per staked uluna over the window; null when no clean delegation was found. */
  readonly rates: (number | null)[];
};

export type StakingAprState = {
  readonly lastGood: StakingAprSnapshot | null;
  readonly job: Job | null;
};

export interface StakingAprStore {
  get(): Promise<StakingAprState | null>;
  put(state: StakingAprState): Promise<void>;
}

export type StakingAprOptions = {
  readonly windowBlocks?: number;
  readonly budget?: number;
  readonly lcdEndpoints?: readonly string[];
};

type Coin = { readonly denom: string; readonly amount: string };

class BudgetExceeded extends Error {}

class Lcd {
  used = 0;

  constructor(private readonly endpoints: readonly string[], private readonly budget: number) {}

  get remaining(): number {
    return this.budget - this.used;
  }

  // Archive LCDs can sit behind caches that ignore x-cosmos-block-height, so the height is also put
  // in the URL. A failed or pruned node is retried once on the next endpoint. Every attempt counts.
  async get<T>(path: string, height?: number): Promise<T> {
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (this.used >= this.budget) throw new BudgetExceeded("subrequest budget exhausted");
      this.used += 1;
      const base = this.endpoints[(this.used + attempt) % this.endpoints.length];
      const separator = path.includes("?") ? "&" : "?";
      const url = height ? `${base}${path}${separator}_h=${height}` : `${base}${path}`;
      try {
        const response = await fetch(url, {
          headers: { Accept: "application/json", ...(height ? { "x-cosmos-block-height": String(height) } : {}) },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (response.ok) return (await response.json()) as T;
        lastError = new Error(`${response.status} ${url}`);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error ? lastError : new Error(`LCD request failed: ${path}`);
  }
}

const valueInUluna = (coins: readonly Coin[] | undefined, ustcToLunc: number): number => (coins ?? []).reduce(
  (sum, coin) => {
    if (coin.denom === "uluna") return sum + Number(coin.amount);
    if (coin.denom === "uusd") return sum + Number(coin.amount) * ustcToLunc;
    return sum;
  },
  0,
);

const blockHeader = async (lcd: Lcd, height?: number): Promise<{ height: number; time: number }> => {
  const path = height ? `/cosmos/base/tendermint/v1beta1/blocks/${height}` : "/cosmos/base/tendermint/v1beta1/blocks/latest";
  const data = await lcd.get<{ block: { header: { height: string; time: string } } }>(path);
  return { height: Number(data.block.header.height), time: Date.parse(data.block.header.time) };
};

const startJob = async (lcd: Lcd, windowBlocks: number): Promise<Job> => {
  const window = Math.max(VOTE_PERIOD, Math.round(windowBlocks / VOTE_PERIOD) * VOTE_PERIOD);
  const latest = await blockHeader(lcd);
  // Stay a few blocks behind the tip so every LCD in the pool has the state.
  const toHeight = latest.height - 5;
  const fromHeight = toHeight - window;
  const poolQuery = btoa(JSON.stringify({ pool: {} }));
  const [start, end, pool, bonded] = await Promise.all([
    blockHeader(lcd, fromHeight),
    blockHeader(lcd, toHeight),
    lcd.get<{ data: { assets: { info: { native_token?: { denom: string } }; amount: string }[] } }>(
      `/cosmwasm/wasm/v1/contract/${TERRASWAP_LUNC_USTC_PAIR}/smart/${poolQuery}`,
      toHeight,
    ),
    lcd.get<{ validators: { operator_address: string; tokens: string; delegator_shares: string; commission: { commission_rates: { rate: string } } }[] }>(
      "/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&pagination.limit=300",
      toHeight,
    ),
  ]);
  const amountOf = (denom: string): number => Number(
    pool.data.assets.find((asset) => asset.info.native_token?.denom === denom)?.amount ?? 0,
  );
  const lunc = amountOf("uluna");
  const ustc = amountOf("uusd");
  const blockTimeSec = (end.time - start.time) / 1000 / window;
  if (!(lunc > 0 && ustc > 0) || !(blockTimeSec > 0) || bonded.validators.length === 0) {
    throw new Error("Unusable chain data for staking APR");
  }
  const validators = bonded.validators
    .map((validator) => ({
      op: validator.operator_address,
      tokens: Number(validator.tokens),
      shares: Number(validator.delegator_shares),
      commission: Number(validator.commission.commission_rates.rate),
    }))
    // Largest first, so coverage grows fastest while a refresh is in progress.
    .sort((first, second) => second.tokens - first.tokens);
  return {
    startedAt: Date.now(),
    window,
    fromHeight,
    toHeight,
    blockTimeSec,
    ustcToLunc: lunc / ustc,
    validators,
    rates: [],
  };
};

const measureValidator = async (lcd: Lcd, job: Job, validator: ValidatorInfo): Promise<number | null> => {
  if (!(validator.tokens > 0 && validator.shares > 0)) return null;
  const list = await lcd.get<{ delegation_responses?: { delegation: { delegator_address: string; shares: string } }[] }>(
    `/cosmos/staking/v1beta1/validators/${validator.op}/delegations?pagination.limit=${DELEGATIONS_TO_TRY}`,
    job.toHeight,
  );
  for (const entry of list.delegation_responses ?? []) {
    if (lcd.remaining < 3) throw new BudgetExceeded("subrequest budget exhausted");
    const delegator = entry.delegation.delegator_address;
    const endShares = Number(entry.delegation.shares);
    try {
      const [start, before, after] = await Promise.all([
        lcd.get<{ delegation_response?: { delegation: { shares: string } } }>(
          `/cosmos/staking/v1beta1/validators/${validator.op}/delegations/${delegator}`,
          job.fromHeight,
        ),
        lcd.get<{ rewards?: Coin[] }>(`/cosmos/distribution/v1beta1/delegators/${delegator}/rewards/${validator.op}`, job.fromHeight),
        lcd.get<{ rewards?: Coin[] }>(`/cosmos/distribution/v1beta1/delegators/${delegator}/rewards/${validator.op}`, job.toHeight),
      ]);
      const startShares = Number(start.delegation_response?.delegation.shares ?? 0);
      // A changed delegation or a withdrawal resets the reward period; such a delegation is skipped.
      if (!(endShares > 0) || Math.abs(startShares - endShares) > endShares * 1e-9) continue;
      const earned = valueInUluna(after.rewards, job.ustcToLunc) - valueInUluna(before.rewards, job.ustcToLunc);
      if (!(earned > 0)) continue;
      return earned / (endShares * (validator.tokens / validator.shares));
    } catch (error) {
      if (error instanceof BudgetExceeded) throw error;
      // Delegation did not exist at the window start, or the node failed: try the next one.
    }
  }
  return null;
};

const finishJob = (job: Job): StakingAprSnapshot | null => {
  let totalTokens = 0;
  let coveredTokens = 0;
  let postWeighted = 0;
  let preWeighted = 0;
  job.validators.forEach((validator, index) => {
    totalTokens += validator.tokens;
    const rate = job.rates[index];
    if (rate === null || rate === undefined) return;
    coveredTokens += validator.tokens;
    postWeighted += rate * validator.tokens;
    preWeighted += (validator.commission < 1 ? rate / (1 - validator.commission) : rate) * validator.tokens;
  });
  const bondedCoverage = totalTokens > 0 ? coveredTokens / totalTokens : 0;
  if (bondedCoverage < MIN_COVERAGE) return null;
  const blocksPerYear = SECONDS_PER_YEAR / job.blockTimeSec;
  const annualize = (perWindow: number): number => (perWindow / coveredTokens) * (blocksPerYear / job.window) * 100;
  return {
    apr: annualize(preWeighted),
    aprPostCommission: annualize(postWeighted),
    basis: "pre-commission",
    method: "measured-delegation-rewards",
    windowBlocks: job.window,
    fromHeight: job.fromHeight,
    toHeight: job.toHeight,
    blockTimeSec: job.blockTimeSec,
    bondedCoverage,
    ustcToLunc: job.ustcToLunc,
    computedAt: new Date().toISOString(),
  };
};

export const BAKED_STAKING_APR = bakedFallback as StakingAprSnapshot;

const isFresh = (snapshot: StakingAprSnapshot | null): boolean => (
  snapshot !== null && Date.now() - Date.parse(snapshot.computedAt) < STAKING_APR_TTL_MS
);

/**
 * Advances (or starts) the measurement within `budget` HTTP requests and returns the best value
 * available. Never throws for chain/network problems: it falls back to the last good or baked value.
 */
export const refreshStakingApr = async (store: StakingAprStore, options: StakingAprOptions = {}): Promise<StakingAprResult> => {
  const budget = options.budget ?? Number.POSITIVE_INFINITY;
  const lcd = new Lcd(options.lcdEndpoints?.length ? options.lcdEndpoints : terraClassicEndpoints.lcd, budget);
  let state: StakingAprState = { lastGood: null, job: null };
  try {
    state = (await store.get()) ?? state;
  } catch (error) {
    console.warn("Staking APR state lookup failed", error);
  }
  let { lastGood, job } = state;

  if (!isFresh(lastGood) || job) {
    try {
      if (job && Date.now() - job.startedAt > JOB_MAX_AGE_MS) job = null;
      if (!job) {
        if (lcd.remaining < JOB_START_COST) throw new BudgetExceeded("budget too small");
        job = await startJob(lcd, options.windowBlocks ?? STAKING_APR_DEFAULT_WINDOW);
      }
      while (job.rates.length < job.validators.length && lcd.remaining >= VALIDATOR_MIN_COST) {
        const validator = job.validators[job.rates.length];
        let rate: number | null = null;
        try {
          rate = await measureValidator(lcd, job, validator);
        } catch (error) {
          if (error instanceof BudgetExceeded) break; // resume this validator next call
          rate = null; // node failure on the list call: count as unmeasured
        }
        job.rates.push(rate);
      }
      if (job.rates.length >= job.validators.length) {
        const snapshot = finishJob(job);
        if (snapshot) lastGood = snapshot;
        job = null;
      }
    } catch (error) {
      if (!(error instanceof BudgetExceeded)) {
        console.warn("Staking APR refresh failed", error);
        job = null;
      }
    }
    try {
      await store.put({ lastGood, job });
    } catch (error) {
      console.warn("Staking APR state write failed", error);
    }
  }

  const best = lastGood ?? BAKED_STAKING_APR;
  return {
    ...best,
    freshness: lastGood ? (isFresh(lastGood) ? "fresh" : "stale") : "baked",
    ...(job ? { refreshProgress: `${job.rates.length}/${job.validators.length}` } : {}),
    subrequests: lcd.used,
  };
};

/** In-memory store (Node server, scripts). */
export const createMemoryStore = (): StakingAprStore => {
  let state: StakingAprState | null = null;
  return {
    get: async () => state,
    put: async (next) => {
      state = next;
    },
  };
};

const memoryStore = createMemoryStore();
let inflight: Promise<StakingAprResult> | null = null;

/** Node server entry: unlimited budget, one shared in-memory state, concurrent calls coalesced. */
export const getStakingAprSnapshot = async (windowBlocks?: number): Promise<StakingAprResult> => {
  inflight ??= refreshStakingApr(memoryStore, { windowBlocks }).finally(() => {
    inflight = null;
  });
  return inflight;
};

export const parseWindowBlocks = (value: string | undefined): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 100 && parsed <= 100_000 ? parsed : undefined;
};

export const parseEndpoints = (value: string | undefined): string[] | undefined => {
  const list = (value ?? "").split(",").map((entry) => entry.trim().replace(/\/+$/, "")).filter((entry) => /^https?:\/\//.test(entry));
  return list.length > 0 ? list : undefined;
};
