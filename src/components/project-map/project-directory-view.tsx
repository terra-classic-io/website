import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Box,
  ChevronDown,
  Code2,
  Gamepad2,
  GitBranch,
  Landmark,
  Newspaper,
  Server,
  ShieldCheck,
  Shuffle,
  WalletCards,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { categories as sourceCategories } from "../../data/categories";
import { projects, type ProjectIndicator, type ProjectLink } from "../../data/projects";
import { getOrCreateDailySeed, shuffleWithSeed } from "../../utils/random";
import type { ProjectMapCategory } from "./types";
import ResilientImage from "../resilient-image";

type DirectorySortMode = "random" | "alpha";

type ProjectDirectoryViewProps = {
  readonly categories: readonly ProjectMapCategory[];
  readonly activeCategoryIds: readonly string[];
  readonly searchQuery: string;
  readonly onClearCategories: () => void;
};

type CategoryDirectoryEntry = {
  readonly id: string;
  readonly key: string;
  readonly title: string;
  readonly description: string | undefined;
  readonly color: string;
  readonly projects: readonly ProjectLink[];
};

const MAX_VISIBLE_PROJECTS = 3;
const SERVER_SEED = "project-map-directory-server";

const categoryIcons: Record<string, LucideIcon> = {
  "for-developers": Code2,
  infrastructure: Server,
  tools: Wrench,
  bridges: GitBranch,
  validators: ShieldCheck,
  entertainment: Gamepad2,
  information: Newspaper,
  wallets: WalletCards,
  cex: Landmark,
  dex: ArrowLeftRight,
  applications: Box,
};

const indicatorMeta: Record<ProjectIndicator, { readonly label: string; readonly className: string }> = {
  onchain: {
    label: "On-chain native",
    className: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  hybrid: {
    label: "Hybrid integration",
    className: "bg-violet-500/10 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
  },
  support: {
    label: "Terra Classic supported",
    className: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
  },
};

function normalizeLogoPath(rawLogo?: string): string | undefined {
  if (!rawLogo) {
    return undefined;
  }
  if (rawLogo.startsWith("http://") || rawLogo.startsWith("https://")) {
    return rawLogo;
  }
  const publicPath = rawLogo.replace(/^\/public/, "");
  return publicPath.startsWith("/") ? publicPath : `/${publicPath}`;
}

function matchesSearch(project: ProjectLink, query: string): boolean {
  if (!query) {
    return true;
  }
  return `${project.name} ${project.description ?? ""}`.toLowerCase().includes(query);
}

function getWebsiteLabel(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return `${parsedUrl.hostname}${parsedUrl.pathname === "/" ? "" : parsedUrl.pathname}`;
  } catch {
    return url;
  }
}

function getIntegrationLabel(indicator: ProjectIndicator): string {
  if (indicator === "onchain") {
    return "On-chain";
  }
  if (indicator === "hybrid") {
    return "Hybrid";
  }
  return "Support";
}

type ProjectRowProps = {
  readonly project: ProjectLink;
  readonly selected?: boolean;
  readonly onSelect?: () => void;
};

function ProjectRow({ project, selected = false, onSelect }: ProjectRowProps): JSX.Element {
  const logo = normalizeLogoPath(project.logo);
  const darkLogo = normalizeLogoPath(project.darkLogo);
  const indicator = indicatorMeta[project.indicator];
  const rowClassName = `group flex min-h-[92px] w-full items-center gap-4 rounded-xl border p-3.5 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50/60 dark:hover:border-blue-500/35 dark:hover:bg-blue-500/[0.05] ${selected ? "border-blue-400 bg-blue-50/80 ring-2 ring-blue-500/10 dark:border-blue-500/50 dark:bg-blue-500/[0.08]" : "border-slate-200 bg-slate-50/70 dark:border-white/10 dark:bg-white/[0.025]"}`;
  const content = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm dark:bg-white/5">
        {logo ? (
          darkLogo ? (
            <>
              <ResilientImage src={logo} alt="" loading="lazy" className="h-8 w-8 object-contain dark:hidden" fallback={<Box size={20} className="text-slate-400" />} />
              <ResilientImage src={darkLogo} alt="" loading="lazy" className="hidden h-8 w-8 object-contain dark:block" fallback={<Box size={20} className="text-slate-400" />} />
            </>
          ) : (
            <ResilientImage src={logo} alt="" loading="lazy" className="h-8 w-8 object-contain" fallback={<Box size={20} className="text-slate-400" />} />
          )
        ) : (
          <Box size={20} className="text-slate-400" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <strong className="truncate text-sm font-semibold text-slate-900 transition group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">{project.name}</strong>
          {project.wip ? <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-300">WIP</span> : null}
        </span>
        <span className="mt-1 block truncate text-[10px] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{project.description ?? "Ecosystem project"}</span>
        <span className="mt-2 flex items-center justify-between gap-3">
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] ${indicator.className}`}>
            {indicator.label}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
            {onSelect ? "Details" : "Visit"} <ArrowRight size={13} />
          </span>
        </span>
      </span>
    </>
  );

  if (onSelect) {
    return (
      <button type="button" onClick={onSelect} aria-pressed={selected} className={rowClassName}>
        {content}
      </button>
    );
  }

  const isExternal = project.url.startsWith("http");
  return (
    <a
      href={project.url}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={rowClassName}
    >
      {content}
    </a>
  );
}

function ProjectDirectoryView({
  categories,
  activeCategoryIds,
  searchQuery,
  onClearCategories,
}: ProjectDirectoryViewProps): JSX.Element {
  const [sortMode, setSortMode] = useState<DirectorySortMode>("random");
  const [prioritizeOnchain, setPrioritizeOnchain] = useState<boolean>(false);
  const [dailySeed, setDailySeed] = useState<string>(SERVER_SEED);
  const [focusedCategoryId, setFocusedCategoryId] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectLink | null>(null);
  const directoryContentRef = useRef<HTMLDivElement | null>(null);
  const filterFocusedCategoryIdRef = useRef<string | null>(null);

  useEffect(() => {
    setDailySeed(getOrCreateDailySeed("terra-project-map-directory"));
  }, []);

  const entries = useMemo<readonly CategoryDirectoryEntry[]>(() => {
    const mapCategoryByTitle = new Map(categories.map((category) => [category.title, category]));
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return Object.entries(sourceCategories)
      .map<CategoryDirectoryEntry | null>(([categoryKey, category]) => {
        const mapCategory = mapCategoryByTitle.get(category.title);
        if (!mapCategory) {
          return null;
        }
        if (activeCategoryIds.length > 0 && !activeCategoryIds.includes(mapCategory.id)) {
          return null;
        }

        const matchingProjects = projects
          .filter((project) => project.categories?.includes(categoryKey))
          .filter((project) => matchesSearch(project, normalizedSearch));

        if (normalizedSearch && matchingProjects.length === 0) {
          return null;
        }

        const sortedProjects = sortMode === "alpha"
          ? [...matchingProjects].sort((first, second) => first.name.localeCompare(second.name))
          : shuffleWithSeed(matchingProjects, `${dailySeed}-${categoryKey}`);
        const prioritizedProjects = prioritizeOnchain
          ? [
              ...sortedProjects.filter((project) => project.indicator === "onchain"),
              ...sortedProjects.filter((project) => project.indicator !== "onchain"),
            ]
          : sortedProjects;

        return {
          id: mapCategory.id,
          key: categoryKey,
          title: category.title,
          description: category.description,
          color: mapCategory.color,
          projects: prioritizedProjects,
        } satisfies CategoryDirectoryEntry;
      })
      .filter((entry): entry is CategoryDirectoryEntry => entry !== null);
  }, [activeCategoryIds, categories, dailySeed, prioritizeOnchain, searchQuery, sortMode]);

  const focusedEntry = useMemo(
    () => entries.find((entry) => entry.id === focusedCategoryId) ?? null,
    [entries, focusedCategoryId],
  );

  const selectedProjectDetails = useMemo(() => {
    if (!focusedEntry) {
      return null;
    }
    return focusedEntry.projects.find((project) => project === selectedProject)
      ?? focusedEntry.projects[0]
      ?? null;
  }, [focusedEntry, selectedProject]);

  useEffect(() => {
    if (focusedCategoryId && !focusedEntry) {
      setFocusedCategoryId(null);
      setSelectedProject(null);
    }
  }, [focusedCategoryId, focusedEntry]);

  useEffect(() => {
    if (activeCategoryIds.length === 1) {
      const filteredEntry = entries.find((entry) => entry.id === activeCategoryIds[0]);
      if (!filteredEntry) {
        return;
      }

      filterFocusedCategoryIdRef.current = filteredEntry.id;
      if (focusedCategoryId !== filteredEntry.id) {
        setFocusedCategoryId(filteredEntry.id);
        setSelectedProject(filteredEntry.projects[0] ?? null);
        window.requestAnimationFrame(() => {
          directoryContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
      return;
    }

    if (filterFocusedCategoryIdRef.current) {
      const categoryOpenedFromFilter = filterFocusedCategoryIdRef.current;
      filterFocusedCategoryIdRef.current = null;
      if (focusedCategoryId === categoryOpenedFromFilter) {
        setFocusedCategoryId(null);
        setSelectedProject(null);
      }
    }
  }, [activeCategoryIds, entries, focusedCategoryId]);

  const focusCategory = (entry: CategoryDirectoryEntry): void => {
    filterFocusedCategoryIdRef.current = null;
    setFocusedCategoryId(entry.id);
    setSelectedProject(entry.projects[0] ?? null);
    window.requestAnimationFrame(() => {
      directoryContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const closeCategoryFocus = (): void => {
    filterFocusedCategoryIdRef.current = null;
    setFocusedCategoryId(null);
    setSelectedProject(null);
    onClearCategories();
  };

  const selectedLogo = normalizeLogoPath(selectedProjectDetails?.logo);
  const selectedDarkLogo = normalizeLogoPath(selectedProjectDetails?.darkLogo);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-[#061121]/80 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Sorting</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Order projects within every category.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSortMode("random")}
            aria-pressed={sortMode === "random"}
            className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition ${sortMode === "random" ? "border-blue-500/30 bg-blue-600/10 text-blue-600 dark:text-blue-300" : "border-slate-200 text-slate-600 hover:border-blue-300 dark:border-white/10 dark:text-slate-300"}`}
          >
            <Shuffle size={14} />
            Randomized
          </button>
          <button
            type="button"
            onClick={() => setSortMode("alpha")}
            aria-pressed={sortMode === "alpha"}
            className={`inline-flex h-9 items-center rounded-lg border px-3 text-xs font-semibold transition ${sortMode === "alpha" ? "border-blue-500/30 bg-blue-600/10 text-blue-600 dark:text-blue-300" : "border-slate-200 text-slate-600 hover:border-blue-300 dark:border-white/10 dark:text-slate-300"}`}
          >
            A → Z
          </button>
          <button
            type="button"
            onClick={() => setPrioritizeOnchain((current) => !current)}
            aria-pressed={prioritizeOnchain}
            className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition ${prioritizeOnchain ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "border-slate-200 text-slate-600 hover:border-emerald-300 dark:border-white/10 dark:text-slate-300"}`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            On-chain native first
          </button>
        </div>
      </div>

      <div ref={directoryContentRef} className="scroll-mt-28">
        {focusedEntry ? (
          <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#061121] xl:grid-cols-[minmax(0,1fr)_380px]">
            <section className="min-w-0">
              <header className="flex min-h-[152px] flex-col gap-5 border-b border-slate-200 p-6 dark:border-white/10 sm:flex-row sm:items-start">
                <button
                  type="button"
                  onClick={closeCategoryFocus}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:text-blue-400"
                  aria-label="Back to all categories"
                >
                  <ArrowLeft size={18} />
                </button>
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border"
                  style={{ borderColor: `${focusedEntry.color}35`, backgroundColor: `${focusedEntry.color}12`, color: focusedEntry.color }}
                >
                  {(() => {
                    const FocusedCategoryIcon = categoryIcons[focusedEntry.key] ?? Box;
                    return <FocusedCategoryIcon size={24} />;
                  })()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="text-2xl font-semibold leading-8 text-slate-950 dark:text-white">{focusedEntry.title}</h2>
                    <span className="shrink-0 rounded-full border border-slate-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:border-white/10 dark:text-slate-400">
                      {focusedEntry.projects.length} resources
                    </span>
                  </div>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">{focusedEntry.description}</p>
                </div>
              </header>

              <ul className="project-directory-scroll h-[620px] space-y-2 p-5">
                {focusedEntry.projects.map((project) => (
                  <li key={`${focusedEntry.id}-${project.name}-${project.url}`}>
                    <ProjectRow
                      project={project}
                      selected={project === selectedProjectDetails}
                      onSelect={() => setSelectedProject(project)}
                    />
                  </li>
                ))}
              </ul>
              <div className="flex h-12 items-center justify-center border-t border-slate-200 text-[11px] font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400">
                {focusedEntry.projects.length} projects in this category
              </div>
            </section>

            <aside className="border-t border-slate-200 bg-slate-50/75 p-7 dark:border-white/10 dark:bg-[#040f20] xl:border-l xl:border-t-0" aria-live="polite">
              {selectedProjectDetails ? (
                <>
                  <div className="flex items-center gap-4">
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-white/5">
                      {selectedLogo ? (
                        selectedDarkLogo ? (
                          <>
                            <ResilientImage src={selectedLogo} alt="" className="h-12 w-12 object-contain dark:hidden" fallback={<Box size={26} className="text-blue-600 dark:text-blue-400" />} />
                            <ResilientImage src={selectedDarkLogo} alt="" className="hidden h-12 w-12 object-contain dark:block" fallback={<Box size={26} className="text-blue-600 dark:text-blue-400" />} />
                          </>
                        ) : (
                          <ResilientImage src={selectedLogo} alt="" className="h-12 w-12 object-contain" fallback={<Box size={26} className="text-blue-600 dark:text-blue-400" />} />
                        )
                      ) : (
                        <Box size={26} className="text-blue-600 dark:text-blue-400" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-white">{selectedProjectDetails.name}</h2>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{focusedEntry.title} · {selectedProjectDetails.description ?? "Ecosystem project"}</p>
                    </div>
                  </div>

                  <p className="mt-8 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {selectedProjectDetails.description
                      ? `${selectedProjectDetails.name} is listed in the Terra Classic ecosystem directory as ${selectedProjectDetails.description.toLowerCase()}.`
                      : `${selectedProjectDetails.name} is part of the community-curated Terra Classic ecosystem directory.`}
                  </p>

                  <dl className="mt-8 divide-y divide-slate-200 border-y border-slate-200 text-xs dark:divide-white/10 dark:border-white/10">
                    <div className="flex items-center justify-between gap-4 py-4"><dt className="text-slate-500 dark:text-slate-400">Category</dt><dd className="text-right font-semibold text-slate-950 dark:text-white">{focusedEntry.title}</dd></div>
                    <div className="flex items-center justify-between gap-4 py-4"><dt className="text-slate-500 dark:text-slate-400">Integration</dt><dd className="font-medium text-slate-950 dark:text-white">{getIntegrationLabel(selectedProjectDetails.indicator)}</dd></div>
                    <div className="flex items-center justify-between gap-4 py-4"><dt className="text-slate-500 dark:text-slate-400">Status</dt><dd className="rounded-full bg-emerald-500/10 px-2 py-1 font-semibold text-emerald-600 dark:text-emerald-400">Listed</dd></div>
                    <div className="flex items-center justify-between gap-4 py-4"><dt className="text-slate-500 dark:text-slate-400">Website</dt><dd className="min-w-0 truncate font-semibold text-blue-600 dark:text-blue-400">{getWebsiteLabel(selectedProjectDetails.url)}</dd></div>
                  </dl>

                  <a
                    href={selectedProjectDetails.url}
                    target={selectedProjectDetails.url.startsWith("http") ? "_blank" : undefined}
                    rel={selectedProjectDetails.url.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="mt-8 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_16px_30px_-16px_rgba(37,99,235,0.75)] transition hover:bg-blue-500"
                  >
                    View project details
                    <ArrowUpRight size={16} />
                  </a>
                  <button type="button" onClick={closeCategoryFocus} className="mt-4 flex w-full items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400">
                    <ArrowLeft size={13} />
                    Browse all categories
                  </button>
                </>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">Select a project to view its details.</p>
              )}
            </aside>
          </div>
        ) : entries.length > 0 ? (
          <div className="grid items-start gap-5 lg:grid-cols-2 2xl:grid-cols-3">
            {entries.map((entry) => {
              const CategoryIcon = categoryIcons[entry.key] ?? Box;
              const hiddenProjects = Math.max(entry.projects.length - MAX_VISIBLE_PROJECTS, 0);

              return (
                <section key={entry.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#061121]">
                  <header className="flex min-h-[152px] items-start gap-4 p-6">
                    <span
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border"
                      style={{ borderColor: `${entry.color}35`, backgroundColor: `${entry.color}12`, color: entry.color }}
                    >
                      <CategoryIcon size={24} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-lg font-semibold leading-6 text-slate-950 dark:text-white">{entry.title}</h2>
                        <span className="shrink-0 rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:border-white/10 dark:text-slate-400">
                          {entry.projects.length} resources
                        </span>
                      </div>
                      <p className="mt-3 max-w-sm text-sm leading-5 text-slate-500 dark:text-slate-400">{entry.description}</p>
                    </div>
                  </header>

                  <ul className="project-directory-scroll h-[410px] space-y-2 border-t border-slate-200 p-4 dark:border-white/10">
                    {entry.projects.map((project) => (
                      <li key={`${entry.id}-${project.name}-${project.url}`}>
                        <ProjectRow project={project} />
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => focusCategory(entry)}
                    className="flex h-12 w-full items-center justify-center gap-2 border-t border-slate-200 text-[11px] font-semibold text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 dark:border-white/10 dark:text-slate-400 dark:hover:bg-blue-500/[0.05] dark:hover:text-blue-400"
                  >
                    {hiddenProjects > 0 ? `Scroll for ${hiddenProjects} more` : "Focus this category"}
                    <ChevronDown size={14} />
                  </button>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[260px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/60 px-6 text-center text-sm text-slate-500 dark:border-white/15 dark:bg-white/[0.015] dark:text-slate-400">
            No projects match the current filters.
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectDirectoryView;
