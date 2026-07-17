import { useCallback, useRef } from "react";
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
  Users,
  WalletCards,
} from "lucide-react";
import terraClassicLogoUrl from "../assets/terra-classic.svg";
import { categories } from "../data/categories";
import { projects } from "../data/projects";
import { stablecoinAssets } from "../data/stablecoins";

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
  readonly onOpenDocs: () => void;
  readonly onOpenMap: () => void;
};

const stablecoinAssetMap = new Map(stablecoinAssets.map((asset) => [asset.symbol, asset]));

const ecosystemFeatures = [
  { title: "DeFi", body: "Open financial applications", icon: Box, tone: "text-blue-600 dark:text-blue-400" },
  { title: "Infrastructure", body: "Services powering the network", icon: Network, tone: "text-violet-600 dark:text-violet-400" },
  { title: "Payments", body: "Fast, global, borderless", icon: CircleDollarSign, tone: "text-emerald-600 dark:text-emerald-400" },
  { title: "Analytics", body: "Data for smarter decisions", icon: BarChart3, tone: "text-fuchsia-600 dark:text-fuchsia-400" },
  { title: "NFT & Gaming", body: "Digital ownership for all", icon: Gamepad2, tone: "text-indigo-600 dark:text-indigo-400" },
  { title: "And more", body: "Explore every listed project", icon: Blocks, tone: "text-blue-600 dark:text-blue-400" },
] as const;

function MetricsShowcase({ tokens, stakingApr, onOpenDocs, onOpenMap }: MetricsShowcaseProps): JSX.Element {
  const onchainProjects = projects.filter((project) => project.indicator === "onchain").length;
  const stablecoinCarouselRef = useRef<HTMLDivElement | null>(null);

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
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400">Stablecoins powering the economy</p>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{tokens.length} assets · live prices from Vyntrex</p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => scrollStablecoins(-1)}
            aria-label="Show previous stablecoins"
            className="absolute -left-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg transition hover:border-blue-300 hover:text-blue-600 sm:inline-flex dark:border-white/10 dark:bg-[#071426] dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:text-blue-400"
          >
            <ChevronLeft size={17} />
          </button>
          <div ref={stablecoinCarouselRef} className="stablecoin-carousel flex snap-x snap-mandatory gap-3 overflow-x-auto px-0.5 pb-1">
            {tokens.map((metric, index) => {
              const asset = stablecoinAssetMap.get(metric.symbol);
              return (
                <article key={metric.symbol} className="relative min-h-[220px] min-w-[250px] snap-start overflow-hidden rounded-xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#061121] sm:min-w-[268px]">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-slate-50 text-[11px] font-bold dark:bg-white/5"
                      style={{ borderColor: `${asset?.accent ?? "#2563eb"}55`, color: asset?.accent ?? "#2563eb" }}
                    >
                      {asset?.logo ? <img src={asset.logo} alt="" className="h-8 w-8" /> : asset?.glyph ?? metric.symbol.slice(0, 2)}
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
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Market cap</p>
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
              onClick={onOpenDocs}
              className="group flex min-h-[220px] min-w-[210px] snap-start flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/70 p-5 text-center transition hover:border-blue-300 hover:bg-blue-50 dark:border-white/10 dark:bg-white/[0.025] dark:hover:border-blue-500/40 dark:hover:bg-blue-500/[0.06]"
            >
              <CircleDollarSign size={30} className="text-blue-600 transition group-hover:scale-110 dark:text-blue-400" />
              <strong className="mt-3 text-sm text-slate-950 dark:text-white">All stablecoins listed</strong>
              <span className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">LUNC + {Math.max(tokens.length - 1, 0)} denominations</span>
              <span className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">Learn more <ArrowRight size={14} /></span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => scrollStablecoins(1)}
            aria-label="Show next stablecoins"
            className="absolute -right-3 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg transition hover:border-blue-300 hover:text-blue-600 sm:inline-flex dark:border-white/10 dark:bg-[#071426] dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:text-blue-400"
          >
            <ChevronRight size={17} />
          </button>
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
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Curated projects", value: `${projects.length}+`, icon: Network },
            { label: "On-chain projects", value: `${onchainProjects}`, icon: Blocks },
            { label: "Ecosystem categories", value: `${Object.keys(categories).length}`, icon: Box },
            { label: "Staking APR", value: stakingApr, icon: ShieldCheck },
          ].map((metric) => (
            <div key={metric.label} className="flex items-center gap-3 border-slate-200 lg:border-r lg:last:border-0 dark:border-white/10">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
                <metric.icon size={18} />
              </span>
              <div>
                <dt className="text-[10px] text-slate-500 dark:text-slate-400">{metric.label}</dt>
                <dd className="text-lg font-semibold text-slate-950 dark:text-white">{metric.value}</dd>
              </div>
            </div>
          ))}
        </dl>
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

          <div className="ecosystem-constellation relative mx-auto aspect-square w-full max-w-[330px]" aria-hidden="true">
            <span className="ecosystem-constellation__ring" />
            <span className="ecosystem-constellation__ring ecosystem-constellation__ring--small" />
            <span className="ecosystem-constellation__line ecosystem-constellation__line--one" />
            <span className="ecosystem-constellation__line ecosystem-constellation__line--two" />
            <span className="ecosystem-constellation__line ecosystem-constellation__line--three" />
            <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-blue-300 bg-white p-2 shadow-[0_0_50px_rgba(37,99,235,0.28)] dark:border-blue-500/40 dark:bg-[#071426]">
              <img src={terraClassicLogoUrl} alt="" className="h-16 w-16" />
            </span>
            <span className="absolute left-[12%] top-[28%] flex h-11 w-11 items-center justify-center rounded-full border border-violet-400/50 bg-white text-violet-600 shadow-lg dark:bg-[#071426] dark:text-violet-400"><Gamepad2 size={20} /></span>
            <span className="absolute right-[10%] top-[21%] flex h-11 w-11 items-center justify-center rounded-full border border-blue-400/50 bg-white text-blue-600 shadow-lg dark:bg-[#071426] dark:text-blue-400"><Network size={20} /></span>
            <span className="absolute bottom-[12%] left-[27%] flex h-11 w-11 items-center justify-center rounded-full border border-orange-400/50 bg-white text-orange-500 shadow-lg dark:bg-[#071426]"><CircleDollarSign size={20} /></span>
            <span className="absolute bottom-[18%] right-[14%] flex h-11 w-11 items-center justify-center rounded-full border border-emerald-400/50 bg-white text-emerald-500 shadow-lg dark:bg-[#071426]"><WalletCards size={20} /></span>
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
          { id: "stablecoin-card", title: "Stablecoins", subtitle: "The foundation of digital finance.", body: "Discover assets, payment rails, trading venues, and DeFi applications across Terra Classic.", icon: CircleDollarSign, action: onOpenMap, accent: "from-blue-600/18" },
          { id: "treasury", title: "Treasury", subtitle: "Sustainable growth. Secured for the future.", body: "Understand community governance, shared funds, and the proposals shaping long-term network development.", icon: Landmark, action: onOpenDocs, accent: "from-sky-600/16" },
          { id: "developers", title: "Developers", subtitle: "Build. Innovate. Disrupt.", body: "Use guides, endpoints, modules, and open-source tooling to ship the next generation of applications.", icon: Code2, action: onOpenDocs, accent: "from-violet-600/16" },
          { id: "governance", title: "Governance", subtitle: "Community-led. Future-focused.", body: "Review the resources that help delegators, validators, and contributors participate in on-chain decisions.", icon: Users, action: onOpenDocs, accent: "from-indigo-600/16" },
        ].map((card) => (
          <article id={card.id} key={card.title} className={`group relative min-h-[310px] scroll-mt-28 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br ${card.accent} via-white to-white p-6 dark:border-white/10 dark:via-[#061121] dark:to-[#061121]`}>
            <card.icon size={30} className="text-blue-600 dark:text-blue-400" />
            <h3 className="mt-5 text-xl font-semibold text-slate-950 dark:text-white">{card.title}</h3>
            <p className="mt-4 max-w-[260px] text-lg font-medium leading-6 text-slate-900 dark:text-slate-100">{card.subtitle}</p>
            <p className="mt-4 max-w-[290px] text-xs leading-5 text-slate-600 dark:text-slate-400">{card.body}</p>
            <button type="button" onClick={card.action} className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
              Learn more
              <ArrowRight size={14} className="transition group-hover:translate-x-1" />
            </button>
            <span className="pointer-events-none absolute -bottom-16 -right-12 h-44 w-44 rounded-full border-[28px] border-blue-600/10 dark:border-blue-500/10" />
          </article>
        ))}
      </section>
    </div>
  );
}

export default MetricsShowcase;
