import { terraClassicEndpoints } from "../data/terra-classic-endpoints";

/**
 * Measured staking APR for Terra Classic (columbus-5).
 *
 * Instead of annualizing the oracle reward pool, this measures the rewards that were
 * actually credited to delegators over the last `windowBlocks` blocks. It reads the
 * distribution module's own F1 accounting: for one unchanged delegation per bonded
 * validator, pending rewards at the window end minus pending rewards at the window start
 * (same shares, no withdrawal in between) is exactly what each staked token earned. That
 * includes both the oracle reward drip (EndBlock) and block fee rewards (BeginBlock).
 *
 * Rewards paid in uluna and uusd are counted. uusd is converted to LUNC at the on-chain
 * Terraswap LUNC/USTC pool price (not the oracle uusd rate, which tracks USD, not USTC).
 * Other legacy denoms are a negligible share (< 0.05% APR) and are ignored.
 */

export const STAKING_APR_TTL_MS = 6 * 60 * 60 * 1000;
export const STAKING_APR_DEFAULT_WINDOW = 10_000;
// Oracle rewards are paid once per 5-block vote period. Keep windows a whole number of periods.
const VOTE_PERIOD = 5;
const TERRASWAP_LUNC_USTC_PAIR = "terra1tndcaqxkpc5ce9qee5ggqf430mr2z3pefe5wj6";
const MIN_COVERAGE = 0.9;
const DELEGATIONS_TO_TRY = 5;
const CONCURRENCY = 6;
const REQUEST_TIMEOUT_MS = 15_000;
const SECONDS_PER_YEAR = 365.25 * 24 * 60 * 60;

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

type Coin = { readonly denom: string; readonly amount: string };
type Validator = {
  readonly operator_address: string;
  readonly tokens: string;
  readonly delegator_shares: string;
  readonly commission: { readonly commission_rates: { readonly rate: string } };
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// Archive LCDs can sit behind caches that ignore x-cosmos-block-height, so the height is also
// put in the URL. Pruned nodes answer "version does not exist"; the next endpoint is tried.
const lcd = async <T>(path: string, height?: number): Promise<T> => {
  const endpoints = terraClassicEndpoints.lcd;
  let lastError: unknown = null;
  for (let attempt = 0; attempt < endpoints.length * 2; attempt += 1) {
    const base = endpoints[attempt % endpoints.length];
    const separator = path.includes("?") ? "&" : "?";
    const url = height ? `${base}${path}${separator}_h=${height}` : `${base}${path}`;
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          ...(height ? { "x-cosmos-block-height": String(height) } : {}),
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (response.ok) {
        return (await response.json()) as T;
      }
      lastError = new Error(`${response.status} ${url}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(250);
  }
  throw lastError instanceof Error ? lastError : new Error(`LCD request failed: ${path}`);
};

const mapLimit = async <T, R>(items: readonly T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  let next = 0;
  const run = async (): Promise<void> => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
};

const blockHeader = async (height?: number): Promise<{ height: number; time: number }> => {
  const path = height ? `/cosmos/base/tendermint/v1beta1/blocks/${height}` : "/cosmos/base/tendermint/v1beta1/blocks/latest";
  const data = await lcd<{ block: { header: { height: string; time: string } } }>(path);
  return { height: Number(data.block.header.height), time: Date.parse(data.block.header.time) };
};

const ustcToLuncRate = async (height: number): Promise<number> => {
  const query = btoa(JSON.stringify({ pool: {} }));
  const data = await lcd<{ data: { assets: { info: { native_token?: { denom: string } }; amount: string }[] } }>(
    `/cosmwasm/wasm/v1/contract/${TERRASWAP_LUNC_USTC_PAIR}/smart/${query}`,
    height,
  );
  const amountOf = (denom: string): number => Number(
    data.data.assets.find((asset) => asset.info.native_token?.denom === denom)?.amount ?? 0,
  );
  const lunc = amountOf("uluna");
  const ustc = amountOf("uusd");
  if (!(lunc > 0 && ustc > 0)) {
    throw new Error("LUNC/USTC pool is empty");
  }
  return lunc / ustc;
};

const valueInUluna = (coins: readonly Coin[] | undefined, ustcToLunc: number): number => (coins ?? []).reduce(
  (sum, coin) => {
    if (coin.denom === "uluna") return sum + Number(coin.amount);
    if (coin.denom === "uusd") return sum + Number(coin.amount) * ustcToLunc;
    return sum;
  },
  0,
);

/** Rewards earned per staked uluna over the window for one validator, or null if no clean delegation was found. */
const measureValidator = async (
  validator: Validator,
  fromHeight: number,
  toHeight: number,
  ustcToLunc: number,
): Promise<number | null> => {
  const operator = validator.operator_address;
  const tokens = Number(validator.tokens);
  const shares = Number(validator.delegator_shares);
  if (!(tokens > 0 && shares > 0)) return null;
  const list = await lcd<{ delegation_responses?: { delegation: { delegator_address: string; shares: string } }[] }>(
    `/cosmos/staking/v1beta1/validators/${operator}/delegations?pagination.limit=${DELEGATIONS_TO_TRY}`,
    toHeight,
  );
  for (const entry of list.delegation_responses ?? []) {
    const delegator = entry.delegation.delegator_address;
    const endShares = Number(entry.delegation.shares);
    try {
      const [start, before, after] = await Promise.all([
        lcd<{ delegation_response?: { delegation: { shares: string } } }>(
          `/cosmos/staking/v1beta1/validators/${operator}/delegations/${delegator}`,
          fromHeight,
        ),
        lcd<{ rewards?: Coin[] }>(`/cosmos/distribution/v1beta1/delegators/${delegator}/rewards/${operator}`, fromHeight),
        lcd<{ rewards?: Coin[] }>(`/cosmos/distribution/v1beta1/delegators/${delegator}/rewards/${operator}`, toHeight),
      ]);
      const startShares = Number(start.delegation_response?.delegation.shares ?? 0);
      // A changed delegation or a withdrawal resets the reward period; such a delegation is skipped.
      if (!(endShares > 0) || Math.abs(startShares - endShares) > endShares * 1e-9) continue;
      const earned = valueInUluna(after.rewards, ustcToLunc) - valueInUluna(before.rewards, ustcToLunc);
      if (!(earned > 0)) continue;
      return earned / (endShares * (tokens / shares));
    } catch {
      // Delegation did not exist at the window start, or the node failed: try the next one.
    }
  }
  return null;
};

export const measureStakingApr = async (windowBlocks: number = STAKING_APR_DEFAULT_WINDOW): Promise<StakingAprSnapshot> => {
  const window = Math.max(VOTE_PERIOD, Math.round(windowBlocks / VOTE_PERIOD) * VOTE_PERIOD);
  const latest = await blockHeader();
  // Stay a few blocks behind the tip so every LCD in the pool has the state.
  const toHeight = latest.height - 5;
  const fromHeight = toHeight - window;
  const [start, end, ustcToLunc, bonded] = await Promise.all([
    blockHeader(fromHeight),
    blockHeader(toHeight),
    ustcToLuncRate(toHeight),
    lcd<{ validators: Validator[] }>("/cosmos/staking/v1beta1/validators?status=BOND_STATUS_BONDED&pagination.limit=300", toHeight),
  ]);
  const blockTimeSec = (end.time - start.time) / 1000 / window;
  if (!(blockTimeSec > 0)) throw new Error("Invalid block time");
  const blocksPerYear = SECONDS_PER_YEAR / blockTimeSec;

  const rates = await mapLimit(bonded.validators, CONCURRENCY, (validator) => (
    measureValidator(validator, fromHeight, toHeight, ustcToLunc)
  ));
  let totalTokens = 0;
  let coveredTokens = 0;
  let postWeighted = 0;
  let preWeighted = 0;
  bonded.validators.forEach((validator, index) => {
    const tokens = Number(validator.tokens);
    totalTokens += tokens;
    const rate = rates[index];
    if (rate === null || rate === undefined) return;
    const commission = Number(validator.commission.commission_rates.rate);
    coveredTokens += tokens;
    postWeighted += rate * tokens;
    preWeighted += (commission < 1 ? rate / (1 - commission) : rate) * tokens;
  });
  const bondedCoverage = totalTokens > 0 ? coveredTokens / totalTokens : 0;
  if (bondedCoverage < MIN_COVERAGE) {
    throw new Error(`Only ${(bondedCoverage * 100).toFixed(1)}% of bonded stake could be measured`);
  }
  const annualize = (perWindow: number): number => (perWindow / coveredTokens) * (blocksPerYear / window) * 100;
  return {
    apr: annualize(preWeighted),
    aprPostCommission: annualize(postWeighted),
    basis: "pre-commission",
    method: "measured-delegation-rewards",
    windowBlocks: window,
    fromHeight,
    toHeight,
    blockTimeSec,
    bondedCoverage,
    ustcToLunc,
    computedAt: new Date().toISOString(),
  };
};

let cached: StakingAprSnapshot | null = null;
let inflight: Promise<StakingAprSnapshot> | null = null;

/** Cached for STAKING_APR_TTL_MS per instance; concurrent misses share one measurement. A stale value is served if a refresh fails. */
export const getStakingAprSnapshot = async (windowBlocks?: number): Promise<StakingAprSnapshot> => {
  if (cached && Date.now() - Date.parse(cached.computedAt) < STAKING_APR_TTL_MS) {
    return cached;
  }
  inflight ??= measureStakingApr(windowBlocks)
    .then((snapshot) => {
      cached = snapshot;
      return snapshot;
    })
    .catch((error: unknown) => {
      if (cached) return cached;
      throw error;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
};

export const parseWindowBlocks = (value: string | undefined): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 100 && parsed <= 100_000 ? parsed : undefined;
};
