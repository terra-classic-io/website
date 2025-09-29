/**
 * @fileoverview HeroSection component renders the top-of-page hero experience with calls to action.
 */

import React from 'react';
import { ArrowDown, ArrowRight, ChevronDown, Globe, ShieldCheck, Wallet } from 'lucide-react';
import terraClassicLogoUrl from '../assets/terra-classic.svg';

type HeroStatistic = {
  readonly label: string;
  readonly value: string;
  readonly description: string;
};

type HeroSectionProps = {
  readonly onExploreCategories: () => void;
  readonly onOpenDocs: () => void;
  readonly onOpenMap: () => void;
  readonly stats: readonly HeroStatistic[];
  readonly isMobile: boolean;
  readonly isExpanded: boolean;
  readonly onToggleExpand: () => void;
};

/**
 * HeroSection surfaces the primary narrative for Terra Classic alongside high-impact calls to action.
 */
function HeroSection({
  onExploreCategories,
  onOpenDocs,
  onOpenMap,
  stats,
  isMobile,
  isExpanded,
  onToggleExpand,
}: HeroSectionProps): JSX.Element {
  const shouldShowDetails: boolean = !isMobile || isExpanded;

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-gradient-to-br from-white/92 via-white/70 to-slate-100/85 p-5 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl transition dark:border-slate-800/70 dark:bg-gradient-to-br dark:from-slate-950/88 dark:via-slate-950/60 dark:to-slate-900/75 sm:p-10">
      <div className="hero-grid-overlay hidden lg:block" />
      <div className="absolute left-[-24px] top-[-36px] hidden h-48 w-48 rounded-full bg-sky-500/18 blur-3xl dark:bg-sky-500/12 lg:block" />
      <div className="absolute right-[-20px] bottom-[-32px] hidden h-44 w-44 rounded-full bg-indigo-500/18 blur-3xl dark:bg-indigo-500/12 lg:block" />
      <img
        src={terraClassicLogoUrl}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-[-110px] top-1/2 hidden w-[640px] -translate-y-2/3 select-none opacity-[0.05] mix-blend-luminosity dark:opacity-[0.12] lg:block xl:left-[-140px]"
      />

      <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-center">
        <div className="max-w-2xl space-y-4 lg:space-y-5">
          <div className="space-y-4">
            <h1 className="text-[2.4rem] font-semibold leading-[1.18] tracking-tight text-slate-900 dark:text-white sm:text-[2.9rem] lg:text-[3.1rem]">
              Everything you need to explore, build and stake on the <strong>Terra Classic</strong> network.
            </h1>
            {shouldShowDetails ? (
              <p className="text-base leading-[1.7] text-slate-600 dark:text-slate-300 lg:text-[17px]">
                This is a community-curated resource hub for Terra Classic. As a decentralized and community-owned network, Terra-Classic has no official website. On this page you can find applications, tooling, and knowledge to help teams ship faster and empower the
                global Terra Classic community. Dive into the ecosystem, connect with infrastructure and find your place in the Terra Classic community.
              </p>
            ) : (
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Explore apps, tooling, and guidance curated for Terra Classic users and builders.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onExploreCategories}
              className="group inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              Explore Ecosystem
              <ArrowDown size={18} />
            </button>
            <button
              type="button"
              onClick={onOpenDocs}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-500"
            >
              View Documentation
            </button>
            <button
              type="button"
              onClick={onOpenMap}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-500"
            >
              Ecosystem Map
            </button>
          </div>
          <div className="hidden pt-6 text-sm text-slate-600 dark:text-slate-300 lg:grid lg:grid-cols-3 lg:gap-4">
            <div className="group flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm transition hover:-translate-y-1 hover:border-sky-400/70 dark:border-slate-800/60 dark:bg-slate-900/60">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 transition group-hover:bg-sky-500/20 dark:text-sky-300">
                <ShieldCheck size={18} />
              </span>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
                  Hardened
                </p>
                <p className="font-medium text-slate-900 dark:text-slate-100">Validator-grade playbooks & monitoring</p>
              </div>
            </div>
            <div className="group flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm transition hover:-translate-y-1 hover:border-indigo-400/70 dark:border-slate-800/60 dark:bg-slate-900/60">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 transition group-hover:bg-indigo-500/20 dark:text-indigo-300">
                <Globe size={18} />
              </span>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
                  Network reach
                </p>
                <p className="font-medium text-slate-900 dark:text-slate-100">Global RPC, LCD, and gRPC access points</p>
              </div>
            </div>
            <div className="group flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm transition hover:-translate-y-1 hover:border-emerald-400/70 dark:border-slate-800/60 dark:bg-slate-900/60">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 transition group-hover:bg-emerald-500/20 dark:text-emerald-300">
                <Wallet size={18} />
              </span>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
                  Wallet ready
                </p>
                <p className="font-medium text-slate-900 dark:text-slate-100">Keplr, Galaxy Station, mobile, and scripts</p>
              </div>
            </div>
          </div>
          {isMobile && (
            <button
              type="button"
              onClick={onToggleExpand}
              aria-expanded={isExpanded}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-300/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500"
            >
              {isExpanded ? 'Hide insights' : 'Show insights'}
              <ChevronDown
                size={16}
                className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>
        {shouldShowDetails && (
          <div className="w-full max-w-sm rounded-2xl border border-slate-200/70 bg-white/85 p-5 shadow-[0_16px_32px_-24px_rgba(15,23,42,0.4)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/65">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-purple-500 to-blue-600 text-white shadow-lg shadow-sky-500/30">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
                  Why Terra Classic
                </p>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Composable. Decentralised. Community-led.
                </h3>
              </div>
            </div>
            <ul className="mt-5 space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600" />
                Enterprise-grade infrastructure, observability, and tooling curated for production workloads.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600" />
                Community governance and support from dedicated volunteers and teams to accelerate builders.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600" />
                Cross-chain connectivity across Cosmos, Ethereum, and beyond via IBC and bridge partners.
              </li>
            </ul>
            <dl className="mt-5 grid gap-3 border-t border-slate-200 pt-5 text-sm dark:border-slate-800">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-start justify-between gap-3">
                  <dt className="text-slate-500 dark:text-slate-400">{stat.label}</dt>
                  <dd className="text-right">
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">{stat.value}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{stat.description}</p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}

export default HeroSection;
