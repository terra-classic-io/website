import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Database, RefreshCw } from "lucide-react";
import { stablecoinAssets, type StablecoinAsset } from "../../data/stablecoins";
import {
  fetchTerraClassicSupply,
  microAmountToDisplayNumber,
  TERRA_CLASSIC_TOTAL_SUPPLY_PATH,
} from "../../lib/terra-classic-supply";
import ResilientImage from "../resilient-image";

type SupplySnapshot = {
  readonly supplies: ReadonlyMap<string, string>;
  readonly fetchedAt: string;
  readonly source: string;
};

type LoadStatus = "loading" | "refreshing" | "ready" | "error";

type AssetsSupplyTableProps = {
  readonly assetUsdPrices: Readonly<Record<string, number>>;
};

const REFRESH_INTERVAL_MS = 120_000;

function formatDisplayAmount(amount?: string): string {
  if (!amount) {
    return "Unavailable";
  }
  const value = microAmountToDisplayNumber(amount);
  if (value === undefined) {
    return "Unavailable";
  }

  return new Intl.NumberFormat("en-US", {
    notation: Math.abs(value) >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: Math.abs(value) >= 1_000_000 ? 2 : value >= 1 ? 2 : 6,
  }).format(value);
}

function formatFullDisplayAmount(amount?: string): string | undefined {
  if (!amount || !/^\d+$/.test(amount)) {
    return undefined;
  }
  const padded = amount.padStart(7, "0");
  const integerPart = padded.slice(0, -6).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const fractionPart = padded.slice(-6).replace(/0+$/, "");
  return fractionPart ? `${integerPart}.${fractionPart}` : integerPart;
}

function calculateUsdValue(
  amount: string | undefined,
  asset: StablecoinAsset,
  assetUsdPrices: Readonly<Record<string, number>>,
): number | undefined {
  if (!amount) {
    return undefined;
  }
  const displayAmount = microAmountToDisplayNumber(amount);
  const price = assetUsdPrices[asset.symbol];
  if (displayAmount === undefined || typeof price !== "number") {
    return undefined;
  }
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

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function AssetsSupplyTable({ assetUsdPrices }: AssetsSupplyTableProps): JSX.Element {
  const [snapshot, setSnapshot] = useState<SupplySnapshot>();
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const requestRefresh = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadSupply = async (): Promise<void> => {
      setStatus((current) => current === "ready" || current === "refreshing" ? "refreshing" : "loading");
      setErrorMessage("");

      try {
        const result = await fetchTerraClassicSupply(controller.signal);
        if (controller.signal.aborted) {
          return;
        }

        const nativeDenoms = new Set(stablecoinAssets.map((asset) => asset.denom));
        setSnapshot({
          supplies: new Map(
            result.coins
              .filter((coin) => nativeDenoms.has(coin.denom))
              .map((coin) => [coin.denom, coin.amount]),
          ),
          fetchedAt: new Date().toISOString(),
          source: result.endpoint,
        });
        setStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.warn("Unable to load Terra Classic total supply", error);
        setErrorMessage("Live supply data is temporarily unavailable. Asset metadata remains available below.");
        setStatus("error");
      }
    };

    void loadSupply();
    const intervalId = window.setInterval(() => {
      void loadSupply();
    }, REFRESH_INTERVAL_MS);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [refreshKey]);

  const rows = useMemo(
    () => stablecoinAssets.map((asset) => ({
      asset,
      amount: snapshot?.supplies.get(asset.denom),
    })),
    [snapshot],
  );

  return (
    <section
      id="asset-supply"
      className="my-8 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 shadow-sm dark:border-white/10 dark:bg-white/[0.02]"
      aria-labelledby="asset-supply-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 px-5 py-5 dark:border-white/10 sm:px-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 id="asset-supply-title" className="text-xl font-semibold text-slate-950 dark:text-white">
              Live native asset supply
            </h3>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">
              ● Live chain data
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 dark:text-slate-400">
            Current minted supply, net of burns, queried from Terra Classic public LCD endpoints. USD values use the latest Vyntrex prices available to the site.
          </p>
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
        <div className="m-5 flex items-start gap-3 rounded-2xl border border-amber-300/70 bg-amber-50/80 p-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100" role="status">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1060px] text-left">
          <thead className="bg-slate-50/80 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:bg-white/[0.025] dark:text-slate-400">
            <tr>
              <th className="px-5 py-3 sm:px-6">Asset</th>
              <th className="px-4 py-3">Network denom</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-5 py-3 text-right sm:px-6">Minted supply</th>
              <th className="px-5 py-3 text-right sm:px-6">USD value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 dark:divide-white/10">
            {rows.map(({ asset, amount }) => {
              const usdValue = calculateUsdValue(amount, asset, assetUsdPrices);
              const fullAmount = formatFullDisplayAmount(amount);
              return (
                <tr key={asset.denom} className="text-sm text-slate-700 dark:text-slate-200">
                  <td className="px-5 py-3.5 sm:px-6">
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-blue-200 bg-blue-50 text-xs font-semibold dark:border-blue-500/20 dark:bg-blue-500/10">
                        <ResilientImage
                          src={asset.logo}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                          fallback={<span aria-hidden="true">{asset.glyph}</span>}
                        />
                      </span>
                      <span>
                        <strong className="block text-slate-950 dark:text-white">{asset.symbol}</strong>
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400">{asset.name}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">{asset.denom}</td>
                  <td className="px-4 py-3.5">{asset.currency}</td>
                  <td className="max-w-[220px] px-4 py-3.5 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {asset.symbol === "LUNC" ? "Native staking, governance, and gas asset" : "Historical fiat-denominated asset"}
                  </td>
                  <td
                    className="px-5 py-3.5 text-right font-semibold text-slate-950 dark:text-white sm:px-6"
                    title={fullAmount ? `${fullAmount} ${asset.symbol}` : undefined}
                  >
                    {status === "loading" && !amount ? "Loading…" : `${formatDisplayAmount(amount)}${amount ? ` ${asset.symbol}` : ""}`}
                  </td>
                  <td
                    className="px-5 py-3.5 text-right font-semibold text-blue-600 dark:text-blue-400 sm:px-6"
                    title={formatFullUsdValue(usdValue)}
                  >
                    {usdValue === undefined ? "—" : `≈ ${formatUsdValue(usdValue)}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200/80 px-5 py-3 text-[11px] text-slate-500 dark:border-white/10 dark:text-slate-400 sm:px-6">
        <span className="inline-flex items-center gap-1.5">
          <Database size={13} aria-hidden="true" />
          {snapshot ? `${snapshot.supplies.size} native denominations returned` : "Waiting for on-chain data"}
        </span>
        {snapshot ? <span>Refreshed {formatDateTime(snapshot.fetchedAt)}</span> : null}
        {snapshot ? (
          <a
            href={`${snapshot.source}${TERRA_CLASSIC_TOTAL_SUPPLY_PATH}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            Data source: {new URL(snapshot.source).hostname}
          </a>
        ) : null}
      </div>
    </section>
  );
}

export default AssetsSupplyTable;
