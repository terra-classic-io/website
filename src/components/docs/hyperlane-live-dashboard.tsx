import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Database,
  ExternalLink,
  HelpCircle,
  Network,
  Radio,
  RefreshCw,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import type {
  HyperlaneRouteSnapshot,
  HyperlaneSecuritySnapshot,
  HyperlaneValidatorSnapshot,
} from "../../types/hyperlane";

type LoadStatus = "loading" | "refreshing" | "ready" | "error";
type RouteCheckpointState = "all-current" | "quorum-observed" | "below-quorum" | "unknown";

type RouteVisualState = {
  readonly route: HyperlaneRouteSnapshot;
  readonly state: RouteCheckpointState;
  readonly currentValidatorCount: number;
  readonly behindValidatorCount: number;
  readonly unverifiedValidatorCount: number;
};

const REFRESH_INTERVAL_MS = 120_000;
const SNAPSHOT_ENDPOINT = "/api/hyperlane/validators";

function formatAddress(address: string): string {
  return address.length > 20 ? `${address.slice(0, 10)}…${address.slice(-8)}` : address;
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

function routeStatusLabel(route: HyperlaneRouteSnapshot): string {
  if (route.status !== "ready" || route.threshold === undefined) {
    return "Temporarily unavailable";
  }
  return `${route.threshold} of ${route.validators.length} signatures required`;
}

function getRouteVisualState(
  route: HyperlaneRouteSnapshot,
  validators: readonly HyperlaneValidatorSnapshot[],
  validatorAnnounceStatus: HyperlaneSecuritySnapshot["validatorAnnounceStatus"],
): RouteVisualState {
  if (route.status !== "ready" || route.threshold === undefined || validatorAnnounceStatus !== "ready") {
    return { route, state: "unknown", currentValidatorCount: 0, behindValidatorCount: 0, unverifiedValidatorCount: route.validators.length };
  }

  const validatorStates = route.validators.map((address) => (
    validators.find((validator) => validator.address === address)?.checkpointCurrent
  ));
  const currentValidatorCount = validatorStates.filter((isCurrent) => isCurrent === true).length;
  const unknownValidatorCount = validatorStates.filter((isCurrent) => isCurrent === undefined).length;

  const counts = {
    currentValidatorCount,
    behindValidatorCount: validatorStates.filter((isCurrent) => isCurrent === false).length,
    unverifiedValidatorCount: unknownValidatorCount,
  };

  if (currentValidatorCount === route.validators.length && route.validators.length > 0) {
    return { route, state: "all-current", ...counts };
  }
  if (currentValidatorCount >= route.threshold) {
    return { route, state: "quorum-observed", ...counts };
  }
  if (currentValidatorCount + unknownValidatorCount < route.threshold || unknownValidatorCount === 0) {
    return { route, state: "below-quorum", ...counts };
  }
  return { route, state: "unknown", ...counts };
}

const ROUTE_STATE_PRESENTATION = {
  "all-current": {
    label: "All checkpoints current",
    icon: CheckCircle2,
    iconClass: "text-emerald-500",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    cardClass: "border-emerald-300/70 bg-emerald-50/40 dark:border-emerald-500/25 dark:bg-emerald-500/[0.035]",
  },
  "quorum-observed": {
    label: "Quorum observed",
    icon: AlertTriangle,
    iconClass: "text-amber-500",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    cardClass: "border-amber-300/70 bg-amber-50/40 dark:border-amber-500/25 dark:bg-amber-500/[0.035]",
  },
  "below-quorum": {
    label: "Below checkpoint quorum",
    icon: XCircle,
    iconClass: "text-rose-500",
    badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    cardClass: "border-rose-300/70 bg-rose-50/40 dark:border-rose-500/25 dark:bg-rose-500/[0.035]",
  },
  unknown: {
    label: "Checkpoint status unknown",
    icon: HelpCircle,
    iconClass: "text-slate-400",
    badgeClass: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
    cardClass: "border-slate-200/80 bg-slate-50/70 dark:border-white/10 dark:bg-white/[0.025]",
  },
} as const;

function routeCheckpointLabel(visualState: RouteVisualState): string {
  if (visualState.state === "unknown") {
    return "Checkpoint activity could not be verified";
  }
  const details = [`${visualState.currentValidatorCount} of ${visualState.route.validators.length} checkpoints current`];
  if (visualState.behindValidatorCount > 0) {
    details.push(`${visualState.behindValidatorCount} checkpoint${visualState.behindValidatorCount === 1 ? "" : "s"} behind`);
  }
  if (visualState.unverifiedValidatorCount > 0) {
    details.push(`${visualState.unverifiedValidatorCount} checkpoint${visualState.unverifiedValidatorCount === 1 ? "" : "s"} unverified`);
  }
  return details.join(" · ");
}

function statusPillClass(isActive: boolean): string {
  return isActive
    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : "bg-slate-500/10 text-slate-600 dark:text-slate-300";
}

function ValidatorRow({ validator }: { readonly validator: HyperlaneValidatorSnapshot }): JSX.Element {
  return (
    <li className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.025]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {validator.website ? (
              <a
                href={validator.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-slate-950 underline-offset-4 hover:text-blue-600 hover:underline dark:text-white dark:hover:text-blue-400"
              >
                {validator.name}
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            ) : (
              <p className="font-semibold text-slate-950 dark:text-white">{validator.name}</p>
            )}
            {!validator.metadataKnown ? (
              <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.13em] text-amber-700 dark:text-amber-300">
                Metadata pending
              </span>
            ) : null}
          </div>
          <code className="mt-1 block break-all text-[11px] text-slate-500 dark:text-slate-400">{validator.address}</code>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${statusPillClass(validator.announced)}`}>
          {validator.announced ? "Announced" : "Not announced"}
        </span>
        <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${statusPillClass(Boolean(validator.checkpointCurrent))}`}>
          {validator.checkpointCurrent
            ? `Checkpoint #${validator.checkpointIndex ?? "–"}`
            : validator.checkpointCurrent === false
              ? "Checkpoint behind"
              : "Checkpoint unavailable"}
        </span>
        {validator.routes.map((route) => (
          <span key={route} className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300">
            {route === "bsc" ? "BSC ISM" : `${route[0]?.toUpperCase()}${route.slice(1)} ISM`}
          </span>
        ))}
      </div>
    </li>
  );
}

function HyperlaneLiveDashboard(): JSX.Element {
  const [snapshot, setSnapshot] = useState<HyperlaneSecuritySnapshot>();
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const requestRefresh = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadSnapshot = async () => {
      setStatus((current) => current === "ready" || current === "refreshing" ? "refreshing" : "loading");
      setErrorMessage("");

      try {
        const response = await fetch(SNAPSHOT_ENDPOINT, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`Hyperlane status request failed with status ${response.status}.`);
        }
        const nextSnapshot = await response.json() as HyperlaneSecuritySnapshot;
        if (!controller.signal.aborted) {
          setSnapshot(nextSnapshot);
          setStatus("ready");
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.warn("Unable to load Hyperlane security data", error);
        setErrorMessage("Live Hyperlane security data is temporarily unavailable. Contract documentation remains available below.");
        setStatus("error");
      }
    };

    void loadSnapshot();
    const intervalId = window.setInterval(() => void loadSnapshot(), REFRESH_INTERVAL_MS);
    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [refreshKey]);

  const thresholdLabel = useMemo(() => {
    if (snapshot?.summary.sharedThreshold === undefined || snapshot.summary.sharedValidatorCount === undefined) {
      return "By route";
    }
    return `${snapshot.summary.sharedThreshold} of ${snapshot.summary.sharedValidatorCount}`;
  }, [snapshot]);
  const routeVisualStates = useMemo(() => snapshot?.routes.map((route) => getRouteVisualState(
    route,
    snapshot.validators,
    snapshot.validatorAnnounceStatus,
  )) ?? [], [snapshot]);
  const allCurrentRouteCount = useMemo(() => (
    routeVisualStates.filter((route) => route.state === "all-current").length
  ), [routeVisualStates]);

  return (
    <section id="live-hyperlane-security" className="space-y-6" aria-labelledby="live-hyperlane-security-title">
      <div className="rounded-3xl border border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-5 shadow-sm dark:border-violet-500/20 dark:from-violet-950/25 dark:via-[#061121] dark:to-[#061121] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-200 bg-violet-100/70 text-violet-600 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-400">
              <ShieldCheck size={24} aria-hidden="true" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="live-hyperlane-security-title" className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Hyperlane security</h2>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">● Live configuration</span>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                Terra Classic validator announcements, current checkpoints, and the validator sets enforced by each destination ISM.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={requestRefresh}
            disabled={status === "loading" || status === "refreshing"}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-600 disabled:cursor-wait disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:border-violet-500/40 dark:hover:text-violet-400"
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
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading Hyperlane security data">
            {[0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl border border-slate-200/80 bg-slate-100/70 dark:border-white/10 dark:bg-white/[0.04]" />)}
          </div>
        ) : (
          <>
            <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Securing routes", value: String(snapshot.summary.securingValidatorCount), icon: Users },
                { label: "Current checkpoints", value: String(snapshot.summary.currentCheckpointCount), icon: Radio },
                { label: "ISM signature threshold", value: thresholdLabel, icon: ShieldCheck },
                { label: "Routes with all checkpoints current", value: `${allCurrentRouteCount} / ${snapshot.summary.totalRouteCount}`, icon: Network },
              ].map((metric) => (
                <div key={metric.label} className="min-h-32 rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.035]">
                  <metric.icon size={18} className="text-violet-600 dark:text-violet-400" aria-hidden="true" />
                  <dt className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{metric.label}</dt>
                  <dd className="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">{metric.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5"><Database size={13} aria-hidden="true" /> {snapshot.summary.announcedValidatorCount} announced</span>
              <span className="inline-flex items-center gap-1.5"><Radio size={13} aria-hidden="true" /> Latest checkpoint #{snapshot.latestCheckpointIndex ?? "–"}</span>
              <span className="inline-flex items-center gap-1.5"><Clock3 size={13} aria-hidden="true" /> Refreshed {formatDateTime(snapshot.fetchedAt)}</span>
            </div>
          </>
        )}
      </div>

      {snapshot ? (
        <>
          <section className="rounded-3xl border border-slate-200/80 bg-white/70 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.02] sm:p-6" aria-labelledby="hyperlane-route-isms-title">
            <div>
              <h2 id="hyperlane-route-isms-title" className="text-xl font-semibold text-slate-950 dark:text-white">Route ISMs</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Each destination enforces its own validator set and signature threshold. Status reflects published checkpoint indexes; it does not verify signatures or end-to-end bridge delivery.</p>
            </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              {routeVisualStates.map((visualState) => {
                const { route } = visualState;
                const presentation = ROUTE_STATE_PRESENTATION[visualState.state];
                const StatusIcon = presentation.icon;
                return (
                  <article key={route.id} className={`rounded-2xl border p-4 ${presentation.cardClass}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <StatusIcon size={16} className={presentation.iconClass} aria-hidden="true" />
                          <h3 className="text-sm font-semibold text-slate-950 dark:text-white">{route.label}</h3>
                        </div>
                        <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.13em] ${presentation.badgeClass}`}>
                          {presentation.label}
                        </span>
                        <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{routeStatusLabel(route)}</p>
                        <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">{routeCheckpointLabel(visualState)}</p>
                      </div>
                      <a href={route.explorerUrl} target="_blank" rel="noopener noreferrer" aria-label={`View ${route.label} ISM in explorer`} className="text-slate-400 transition hover:text-blue-600 dark:hover:text-blue-400">
                        <ExternalLink size={15} aria-hidden="true" />
                      </a>
                    </div>
                    <p className="mt-3 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">ISM address</p>
                    <code className="mt-1 block text-[11px] text-slate-600 dark:text-slate-300" title={route.ismAddress}>{formatAddress(route.ismAddress)}</code>
                  </article>
                );
              })}
            </div>
          </section>

          <details className="group rounded-3xl border border-slate-200/80 bg-white/70 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
              <div>
                <h2 className="text-xl font-semibold text-slate-950 dark:text-white">Validators and ISM membership</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Inspect signing addresses, checkpoint status, and the routes each validator currently secures.</p>
              </div>
              <ChevronDown size={20} className="shrink-0 text-slate-400 transition group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="border-t border-slate-200/80 p-5 dark:border-white/10 sm:p-6">
              <ul className="space-y-3">
                {snapshot.validators.map((validator) => <ValidatorRow key={validator.address} validator={validator} />)}
              </ul>
              <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">
                A validator can publish checkpoints without being included in a route ISM. ISM membership, not announcement alone, determines which signatures can secure a destination route.
              </p>
            </div>
          </details>
        </>
      ) : null}
    </section>
  );
}

export default HyperlaneLiveDashboard;
