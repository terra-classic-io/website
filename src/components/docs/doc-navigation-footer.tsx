import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { DocNavigationHandler } from "../../types/doc-navigation";
import type { DocPageWithPath } from "../../types/doc-page-with-path";

type DocNavigationFooterProps = {
  readonly previous?: DocPageWithPath;
  readonly next?: DocPageWithPath;
  readonly onNavigate: DocNavigationHandler;
};

export default function DocNavigationFooter({ previous, next, onNavigate }: DocNavigationFooterProps): JSX.Element | null {
  if (!previous && !next) {
    return null;
  }

  const handleNavigate = (target: DocPageWithPath | undefined): void => {
    if (!target) {
      return;
    }
    onNavigate(target.sectionSlug, target.path);
  };

  return (
    <nav aria-label="Documentation pagination" className="flex flex-col gap-4 border-t border-slate-200/70 pt-6 dark:border-slate-800/60 sm:flex-row sm:items-center sm:justify-between">
      {previous ? (
        <button
          type="button"
          onClick={() => handleNavigate(previous)}
          className="group inline-flex w-full flex-col items-start gap-1 rounded-2xl border border-slate-200/70 bg-white/80 px-5 py-4 text-left transition hover:-translate-y-0.5 hover:border-sky-400/70 hover:shadow-lg hover:shadow-sky-400/10 dark:border-slate-800/60 dark:bg-slate-950/60 dark:hover:border-sky-500/60 dark:hover:shadow-sky-500/15 sm:w-auto"
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-300">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Previous
          </span>
          <span className="text-sm font-semibold text-slate-900 transition group-hover:text-sky-600 dark:text-slate-50 dark:group-hover:text-sky-300">
            {previous.title}
          </span>
        </button>
      ) : (
        <div className="hidden sm:block sm:w-1/3" />
      )}

      {next ? (
        <button
          type="button"
          onClick={() => handleNavigate(next)}
          className="group ms-auto inline-flex w-full flex-col items-end gap-1 rounded-2xl border border-slate-200/70 bg-white/80 px-5 py-4 text-right transition hover:-translate-y-0.5 hover:border-sky-400/70 hover:shadow-lg hover:shadow-sky-400/10 dark:border-slate-800/60 dark:bg-slate-950/60 dark:hover:border-sky-500/60 dark:hover:shadow-sky-500/15 sm:w-auto"
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-300">
            Next
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold text-slate-900 transition group-hover:text-sky-600 dark:text-slate-50 dark:group-hover:text-sky-300">
            {next.title}
          </span>
        </button>
      ) : (
        <div className="hidden sm:block sm:w-1/3" />
      )}
    </nav>
  );
}
