import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  Suspense,
} from "react";
import { Helmet } from "react-helmet-async";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import FAQAccordion from "./components/FAQAccordion";
import HeroSection from "./components/hero-section";
import MetricsShowcase, { TokenMetric } from "./components/metrics-showcase";
import SiteHeader from "./components/site-header";
import SiteFooter from "./components/site-footer";
import { stablecoinAssets } from "./data/stablecoins";
import { useTheme } from "./contexts/ThemeContext";
import type { DocNavigationOptions } from "./types/doc-navigation";
import { LAST_UPDATE } from "./generated/build-info";
const ProjectMapPage = React.lazy(() => import("./components/project-map/project-map-page"));
const DocsShell = React.lazy(() => import("./components/docs/docs-shell"));
const NotFoundPage = React.lazy(() => import("./components/not-found/not-found-page"));

export type TokenInfo = {
  readonly price: string;
  readonly change: string;
  readonly isPositive: boolean;
  readonly marketCap: string;
};

export type StakingInfo = {
  readonly apr: string;
};

export type AppState = {
  tokens: {
    LUNC: TokenInfo;
    USTC: TokenInfo;
  };
  staking: StakingInfo;
  isMobile: boolean;
};

type ValidatorAprBreakdown = {
  readonly denom: string;
  readonly amount: number;
};

type ValidatorAprResponse = {
  readonly apr: number;
  readonly aprByDenoms: readonly ValidatorAprBreakdown[];
};

type VyntrexPriceResponse = {
  readonly price: number;
  readonly gain1h?: number;
  readonly gain24h?: number;
  readonly gain7d?: number;
  readonly gain30d?: number;
  readonly marketCap?: number;
  readonly marketcap?: number;
  readonly market_cap?: number;
  readonly mcap?: number;
};

const STAKING_APR_ENDPOINT = "https://validator.info/api/terra-classic/blockchain/apr-info";
const VYNTREX_API_BASE = "https://api.vyntrex.io/api/v1/prices";
const VYNTREX_MARKET_CAP_API_BASE = "https://api.vyntrex.io/api/v1/marketcap";
const DEFAULT_VYNTREX_API_KEY = "a7eb94aa-ff81-4a82-89e2-ca3665f70739";
const CONFIGURED_VYNTREX_API_KEY = import.meta.env.VITE_VYNTREX_API_KEY?.trim();
const VYNTREX_API_KEY = CONFIGURED_VYNTREX_API_KEY || DEFAULT_VYNTREX_API_KEY;
const VYNTREX_MARKET_CAP_API_KEY = import.meta.env.VITE_VYNTREX_MARKET_CAP_API_KEY?.trim() || CONFIGURED_VYNTREX_API_KEY;
const VYNTREX_REFERER = "https://terra-classic.io";

const formatApr = (value: number): string => `${value.toFixed(2)}%`;
const formatUsdPrice = (value: number): string => {
  const minimumFractionDigits = value >= 1 ? 2 : value >= 0.01 ? 4 : value >= 0.0001 ? 5 : 6;
  const maximumFractionDigits = value >= 1 ? 4 : value >= 0.01 ? 6 : value >= 0.0001 ? 7 : 9;
  return `$${value.toLocaleString("en-US", { minimumFractionDigits, maximumFractionDigits })}`;
};

const formatUsdMarketCap = (value?: number): string => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return "$-.--";
  }

  const units = [
    { threshold: 1_000_000_000_000, suffix: "T" },
    { threshold: 1_000_000_000, suffix: "B" },
    { threshold: 1_000_000, suffix: "M" },
    { threshold: 1_000, suffix: "K" },
  ] as const;
  const unit = units.find(({ threshold }) => value >= threshold);

  if (!unit) {
    return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  }

  return `$${(value / unit.threshold).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}${unit.suffix}`;
};

const parseVyntrexMarketCap = (payload: unknown): number | undefined => {
  if (typeof payload === "number" && Number.isFinite(payload)) {
    return payload;
  }
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const response = payload as Record<string, unknown>;
  const candidate = [response.marketCap, response.marketcap, response.market_cap, response.mcap, response.value]
    .find((value) => typeof value === "number" || (typeof value === "string" && value.trim().length > 0));
  const marketCap = typeof candidate === "string" ? Number(candidate) : candidate;
  return typeof marketCap === "number" && Number.isFinite(marketCap) ? marketCap : undefined;
};

const formatChangePercentage = (value: number): { readonly label: string; readonly isPositive: boolean } => {
  const percentage = value * 100;
  const isPositive = percentage >= 0;
  const labelPrefix = isPositive ? "+" : "";
  return {
    label: `${labelPrefix}${percentage.toFixed(2)}%`,
    isPositive,
  };
};

const fetchVyntrexPrice = async (denom: string): Promise<VyntrexPriceResponse> => {
  const response = await fetch(`${VYNTREX_API_BASE}/${denom}`, {
    headers: {
      Accept: "application/json",
      "X-Api-Key": VYNTREX_API_KEY,
      Referer: VYNTREX_REFERER,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${denom} price: ${response.status}`);
  }

  return (await response.json()) as VyntrexPriceResponse;
};

const fetchVyntrexMarketCap = async (denom: string): Promise<number | undefined> => {
  if (!VYNTREX_MARKET_CAP_API_KEY) {
    return undefined;
  }

  const response = await fetch(`${VYNTREX_MARKET_CAP_API_BASE}/${denom}`, {
    headers: {
      Accept: "application/json",
      "X-Api-Key": VYNTREX_MARKET_CAP_API_KEY,
      Referer: VYNTREX_REFERER,
    },
  });

  if (!response.ok) {
    return undefined;
  }

  return parseVyntrexMarketCap(await response.json());
};

const getInitialState = (): AppState => ({
  tokens: {
    LUNC: {
      price: "$-.--",
      change: "+.---%",
      isPositive: true,
      marketCap: "$-.--",
    },
    USTC: {
      price: "$-.--",
      change: "+.---%",
      isPositive: true,
      marketCap: "$-.--",
    },
  },
  staking: {
    apr: "-.--%",
  },
  isMobile: false,
});

export const DEFAULT_STATE = getInitialState();

const App: React.FC<{
  readonly initialState?: Partial<AppState>;
  readonly initialHostname?: string;
}> = ({ initialState = {}, initialHostname = "" }) => {
  const mergedInitialState = useMemo<AppState>(
    () => ({
      ...DEFAULT_STATE,
      ...initialState,
      tokens: {
        ...DEFAULT_STATE.tokens,
        ...(initialState.tokens ?? {}),
      },
      staking: {
        ...DEFAULT_STATE.staking,
        ...(initialState.staking ?? {}),
      },
      isMobile: initialState.isMobile ?? DEFAULT_STATE.isMobile,
    }),
    [initialState]
  );

  const [appState, setAppState] = useState<AppState>(mergedInitialState);
  const [stablecoinPrices, setStablecoinPrices] = useState<Record<string, TokenInfo>>({
    LUNC: mergedInitialState.tokens.LUNC,
    USTC: mergedInitialState.tokens.USTC,
  });
  const location = useLocation();
  const navigate = useNavigate();

  const { resolvedTheme } = useTheme();

  const normalizedInitialHostname = useMemo<string>(
    () => initialHostname.toLowerCase(),
    [initialHostname]
  );

  const [hostname, setHostname] = useState<string>(() => {
    if (typeof window !== "undefined" && window.location.hostname) {
      return window.location.hostname.toLowerCase();
    }
    return normalizedInitialHostname;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.location.hostname) {
      return;
    }
    setHostname(window.location.hostname.toLowerCase());
  }, [normalizedInitialHostname]);
  useEffect(() => {
    setAppState(mergedInitialState);
  }, [mergedInitialState]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const updateMobileState = () => {
      setAppState((prev) => ({
        ...prev,
        isMobile: window.innerWidth < 768,
      }));
    };

    updateMobileState();
    window.addEventListener("resize", updateMobileState);

    return () => {
      window.removeEventListener("resize", updateMobileState);
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const fetchStakingApr = async () => {
      try {
        const response = await fetch(STAKING_APR_ENDPOINT, {
          headers: {
            Accept: "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch staking APR: ${response.status}`);
        }
        const data: ValidatorAprResponse = await response.json();
        if (typeof data.apr !== "number" || Number.isNaN(data.apr)) {
          return;
        }
        if (isCancelled) {
          return;
        }
        setAppState((previous) => ({
          ...previous,
          staking: {
            apr: formatApr(data.apr),
          },
        }));
      } catch (error) {
        console.error("Unable to load staking APR", error);
      }
    };

    fetchStakingApr();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let isCancelled = false;
    let intervalId: number | undefined;

    const fetchTokenPrices = async () => {
      const results = await Promise.allSettled(
        stablecoinAssets.map(async (asset) => {
          const data = await fetchVyntrexPrice(asset.denom);
          const change = formatChangePercentage(data.gain24h ?? 0);
          const marketCap = parseVyntrexMarketCap(data) ?? await fetchVyntrexMarketCap(asset.denom);
          return [
            asset.symbol,
            {
              price: formatUsdPrice(data.price ?? 0),
              change: change.label,
              isPositive: change.isPositive,
              marketCap: formatUsdMarketCap(marketCap),
            } satisfies TokenInfo,
          ] as const;
        })
      );

      if (isCancelled) {
        return;
      }

      const nextPrices = results.reduce<Record<string, TokenInfo>>((prices, result) => {
        if (result.status === "fulfilled") {
          const [symbol, tokenInfo] = result.value;
          prices[symbol] = tokenInfo;
        }
        return prices;
      }, {});

      setStablecoinPrices((previous) => ({ ...previous, ...nextPrices }));
      setAppState((previous) => ({
        ...previous,
        tokens: {
          LUNC: nextPrices.LUNC ?? previous.tokens.LUNC,
          USTC: nextPrices.USTC ?? previous.tokens.USTC,
        },
      }));

      const failedRequests = results.filter((result) => result.status === "rejected").length;
      if (failedRequests > 0) {
        console.warn(`Unable to refresh ${failedRequests} Terra Classic asset price(s)`);
      }
    };

    fetchTokenPrices();
    intervalId = window.setInterval(fetchTokenPrices, 300_000);

    return () => {
      isCancelled = true;
      if (typeof intervalId === "number") {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  const pathSegments = useMemo<readonly string[]>(
    () => location.pathname.split("/").filter(Boolean),
    [location.pathname]
  );

  const docsHostnameCandidates = useMemo<readonly string[]>(
    () => ["docs.terra-classic.io"],
    []
  );

  const normalizedHostname = hostname.toLowerCase();

  const isDocsSubdomain = useMemo<boolean>(() => {
    if (!normalizedHostname) {
      return false;
    }
    if (normalizedHostname.startsWith("docs.")) {
      return true;
    }
    return docsHostnameCandidates.includes(normalizedHostname);
  }, [docsHostnameCandidates, normalizedHostname]);

  const isDocsPath = pathSegments[0] === "docs";

  const docSegments = useMemo<readonly string[]>(() => {
    if (isDocsSubdomain) {
      return pathSegments;
    }
    if (isDocsPath) {
      return pathSegments.slice(1);
    }
    return [];
  }, [isDocsPath, isDocsSubdomain, pathSegments]);

  const isDocsMode = isDocsSubdomain || isDocsPath;

  const handleDocsNavigate = useCallback(
    (sectionSlug: string, pagePath?: readonly string[], options?: DocNavigationOptions) => {
      const effectivePagePath: readonly string[] = pagePath ?? [];
      const segments: string[] = [];
      if (!isDocsSubdomain) {
        segments.push("docs");
      }
      if (sectionSlug) {
        segments.push(sectionSlug);
      }
      segments.push(...effectivePagePath.filter((segment) => segment.length > 0));

      const nextPath = segments.length > 0 ? `/${segments.join("/")}` : "/";
      const hash = options?.hash ?? "";
      navigate(`${nextPath}${hash}`);
    },
    [isDocsSubdomain, navigate]
  );
  
  const tokenMetrics = useMemo<TokenMetric[]>(() => {
    return stablecoinAssets.map((asset) => {
      const fallback = asset.symbol === "LUNC"
        ? appState.tokens.LUNC
        : asset.symbol === "USTC"
        ? appState.tokens.USTC
        : { price: "$-.--", change: "+.---%", isPositive: true, marketCap: "$-.--" };
      const metric = stablecoinPrices[asset.symbol] ?? fallback;
      return { symbol: asset.symbol, ...metric };
    });
  }, [appState.tokens, stablecoinPrices]);

  const handleOpenDocs = useCallback(() => {
    handleDocsNavigate("", []);
  }, [handleDocsNavigate]);

  const handleOpenMap = useCallback(() => {
    navigate("/bubbles");
  }, [navigate]);

  if (isDocsMode) {
    return (
      <Suspense fallback={<div style={{ minHeight: 200 }} />}> 
        <DocsShell
          docSegments={docSegments}
          onNavigate={handleDocsNavigate}
          isDocsSubdomain={isDocsSubdomain}
        />
      </Suspense>
    );
  }

  const homeContent = (
    <div className="relative z-30">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-5 px-5 pb-8 pt-5 sm:px-8 lg:px-10">
        <HeroSection
          onExploreCategories={handleOpenMap}
          onOpenDocs={handleOpenDocs}
          onOpenMap={handleOpenMap}
        />
        <MetricsShowcase
          tokens={tokenMetrics}
          stakingApr={appState.staking.apr}
          onOpenDocs={handleOpenDocs}
          onOpenMap={handleOpenMap}
        />
      </div>

      <div className="mx-auto max-w-[1480px] px-5 py-10 sm:px-8 lg:px-10">
        <FAQAccordion />
      </div>
    </div>
  );

  // Retrieve last update date injected by generate-build-info.mjs
  const lastUpdate = LAST_UPDATE;
  const formattedUpdate = (() => {
    if (!lastUpdate) {
      return "";
    }

    const [yearText, monthText, dayText] = String(lastUpdate).split("-");
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);

    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
      return "";
    }

    const localDate = new Date(year, month - 1, day);
    if (Number.isNaN(localDate.getTime())) {
      return "";
    }

    return localDate
      .toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
      .toUpperCase();
  })();

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#f8fafc] text-slate-900 transition-colors duration-300 dark:bg-[#020b19] dark:text-slate-50">
      <Helmet>
        <meta
          name="theme-color"
          content={resolvedTheme === "dark" ? "#020617" : "#e2e8f0"}
        />
      </Helmet>

      <SiteHeader onExplore={handleOpenMap} onSearch={handleOpenMap} />

      <Routes>
        <Route path="/" element={homeContent} />
        <Route
          path="/bubbles"
          element={
            <Suspense fallback={<div style={{ minHeight: 200 }} />}>
              <ProjectMapPage />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <Suspense
              fallback={<div style={{ minHeight: 200 }} />}
            >
              <NotFoundPage />
            </Suspense>
          }
        />
      </Routes>

      <SiteFooter lastUpdated={formattedUpdate} />
    </div>
  );
};

export default App;
