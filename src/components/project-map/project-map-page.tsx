import React, { useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, BookOpen, Network } from "lucide-react";
import ProjectMap from "./project-map";
import { projects } from "../../data/projects";

const ProjectMapPage: React.FC = () => {
  const totalProjects: number = useMemo(() => {
    return projects.length;
  }, []);

  return (
    <div className="relative min-h-screen bg-[#f8fafc] text-slate-900 transition-colors duration-300 dark:bg-[#020b19] dark:text-slate-50">
      <Helmet>
        <title>Terra Classic Ecosystem Directory | Projects &amp; Tools</title>
        <meta
          name="description"
          content="Browse the Terra Classic ecosystem directory by category, search projects and tools, or explore the network through an interactive project map."
        />
        <link rel="canonical" href="https://terra-classic.io/ecosystem" />
      </Helmet>

      <div className="relative z-20 mx-auto flex min-h-screen max-w-[1480px] flex-col gap-6 px-4 pb-16 pt-5 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-4">
            <a
              href="/"
              className="inline-flex w-fit items-center gap-2 text-xs font-semibold text-blue-600 transition hover:text-blue-500 dark:text-blue-400"
            >
              <ArrowLeft size={15} />
              Back
            </a>
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
                Terra Classic Ecosystem Directory
              </h1>
              <p className="max-w-3xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
                Browse {totalProjects}+ Terra Classic projects by category, or switch to the interactive bubble map. Use filters and search to navigate the ecosystem at your own pace.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/75 px-6 py-4 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
            <Network size={22} className="text-blue-600 dark:text-blue-400" />
            <div>
              <div className="text-3xl font-semibold text-blue-600 dark:text-blue-400">{totalProjects}+</div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Projects</span>
            </div>
          </div>
        </header>

        <ProjectMap />

        <section className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white/75 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400"><BookOpen size={24} /></span>
            <div>
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">Explore the Terra Classic ecosystem</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Discover projects, connect with builders, and join the community shaping decentralized finance.</p>
            </div>
          </div>
          <a href="/#resource-directory" className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:text-slate-200 dark:hover:border-blue-500/40 dark:hover:text-blue-400">View all projects</a>
        </section>
      </div>
    </div>
  );
};

export default ProjectMapPage;
