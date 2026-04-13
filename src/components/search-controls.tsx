
/**
 * @fileoverview Search and discovery controls for the ecosystem directory.
 */

import React from 'react';
import { Search, Star, X } from 'lucide-react';

type SearchControlsProps = {
  readonly searchQuery: string;
  readonly onSearchQueryChange: (value: string) => void;
  readonly featuredOnly: boolean;
  readonly onToggleFeaturedOnly: () => void;
  readonly resultCount: number;
};

const SearchControls: React.FC<SearchControlsProps> = ({
  searchQuery,
  onSearchQueryChange,
  featuredOnly,
  onToggleFeaturedOnly,
  resultCount,
}) => {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-4 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
          <Search size={14} className="text-sky-500" />
          Discovery
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
          {resultCount} matching
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="group flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-3 py-2.5 transition focus-within:border-sky-400 dark:border-slate-800 dark:bg-slate-950/70">
          <Search size={16} className="shrink-0 text-slate-400 transition group-focus-within:text-sky-500" />
          <input
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            type="search"
            placeholder="Search wallets, bridges, governance, USTC, gaming..."
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
            aria-label="Search ecosystem resources"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </label>

        <button
          type="button"
          onClick={onToggleFeaturedOnly}
          className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
            featuredOnly
              ? 'border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-400/60 dark:bg-amber-500/20 dark:text-amber-200'
              : 'border-slate-200/70 bg-white/70 text-slate-600 hover:border-slate-300 hover:bg-white dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-900'
          }`}
        >
          <Star size={14} className={featuredOnly ? 'fill-current' : ''} />
          Featured only
        </button>
      </div>
    </section>
  );
};

export default SearchControls;
