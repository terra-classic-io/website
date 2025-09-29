/**
 * @fileoverview MetricsShowcase visualises live token performance and staking insights.
 */

import React from 'react';
import { ArrowUpRight, LineChart, TrendingUp } from 'lucide-react';

export type TokenMetric = {
  readonly symbol: string;
  readonly price: string;
  readonly change: string;
  readonly isPositive: boolean;
};

type MetricsShowcaseProps = {
  readonly tokens: readonly TokenMetric[];
  readonly stakingApr: string;
};

const changeClassnameMap: Record<'positive' | 'negative', string> = {
  positive: 'text-emerald-500 bg-emerald-500/10',
  negative: 'text-rose-500 bg-rose-500/10',
};

/**
 * MetricsShowcase renders headline metrics for LUNC, USTC, and staking rewards.
 */
function MetricsShowcase({ tokens, stakingApr }: MetricsShowcaseProps): JSX.Element {
  const stakingCardLabel: string = 'Network staking APR';
  const stakingDescription: string = 'Annual rewards for active delegators, sourced from validator.info';

  return (
    <section className="mt-0">
      <div className="flex items-center justify-between gap-6">
        <div className="max-w-xl space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Live Signals</p>
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">Market & Network</h2>
          <p className="text-base text-slate-600 dark:text-slate-300">
            Stay aligned with Terra Classic token dynamics so you can act with confidence when building,
            staking, and participating in governance.
          </p>
        </div>
        {/*<a
          href="https://finder.terraclassic.community"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden shrink-0 items-center gap-2 rounded-full border border-slate-300/80 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-white/80 hover:text-slate-900 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-500 sm:inline-flex"
        >
          View analytics
          <ArrowUpRight size={16} />
        </a>*/}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {tokens.map((tokenMetric) => {
          const changeTone: 'positive' | 'negative' = tokenMetric.isPositive ? 'positive' : 'negative';
          const badgeClassname: string = changeClassnameMap[changeTone];

          return (
            <article
              key={tokenMetric.symbol}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/70 p-6 shadow-lg shadow-slate-900/5 backdrop-blur-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900/70"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800/70">
                    <TrendingUp size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{tokenMetric.symbol}</h3>
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">Native asset</p>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClassname}`}>
                  {tokenMetric.change}
                </span>
              </div>
              <p className="mt-6 text-3xl font-semibold text-slate-900 dark:text-white">{tokenMetric.price}</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Sourced from vyntrex.io.
              </p>
              <div className="pointer-events-none absolute -right-10 bottom-0 h-24 w-24 rounded-full bg-sky-500/10 transition duration-300 group-hover:scale-125 dark:bg-sky-500/5" />
            </article>
          );
        })}

        <article className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 text-white shadow-xl shadow-slate-900/40 transition hover:-translate-y-1 hover:shadow-2xl dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-800/70">
                <LineChart size={22} />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{stakingCardLabel}</h3>
                <p className="text-xs uppercase tracking-[0.25em] opacity-60">Delegator insight</p>
              </div>
            </div>
          </div>
          <p className="mt-6 text-4xl font-semibold">{stakingApr}</p>
          <p className="mt-2 text-sm opacity-70">{stakingDescription}</p>
          <div className="pointer-events-none absolute -left-12 top-10 h-36 w-36 rounded-full bg-slate-500/20 blur-3xl" />
        </article>
      </div>
    </section>
  );
}

export default MetricsShowcase;
