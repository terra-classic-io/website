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

const baseButtonClassname: string = 'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500';
const activeButtonClassname: string = 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-500/60 dark:bg-blue-500/15 dark:text-blue-300';
const inactiveButtonClassname: string = 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:bg-white/[0.025] dark:text-slate-200 dark:hover:border-blue-500/30';

const SortControls: React.FC<SortControlsProps> = ({ sortMode, onChangeSortMode, prioritizeOnchain, onTogglePrioritizeOnchain }) => {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#061121]/92 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
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
