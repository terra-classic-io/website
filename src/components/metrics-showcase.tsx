import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Blocks,
  Box,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Code2,
  Gamepad2,
  Landmark,
  Network,
  ShieldCheck,
  Shuffle,
  Users,
  WalletCards,
} from "lucide-react";
import terraClassicLogoUrl from "../assets/terra-classic.svg";
import { categories } from "../data/categories";
import { projects, type ProjectLink } from "../data/projects";
import { stablecoinAssets } from "../data/stablecoins";
import ResilientImage from "./resilient-image";

export type TokenMetric = {
  readonly symbol: string;
  readonly price: string;
  readonly change: string;
  readonly isPositive: boolean;
  readonly marketCap: string;
};

type MetricsShowcaseProps = {
  readonly tokens: readonly TokenMetric[];
  readonly stakingApr: string;
  readonly onOpenStablecoins: () => void;
  readonly onOpenTreasury: () => void;
  readonly onOpenDevelopers: () => void;
  readonly onOpenGovernance: () => void;
  readonly onOpenMap: () => void;
};

const stablecoinAssetMap = new Map(stablecoinAssets.map((asset) => [asset.symbol, asset]));

// Add a symbol here to display its card in the homepage asset list again.
// This setting is intentionally independent from the hero orbit configuration.
const HOME_ASSET_LIST_SYMBOLS = new Set(["LUNC", "USTC"]);

const ecosystemFeatures = [
  { title: "DeFi", body: "Open financial applications", icon: Box, tone: "text-blue-600 dark:text-blue-400" },
  { title: "Infrastructure", body: "Services powering the network", icon: Network, tone: "text-violet-600 dark:text-violet-400" },
  { title: "Applications", body: "Services built on Terra Classic", icon: Code2, tone: "text-emerald-600 dark:text-emerald-400" },
  { title: "Analytics", body: "Data for smarter decisions", icon: BarChart3, tone: "text-fuchsia-600 dark:text-fuchsia-400" },
  { title: "NFT & Gaming", body: "Digital ownership for all", icon: Gamepad2, tone: "text-indigo-600 dark:text-indigo-400" },
  { title: "And more", body: "Explore every listed project", icon: Blocks, tone: "text-blue-600 dark:text-blue-400" },
] as const;

const constellationNodes = [
  { category: "validators", position: "left-1/2 top-[2%] -translate-x-1/2", tone: "border-sky-400/50 text-sky-600 dark:text-sky-400", fallbackIcon: ShieldCheck },
  { category: "entertainment", position: "left-[12%] top-[28%]", tone: "border-violet-400/50 text-violet-600 dark:text-violet-400", fallbackIcon: Gamepad2 },
  { category: "infrastructure", position: "right-[10%] top-[21%]", tone: "border-blue-400/50 text-blue-600 dark:text-blue-400", fallbackIcon: Network },
  { category: "dex", position: "left-[1%] top-[53%]", tone: "border-cyan-400/50 text-cyan-600 dark:text-cyan-400", fallbackIcon: CircleDollarSign },
  { category: "tools", position: "right-[2%] top-[54%]", tone: "border-fuchsia-400/50 text-fuchsia-600 dark:text-fuchsia-400", fallbackIcon: BarChart3 },
  { category: "applications", position: "bottom-[12%] left-[27%]", tone: "border-orange-400/50 text-orange-500", fallbackIcon: CircleDollarSign },
  { category: "wallets", position: "bottom-[18%] right-[14%]", tone: "border-emerald-400/50 text-emerald-500", fallbackIcon: WalletCards },
] as const;

type ConstellationCategory = (typeof constellationNodes)[number]["category"];
type ConstellationProjects = Partial<Record<ConstellationCategory, ProjectLink>>;
type PreviousConstellationProjects = Partial<Record<ConstellationCategory, string>>;

const CONSTELLATION_STORAGE_KEY = "terra-classic:constellation-projects";

function normalizeLogoPath(logo?: string): string | undefined {
  return logo?.replace(/^\/public/, "");
}

function pickConstellationProjects(
  randomize: boolean,
  previousProjects: PreviousConstellationProjects = {}
): ConstellationProjects {
  const selection: ConstellationProjects = {};
  const selectedNames = new Set<string>();

  constellationNodes.forEach(({ category }) => {
    const candidates = projects.filter((project) => (
      Boolean(project.logo)
      && project.categories?.includes(category)
      && !selectedNames.has(project.name)
    ));
    const freshCandidates = candidates.filter((project) => project.name !== previousProjects[category]);
    const pool = freshCandidates.length > 0 ? freshCandidates : candidates;
    const selectedProject = randomize
      ? pool[Math.floor(Math.random() * pool.length)]
      : pool[0];

    if (selectedProject) {
      selection[category] = selectedProject;
      selectedNames.add(selectedProject.name);
    }
  });

  return selection;
}

function MetricsShowcase({ tokens, stakingApr, onOpenStablecoins, onOpenTreasury, onOpenDevelopers, onOpenGovernance, onOpenMap }: MetricsShowcaseProps): JSX.Element {
  const onchainProjects = projects.filter((project) => project.indicator === "onchain").length;
  const displayedTokens = tokens.filter((token) => HOME_ASSET_LIST_SYMBOLS.has(token.symbol));
  const usesCompactAssetList = displayedTokens.length <= 2;
  const stablecoinCarouselRef = useRef<HTMLDivElement | null>(null);
  const [constellationProjects, setConstellationProjects] = useState<ConstellationProjects>(() => pickConstellationProjects(false));

  useEffect(() => {
    let previousProjects: PreviousConstellationProjects = {};
    try {
      previousProjects = JSON.parse(window.localStorage.getItem(CONSTELLATION_STORAGE_KEY) ?? "{}") as PreviousConstellationProjects;
    } catch {
      previousProjects = {};
    }

    const nextProjects = pickConstellationProjects(true, previousProjects);
    setConstellationProjects(nextProjects);

    try {
      window.localStorage.setItem(CONSTELLATION_STORAGE_KEY, JSON.stringify(
        Object.fromEntries(Object.entries(nextProjects).map(([category, project]) => [category, project?.name]))
      ));
    } catch {
      // The randomized selection still works when browser storage is unavailable.
    }
  }, []);

  const scrollStablecoins = useCallback((direction: -1 | 1) => {
    const carousel = stablecoinCarouselRef.current;
    if (!carousel) {
      return;
    }
    carousel.scrollBy({ left: direction * Math.max(carousel.clientWidth * 0.82, 280), behavior: "smooth" });
  }, []);

  return (
    <div className="space-y-5">
      <section id="stablecoins" className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white/72 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.02] sm:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4 px-1">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400">Assets powering the economy</p>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{tokens.length} assets · live prices from Vyntrex</p>
        </div>
        <div className="relative">
          {!usesCompactAssetList && (
            <button
              type="button"
              onClick={() => scrollStablecoins(-1)}
              aria-label="Show previous assets"
              className="absolute -left-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg transition hover:border-blue-300 hover:text-blue-600 sm:inline-flex dark:border-white/10 dark:bg-[#071426] dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:text-blue-400"
            >
              <ChevronLeft size={17} />
            </button>
          )}
          <div
            ref={stablecoinCarouselRef}
            className={`stablecoin-carousel flex snap-x snap-mandatory gap-3 overflow-x-auto px-0.5 pb-1 ${usesCompactAssetList ? "sm:grid sm:grid-cols-3 sm:overflow-visible" : ""}`}
          >
            {displayedTokens.map((metric, index) => {
              const asset = stablecoinAssetMap.get(metric.symbol);
              return (
                <article
                  key={metric.symbol}
                  className={`relative min-h-[220px] min-w-[250px] snap-start overflow-hidden rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#061121] ${usesCompactAssetList ? "sm:min-w-0" : "sm:min-w-[268px]"}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-slate-50 text-[11px] font-bold dark:bg-white/5"
                      style={{ borderColor: `${asset?.accent ?? "#2563eb"}55`, color: asset?.accent ?? "#2563eb" }}
                    >
                      {asset?.logo ? (
                        <ResilientImage
                          src={asset.logo}
                          alt=""
                          className="h-8 w-8 object-contain"
                          fallback={<span>{asset.glyph ?? metric.symbol.slice(0, 2)}</span>}
                        />
                      ) : asset?.glyph ?? metric.symbol.slice(0, 2)}
                    </span>
                    <span className="min-w-0">
                      <strong className="block text-sm text-slate-950 dark:text-white">{metric.symbol}</strong>
                      <span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">{asset?.name ?? "Terra Classic asset"}</span>
                    </span>
                  </div>
                  <div className="mt-5 flex items-end justify-between gap-4">
                    <span className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{metric.price}</span>
                    <span className={`text-xs font-semibold ${metric.isPositive ? "text-emerald-500" : "text-rose-500"}`}>{metric.change}</span>
                  </div>
                  <div className="mt-4">
                    <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Market cap</p>
                    <p className="mt-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">{metric.marketCap}</p>
                  </div>
                  <div
                    className={`market-sparkline market-sparkline--${(index % 3) + 1}`}
                    style={{ background: metric.isPositive ? "rgb(16 185 129)" : "rgb(244 63 94)" }}
                    aria-hidden="true"
                  />
                </article>
              );
            })}
            <button
              type="button"
              onClick={onOpenStablecoins}
              className={`group flex min-h-[220px] min-w-[210px] snap-start flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/70 p-5 text-center transition hover:border-blue-300 hover:bg-blue-50 dark:border-white/10 dark:bg-white/[0.025] dark:hover:border-blue-500/40 dark:hover:bg-blue-500/[0.06] ${usesCompactAssetList ? "sm:min-w-0" : ""}`}
            >
              <CircleDollarSign size={30} className="text-blue-600 transition group-hover:scale-110 dark:text-blue-400" />
              <strong className="mt-3 text-sm text-slate-950 dark:text-white">All native assets listed</strong>
              <span className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">LUNC + {Math.max(tokens.length - 1, 0)} historical denominations</span>
              <span className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">Learn more <ArrowRight size={14} /></span>
            </button>
          </div>
          {!usesCompactAssetList && (
            <button
              type="button"
              onClick={() => scrollStablecoins(1)}
              aria-label="Show next assets"
              className="absolute -right-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg transition hover:border-blue-300 hover:text-blue-600 sm:inline-flex dark:border-white/10 dark:bg-[#071426] dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:text-blue-400"
            >
              <ChevronRight size={17} />
            </button>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/72 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-400">
            Live network overview <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-600 dark:text-emerald-400">● Live</span>
          </p>
          <button type="button" onClick={onOpenMap} className="hidden items-center gap-2 text-xs font-semibold text-blue-600 sm:inline-flex dark:text-blue-400">
            Network explorer
            <ArrowRight size={14} />
          </button>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Live network metrics">
          {[
            { label: "Curated projects", value: `${projects.length}+`, icon: Network },
            { label: "On-chain projects", value: `${onchainProjects}`, icon: Blocks },
            { label: "Ecosystem categories", value: `${Object.keys(categories).length}`, icon: Box },
            { label: "Staking APR", value: stakingApr, icon: ShieldCheck },
          ].map((metric) => (
            <li key={metric.label} className="flex items-center gap-3 border-slate-200 lg:border-r lg:last:border-0 dark:border-white/10">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
                <metric.icon size={18} />
              </span>
              <div>
                <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400">{metric.label}</p>
                <p className="text-lg font-semibold text-slate-950 dark:text-white">{metric.value}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="ecosystem" className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white/72 p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.02] sm:p-8">
        <div className="grid items-center gap-10 lg:grid-cols-[0.72fr_0.92fr_1.1fr]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400">The Terra Classic ecosystem</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.04em] text-slate-950 dark:text-white sm:text-4xl">A global network of innovation.</h2>
            <p className="mt-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Hundreds of projects, builders, validators, and community members share the infrastructure that keeps Terra Classic open and useful.
            </p>
            <button type="button" onClick={onOpenMap} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
              Explore ecosystem
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="mx-auto w-full max-w-[330px]">
            <div className="ecosystem-constellation relative aspect-square w-full" aria-hidden="true">
              <span className="ecosystem-constellation__ring" />
              <span className="ecosystem-constellation__ring ecosystem-constellation__ring--small" />
              <span className="ecosystem-constellation__line ecosystem-constellation__line--one" />
              <span className="ecosystem-constellation__line ecosystem-constellation__line--two" />
              <span className="ecosystem-constellation__line ecosystem-constellation__line--three" />
              <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-blue-300 bg-white p-2 shadow-[0_0_50px_rgba(37,99,235,0.28)] dark:border-blue-500/40 dark:bg-[#071426]">
                <img src={terraClassicLogoUrl} alt="" className="h-16 w-16" />
              </span>
              {constellationNodes.map((node) => {
                const project = constellationProjects[node.category];
                const logo = normalizeLogoPath(project?.logo);
                const darkLogo = normalizeLogoPath(project?.darkLogo);
                const FallbackIcon = node.fallbackIcon;

                return (
                  <span
                    key={node.category}
                    className={`absolute ${node.position} ${node.tone} flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border bg-white p-1 shadow-lg dark:bg-[#071426]`}
                    title={project?.name}
                  >
                    {logo ? (
                      darkLogo ? (
                        <>
                          <ResilientImage src={logo} alt="" className="h-full w-full rounded-full object-contain dark:hidden" fallback={<FallbackIcon size={20} />} />
                          <ResilientImage src={darkLogo} alt="" className="hidden h-full w-full rounded-full object-contain dark:block" fallback={<FallbackIcon size={20} />} />
                        </>
                      ) : (
                        <ResilientImage src={logo} alt="" className="h-full w-full rounded-full object-contain" fallback={<FallbackIcon size={20} />} />
                      )
                    ) : (
                      <FallbackIcon size={20} />
                    )}
                  </span>
                );
              })}
            </div>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[10px] font-medium text-slate-500 dark:text-slate-400">
              <Shuffle size={12} aria-hidden="true" />
              Random community projects · New selection on each visit
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {ecosystemFeatures.map((feature) => (
              <article key={feature.title} className="flex min-h-[82px] items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.025]">
                <feature.icon size={23} className={feature.tone} />
                <div>
                  <h3 className="text-sm font-semibold text-slate-950 dark:text-white">{feature.title}</h3>
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{feature.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { id: "stablecoin-card", title: "Terra Classic Assets", subtitle: "LUNC and historical fiat-denominated assets.", body: "Discover native assets, trading venues, and DeFi applications across Terra Classic.", icon: CircleDollarSign, action: onOpenStablecoins, accent: "from-blue-600/18" },
          { id: "treasury", title: "Treasury", subtitle: "Sustainable growth. Secured for the future.", body: "Understand community governance, shared funds, and the proposals shaping long-term network development.", icon: Landmark, action: onOpenTreasury, accent: "from-sky-600/16" },
          { id: "developers", title: "Developers", subtitle: "Build. Innovate. Disrupt.", body: "Use guides, endpoints, modules, and open-source tooling to ship the next generation of applications.", icon: Code2, action: onOpenDevelopers, accent: "from-violet-600/16" },
          { id: "governance", title: "Governance", subtitle: "Community-led. Future-focused.", body: "Review the resources that help delegators, validators, and contributors participate in on-chain decisions.", icon: Users, action: onOpenGovernance, accent: "from-indigo-600/16" },
        ].map((card) => {
          const artworkClass = card.id === "stablecoin-card"
            ? "stablecoins-feature-card"
            : card.id === "treasury"
              ? "treasury-feature-card"
              : card.id === "developers"
                ? "developers-feature-card"
              : card.id === "governance"
                  ? "governance-feature-card"
                  : "";
          const hasFeatureArtwork = artworkClass.length > 0;

          return (
            <article
              id={card.id}
              key={card.title}
              className={`group relative min-h-[310px] scroll-mt-28 overflow-hidden rounded-2xl border p-6 ${
                hasFeatureArtwork
                  ? `${artworkClass} border-blue-200/80 dark:border-blue-500/20`
                  : `border-slate-200 bg-gradient-to-br ${card.accent} via-white to-white dark:border-white/10 dark:via-[#061121] dark:to-[#061121]`
              }`}
            >
              <div className={`relative z-10 ${hasFeatureArtwork ? "feature-card-content" : ""}`}>
                <card.icon size={30} className="text-blue-600 dark:text-blue-400" />
                <h3 className="mt-5 text-xl font-semibold text-slate-950 dark:text-white">{card.title}</h3>
                <p className="mt-4 max-w-[260px] text-lg font-medium leading-6 text-slate-900 dark:text-slate-100">{card.subtitle}</p>
                <p className={`mt-4 max-w-[290px] text-xs leading-5 ${
                  hasFeatureArtwork
                    ? "text-[13px] font-medium text-slate-800 dark:text-slate-300"
                    : "text-slate-600 dark:text-slate-400"
                }`}>{card.body}</p>
                <button type="button" onClick={card.action} className={`mt-6 inline-flex items-center gap-2 font-semibold text-blue-600 dark:text-blue-400 ${
                  hasFeatureArtwork ? "text-[13px]" : "text-xs"
                }`}>
                  Learn more
                  <ArrowRight size={14} className="transition group-hover:translate-x-1" />
                </button>
              </div>
              {!hasFeatureArtwork ? (
                <span className="pointer-events-none absolute -bottom-16 -right-12 h-44 w-44 rounded-full border-[28px] border-blue-600/10 dark:border-blue-500/10" />
              ) : null}
            </article>
          );
        })}
      </section>
    </div>
  );
}

export default MetricsShowcase;
