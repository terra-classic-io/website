/**
 * @fileoverview Styled 404 page consistent with Terra Classic design language.
 */

import React from "react";
import { Link } from "react-router-dom";

/**
 * NotFoundPage renders a branded 404 error view with navigation shortcuts.
 */
const NotFoundPage: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-50">
      <div className="pointer-events-none fixed inset-x-0 top-[-20%] h-[420px] bg-gradient-to-b from-sky-200/80 via-transparent to-transparent dark:from-sky-900/30" />
      <div className="pointer-events-none fixed left-[-12%] top-1/3 h-80 w-80 rounded-full bg-sky-400/25 blur-3xl dark:bg-sky-500/15" />
      <div className="pointer-events-none fixed right-[-14%] top-1/4 h-96 w-96 rounded-full bg-indigo-400/20 blur-[120px] dark:bg-indigo-500/10" />

      <div className="relative z-20 mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-10 px-6 py-24 text-center sm:px-10 lg:px-12">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-400">
          Lost in the LUNC galaxy
        </span>
        <div className="flex flex-col gap-6">
          <h1 className="text-5xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
            404 — Page not found
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
            The page you are looking for doesn&apos;t exist or was moved. Explore highlighted
            Terra Classic resources below to get back on track.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200/70 bg-white/90 px-6 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-600 shadow-lg transition hover:-translate-y-0.5 hover:border-sky-400 hover:text-sky-600 dark:border-slate-800/70 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-sky-500/60 dark:hover:text-sky-300"
          >
            Return home
          </Link>
          <Link
            to="/docs"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-transparent bg-sky-500/90 px-6 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-sky-400 dark:bg-sky-500 dark:hover:bg-sky-400"
          >
            Browse docs
          </Link>
        </div>
        <div className="grid w-full gap-4 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
          <h2 className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
            Quick navigation
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link
              to="/bubbles"
              className="flex flex-col gap-1 rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-left text-sm shadow-sm transition hover:-translate-y-1 hover:border-sky-400/60 hover:text-sky-600 dark:border-slate-800/70 dark:bg-slate-900/60"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                Visual explorer
              </span>
              <span className="text-base font-medium text-slate-900 dark:text-slate-50">
                Project map bubbles
              </span>
            </Link>
            <Link
              to="/docs/develop"
              className="flex flex-col gap-1 rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-left text-sm shadow-sm transition hover:-translate-y-1 hover:border-violet-400/60 hover:text-violet-600 dark:border-slate-800/70 dark:bg-slate-900/60"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                Start building
              </span>
              <span className="text-base font-medium text-slate-900 dark:text-slate-50">
                Developer guides
              </span>
            </Link>
            <Link
              to="/docs/learn"
              className="flex flex-col gap-1 rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-left text-sm shadow-sm transition hover:-translate-y-1 hover:border-emerald-400/60 hover:text-emerald-600 dark:border-slate-800/70 dark:bg-slate-900/60"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                Learn Terra Classic
              </span>
              <span className="text-base font-medium text-slate-900 dark:text-slate-50">
                Protocol deep dive
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
