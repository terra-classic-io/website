import { useEffect, useState, type ReactNode } from "react";
import { ArrowUpRight, RefreshCw, Shield, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { deploymentSource } from "../../data/hyperlane-governance";
import type {
  GovernanceAction,
  GovernanceNetwork,
  GovernanceSource,
  HyperlaneGovernanceSnapshot,
} from "../../types/hyperlane-governance";

const dashboardPath = "/docs/develop/hyperlane/governance";
const panel =
  "rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.025]";
const link =
  "inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:underline dark:text-sky-300";
const subdued = "text-sm text-slate-600 dark:text-slate-400";
function External({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={link}>
      {children}
      <ArrowUpRight size={14} aria-hidden="true" />
    </a>
  );
}
function date(value?: string) {
  return value
    ? new Date(value).toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Not available";
}
function Address({ value }: { value?: string | null }) {
  return (
    <span className="min-w-0 break-all font-mono text-xs leading-6 text-slate-700 dark:text-slate-300">
      {value === null ? "None" : (value ?? "Unavailable")}
    </span>
  );
}
function SourceNote({ value }: { value: GovernanceSource<unknown> }) {
  return (
    <p className="mt-3 flex flex-wrap gap-x-2 text-xs text-slate-500 dark:text-slate-400">
      <a
        className="underline"
        target="_blank"
        rel="noopener noreferrer"
        href={value.url}
      >
        Source
      </a>
      <span>
        {value.error ? "Last attempt" : "Checked"} {date(value.checkedAt)}
      </span>
    </p>
  );
}
function Status({ action }: { action: GovernanceAction }) {
  const color = action.active
    ? "bg-violet-500/10 text-violet-700 dark:text-violet-300"
    : action.status === "Executed" || action.status === "Passed"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : "bg-slate-500/10 text-slate-600 dark:text-slate-300";
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${color}`}
    >
      {action.status}
    </span>
  );
}
function ActionCard({
  action,
  network,
}: {
  action: GovernanceAction;
  network: GovernanceNetwork;
}) {
  return (
    <article className={`${panel} min-w-0 space-y-3`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {network.name}
          {action.nonce !== undefined ? ` · Nonce ${action.nonce}` : ""}
        </span>
        <Status action={action} />
      </div>
      <h4 className="break-words text-lg font-semibold text-slate-900 dark:text-white">
        {action.title}
      </h4>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 dark:text-slate-300">
        {action.confirmations !== undefined ? (
          <span>
            <strong className="text-slate-900 dark:text-white">
              {action.confirmations}
              {action.threshold ? ` / ${action.threshold}` : ""}
            </strong>{" "}
            recorded approvals
            {!action.threshold ? " · historical threshold unknown" : ""}
          </span>
        ) : null}
        {action.deadline ? (
          <span className="inline-flex items-center gap-1">
            <Clock3 size={14} aria-hidden="true" />
            Ends {date(action.deadline)}
          </span>
        ) : null}
        {action.timestamp ? <span>{date(action.timestamp)}</span> : null}
      </div>
      <p className={`${subdued} break-words [overflow-wrap:anywhere]`}>
        {action.detail}
      </p>
      {action.tally && (
        <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          {Object.entries(action.tally).map(([key, value]) => (
            <div
              key={key}
              className="rounded-lg bg-slate-50 p-2 dark:bg-white/5"
            >
              <dt className="capitalize text-slate-500 dark:text-slate-400">
                {key.replace(/_count$/, "").replaceAll("_", " ")}
              </dt>
              <dd className="break-all font-medium text-slate-800 dark:text-slate-200">
                {(Number(value) / 1_000_000).toLocaleString("en", {
                  maximumFractionDigits: 0,
                })}{" "}
                LUNC
              </dd>
            </div>
          ))}
        </dl>
      )}
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <External href={action.url}>
          {network.id === "terra"
            ? "Review proposal"
            : action.active
              ? "Review transaction"
              : "View evidence"}
        </External>
        {network.id === "solana" && action.active ? (
          <External href={network.reviewUrl}>Open Squads</External>
        ) : null}
      </div>
      {action.payload !== undefined ? (
        <details className="text-xs">
          <summary className="cursor-pointer py-1 font-medium text-slate-600 dark:text-slate-300">
            {network.id === "solana"
              ? "Proposal account details"
              : "Transaction messages and parameters"}
          </summary>
          <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-slate-100 p-3 text-slate-700 dark:bg-black/20 dark:text-slate-300">
            {JSON.stringify(action.payload, null, 2)}
          </pre>
        </details>
      ) : null}
      {action.signers?.length ? (
        <details className="text-xs">
          <summary className="cursor-pointer text-slate-600 dark:text-slate-300">
            Recorded signers ({action.signers.length})
          </summary>
          <ul className="mt-2 space-y-1">
            {action.signers.map((signer) => (
              <li key={signer}>
                <Address value={signer} />
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </article>
  );
}
function NetworkCard({ network }: { network: GovernanceNetwork }) {
  const config = network.configuration.data;
  return (
    <article className={`${panel} min-w-0 flex flex-col gap-3`}>
      <h3 className="font-semibold text-slate-900 dark:text-white">
        {network.name}
      </h3>
      <div>
        <p className="text-2xl font-semibold text-slate-900 dark:text-white">
          {config?.threshold
            ? `${config.threshold} of ${config.voters ?? config.members?.length ?? "?"}`
            : network.id === "terra" && config
              ? "Community vote"
              : "Unavailable"}
        </p>
        <p className={subdued}>
          {config?.threshold
            ? "Administrative approval threshold"
            : (config?.kind ?? "Configuration source unavailable")}
        </p>
      </div>
      <p className="text-sm text-slate-700 dark:text-slate-300">
        {network.pending.data
          ? `${network.pending.data.length}${network.pending.limited ? "+" : ""} pending action${network.pending.data.length === 1 ? "" : "s"} observed`
          : "Pending actions unavailable"}
      </p>
      {config ? (
        <details className="text-xs">
          <summary className="cursor-pointer font-medium text-slate-600 dark:text-slate-300">
            Accounts &amp; members
          </summary>
          <div className="mt-3 space-y-2">
            <p className={subdued}>{config.kind}</p>
            <Address value={config.address} />
            {config.vault && (
              <div>
                <p className={subdued}>Vault · deployment reference</p>
                <Address value={config.vault} />
              </div>
            )}
            {config.nonce !== undefined && (
              <p className={subdued}>Current nonce: {config.nonce}</p>
            )}
            {config.timeLock !== undefined && (
              <p className={subdued}>Time lock: {config.timeLock}s</p>
            )}
            {config.configAuthority && (
              <div>
                <p className={subdued}>
                  Configuration authority
                  {config.configAuthority === "11111111111111111111111111111111"
                    ? " · autonomous multisig"
                    : ""}
                </p>
                <Address value={config.configAuthority} />
              </div>
            )}
            {config.members && (
              <ul className="space-y-2 border-t border-slate-200 pt-3 dark:border-white/10">
                {config.members.map((member) => (
                  <li key={member}>
                    <Address value={member} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>
      ) : (
        <p className={subdued}>{network.configuration.error}</p>
      )}
      <div className="mt-auto">
        <External href={network.reviewUrl}>
          {network.id === "terra"
            ? "Governance explorer"
            : network.id === "solana"
              ? "Open Squads"
              : "Open Safe"}
        </External>
        <SourceNote value={network.configuration} />
      </div>
    </article>
  );
}
function ActionList({
  networks,
  mode,
}: {
  networks: GovernanceNetwork[];
  mode: "pending" | "history";
}) {
  const actions = networks.flatMap((network) =>
    (network[mode].data ?? []).map((action) => ({ action, network })),
  );
  if (mode === "history")
    actions.sort((a, b) =>
      (b.action.timestamp ?? "").localeCompare(a.action.timestamp ?? ""),
    );
  const errors = networks.filter((n) => n[mode].error);
  return (
    <div className="space-y-4">
      {errors.map((n) => (
        <div
          key={n.id}
          className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5"
        >
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {n.name} · source unavailable
          </p>
          <p className={subdued}>
            {n[mode].error} Check the external application for current activity.
          </p>
          <SourceNote value={n[mode]} />
        </div>
      ))}
      {actions.map(({ action, network }) => (
        <ActionCard
          key={`${network.id}-${action.id}`}
          action={action}
          network={network}
        />
      ))}
      {!actions.length && (
        <p className={`${panel} ${subdued}`}>
          {errors.length === networks.length
            ? "Activity could not be loaded."
            : mode === "pending"
              ? "No pending action returned by the available sources."
              : "No completed action found within the displayed history."}
        </p>
      )}
      <details className="text-xs text-slate-500 dark:text-slate-400">
        <summary className="cursor-pointer">Sources &amp; coverage</summary>
        <div className="mt-2 space-y-3">
          {networks.map((n) => (
            <div key={n.id}>
              <p className="font-semibold">
                {n.name}
                {n[mode].limited ? " · limited coverage" : ""}
              </p>
              <p>
                {n.id === "terra"
                  ? mode === "history"
                    ? "Matches within the 30 most recent chain proposals."
                    : "Up to 100 voting and 100 deposit proposals; matched by exact contract fields."
                  : n.id === "solana"
                    ? "Retained on-chain proposal accounts only. Closed accounts are absent from history; at most 10 completed proposals shown."
                    : mode === "history"
                      ? "10 most recent executed Safe transactions."
                      : "Up to 100 indexed pending Safe transactions; consumed nonces excluded when configuration is available."}
              </p>
              <SourceNote value={n[mode]} />
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
export default function HyperlaneGovernanceDashboard({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [snapshot, setSnapshot] = useState<HyperlaneGovernanceSnapshot>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  const [filter, setFilter] = useState("all");
  useEffect(() => {
    let alive = true;
    let controller: AbortController;
    const load = async () => {
      controller?.abort();
      controller = new AbortController();
      const current = controller;
      setLoading(true);
      const timeout = setTimeout(() => current.abort(), 45_000);
      try {
        const response = await fetch("/api/hyperlane/governance", {
          signal: current.signal,
        });
        if (!response.ok) throw new Error("Snapshot unavailable");
        const value: HyperlaneGovernanceSnapshot = await response.json();
        if (!Array.isArray(value.networks) || !value.fetchedAt)
          throw new Error("Invalid snapshot");
        if (alive) {
          setSnapshot(value);
          setError(false);
        }
      } catch {
        if (alive) setError(true);
      } finally {
        clearTimeout(timeout);
        if (alive) setLoading(false);
      }
    };
    void load();
    const interval = setInterval(() => void load(), 120_000);
    return () => {
      alive = false;
      controller?.abort();
      clearInterval(interval);
    };
  }, [revision]);
  const available =
    snapshot?.networks.filter((n) => n.pending.data !== undefined).length ?? 0;
  const pendingCount =
    snapshot?.networks.reduce(
      (sum, n) => sum + (n.pending.data?.length ?? 0),
      0,
    ) ?? 0;
  const stale =
    error ||
    (snapshot && Date.now() - Date.parse(snapshot.fetchedAt) > 180_000);
  const networks =
    snapshot?.networks.filter((n) => filter === "all" || n.id === filter) ?? [];
  if (compact)
    return (
      <aside
        className={`${panel} mt-6 space-y-3`}
        aria-label="Hyperlane governance overview"
      >
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Hyperlane governance
        </h2>
        <p className={subdued}>
          Follow Terra Classic proposals and administrative approvals on BNB
          Smart Chain, Ethereum, and Solana.
        </p>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          {stale
            ? "Refresh unavailable · open the dashboard to check sources."
            : snapshot && available === 0
              ? "Activity sources unavailable."
              : snapshot
                ? `${pendingCount} pending action${pendingCount === 1 ? "" : "s"} observed · ${available}/4 activity sources available`
                : loading
                  ? "Loading activity…"
                  : "Activity temporarily unavailable."}
        </p>
        <Link className={link} to={dashboardPath}>
          Open Hyperlane Governance
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </aside>
    );
  return (
    <section className="space-y-6" aria-label="Hyperlane governance dashboard">
      <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-5 dark:border-violet-500/20 dark:from-violet-950/25 dark:via-[#061121] dark:to-[#061121] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Shield
              className="shrink-0 text-violet-500"
              size={28}
              aria-hidden="true"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-300">
                Public observatory · read only
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
                Decisions &amp; administration
              </h2>
            </div>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => setRevision((n) => n + 1)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 disabled:opacity-50 dark:border-white/10 dark:text-slate-200"
          >
            <RefreshCw
              size={14}
              className={loading ? "animate-spin" : ""}
              aria-hidden="true"
            />
            Refresh
          </button>
        </div>
        <p className={`mt-4 ${subdued}`}>
          Track community proposals, multisig confirmations, and contract
          authorities across the Hyperlane deployment. Review and sign in the
          original governance application.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-3xl font-semibold text-slate-900 dark:text-white">
              {snapshot && available > 0 ? pendingCount : "—"}
            </p>
            <p className={subdued}>Pending actions observed</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-slate-900 dark:text-white">
              {snapshot ? `${available} / 4` : "—"}
            </p>
            <p className={subdued}>Activity sources available</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {snapshot ? date(snapshot.fetchedAt) : "Loading sources…"}
            </p>
            <p className={subdued}>Last snapshot · refresh every 2 min</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Counts cover the available sources and displayed scope. An approval
          threshold being reached does not mean a transaction has executed.
        </p>
      </div>
      <div role="status" aria-live="polite">
        {stale ? (
          <p className="rounded-xl bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
            Refresh unavailable.{" "}
            {snapshot
              ? "The displayed snapshot may be out of date."
              : "Use the external applications while the data is unavailable."}
          </p>
        ) : loading && !snapshot ? (
          <p className={subdued}>Reading governance and multisig sources…</p>
        ) : null}
      </div>
      {snapshot && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {snapshot.networks.map((network) => (
              <NetworkCard key={network.id} network={network} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label
              className="text-sm font-semibold text-slate-700 dark:text-slate-200"
              htmlFor="hyperlane-governance-network"
            >
              Network
            </label>
            <select
              id="hyperlane-governance-network"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="all">All networks</option>
              {snapshot.networks.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              Pending decisions
            </h3>
            <ActionList networks={networks} mode="pending" />
          </section>
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              Recent history
            </h3>
            <ActionList networks={networks} mode="history" />
          </section>
          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              Who controls what?
            </h3>
            <p className={subdued}>
              Live reads for selected Terra Classic contracts, documented EVM
              owners, and Solana program upgrade authorities. This inventory
              does not cover every administrative power.
            </p>
            {networks.map((n) => (
              <details key={n.id} className={panel}>
                <summary className="cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
                  {n.name} ·{" "}
                  {n.authorities.data
                    ? `${n.authorities.data.length} contracts monitored`
                    : "source unavailable"}
                </summary>
                {n.authorities.error ? (
                  <p className={`mt-3 ${subdued}`}>{n.authorities.error}</p>
                ) : (
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {n.authorities.data?.map((a) => (
                      <article
                        key={a.address}
                        className="min-w-0 space-y-2 rounded-xl bg-slate-50 p-4 dark:bg-black/15"
                      >
                        <External href={a.url}>{a.label}</External>
                        <div>
                          <Address value={a.address} />
                        </div>
                        <dl className="space-y-2">
                          {n.id !== "solana" && (
                            <>
                              <div>
                                <dt className={subdued}>Owner</dt>
                                <dd>
                                  <Address value={a.owner} />
                                </dd>
                              </div>
                              <div>
                                <dt className={subdued}>Pending owner</dt>
                                <dd>
                                  <Address value={a.pendingOwner} />
                                </dd>
                              </div>
                            </>
                          )}
                          {a.adminLabel && (
                            <div>
                              <dt className={subdued}>{a.adminLabel}</dt>
                              <dd>
                                <Address value={a.admin} />
                              </dd>
                            </div>
                          )}
                        </dl>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {a.note}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
                <SourceNote value={n.authorities} />
              </details>
            ))}
          </section>
        </>
      )}
      <div className="flex flex-wrap gap-x-5 gap-y-3 border-t border-slate-200 pt-5 dark:border-white/10">
        <Link className={link} to="/docs/learn/governance">
          Terra Classic Governance
        </Link>
        <Link className={link} to="/docs/develop/hyperlane/contracts">
          Contracts &amp; Warp routes
        </Link>
        <External href="https://monitor.terraclassic-bridge.xyz/">
          Bridge monitoring
        </External>
        <External href={deploymentSource}>Deployment inventory</External>
      </div>
    </section>
  );
}
