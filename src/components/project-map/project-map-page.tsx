import React, { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import ProjectMap from "./project-map";
import { projects } from "../../data/projects";

const ProjectMapPage: React.FC = () => {
  const totalProjects: number = useMemo(() => {
    return projects.length;
  }, []);

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-50">
      <Helmet>
        <title>Terra Classic Project Map</title>
        <meta
          name="description"
          content="Explore Terra Classic ecosystem projects through an interactive force-directed map clustered by category."
        />
      </Helmet>

      <div className="pointer-events-none absolute inset-x-0 top-[-15%] h-[420px] bg-gradient-to-b from-sky-200/70 via-transparent to-transparent dark:from-sky-900/35" />
      <div className="pointer-events-none absolute left-[-12%] top-1/3 h-80 w-80 rounded-full bg-sky-400/25 blur-3xl dark:bg-sky-500/15" />
      <div className="pointer-events-none absolute right-[-14%] top-1/4 h-96 w-96 rounded-full bg-indigo-400/20 blur-[120px] dark:bg-indigo-500/12" />

      <div className="relative z-20 mx-auto flex min-h-screen max-w-6xl flex-col gap-12 px-4 pb-20 pt-24 sm:px-10 lg:px-12">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-4">
            <Link
              to="/"
              className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500 shadow-sm transition hover:-translate-y-[1px] hover:shadow-lg dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-400"
            >
              ← Back
            </Link>
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Terra Classic Project Map
              </h1>
              <p className="max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
                Visualize {totalProjects}+ projects by category, indicator, and description. Use filters, search, and zoom to explore the ecosystem at your own pace.
              </p>
            </div>
          </div>
          <div className="grid gap-3 rounded-3xl border border-slate-200/60 bg-white/80 p-6 text-sm shadow-xl shadow-slate-900/10 backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
            <div className="flex items-center gap-2 text-3xl font-semibold text-slate-900 dark:text-slate-100">
              {totalProjects}+
              <span className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Projects
              </span>
            </div>
          </div>
        </header>

        <ProjectMap />
      </div>
    </div>
  );
};

export default ProjectMapPage;
