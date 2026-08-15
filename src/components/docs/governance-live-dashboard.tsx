import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Database,
  RefreshCw,
  Scale,
  ShieldAlert,
  Vote,
} from "lucide-react";

type GovernanceTally = {
  readonly yes: string;
  readonly abstain: string;
  readonly no: string;
  readonly veto: string;
};

type GovernanceProposal = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly status: string;
  readonly depositEndTime?: string;
  readonly votingEndTime?: string;
  readonly tally: GovernanceTally;
};

type GovernanceParams = {
  readonly votingPeriod?: string;
  readonly maxDepositPeriod?: string;
  readonly quorum?: string;
  readonly threshold?: string;
  readonly vetoThreshold?: string;
  readonly minDepositAmount?: string;
  readonly minDepositDenom?: string;
};

type GovernanceSnapshot = {
  readonly activeProposals: readonly GovernanceProposal[];
  readonly recentProposals: readonly GovernanceProposal[];
  readonly params?: GovernanceParams;
  readonly blockHeight?: string;
  readonly blockTime?: string;
  readonly fetchedAt: string;
  readonly source: string;
};

type LoadStatus = "loading" | "refreshing" | "ready" | "error";

type FetchResult<T> = {
  readonly data: T;
  readonly endpoint: string;
};

const LCD_ENDPOINTS = [
  "https://terra-classic-lcd.publicnode.com",
  "https://lcd.terra-classic.hexxagon.io",
  "https://api-lunc-lcd.binodes.com",
] as const;

const RECENT_PROPOSALS_PATH = "/cosmos/gov/v1/proposals?pagination.limit=8&pagination.reverse=true";
const VOTING_PROPOSALS_PATH = "/cosmos/gov/v1/proposals?proposal_status=PROPOSAL_STATUS_VOTING_PERIOD&pagination.limit=100";
const DEPOSIT_PROPOSALS_PATH = "/cosmos/gov/v1/proposals?proposal_status=PROPOSAL_STATUS_DEPOSIT_PERIOD&pagination.limit=100";
const GOVERNANCE_PARAMS_PATH = "/cosmos/gov/v1/params/voting";
const LATEST_BLOCK_PATH = "/cosmos/base/tendermint/v1beta1/blocks/latest";
const REFRESH_INTERVAL_MS = 120_000;
const MICRO_UNITS_PER_DISPLAY_UNIT = 1_000_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function readMetadataTitle(metadata: unknown): string | undefined {
  const value = readString(metadata);
  if (!value?.startsWith("{")) {
    return undefined;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? readString(parsed.title) : undefined;
  } catch {
    return undefined;
  }
}

function parseTally(value: unknown): GovernanceTally {
  if (!isRecord(value)) {
    return { yes: "0", abstain: "0", no: "0", veto: "0" };
  }

  return {
    yes: readString(value.yes_count) ?? "0",
    abstain: readString(value.abstain_count) ?? "0",
    no: readString(value.no_count) ?? "0",
    veto: readString(value.no_with_veto_count) ?? "0",
  };
}

function parseProposals(payload: unknown): readonly GovernanceProposal[] {
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
      title: readString(entry.title) ?? readMetadataTitle(entry.metadata) ?? `Proposal #${id}`,
      summary: readString(entry.summary) ?? "Open the proposal to review its complete on-chain content.",
      status: readString(entry.status) ?? "PROPOSAL_STATUS_UNSPECIFIED",
      depositEndTime: readString(entry.deposit_end_time),
      votingEndTime: readString(entry.voting_end_time),
      tally: parseTally(entry.final_tally_result),
    }];
  });
}

function parseTallyResponse(payload: unknown): GovernanceTally {
  if (!isRecord(payload) || !isRecord(payload.tally)) {
    throw new Error("The LCD returned an invalid proposal tally.");
  }
  return parseTally(payload.tally);
}

function parseGovernanceParams(payload: unknown): GovernanceParams {
  if (!isRecord(payload)) {
    throw new Error("The LCD returned invalid governance parameters.");
  }

  const combinedParams = isRecord(payload.params) ? payload.params : {};
  const votingParams = isRecord(payload.voting_params) ? payload.voting_params : {};
  const depositParams = isRecord(payload.deposit_params) ? payload.deposit_params : {};
  const tallyParams = isRecord(payload.tally_params) ? payload.tally_params : {};
  const minDeposit = Array.isArray(combinedParams.min_deposit)
    ? combinedParams.min_deposit
    : Array.isArray(depositParams.min_deposit)
      ? depositParams.min_deposit
      : [];
  const firstDeposit = minDeposit.find(isRecord);

  return {
    votingPeriod: readString(combinedParams.voting_period) ?? readString(votingParams.voting_period),
    maxDepositPeriod: readString(combinedParams.max_deposit_period) ?? readString(depositParams.max_deposit_period),
    quorum: readString(combinedParams.quorum) ?? readString(tallyParams.quorum),
    threshold: readString(combinedParams.threshold) ?? readString(tallyParams.threshold),
    vetoThreshold: readString(combinedParams.veto_threshold) ?? readString(tallyParams.veto_threshold),
    minDepositAmount: firstDeposit ? readString(firstDeposit.amount) : undefined,
    minDepositDenom: firstDeposit ? readString(firstDeposit.denom) : undefined,
  };
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

function formatDateTime(value?: string): string {
  if (!value) {
    return "Unavailable";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatBlockHeight(value?: string): string {
  const height = Number(value);
  return Number.isFinite(height) ? new Intl.NumberFormat("en-US").format(height) : "Unavailable";
}

function formatDuration(value?: string): string {
  const seconds = Number(value?.replace(/s$/, ""));
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "Unavailable";
  }

  const days = seconds / 86_400;
  if (Number.isInteger(days)) {
    return `${days} ${days === 1 ? "day" : "days"}`;
  }
  const hours = seconds / 3_600;
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(hours)} hours`;
}

function formatRatio(value?: string): string {
  const ratio = Number(value);
  if (!Number.isFinite(ratio)) {
    return "Unavailable";
  }
  return new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 }).format(ratio);
}

function formatDeposit(params?: GovernanceParams): string {
  const amount = Number(params?.minDepositAmount) / MICRO_UNITS_PER_DISPLAY_UNIT;
  if (!Number.isFinite(amount)) {
    return "Unavailable";
  }
  const symbol = params?.minDepositDenom === "uluna" ? "LUNC" : params?.minDepositDenom ?? "";
  return `${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(amount)} ${symbol}`.trim();
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

function tallyPercentages(tally: GovernanceTally): readonly { readonly label: string; readonly value: number; readonly tone: string }[] {
  try {
    const values = [BigInt(tally.yes), BigInt(tally.abstain), BigInt(tally.no), BigInt(tally.veto)];
    const total = values.reduce((sum, value) => sum + value, 0n);
    const percent = (value: bigint): number => total === 0n ? 0 : Number((value * 1_000n) / total) / 10;
    return [
      { label: "Yes", value: percent(values[0] ?? 0n), tone: "bg-emerald-500" },
      { label: "Abstain", value: percent(values[1] ?? 0n), tone: "bg-slate-400" },
      { label: "No", value: percent(values[2] ?? 0n), tone: "bg-amber-500" },
      { label: "Veto", value: percent(values[3] ?? 0n), tone: "bg-rose-500" },
    ];
  } catch {
    return [
      { label: "Yes", value: 0, tone: "bg-emerald-500" },
      { label: "Abstain", value: 0, tone: "bg-slate-400" },
      { label: "No", value: 0, tone: "bg-amber-500" },
      { label: "Veto", value: 0, tone: "bg-rose-500" },
    ];
  }
}

function proposalDeadline(proposal: GovernanceProposal): string | undefined {
  return proposal.status.endsWith("DEPOSIT_PERIOD") ? proposal.depositEndTime : proposal.votingEndTime;
}

function nextDeadline(proposals: readonly GovernanceProposal[]): string | undefined {
  return proposals
    .map(proposalDeadline)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => new Date(left).getTime() - new Date(right).getTime())[0];
}

function GovernanceProposalCard({ proposal, showSummary = true }: { readonly proposal: GovernanceProposal; readonly showSummary?: boolean }): JSX.Element {
  const tally = tallyPercentages(proposal.tally);
  const hasTally = tally.some((item) => item.value > 0);

  return (
    <article className="min-w-0 rounded-2xl border border-slate-200/80 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.025] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Proposal #{proposal.id}</span>
          <h3 className="mt-1 break-words text-base font-semibold leading-6 text-slate-950 dark:text-white">{proposal.title}</h3>
        </div>
        <a
          href={`https://validator.info/terra-classic/governance/${proposal.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 self-start items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
        >
          Details <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </div>
      {showSummary ? <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{proposal.summary}</p> : null}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.13em] ${proposalStatusClass(proposal.status)}`}>{proposalStatusLabel(proposal.status)}</span>
        {proposalDeadline(proposal) ? <span className="text-[10px] text-slate-500 dark:text-slate-400">Deadline: {formatDateTime(proposalDeadline(proposal))}</span> : null}
      </div>
      {hasTally ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {tally.map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400"><span>{item.label}</span><span>{item.value.toFixed(1)}%</span></div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"><span className={`block h-full rounded-full ${item.tone}`} style={{ width: `${item.value}%` }} /></div>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function GovernanceLiveDashboard(): JSX.Element {
  const [snapshot, setSnapshot] = useState<GovernanceSnapshot | undefined>();
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const requestRefresh = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadSnapshot = async () => {
      setStatus((current) => current === "ready" || current === "refreshing" ? "refreshing" : "loading");
      setErrorMessage("");

      try {
        const [recentResult, votingResult, depositResult, paramsResult, blockResult] = await Promise.all([
          fetchJsonWithFallback(RECENT_PROPOSALS_PATH, parseProposals, controller.signal),
          fetchOptional(VOTING_PROPOSALS_PATH, parseProposals, controller.signal),
          fetchOptional(DEPOSIT_PROPOSALS_PATH, parseProposals, controller.signal),
          fetchOptional(GOVERNANCE_PARAMS_PATH, parseGovernanceParams, controller.signal),
          fetchOptional(LATEST_BLOCK_PATH, parseLatestBlock, controller.signal),
        ]);

        if (controller.signal.aborted) {
          return;
        }

        const activeProposals = [...(votingResult?.data ?? []), ...(depositResult?.data ?? [])]
          .sort((left, right) => Number(right.id) - Number(left.id));
        const activeProposalsWithTallies = await Promise.all(activeProposals.map(async (proposal) => {
          if (!proposal.status.endsWith("VOTING_PERIOD")) {
            return proposal;
          }
          const tallyResult = await fetchOptional(
            `/cosmos/gov/v1/proposals/${proposal.id}/tally`,
            parseTallyResponse,
            controller.signal,
          );
          return tallyResult ? { ...proposal, tally: tallyResult.data } : proposal;
        }));

        if (controller.signal.aborted) {
          return;
        }

        setSnapshot({
          activeProposals: activeProposalsWithTallies,
          recentProposals: recentResult.data,
          params: paramsResult?.data,
          blockHeight: blockResult?.data.height,
          blockTime: blockResult?.data.time,
          fetchedAt: new Date().toISOString(),
          source: recentResult.endpoint,
        });
        setStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.warn("Unable to load on-chain governance data", error);
        setErrorMessage("Live governance data is temporarily unavailable. The explanatory documentation remains accessible below.");
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

  const deadline = useMemo(() => nextDeadline(snapshot?.activeProposals ?? []), [snapshot?.activeProposals]);

  return (
    <section id="live-governance" className="space-y-6" aria-labelledby="live-governance-title">
      <div className="rounded-3xl border border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-5 shadow-sm dark:border-blue-500/20 dark:from-blue-950/25 dark:via-[#061121] dark:to-[#061121] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-200 bg-blue-100/70 text-blue-600 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-400"><Vote size={24} aria-hidden="true" /></span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="live-governance-title" className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Governance status</h2>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">● Live chain data</span>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Active proposals, current governance parameters, and recent outcomes queried directly from Terra Classic public LCD endpoints.</p>
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
            <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" /><span>{errorMessage}</span>
          </div>
        ) : null}

        {!snapshot ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading governance data">
            {[0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl border border-slate-200/80 bg-slate-100/70 dark:border-white/10 dark:bg-white/[0.04]" />)}
          </div>
        ) : (
          <>
            <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Active proposals", value: String(snapshot.activeProposals.length), icon: Vote },
                { label: "Voting period", value: formatDuration(snapshot.params?.votingPeriod), icon: CalendarClock },
                { label: "Quorum", value: formatRatio(snapshot.params?.quorum), icon: Scale },
                { label: "Next deadline", value: deadline ? formatDateTime(deadline) : "No active deadline", icon: Clock3 },
              ].map((metric) => (
                <div key={metric.label} className="min-h-32 rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.035]">
                  <metric.icon size={18} className="text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <dt className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{metric.label}</dt>
                  <dd className="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">{metric.value}</dd>
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
        <>
          <section id="governance-parameters" className="rounded-3xl border border-slate-200/80 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.02] sm:p-6" aria-labelledby="governance-parameters-title">
            <div className="flex items-start gap-3"><ShieldAlert size={22} className="mt-0.5 text-blue-600 dark:text-blue-400" aria-hidden="true" /><div><h2 id="governance-parameters-title" className="text-xl font-semibold text-slate-950 dark:text-white">Current governance parameters</h2><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Values returned by the chain at refresh time. They can change through governance or network upgrades.</p></div></div>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: "Minimum deposit", value: formatDeposit(snapshot.params) },
                { label: "Deposit period", value: formatDuration(snapshot.params?.maxDepositPeriod) },
                { label: "Voting period", value: formatDuration(snapshot.params?.votingPeriod) },
                { label: "Approval threshold", value: formatRatio(snapshot.params?.threshold) },
                { label: "Veto threshold", value: formatRatio(snapshot.params?.vetoThreshold) },
              ].map((item) => <div key={item.label} className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.025]"><dt className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">{item.label}</dt><dd className="mt-2 text-sm font-semibold text-slate-950 dark:text-white">{item.value}</dd></div>)}
            </dl>
          </section>

          <section id="active-governance-proposals" className="space-y-4" aria-labelledby="active-governance-proposals-title">
            <div><h2 id="active-governance-proposals-title" className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Active proposals</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Proposals currently in a deposit or voting period.</p></div>
            {snapshot.activeProposals.length > 0 ? (
              <div className="space-y-4">{snapshot.activeProposals.map((proposal) => <GovernanceProposalCard key={proposal.id} proposal={proposal} />)}</div>
            ) : (
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 text-sm text-slate-600 dark:border-white/10 dark:bg-white/[0.025] dark:text-slate-300"><CheckCircle2 size={19} className="mt-0.5 shrink-0 text-emerald-500" aria-hidden="true" /><span>No proposal is currently in a deposit or voting period.</span></div>
            )}
          </section>

          <section id="recent-governance-proposals" className="space-y-4" aria-labelledby="recent-governance-proposals-title">
            <div><h2 id="recent-governance-proposals-title" className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Recent proposal outcomes</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Latest proposals and final vote distributions returned by Governance v1.</p></div>
            <div className="space-y-3">{snapshot.recentProposals.map((proposal) => <GovernanceProposalCard key={proposal.id} proposal={proposal} showSummary={false} />)}</div>
          </section>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 text-xs leading-5 text-slate-600 dark:border-white/10 dark:bg-white/[0.025] dark:text-slate-300">
            <strong className="text-slate-900 dark:text-white">Read-only data.</strong> This page does not sign or broadcast votes. Confirm every proposal and attached message in a trusted governance interface before participating. On-chain source:{" "}
            <a href={`${snapshot.source}${RECENT_PROPOSALS_PATH}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">{new URL(snapshot.source).hostname}<ArrowUpRight size={12} className="ml-1 inline" aria-hidden="true" /></a>
          </div>
        </>
      ) : null}
    </section>
  );
}

export default GovernanceLiveDashboard;
