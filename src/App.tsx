import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  Suspense,
} from "react";
import { Helmet } from "react-helmet-async";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import FAQAccordion from "./components/FAQAccordion";
import HeroSection from "./components/hero-section";
import MetricsShowcase, { TokenMetric } from "./components/metrics-showcase";
import SiteHeader from "./components/site-header";
import SiteFooter from "./components/site-footer";
import SeoHead, { OG_IMAGE_URL, SITE_URL } from "./components/seo-head";
import { stablecoinAssets } from "./data/stablecoins";
import { siteLinks } from "./data/site-links";
import { docSeoSections } from "./generated/doc-seo";
import { useTheme } from "./contexts/ThemeContext";
import type { DocNavigationOptions } from "./types/doc-navigation";
import type { DocSeoPage, DocSeoSection } from "./types/doc-seo";
import { LAST_UPDATE } from "./generated/build-info";
import {
  fetchTerraClassicCirculatingSupply,
  type TerraClassicCirculatingSupplyAsset,
} from "./lib/terra-classic-supply";
import { scheduleNonCriticalTask } from "./utils/schedule-non-critical-task";
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
};

const STAKING_APR_ENDPOINT = "https://validator.info/api/terra-classic/blockchain/apr-info";
const VYNTREX_API_BASE = "https://api.vyntrex.io/api/v1/prices";
const DEFAULT_VYNTREX_API_KEY = "a7eb94aa-ff81-4a82-89e2-ca3665f70739";
const CONFIGURED_VYNTREX_API_KEY = import.meta.env.VITE_VYNTREX_API_KEY?.trim();
const VYNTREX_API_KEY = CONFIGURED_VYNTREX_API_KEY || DEFAULT_VYNTREX_API_KEY;
const VYNTREX_REFERER = "https://terra-classic.io";
const FCD_CIRCULATING_SUPPLY_ASSET_BY_SYMBOL = {
  LUNC: "luna",
  USTC: "ust",
} as const satisfies Readonly<Record<string, TerraClassicCirculatingSupplyAsset>>;

const HOME_TITLE = "Terra Classic (LUNC) | Ecosystem, Docs & Governance";
const HOME_DESCRIPTION = "Explore Terra Classic (LUNC): native assets, live network data, validators, governance, developer guides, wallets, DeFi projects, and documentation.";
const ECOSYSTEM_TITLE = "Terra Classic Ecosystem Directory | LUNC Projects";
const ECOSYSTEM_DESCRIPTION = "Browse Terra Classic ecosystem projects, wallets, validators, infrastructure, DeFi applications, bridges, and developer tools in one searchable directory.";
const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

const organizationStructuredData = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: "Terra Classic Community",
  alternateName: ["Terra Classic", "Luna Classic"],
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/favicon-512.png`,
    width: 512,
    height: 512,
  },
  image: OG_IMAGE_URL,
  sameAs: [
    siteLinks.github,
    siteLinks.communityForum,
    siteLinks.communityTelegram,
  ],
};

const websiteStructuredData = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: SITE_URL,
  name: "Terra Classic",
  alternateName: "Luna Classic",
  description: HOME_DESCRIPTION,
  inLanguage: "en",
  publisher: { "@id": ORGANIZATION_ID },
};

type DocSeoTarget = {
  readonly section: DocSeoSection;
  readonly page: DocSeoPage;
  readonly trail: readonly DocSeoPage[];
  readonly path: readonly string[];
  readonly isValid: boolean;
};

const resolveDocSeoTarget = (segments: readonly string[]): DocSeoTarget => {
  const seoSections: readonly DocSeoSection[] = docSeoSections;
  const fallbackSection = seoSections[0];
  const fallbackPage = fallbackSection.pages[0];
  const [sectionSlug, ...pageSegments] = segments;
  const matchingSection = seoSections.find((candidate) => candidate.slug === sectionSlug);
  const section = matchingSection ?? fallbackSection;
  let isValid = segments.length === 0 || Boolean(matchingSection);
  let pages = section.pages;
  const trail: DocSeoPage[] = [];

  if (pageSegments.length === 0) {
    trail.push(pages[0] ?? fallbackPage);
  } else {
    pageSegments.forEach((pageSlug) => {
      const page = pages.find((candidate) => candidate.slug === pageSlug);
      if (!page) {
        isValid = false;
        return;
      }
      trail.push(page);
      pages = page.children ?? [];
    });
  }

  const page = trail[trail.length - 1] ?? fallbackPage;
  return {
    section,
    page,
    trail: trail.length > 0 ? trail : [fallbackPage],
    path: (trail.length > 0 ? trail : [fallbackPage]).map((entry) => entry.slug),
    isValid,
  };
};

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

    const cancelScheduledFetch = scheduleNonCriticalTask(() => {
      void fetchStakingApr();
    });

    return () => {
      isCancelled = true;
      cancelScheduledFetch();
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
      const circulatingSupplyPromise = Promise.allSettled(
        Object.entries(FCD_CIRCULATING_SUPPLY_ASSET_BY_SYMBOL).map(async ([symbol, asset]) => {
          const result = await fetchTerraClassicCirculatingSupply(asset);
          return [symbol, result.amount] as const;
        })
      );
      const priceResultsPromise = Promise.allSettled(
        stablecoinAssets.map(async (asset) => {
          const data = await fetchVyntrexPrice(asset.denom);
          return [asset, data] as const;
        })
      );
      const [circulatingSupplyResults, results] = await Promise.all([
        circulatingSupplyPromise,
        priceResultsPromise,
      ]);

      if (isCancelled) {
        return;
      }

      const circulatingSupplies = new Map(
        circulatingSupplyResults.flatMap((result) => result.status === "fulfilled" ? [result.value] : [])
      );
      const nextPrices = results.reduce<Record<string, TokenInfo>>((prices, result) => {
        if (result.status === "fulfilled") {
          const [asset, data] = result.value;
          const change = formatChangePercentage(data.gain24h ?? 0);
          const circulatingSupply = circulatingSupplies.get(asset.symbol);
          const marketCap = circulatingSupply === undefined ? undefined : circulatingSupply * data.price;
          prices[asset.symbol] = {
            price: formatUsdPrice(data.price ?? 0),
            change: change.label,
            isPositive: change.isPositive,
            marketCap: formatUsdMarketCap(marketCap),
          } satisfies TokenInfo;
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
      const failedSupplyRequests = circulatingSupplyResults.filter((result) => result.status === "rejected").length;
      if (failedSupplyRequests > 0) {
        console.warn(`Unable to refresh ${failedSupplyRequests} Terra Classic circulating supply value(s)`);
      }
    };

    const cancelScheduledFetch = scheduleNonCriticalTask(() => {
      void fetchTokenPrices();
      intervalId = window.setInterval(() => {
        void fetchTokenPrices();
      }, 300_000);
    });

    return () => {
      isCancelled = true;
      cancelScheduledFetch();
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

  const assetUsdPrices = useMemo<Readonly<Record<string, number>>>(() => tokenMetrics.reduce<Record<string, number>>((prices, metric) => {
    const numericPrice = Number(metric.price.replace(/[$,]/g, ""));
    if (Number.isFinite(numericPrice) && numericPrice > 0) {
      prices[metric.symbol] = numericPrice;
    }
    return prices;
  }, {}), [tokenMetrics]);

  const handleOpenDocs = useCallback(() => {
    handleDocsNavigate("", []);
  }, [handleDocsNavigate]);

  const handleOpenStablecoins = useCallback(() => {
    handleDocsNavigate("learn", ["stablecoins"]);
  }, [handleDocsNavigate]);

  const handleOpenTreasury = useCallback(() => {
    handleDocsNavigate("learn", ["treasury"]);
  }, [handleDocsNavigate]);

  const handleOpenDevelopers = useCallback(() => {
    handleDocsNavigate("develop", ["overview"]);
  }, [handleDocsNavigate]);

  const handleOpenGovernance = useCallback(() => {
    handleDocsNavigate("learn", ["governance"]);
  }, [handleDocsNavigate]);

  const handleOpenMap = useCallback(() => {
    navigate("/ecosystem");
  }, [navigate]);

  if (isDocsMode) {
    const docSeoTarget = resolveDocSeoTarget(docSegments);
    const docPageUrl = `${SITE_URL}/docs/${docSeoTarget.section.slug}/${docSeoTarget.path.join("/")}`;
    const docPageTitle = `${docSeoTarget.page.title} | Terra Classic Docs`;
    const docPageDescription = docSeoTarget.page.summary
      || "Terra Classic documentation covering network operations, native assets, wallets, governance, and development.";
    const docBreadcrumbItems = [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Documentation", item: `${SITE_URL}/docs` },
      ...docSeoTarget.trail.map((entry, index) => ({
        "@type": "ListItem",
        position: index + 3,
        name: entry.title,
        item: `${SITE_URL}/docs/${docSeoTarget.section.slug}/${docSeoTarget.trail.slice(0, index + 1).map((target) => target.slug).join("/")}`,
      })),
    ];
    const docStructuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": docSeoTarget.section.slug === "develop" || docSeoTarget.section.slug === "full-node" ? "TechArticle" : "Article",
          "@id": `${docPageUrl}#article`,
          headline: docSeoTarget.page.title,
          description: docPageDescription,
          url: docPageUrl,
          mainEntityOfPage: { "@type": "WebPage", "@id": docPageUrl },
          image: OG_IMAGE_URL,
          dateModified: LAST_UPDATE,
          inLanguage: "en",
          author: { "@type": "Organization", "@id": ORGANIZATION_ID, name: "Terra Classic Community" },
          publisher: { "@type": "Organization", "@id": ORGANIZATION_ID, name: "Terra Classic Community" },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: docBreadcrumbItems,
        },
      ],
    };

    return (
      <>
        <SeoHead
          title={docPageTitle}
          description={docPageDescription}
          canonicalPath={docPageUrl}
          type="article"
          noIndex={!docSeoTarget.isValid}
          modifiedTime={LAST_UPDATE}
          structuredData={docStructuredData}
        />
        <Suspense fallback={<div style={{ minHeight: 200 }}>
          <a href={docPageUrl}>{docSeoTarget.page.title}</a>
        </div>}>
          <DocsShell
            docSegments={docSegments}
            onNavigate={handleDocsNavigate}
            isDocsSubdomain={isDocsSubdomain}
            assetUsdPrices={assetUsdPrices}
          />
        </Suspense>
      </>
    );
  }

  const isHomeRoute = location.pathname === "/";
  const isEcosystemRoute = location.pathname === "/ecosystem" || location.pathname === "/bubbles";
  const pageSeo = isHomeRoute
    ? {
        title: HOME_TITLE,
        description: HOME_DESCRIPTION,
        canonicalPath: "/",
        noIndex: false,
        structuredData: {
          "@context": "https://schema.org",
          "@graph": [
            organizationStructuredData,
            websiteStructuredData,
            {
              "@type": "WebPage",
              "@id": `${SITE_URL}/#webpage`,
              url: `${SITE_URL}/`,
              name: HOME_TITLE,
              description: HOME_DESCRIPTION,
              isPartOf: { "@id": WEBSITE_ID },
              about: { "@id": ORGANIZATION_ID },
              primaryImageOfPage: { "@type": "ImageObject", url: OG_IMAGE_URL },
              inLanguage: "en",
            },
          ],
        },
      }
    : isEcosystemRoute
    ? {
        title: ECOSYSTEM_TITLE,
        description: ECOSYSTEM_DESCRIPTION,
        canonicalPath: "/ecosystem",
        noIndex: false,
        structuredData: {
          "@context": "https://schema.org",
          "@graph": [
            organizationStructuredData,
            websiteStructuredData,
            {
              "@type": "CollectionPage",
              "@id": `${SITE_URL}/ecosystem#webpage`,
              url: `${SITE_URL}/ecosystem`,
              name: ECOSYSTEM_TITLE,
              description: ECOSYSTEM_DESCRIPTION,
              isPartOf: { "@id": WEBSITE_ID },
              about: { "@id": ORGANIZATION_ID },
              inLanguage: "en",
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
                { "@type": "ListItem", position: 2, name: "Ecosystem Directory", item: `${SITE_URL}/ecosystem` },
              ],
            },
          ],
        },
      }
    : {
        title: "Page not found | Terra Classic",
        description: "The requested Terra Classic page could not be found.",
        canonicalPath: location.pathname,
        noIndex: true,
        structuredData: undefined,
      };

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
          onOpenStablecoins={handleOpenStablecoins}
          onOpenTreasury={handleOpenTreasury}
          onOpenDevelopers={handleOpenDevelopers}
          onOpenGovernance={handleOpenGovernance}
          onOpenMap={handleOpenMap}
        />
      </div>

      <div className="deferred-section mx-auto max-w-[1480px] px-5 py-10 sm:px-8 lg:px-10">
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
      <SeoHead
        title={pageSeo.title}
        description={pageSeo.description}
        canonicalPath={pageSeo.canonicalPath}
        noIndex={pageSeo.noIndex}
        structuredData={pageSeo.structuredData}
      />
      <Helmet>
        <meta
          name="theme-color"
          content={resolvedTheme === "dark" ? "#020617" : "#e2e8f0"}
        />
      </Helmet>

      <SiteHeader onExplore={handleOpenMap} />

      <main id="main-content">
        <Routes>
          <Route path="/" element={homeContent} />
          <Route
            path="/ecosystem"
            element={
              <Suspense fallback={<div style={{ minHeight: 200 }} />}>
                <ProjectMapPage />
              </Suspense>
            }
          />
          <Route
            path="/bubbles"
            element={<Navigate to={{ pathname: "/ecosystem", search: location.search }} replace />}
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
      </main>

      <SiteFooter lastUpdated={formattedUpdate} />
    </div>
  );
};

export default App;
