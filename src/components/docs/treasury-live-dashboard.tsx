import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Clock3,
  Coins,
  Database,
  Landmark,
  RefreshCw,
  Vote,
} from "lucide-react";
import { stablecoinAssets, type StablecoinAsset } from "../../data/stablecoins";

type DecCoin = {
  readonly denom: string;
  readonly amount: string;
};

type GovernanceProposal = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly status: string;
  readonly votingEndTime?: string;
};

type TreasurySnapshot = {
  readonly holdings: readonly DecCoin[];
  readonly ibcAssetCount: number;
  readonly recentProposals: readonly GovernanceProposal[];
  readonly activeProposalCount?: number;
  readonly blockHeight?: string;
  readonly blockTime?: string;
  readonly fetchedAt: string;
  readonly source: string;
};

type LoadStatus = "loading" | "refreshing" | "ready" | "error";

type TreasuryLiveDashboardProps = {
  readonly assetUsdPrices: Readonly<Record<string, number>>;
};

type FetchResult<T> = {
  readonly data: T;
  readonly endpoint: string;
};

const LCD_ENDPOINTS = [
  "https://terra-classic-lcd.publicnode.com",
  "https://lcd.terra-classic.hexxagon.io",
  "https://api-lunc-lcd.binodes.com",
] as const;

const COMMUNITY_POOL_PATH = "/cosmos/distribution/v1beta1/community_pool";
const LATEST_BLOCK_PATH = "/cosmos/base/tendermint/v1beta1/blocks/latest";
const RECENT_PROPOSALS_PATH = "/cosmos/gov/v1/proposals?pagination.limit=6&pagination.reverse=true";
const VOTING_PROPOSALS_PATH = "/cosmos/gov/v1/proposals?proposal_status=PROPOSAL_STATUS_VOTING_PERIOD&pagination.limit=100";
const DEPOSIT_PROPOSALS_PATH = "/cosmos/gov/v1/proposals?proposal_status=PROPOSAL_STATUS_DEPOSIT_PERIOD&pagination.limit=100";
const REFRESH_INTERVAL_MS = 120_000;
const MICRO_UNITS_PER_DISPLAY_UNIT = 1_000_000;
const INITIAL_HOLDINGS_COUNT = 8;

const assetByDenom = new Map<string, StablecoinAsset>(
  stablecoinAssets.map((asset) => [asset.denom, asset]),
);
const assetOrderByDenom = new Map<string, number>(
  stablecoinAssets.map((asset, index) => [asset.denom, index]),
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function parseCommunityPool(payload: unknown): readonly DecCoin[] {
  if (!isRecord(payload) || !Array.isArray(payload.pool)) {
    throw new Error("The LCD returned an invalid Community Pool response.");
  }

  return payload.pool.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }
    const denom = readString(entry.denom);
    const amount = readString(entry.amount);
    return denom && amount ? [{ denom, amount }] : [];
  });
}

function readProposalMetadataTitle(metadata: unknown): string | undefined {
  const metadataText = readString(metadata);
  if (!metadataText?.startsWith("{")) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(metadataText);
    return isRecord(parsed) ? readString(parsed.title) : undefined;
  } catch {
    return undefined;
  }
}

function parseGovernanceProposals(payload: unknown): readonly GovernanceProposal[] {
  if (!isRecord(payload) || !Array.isArray(payload.proposals)) {
    throw new Error("The LCD returned an invalid governance response.");
  }

  return payload.proposals.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const id = readString(entry.id) ?? readString(entry.proposal_id);
    if (!id) {
      return [];
    }

    return [{
      id,
      title: readString(entry.title) ?? readProposalMetadataTitle(entry.metadata) ?? `Proposal #${id}`,
      summary: readString(entry.summary) ?? "Open the proposal to review its full on-chain content.",
      status: readString(entry.status) ?? "PROPOSAL_STATUS_UNSPECIFIED",
      votingEndTime: readString(entry.voting_end_time),
    }];
  });
}

function parseLatestBlock(payload: unknown): { readonly height?: string; readonly time?: string } {
  if (!isRecord(payload) || !isRecord(payload.block) || !isRecord(payload.block.header)) {
    return {};
  }

  return {
    height: readString(payload.block.header.height),
    time: readString(payload.block.header.time),
  };
}

async function fetchJsonWithFallback<T>(
  path: string,
  parse: (payload: unknown) => T,
  signal: AbortSignal,
): Promise<FetchResult<T>> {
  let lastError: unknown;

  for (const endpoint of LCD_ENDPOINTS) {
    if (signal.aborted) {
      throw new DOMException("The request was aborted.", "AbortError");
    }

    try {
      const response = await fetch(`${endpoint}${path}`, {
        signal,
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`LCD request failed with status ${response.status}.`);
      }
      const payload: unknown = await response.json();
      return { data: parse(payload), endpoint };
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Every configured LCD endpoint failed.");
}

async function fetchOptional<T>(
  path: string,
  parse: (payload: unknown) => T,
  signal: AbortSignal,
): Promise<FetchResult<T> | undefined> {
  try {
    return await fetchJsonWithFallback(path, parse, signal);
  } catch (error) {
    if (signal.aborted) {
      throw error;
    }
    return undefined;
  }
}

function formatDisplayAmount(amount: string): string {
  const value = Number(amount) / MICRO_UNITS_PER_DISPLAY_UNIT;
  if (!Number.isFinite(value)) {
    return "Unavailable";
  }

  if (Math.abs(value) >= 1_000_000) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value);
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: value >= 1 ? 2 : 6,
  }).format(value);
}

function formatFullDisplayAmount(amount: string): string {
  const value = Number(amount) / MICRO_UNITS_PER_DISPLAY_UNIT;
  if (!Number.isFinite(value)) {
    return "Unavailable";
  }
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(value);
}

function calculateUsdValue(
  amount: string,
  symbol: string,
  assetUsdPrices: Readonly<Record<string, number>>,
): number | undefined {
  const displayAmount = Number(amount) / MICRO_UNITS_PER_DISPLAY_UNIT;
  const price = assetUsdPrices[symbol];
  const value = displayAmount * price;
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

function formatUsdValue(value?: number): string {
  if (value === undefined) {
    return "—";
  }
  if (value > 0 && value < 0.01) {
    return "< $0.01";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: value >= 1_000_000 ? "compact" : "standard",
    minimumFractionDigits: value >= 1_000_000 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatFullUsdValue(value?: number): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 1 ? 2 : 6,
  }).format(value);
}

function formatBlockHeight(height?: string): string {
  const value = Number(height);
  return Number.isFinite(value) ? new Intl.NumberFormat("en-US").format(value) : "Unavailable";
}

function formatDateTime(value?: string): string {
  if (!value) {
    return "Unavailable";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function proposalStatusLabel(status: string): string {
  return status
    .replace(/^PROPOSAL_STATUS_/, "")
    .split("_")
    .map((word) => `${word.slice(0, 1)}${word.slice(1).toLowerCase()}`)
    .join(" ");
}

function proposalStatusClass(status: string): string {
  if (status.endsWith("PASSED")) {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }
  if (status.endsWith("VOTING_PERIOD") || status.endsWith("DEPOSIT_PERIOD")) {
    return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
  }
  if (status.endsWith("REJECTED") || status.endsWith("FAILED")) {
    return "bg-rose-500/10 text-rose-700 dark:text-rose-300";
  }
  return "bg-slate-500/10 text-slate-600 dark:text-slate-300";
}

function DashboardSkeleton(): JSX.Element {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading on-chain Treasury data">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="h-32 animate-pulse rounded-2xl border border-slate-200/80 bg-slate-100/70 dark:border-white/10 dark:bg-white/[0.04]" />
      ))}
    </div>
  );
}

function TreasuryLiveDashboard({ assetUsdPrices }: TreasuryLiveDashboardProps): JSX.Element {
  const [snapshot, setSnapshot] = useState<TreasurySnapshot | undefined>();
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [showAllHoldings, setShowAllHoldings] = useState<boolean>(false);

  const requestRefresh = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadSnapshot = async () => {
      setStatus((current) => current === "ready" || current === "refreshing" ? "refreshing" : "loading");
      setErrorMessage("");

      try {
        const [poolResult, blockResult, recentResult, votingResult, depositResult] = await Promise.all([
          fetchJsonWithFallback(COMMUNITY_POOL_PATH, parseCommunityPool, controller.signal),
          fetchOptional(LATEST_BLOCK_PATH, parseLatestBlock, controller.signal),
          fetchOptional(RECENT_PROPOSALS_PATH, parseGovernanceProposals, controller.signal),
          fetchOptional(VOTING_PROPOSALS_PATH, parseGovernanceProposals, controller.signal),
          fetchOptional(DEPOSIT_PROPOSALS_PATH, parseGovernanceProposals, controller.signal),
        ]);

        if (controller.signal.aborted) {
          return;
        }

        const nativeHoldings = poolResult.data
          .filter((coin) => assetByDenom.has(coin.denom))
          .sort((left, right) => (
            (assetOrderByDenom.get(left.denom) ?? Number.MAX_SAFE_INTEGER)
            - (assetOrderByDenom.get(right.denom) ?? Number.MAX_SAFE_INTEGER)
          ));
        const activeProposalCount = votingResult && depositResult
          ? votingResult.data.length + depositResult.data.length
          : undefined;

        setSnapshot({
          holdings: nativeHoldings,
          ibcAssetCount: poolResult.data.filter((coin) => coin.denom.startsWith("ibc/")).length,
          recentProposals: recentResult?.data ?? [],
          activeProposalCount,
          blockHeight: blockResult?.data.height,
          blockTime: blockResult?.data.time,
          fetchedAt: new Date().toISOString(),
          source: poolResult.endpoint,
        });
        setStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.warn("Unable to load on-chain Treasury data", error);
        setErrorMessage("Live on-chain data is temporarily unavailable. The documentation below remains accessible.");
        setStatus("error");
      }
    };

    void loadSnapshot();
    const intervalId = window.setInterval(() => {
      void loadSnapshot();
    }, REFRESH_INTERVAL_MS);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [refreshKey]);

  const holdingsToDisplay = useMemo(
    () => showAllHoldings ? snapshot?.holdings ?? [] : snapshot?.holdings.slice(0, INITIAL_HOLDINGS_COUNT) ?? [],
    [showAllHoldings, snapshot?.holdings],
  );
  const luncHolding = snapshot?.holdings.find((coin) => coin.denom === "uluna");
  const ustcHolding = snapshot?.holdings.find((coin) => coin.denom === "uusd");
  const luncUsdValue = luncHolding ? calculateUsdValue(luncHolding.amount, "LUNC", assetUsdPrices) : undefined;
  const ustcUsdValue = ustcHolding ? calculateUsdValue(ustcHolding.amount, "USTC", assetUsdPrices) : undefined;

  return (
    <section id="on-chain-treasury" className="space-y-6" aria-labelledby="on-chain-treasury-title">
      <div className="rounded-3xl border border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-5 shadow-sm dark:border-blue-500/20 dark:from-blue-950/25 dark:via-[#061121] dark:to-[#061121] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-200 bg-blue-100/70 text-blue-600 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-400">
              <Landmark size={24} aria-hidden="true" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="on-chain-treasury-title" className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  On-chain Treasury snapshot
                </h2>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
                  ● Live chain data
                </span>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Current Community Pool balances and governance activity queried directly from Terra Classic public LCD endpoints.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={requestRefresh}
            disabled={status === "loading" || status === "refreshing"}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-600 disabled:cursor-wait disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-blue-500/40 dark:hover:text-blue-400"
          >
            <RefreshCw size={14} className={status === "loading" || status === "refreshing" ? "animate-spin" : ""} aria-hidden="true" />
            {status === "refreshing" ? "Refreshing" : "Refresh"}
          </button>
        </div>

        {errorMessage ? (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-300/70 bg-amber-50/80 p-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100" role="status">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        {!snapshot ? (
          <div className="mt-6">
            <DashboardSkeleton />
          </div>
        ) : (
          <>
            <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: "Community Pool LUNC",
                  value: luncHolding ? `${formatDisplayAmount(luncHolding.amount)} LUNC` : "Unavailable",
                  usdValue: luncUsdValue === undefined ? undefined : formatUsdValue(luncUsdValue),
                  icon: Coins,
                  detail: luncHolding ? formatFullDisplayAmount(luncHolding.amount) : undefined,
                },
                {
                  label: "Community Pool USTC",
                  value: ustcHolding ? `${formatDisplayAmount(ustcHolding.amount)} USTC` : "Unavailable",
                  usdValue: ustcUsdValue === undefined ? undefined : formatUsdValue(ustcUsdValue),
                  icon: Landmark,
                  detail: ustcHolding ? formatFullDisplayAmount(ustcHolding.amount) : undefined,
                },
                {
                  label: "Tracked denominations",
                  value: `${snapshot.holdings.length} native · ${snapshot.ibcAssetCount} IBC`,
                  usdValue: undefined,
                  icon: Database,
                },
                {
                  label: "Active proposals",
                  value: snapshot.activeProposalCount === undefined ? "Unavailable" : String(snapshot.activeProposalCount),
                  usdValue: undefined,
                  icon: Vote,
                },
              ].map((metric) => (
                <div key={metric.label} className="min-h-32 rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.035]">
                  <metric.icon size={18} className="text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <dt className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{metric.label}</dt>
                  <dd className="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-white" title={metric.detail}>{metric.value}</dd>
                  {metric.usdValue ? <p className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">≈ {metric.usdValue}</p> : null}
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5"><Database size={13} aria-hidden="true" /> Block {formatBlockHeight(snapshot.blockHeight)}</span>
              <span className="inline-flex items-center gap-1.5"><Clock3 size={13} aria-hidden="true" /> Block time {formatDateTime(snapshot.blockTime)}</span>
              <span>Refreshed {formatDateTime(snapshot.fetchedAt)}</span>
            </div>
          </>
        )}
      </div>

      {snapshot ? (
        <div className="space-y-6">
          <section id="treasury-holdings" className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 shadow-sm dark:border-white/10 dark:bg-white/[0.02]" aria-labelledby="treasury-holdings-title">
            <div className="border-b border-slate-200/80 px-5 py-5 dark:border-white/10 sm:px-6">
              <h2 id="treasury-holdings-title" className="text-xl font-semibold text-slate-950 dark:text-white">Community Pool holdings</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Native Terra Classic denominations held by the governed Community Pool, with indicative USD values from Vyntrex.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead className="bg-slate-50/80 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:bg-white/[0.025] dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3 sm:px-6">Asset</th>
                    <th className="px-4 py-3">Network denom</th>
                    <th className="px-5 py-3 text-right sm:px-6">Balance</th>
                    <th className="px-5 py-3 text-right sm:px-6">USD value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-white/10">
                  {holdingsToDisplay.map((holding) => {
                    const asset = assetByDenom.get(holding.denom);
                    if (!asset) {
                      return null;
                    }
                    const usdValue = calculateUsdValue(holding.amount, asset.symbol, assetUsdPrices);
                    return (
                      <tr key={holding.denom} className="text-sm text-slate-700 dark:text-slate-200">
                        <td className="px-5 py-3.5 sm:px-6">
                          <span className="flex items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-blue-200 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10">
                              {asset.logo ? <img src={asset.logo} alt="" className="h-7 w-7" /> : asset.glyph}
                            </span>
                            <span><strong className="block text-slate-950 dark:text-white">{asset.symbol}</strong><span className="block text-[10px] text-slate-500 dark:text-slate-400">{asset.name}</span></span>
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">{holding.denom}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-slate-950 dark:text-white sm:px-6" title={`${formatFullDisplayAmount(holding.amount)} ${asset.symbol}`}>
                          {formatDisplayAmount(holding.amount)} {asset.symbol}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-blue-600 dark:text-blue-400 sm:px-6" title={formatFullUsdValue(usdValue)}>
                          {usdValue === undefined ? "—" : `≈ ${formatUsdValue(usdValue)}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {snapshot.holdings.length > INITIAL_HOLDINGS_COUNT ? (
              <button
                type="button"
                onClick={() => setShowAllHoldings((current) => !current)}
                className="w-full border-t border-slate-200/80 px-5 py-3 text-xs font-semibold text-blue-600 transition hover:bg-blue-50 dark:border-white/10 dark:text-blue-400 dark:hover:bg-blue-500/[0.05]"
              >
                {showAllHoldings ? "Show primary holdings" : `Show all ${snapshot.holdings.length} native denominations`}
              </button>
            ) : null}
          </section>

          <section id="recent-proposals" className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 shadow-sm dark:border-white/10 dark:bg-white/[0.02]" aria-labelledby="recent-proposals-title">
            <div className="border-b border-slate-200/80 px-5 py-5 dark:border-white/10 sm:px-6">
              <h2 id="recent-proposals-title" className="text-xl font-semibold text-slate-950 dark:text-white">Recent governance proposals</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Latest proposals returned by the on-chain Governance v1 API.</p>
            </div>
            {snapshot.recentProposals.length > 0 ? (
              <ul className="divide-y divide-slate-200/70 dark:divide-white/10">
                {snapshot.recentProposals.map((proposal) => (
                  <li key={proposal.id}>
                    <a
                      href={`https://validator.info/terra-classic/governance/${proposal.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block px-5 py-4 transition hover:bg-blue-50/70 dark:hover:bg-blue-500/[0.05] sm:px-6"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Proposal #{proposal.id}</span>
                          <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-950 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">{proposal.title}</h3>
                        </div>
                        <ArrowUpRight size={15} className="mt-1 shrink-0 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400" aria-hidden="true" />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.13em] ${proposalStatusClass(proposal.status)}`}>{proposalStatusLabel(proposal.status)}</span>
                        {proposal.votingEndTime ? <span className="text-[10px] text-slate-500 dark:text-slate-400">Voting end: {formatDateTime(proposal.votingEndTime)}</span> : null}
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 py-8 text-sm text-slate-500 dark:text-slate-400 sm:px-6">Governance data is temporarily unavailable.</div>
            )}
          </section>
        </div>
      ) : null}

      {snapshot ? (
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-xs leading-5 text-slate-600 dark:border-white/10 dark:bg-white/[0.025] dark:text-slate-300">
          <strong className="text-slate-900 dark:text-white">Data scope.</strong> Community Pool balances are governed reserves, not a measurement of tradable DEX liquidity. USD equivalents are indicative calculations using the latest Vyntrex price available in the site; missing prices remain blank. Liquidity is specific to each market and pool contract. On-chain data source:{" "}
          <a href={`${snapshot.source}${COMMUNITY_POOL_PATH}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
            {new URL(snapshot.source).hostname}<ArrowUpRight size={12} className="ml-1 inline" aria-hidden="true" />
          </a>
        </div>
      ) : null}
    </section>
  );
}

export default TreasuryLiveDashboard;
