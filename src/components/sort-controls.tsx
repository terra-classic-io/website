/**
 * @fileoverview Sorting controls for category listings.
 */

import React from 'react';
import { Sparkles, Shuffle, ArrowDownAZ } from 'lucide-react';

export type SortMode = 'random' | 'alpha';

type SortControlsProps = {
  readonly sortMode: SortMode;
  readonly onChangeSortMode: (nextMode: SortMode) => void;
  readonly prioritizeOnchain: boolean;
  readonly onTogglePrioritizeOnchain: () => void;
};

const baseButtonClassname: string = 'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500';
const activeButtonClassname: string = 'border-sky-300 bg-sky-200 text-slate-600 shadow-lg shadow-sky-500/30 dark:border-sky-500 dark:bg-sky-500/80 dark:text-slate-200';
const inactiveButtonClassname: string = 'border-slate-200/70 bg-white/60 text-slate-600 hover:border-slate-300 hover:bg-white/90 dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-900';

const SortControls: React.FC<SortControlsProps> = ({ sortMode, onChangeSortMode, prioritizeOnchain, onTogglePrioritizeOnchain }) => {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
        <Sparkles size={14} className="text-sky-500" />
        Sorting
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
        <button
          type="button"
          onClick={() => onChangeSortMode('random')}
          className={`${baseButtonClassname} ${sortMode === 'random' ? activeButtonClassname : inactiveButtonClassname}`}
        >
          <Shuffle size={14} />
          Randomized
        </button>
        <button
          type="button"
          onClick={() => onChangeSortMode('alpha')}
          className={`${baseButtonClassname} ${sortMode === 'alpha' ? activeButtonClassname : inactiveButtonClassname}`}
        >
          <ArrowDownAZ size={14} />
          A → Z
        </button>
        <button
          type="button"
          onClick={onTogglePrioritizeOnchain}
          className={`${baseButtonClassname} ${prioritizeOnchain ? activeButtonClassname : inactiveButtonClassname}`}
        >
          <span className="inline-flex h-2 w-2 items-center justify-center rounded-full bg-emerald-500" aria-hidden="true" />
          On-chain native first
        </button>
      </div>
    </section>
  );
};

export default SortControls;
