import { useEffect, useState, type CSSProperties } from "react";
import { ArrowRight, BookOpen, ExternalLink } from "lucide-react";
import terraClassicLogoUrl from "../assets/terra-classic.svg";
import { projects } from "../data/projects";
import { stablecoinAssets } from "../data/stablecoins";
import CoreReleaseBanner from "./core-release-banner";
import ResilientImage from "./resilient-image";

type HeroSectionProps = {
  readonly onExploreCategories: () => void;
  readonly onOpenDocs: () => void;
  readonly onOpenMap: () => void;
};

type OrbitBadge = {
  readonly symbol: string;
  readonly name: string;
  readonly logo: string;
  readonly orbitAngle: number;
  readonly orbitRadius: string;
  readonly orbitDuration: string;
  readonly orbitDirection: 1 | -1;
  readonly orbitScaleY: number;
  readonly orbitTilt: number;
};

type OrbitLayout = Omit<OrbitBadge, "symbol" | "name" | "logo"> & {
  readonly denom: string;
};

const orbitLayouts: readonly OrbitLayout[] = [
  { denom: "ueur", orbitAngle: 180, orbitRadius: "clamp(210px, 21vw, 300px)", orbitDuration: "90s", orbitDirection: 1, orbitScaleY: 0.42, orbitTilt: 12 },
  { denom: "ucny", orbitAngle: 0, orbitRadius: "clamp(210px, 21vw, 300px)", orbitDuration: "90s", orbitDirection: 1, orbitScaleY: 0.42, orbitTilt: 12 },
  { denom: "uusd", orbitAngle: 90, orbitRadius: "clamp(190px, 19vw, 270px)", orbitDuration: "106s", orbitDirection: -1, orbitScaleY: 0.58, orbitTilt: -17 },
  { denom: "ukrw", orbitAngle: 270, orbitRadius: "clamp(190px, 19vw, 270px)", orbitDuration: "106s", orbitDirection: -1, orbitScaleY: 0.58, orbitTilt: -17 },
  { denom: "ujpy", orbitAngle: -30, orbitRadius: "clamp(180px, 17vw, 230px)", orbitDuration: "122s", orbitDirection: 1, orbitScaleY: 0.78, orbitTilt: 48 },
  { denom: "uaud", orbitAngle: 150, orbitRadius: "clamp(180px, 17vw, 230px)", orbitDuration: "122s", orbitDirection: 1, orbitScaleY: 0.78, orbitTilt: 48 },
  { denom: "uluna", orbitAngle: -110, orbitRadius: "clamp(172px, 15vw, 198px)", orbitDuration: "138s", orbitDirection: -1, orbitScaleY: 1, orbitTilt: 0 },
  { denom: "ugbp", orbitAngle: 70, orbitRadius: "clamp(172px, 15vw, 198px)", orbitDuration: "138s", orbitDirection: -1, orbitScaleY: 1, orbitTilt: 0 },
];

// Add a denomination from orbitLayouts here to make its badge visible again.
const ACTIVE_HERO_ASSET_DENOMS = new Set(["uluna", "uusd"]);

const orbitBadges: readonly OrbitBadge[] = orbitLayouts.flatMap((layout) => {
  if (!ACTIVE_HERO_ASSET_DENOMS.has(layout.denom)) {
    return [];
  }

  const asset = stablecoinAssets.find((candidate) => candidate.denom === layout.denom);
  if (!asset) {
    return [];
  }

  return [{
    ...layout,
    symbol: asset.symbol,
    name: asset.name,
    logo: asset.logo ?? terraClassicLogoUrl,
  }];
});

type OrbitStyle = CSSProperties & {
  readonly "--orbit-angle": string;
  readonly "--orbit-counter-angle": string;
  readonly "--orbit-duration": string;
  readonly "--orbit-radius": string;
  readonly "--orbit-turn": string;
  readonly "--orbit-counter-turn": string;
  readonly "--orbit-scale-y": string;
  readonly "--orbit-inverse-scale-y": string;
  readonly "--orbit-tilt": string;
  readonly "--orbit-counter-tilt": string;
};

const MAX_RANDOM_PROJECTS = 5;

function pickRandomProjects(): (typeof projects)[number][] {
  const shuffledProjects = [...projects];
  for (let index = shuffledProjects.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledProjects[index], shuffledProjects[randomIndex]] = [shuffledProjects[randomIndex], shuffledProjects[index]];
  }
  return shuffledProjects.slice(0, MAX_RANDOM_PROJECTS);
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
  const [randomProjects, setRandomProjects] = useState<(typeof projects)[number][]>(() => projects.slice(0, MAX_RANDOM_PROJECTS));

  useEffect(() => {
    setRandomProjects(pickRandomProjects());
  }, []);

  return (
    <div className="space-y-4">
      <CoreReleaseBanner />

      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/70 px-6 py-12 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.28)] dark:border-white/10 dark:bg-white/[0.015] sm:px-10 lg:min-h-[570px] lg:px-12 lg:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_48%,rgba(37,99,235,0.12),transparent_35%)] dark:bg-[radial-gradient(circle_at_72%_48%,rgba(37,99,235,0.2),transparent_38%)]" />
        <div className="relative z-10 grid items-center gap-12 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="max-w-[590px]">
            <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.24em] text-blue-600 dark:text-blue-400">
              Community-owned. Built for everyone.
            </p>
            <h1 className="text-[clamp(3rem,6vw,5.5rem)] font-semibold leading-[0.98] tracking-[-0.065em] text-slate-950 dark:text-white">
              Powering the future of <span className="font-bold text-blue-600 dark:text-blue-500">digital money.</span>
            </h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-[17px]">
              Terra Classic is decentralized infrastructure for native assets and programmable finance, maintained by a global community for a global economy.
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
            <span className="network-core-halo absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
            <div className="network-globe absolute left-1/2 top-1/2 h-[390px] w-[390px] -translate-x-1/2 -translate-y-1/2 xl:h-[430px] xl:w-[430px]">
              <span className="network-globe__latitude network-globe__latitude--one" />
              <span className="network-globe__latitude network-globe__latitude--two" />
              <span className="network-globe__longitude network-globe__longitude--one" />
              <span className="network-globe__longitude network-globe__longitude--two" />
              <span className="network-globe__star network-globe__star--one" />
              <span className="network-globe__star network-globe__star--two" />
              <span className="network-globe__star network-globe__star--three" />
              <div className="absolute left-1/2 top-1/2 flex h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-blue-300/30 bg-[radial-gradient(circle,rgba(96,165,250,0.28),rgba(37,99,235,0.1)_62%,transparent_78%)] shadow-[0_0_180px_rgba(37,99,235,0.56)]">
                <img
                  src={terraClassicLogoUrl}
                  alt=""
                  className="relative left-[6px] top-[6px] h-[320px] w-[320px] max-w-none object-contain drop-shadow-[0_30px_54px_rgba(14,60,165,0.55)]"
                />
              </div>
            </div>
            <span className="network-orbit network-orbit--one" />
            <span className="network-orbit network-orbit--two" />
            <span className="network-orbit network-orbit--three" />
            {orbitBadges.map((badge) => {
              const orbitTurn = badge.orbitDirection * 360;
              const orbitStyle: OrbitStyle = {
                "--orbit-angle": `${badge.orbitAngle}deg`,
                "--orbit-counter-angle": `${-badge.orbitAngle}deg`,
                "--orbit-duration": badge.orbitDuration,
                "--orbit-radius": badge.orbitRadius,
                "--orbit-turn": `${orbitTurn}deg`,
                "--orbit-counter-turn": `${-orbitTurn}deg`,
                "--orbit-scale-y": String(badge.orbitScaleY),
                "--orbit-inverse-scale-y": String(1 / badge.orbitScaleY),
                "--orbit-tilt": `${badge.orbitTilt}deg`,
                "--orbit-counter-tilt": `${-badge.orbitTilt}deg`,
              };

              return (
                <div key={badge.symbol} className="network-asset-orbit" style={orbitStyle}>
                  <div className="network-asset-orbit__radial">
                    <div className="network-asset-orbit__badge z-10 flex min-w-[140px] items-center gap-2.5 rounded-xl border border-slate-200 bg-white/90 p-2 pr-3 shadow-lg backdrop-blur dark:border-white/15 dark:bg-[#071426]/90 xl:min-w-[150px]">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-slate-50 dark:bg-white/5">
                        <ResilientImage
                          src={badge.logo}
                          alt=""
                          className="h-7 w-7 object-contain"
                          fallback={<span className="text-[9px] font-bold text-blue-600 dark:text-blue-300">{badge.symbol.slice(0, 2)}</span>}
                        />
                      </span>
                      <span className="min-w-0">
                        <strong className="block text-xs text-slate-950 dark:text-white">{badge.symbol}</strong>
                        <span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">{badge.name}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white/75 shadow-sm dark:border-white/10 dark:bg-white/[0.025]">
        <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-3 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <h2 className="text-xs font-semibold text-slate-950 dark:text-white">Random community projects</h2>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Randomized on every visit · No ranking</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[repeat(3,minmax(0,1fr))_1.15fr] lg:grid-cols-[repeat(4,minmax(0,1fr))_1.15fr] 2xl:grid-cols-[repeat(5,minmax(0,1fr))_1.15fr]">
          {randomProjects.map((project, index) => {
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
                <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 p-1 dark:bg-white/[0.06]">
                  {logo ? (
                    darkLogo ? (
                      <>
                        <ResilientImage src={logo} fallbackSrc={terraClassicLogoUrl} alt="" className="h-full w-full rounded-full object-contain dark:hidden" />
                        <ResilientImage src={darkLogo} fallbackSrc={terraClassicLogoUrl} alt="" className="hidden h-full w-full rounded-full object-contain dark:block" />
                      </>
                    ) : (
                      <ResilientImage src={logo} fallbackSrc={terraClassicLogoUrl} alt="" className="h-full w-full rounded-full object-contain" />
                    )
                  ) : (
                    <img src={terraClassicLogoUrl} alt="" className="h-full w-full rounded-full object-contain" />
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
        </div>
      </section>
    </div>
  );
}

export default HeroSection;
