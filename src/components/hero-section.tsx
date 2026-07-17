import { useEffect, useState } from "react";
import { ArrowRight, Bell, BookOpen, ExternalLink } from "lucide-react";
import terraClassicLogoUrl from "../assets/terra-classic.svg";
import { projects } from "../data/projects";

type HeroSectionProps = {
  readonly onExploreCategories: () => void;
  readonly onOpenDocs: () => void;
  readonly onOpenMap: () => void;
};

type OrbitBadge = {
  readonly symbol: string;
  readonly name: string;
  readonly logo: string;
  readonly position: string;
};

const orbitBadges: readonly OrbitBadge[] = [
  { symbol: "USTC", name: "TerraClassic USD", logo: "/logos/tokens/uusd.svg", position: "left-[3%] top-[16%]" },
  { symbol: "LUNC", name: "Terra Luna Classic", logo: "/logos/tokens/uluna.svg", position: "right-[1%] top-[29%]" },
  { symbol: "TerraSwap", name: "Decentralized exchange", logo: "/logos/dex/terraswap.svg", position: "left-[1%] bottom-[21%]" },
  { symbol: "Terraport", name: "DeFi protocol", logo: "/logos/dex/terraport.svg", position: "right-[4%] bottom-[14%]" },
];

const MAX_FEATURED_PROJECTS = 5;

function pickRandomProjects(): (typeof projects)[number][] {
  const shuffledProjects = [...projects];
  for (let index = shuffledProjects.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledProjects[index], shuffledProjects[randomIndex]] = [shuffledProjects[randomIndex], shuffledProjects[index]];
  }
  return shuffledProjects.slice(0, MAX_FEATURED_PROJECTS);
}

function normalizeLogoPath(logo?: string): string | undefined {
  if (!logo) {
    return undefined;
  }
  return logo.replace(/^\/public/, "");
}

function HeroSection({
  onExploreCategories,
  onOpenDocs,
  onOpenMap,
}: HeroSectionProps): JSX.Element {
  const [featuredProjects, setFeaturedProjects] = useState<(typeof projects)[number][]>(() => projects.slice(0, MAX_FEATURED_PROJECTS));

  useEffect(() => {
    setFeaturedProjects(pickRandomProjects());
  }, []);

  return (
    <div className="space-y-4">
      <aside className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white/75 px-4 py-2 text-xs text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.025] dark:text-slate-300 sm:px-5">
        <Bell size={16} className="shrink-0 text-blue-600 dark:text-blue-400" />
        <strong className="hidden font-semibold text-slate-900 dark:text-white sm:inline">Terra Classic network</strong>
        <span className="rounded-full bg-blue-600/10 px-2.5 py-1 font-semibold text-blue-600 dark:bg-blue-500/15 dark:text-blue-300">
          Community-led
        </span>
        <span className="hidden h-4 w-px bg-slate-200 dark:bg-white/10 md:block" />
        <span className="line-clamp-1">Open infrastructure, shared knowledge, and an ecosystem built by its community.</span>
        <button
          type="button"
          onClick={onOpenDocs}
          className="ml-auto hidden shrink-0 items-center gap-2 font-semibold text-blue-600 transition hover:text-blue-500 sm:inline-flex dark:text-blue-400"
        >
          View docs
          <ArrowRight size={15} />
        </button>
      </aside>

      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/70 px-6 py-12 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-white/[0.015] sm:px-10 lg:min-h-[570px] lg:px-12 lg:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_48%,rgba(37,99,235,0.12),transparent_35%)] dark:bg-[radial-gradient(circle_at_72%_48%,rgba(37,99,235,0.2),transparent_38%)]" />
        <div className="relative z-10 grid items-center gap-12 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="max-w-[590px]">
            <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-400">
              Community-owned. Built for everyone.
            </p>
            <h1 className="text-[clamp(3rem,6vw,5.5rem)] font-semibold leading-[0.98] tracking-[-0.065em] text-slate-950 dark:text-white">
              Powering the future of <span className="text-blue-600 dark:text-blue-500">digital money.</span>
            </h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-[17px]">
              Terra Classic is decentralized infrastructure for stablecoins, payments, digital assets, and programmable finance—maintained by a global community for a global economy.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onExploreCategories}
                className="inline-flex h-12 items-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-[0_18px_38px_-16px_rgba(37,99,235,0.75)] transition hover:-translate-y-0.5 hover:bg-blue-500"
              >
                Explore ecosystem
                <ArrowRight size={17} />
              </button>
              <button
                type="button"
                onClick={onOpenDocs}
                className="inline-flex h-12 items-center gap-2 px-2 text-sm font-semibold text-slate-700 transition hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400"
              >
                View documentation
                <BookOpen size={17} />
              </button>
            </div>

          </div>

          <div className="relative mx-auto hidden min-h-[490px] w-full max-w-[720px] lg:block" aria-hidden="true">
            <div className="network-globe absolute left-1/2 top-1/2 h-[390px] w-[390px] -translate-x-1/2 -translate-y-1/2 xl:h-[430px] xl:w-[430px]">
              <span className="network-globe__latitude network-globe__latitude--one" />
              <span className="network-globe__latitude network-globe__latitude--two" />
              <span className="network-globe__longitude network-globe__longitude--one" />
              <span className="network-globe__longitude network-globe__longitude--two" />
              <span className="network-globe__star network-globe__star--one" />
              <span className="network-globe__star network-globe__star--two" />
              <span className="network-globe__star network-globe__star--three" />
              <div className="absolute left-1/2 top-1/2 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-blue-300/40 bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800 shadow-[0_0_80px_rgba(37,99,235,0.52)]">
                <img src={terraClassicLogoUrl} alt="" className="h-28 w-28 brightness-0 invert" />
              </div>
            </div>
            <span className="network-orbit network-orbit--one" />
            <span className="network-orbit network-orbit--two" />
            <span className="network-orbit network-orbit--three" />
            {orbitBadges.map((badge) => (
              <div key={badge.symbol} className={`absolute ${badge.position} flex items-center gap-3 rounded-xl border border-slate-200 bg-white/88 p-2 pr-3 shadow-lg backdrop-blur dark:border-white/15 dark:bg-[#071426]/88`}>
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-500/30 bg-slate-50 dark:bg-white/5">
                  <img src={badge.logo} alt="" className="h-7 w-7 object-contain" />
                </span>
                <span>
                  <strong className="block text-xs text-slate-950 dark:text-white">{badge.symbol}</strong>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">{badge.name}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 overflow-hidden rounded-xl border border-slate-200 bg-white/75 shadow-sm dark:border-white/10 dark:bg-white/[0.025] sm:grid-cols-[repeat(3,minmax(0,1fr))_1.15fr] lg:grid-cols-[repeat(4,minmax(0,1fr))_1.15fr] 2xl:grid-cols-[repeat(5,minmax(0,1fr))_1.15fr]">
        {featuredProjects.map((project, index) => {
          const logo = normalizeLogoPath(project.logo);
          const darkLogo = normalizeLogoPath(project.darkLogo);
          const responsiveVisibility = index === 4 ? "hidden 2xl:flex" : index === 3 ? "hidden lg:flex" : index === 2 ? "hidden sm:flex" : "flex";
          return (
            <a
              key={project.name}
              href={project.url}
              target={project.url.startsWith("http") ? "_blank" : undefined}
              rel={project.url.startsWith("http") ? "noopener noreferrer" : undefined}
              className={`${responsiveVisibility} group min-h-[96px] items-center gap-4 border-b border-slate-200 px-5 transition hover:bg-blue-50/70 dark:border-white/10 dark:hover:bg-blue-500/[0.06] sm:border-b-0 sm:border-r`}
              title={project.name}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 p-1.5 dark:bg-white/5">
                {logo ? (
                  darkLogo ? (
                    <>
                      <img src={logo} alt="" className="h-9 w-9 object-contain dark:hidden" />
                      <img src={darkLogo} alt="" className="hidden h-9 w-9 object-contain dark:block" />
                    </>
                  ) : (
                    <img src={logo} alt="" className="h-9 w-9 object-contain" />
                  )
                ) : (
                  <img src={terraClassicLogoUrl} alt="" className="h-9 w-9 object-contain" />
                )}
              </span>
              <span className="min-w-0">
                <strong className="line-clamp-2 text-sm leading-5 text-slate-950 dark:text-white">{project.name}</strong>
                <span className="mt-0.5 block truncate text-[11px] text-slate-500 dark:text-slate-400">{project.description ?? "Ecosystem project"}</span>
              </span>
            </a>
          );
        })}
        <button
          type="button"
          onClick={onOpenMap}
          className="flex min-h-[72px] items-center justify-center gap-2 px-5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/[0.06] sm:min-h-[96px]"
        >
          View project map
          <ExternalLink size={15} />
        </button>
      </section>
    </div>
  );
}

export default HeroSection;
