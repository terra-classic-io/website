import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
} from "react";
import { Helmet } from "react-helmet-async";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import CategoryNavigation from "./components/category-navigation";
import CategorySection from "./components/CategorySection";
import FAQAccordion from "./components/FAQAccordion";
import HeroSection from "./components/hero-section";
import MetricsShowcase, { TokenMetric } from "./components/metrics-showcase";
import ThemeToggle from "./components/ThemeToggle";
import { projects } from "./data/projects";
import { categories } from "./data/categories";
import { useTheme } from "./contexts/ThemeContext";
import SortControls, { SortMode } from "./components/sort-controls";
import type { DocNavigationOptions } from "./types/doc-navigation";
const ProjectMapPage = React.lazy(() => import("./components/project-map/project-map-page"));
const DocsShell = React.lazy(() => import("./components/docs/docs-shell"));
const NotFoundPage = React.lazy(() => import("./components/not-found/not-found-page"));

export type TokenInfo = {
  readonly price: string;
  readonly change: string;
  readonly isPositive: boolean;
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
};

const SCROLL_OFFSET_DESKTOP = 96;
const SCROLL_OFFSET_MOBILE = 56;
const STAKING_APR_ENDPOINT = "https://validator.info/api/terra-classic/blockchain/apr-info";
const VYNTREX_API_BASE = "https://api.vyntrex.io/api/v1/prices";
const VYNTREX_API_KEY = "a7eb94aa-ff81-4a82-89e2-ca3665f70739";
const VYNTREX_REFERER = "https://terra-classic.io";

const formatApr = (value: number): string => `${value.toFixed(2)}%`;
const formatUsdPrice = (value: number): string =>
  `$${value.toLocaleString("en-US", {
    minimumFractionDigits: value >= 1 ? 2 : 5,
    maximumFractionDigits: value >= 1 ? 4 : 6,
  })}`;

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

const getInitialState = (): AppState => ({
  tokens: {
    LUNC: {
      price: "$-.--",
      change: "+.---%",
      isPositive: true,
    },
    USTC: {
      price: "$-.--",
      change: "+.---%",
      isPositive: true,
    },
  },
  staking: {
    apr: "-.--%",
  },
  isMobile: false,
});

export const DEFAULT_STATE = getInitialState();

type CategoryRefMap = Record<string, HTMLElement | null>;

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
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const categoriesContainerRef = useRef<HTMLDivElement | null>(null);
  const categoryRefs = useRef<CategoryRefMap>({});
  const location = useLocation();
  const navigate = useNavigate();

  const { resolvedTheme } = useTheme();
  const [sortMode, setSortMode] = useState<SortMode>("random");
  const [prioritizeOnchain, setPrioritizeOnchain] = useState<boolean>(false);

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
  const [heroDetailsExpanded, setHeroDetailsExpanded] = useState<boolean>(false);

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
    setHeroDetailsExpanded(!appState.isMobile);
  }, [appState.isMobile]);

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
      try {
        const [luncData, ustcData] = await Promise.all([
          fetchVyntrexPrice("uluna"),
          fetchVyntrexPrice("uusd"),
        ]);

        if (isCancelled) {
          return;
        }

        setAppState((previous) => {
          const luncChange = formatChangePercentage(luncData.gain24h ?? 0);
          const ustcChange = formatChangePercentage(ustcData.gain24h ?? 0);

          return {
            ...previous,
            tokens: {
              LUNC: {
                price: formatUsdPrice(luncData.price ?? 0),
                change: luncChange.label,
                isPositive: luncChange.isPositive,
              },
              USTC: {
                price: formatUsdPrice(ustcData.price ?? 0),
                change: ustcChange.label,
                isPositive: ustcChange.isPositive,
              },
            },
          };
        });
      } catch (error) {
        console.error("Unable to load token prices", error);
      }
    };

    fetchTokenPrices();
    intervalId = window.setInterval(fetchTokenPrices, 30_000);

    return () => {
      isCancelled = true;
      if (typeof intervalId === "number") {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  const totalResourceCount = useMemo<number>(
    () => projects.length,
    []
  );

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
  
  const visibleCategories = useMemo<(keyof typeof categories)[]>(() => {
    if (activeCategory === "All") {
      return Object.keys(categories);
    }
    return Object.keys(categories).filter((category) => category === activeCategory);
  }, [activeCategory]);

  const tokenMetrics = useMemo<TokenMetric[]>(() => {
    const { LUNC, USTC } = appState.tokens;
    return [
      {
        symbol: "LUNC",
        price: LUNC.price,
        change: LUNC.change,
        isPositive: LUNC.isPositive,
      },
      {
        symbol: "USTC",
        price: USTC.price,
        change: USTC.change,
        isPositive: USTC.isPositive,
      },
    ];
  }, [appState.tokens]);

  const heroStats = useMemo(
    () => [
      {
        label: "Projects",
        value: `${totalResourceCount}+`,
        description:
          "Applications, infrastructure, and tools",
      },
      {
        label: "Staking APR",
        value: appState.staking.apr,
        description: "Source: validator.info",
      },
    ],
    [appState.staking.apr, totalResourceCount]
  );

  const assignCategoryRef = useCallback(
    (category: string, element: HTMLElement | null) => {
      if (element) {
        categoryRefs.current[category] = element;
      } else {
        delete categoryRefs.current[category];
      }
    },
    []
  );

  const scrollToElement = useCallback(
    (element: HTMLElement | null) => {
      if (!element || typeof window === "undefined") {
        return;
      }
      const offset = appState.isMobile
        ? SCROLL_OFFSET_MOBILE
        : SCROLL_OFFSET_DESKTOP;
      const targetPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: targetPosition - offset, behavior: "smooth" });
    },
    [appState.isMobile]
  );

  const handleExploreCategories = useCallback(() => {
    setActiveCategory("All");
    scrollToElement(categoriesContainerRef.current);
  }, [scrollToElement]);

  const handleCategorySelect = useCallback(
    (category: string) => {
      setActiveCategory(category);
      if (category === "All") {
        scrollToElement(categoriesContainerRef.current);
        return;
      }
      scrollToElement(categoryRefs.current[category] ?? null);
    },
    [scrollToElement]
  );

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

  const showExtendedHeroContent: boolean = !appState.isMobile || heroDetailsExpanded;
  const heroStackSpacingClass: string = !appState.isMobile
    ? "gap-16"
    : heroDetailsExpanded
    ? "gap-12"
    : "gap-8";

  const homeContent = (
    <div className="relative z-30">
      <div
        className={`mx-auto flex max-w-6xl flex-col ${heroStackSpacingClass} px-4 pb-14 pt-8 sm:pt-16 sm:px-10 lg:px-12`}
      >
        <HeroSection
          onExploreCategories={handleExploreCategories}
          onOpenDocs={handleOpenDocs}
          onOpenMap={handleOpenMap}
          stats={heroStats}
          isMobile={appState.isMobile}
          isExpanded={heroDetailsExpanded}
          onToggleExpand={() =>
            setHeroDetailsExpanded((previous: boolean) => !previous)
          }
        />
        {showExtendedHeroContent && (
          <MetricsShowcase
            tokens={tokenMetrics}
            stakingApr={appState.staking.apr}
          />
        )}
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-10 lg:px-12">
        <CategoryNavigation
          categories={categories}
          activeCategory={activeCategory}
          summaryCount={totalResourceCount}
          onSelect={handleCategorySelect}
        />
      </div>

      <div className="sticky top-0 z-50 backdrop-blur-sm mx-auto max-w-6xl px-4 sm:px-10 lg:px-12">
        <SortControls
          sortMode={sortMode}
          onChangeSortMode={setSortMode}
          prioritizeOnchain={prioritizeOnchain}
          onTogglePrioritizeOnchain={() =>
            setPrioritizeOnchain((previous) => !previous)
          }
        />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-20 pt-6 sm:px-10 lg:px-12">
        <div
          ref={categoriesContainerRef}
          className="flex flex-col gap-6 pt-4 md:flex-row md:flex-wrap"
        >
          {visibleCategories.map((category) => (
            <div
              key={category}
              id={`category-${category}`}
              data-title={categories[category].title}
              ref={(element) => assignCategoryRef(category, element)}
              className="w-full md:flex-1"
            >
              <CategorySection
                category={category}
                sortMode={sortMode}
                prioritizeOnchain={prioritizeOnchain}
              />
            </div>
          ))}
        </div>
        <FAQAccordion />
      </div>
    </div>
  );

  //Retrieve Last Update Date from generate-build-info.js
  const lastUpdate = import.meta.env.VITE_LAST_UPDATE;
  const formattedUpdate = lastUpdate
    ? new Date(lastUpdate)
      .toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
      .toUpperCase()
    : "";

  return (
    <div className="relative min-h-screen overflow-x-clip bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-50">
      <Helmet>
        <meta
          name="theme-color"
          content={resolvedTheme === "dark" ? "#020617" : "#e2e8f0"}
        />
      </Helmet>

      <div className="pointer-events-none fixed inset-x-0 top-[-15%] hidden h-[420px] bg-gradient-to-b from-sky-200/70 via-transparent to-transparent dark:from-sky-900/30 sm:block" />
      <div className="pointer-events-none fixed left-[-12%] top-1/3 hidden h-80 w-80 rounded-full bg-sky-400/25 blur-3xl dark:bg-sky-500/15 sm:block" />
      <div className="pointer-events-none fixed right-[-14%] top-1/4 hidden h-96 w-96 rounded-full bg-indigo-400/20 blur-[120px] dark:bg-indigo-500/10 sm:block" />

      <div className="fixed right-3 top-3 z-40 sm:right-6 sm:top-6">
        <ThemeToggle size={appState.isMobile ? "sm" : "md"} />
      </div>

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

      <footer className="relative z-20 border-t border-slate-200/60 bg-white/80 py-10 backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 text-sm text-slate-500 transition-colors duration-300 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-12">
          <p>Built with ❤️ by the Terra Classic community.</p>
          <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
            <span>UPDATED {formattedUpdate}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
