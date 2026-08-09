import React, { useMemo } from "react";
import { ArrowLeft, Network } from "lucide-react";
import ProjectMap from "./project-map";
import { projects } from "../../data/projects";

const ProjectMapPage: React.FC = () => {
  const totalProjects: number = useMemo(() => {
    return projects.length;
  }, []);

  return (
    <div className="relative min-h-screen bg-[#f8fafc] text-slate-900 transition-colors duration-300 dark:bg-[#020b19] dark:text-slate-50">
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
      </div>
    </div>
  );
};

export default ProjectMapPage;
