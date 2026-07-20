import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, ChevronRight, Github, Menu, X } from "lucide-react";
import type { DocPage } from "../../types/doc-page";
import type { DocSection } from "../../types/doc-section";
import DocContent from "./doc-content";
import DocSidebar from "./doc-sidebar";
import { docSections, getDocSourcePath } from "../../data/docs";
import SiteHeader from "../site-header";
import terraClassicLogoUrl from "../../assets/terra-classic.svg";
import type { DocNavigationOptions } from "../../types/doc-navigation";
import type { DocPageWithPath } from "../../types/doc-page-with-path";
import { extractDocMarkdownHeadings } from "../../lib/docs-markdown";

type DocsShellProps = {
  readonly docSegments: readonly string[];
  readonly onNavigate: (sectionSlug: string, pagePath?: readonly string[], options?: DocNavigationOptions) => void;
  readonly isDocsSubdomain: boolean;
  readonly assetUsdPrices: Readonly<Record<string, number>>;
};

type ActiveDocTarget = {
  readonly section: DocSection;
  readonly page: DocPage;
  readonly trail: readonly DocPage[];
  readonly path: readonly string[];
};

const DRAWER_TITLE_ID: string = "docs-navigation-drawer-title";

const buildDocPageKey = (sectionSlug: string, path: readonly string[]): string => `${sectionSlug}/${path.join("/")}`;

const collectSectionPages = (section: DocSection, pages: readonly DocPage[], parentPath: readonly string[] = []): DocPageWithPath[] => {
  const collected: DocPageWithPath[] = [];

  pages.forEach((page) => {
    const path: readonly string[] = [...parentPath, page.slug] as readonly string[];
    collected.push({ sectionSlug: section.slug, path, title: page.title });
    if (page.children && page.children.length > 0) {
      const childPages: DocPageWithPath[] = collectSectionPages(section, page.children, path);
      collected.push(...childPages);
    }
  });

  return collected;
};

const orderedDocPages: readonly DocPageWithPath[] = docSections.flatMap((section) => collectSectionPages(section, section.pages));

const FALLBACK_SECTION = docSections[0];
const FALLBACK_PAGE = FALLBACK_SECTION.pages[0];

function resolvePageByPath(pages: readonly DocPage[], pathSegments: readonly string[]): { page: DocPage; trail: readonly DocPage[] } {
  if (pathSegments.length === 0) {
    const firstPage = pages[0] ?? FALLBACK_PAGE;
    return { page: firstPage, trail: [firstPage] };
  }

  const [currentSlug, ...remaining] = pathSegments;
  const currentPage = pages.find((candidate) => candidate.slug === currentSlug) ?? pages[0] ?? FALLBACK_PAGE;
  if (remaining.length === 0 || !currentPage.children || currentPage.children.length === 0) {
    return { page: currentPage, trail: [currentPage] };
  }

  const childResult = resolvePageByPath(currentPage.children, remaining);
  return { page: childResult.page, trail: [currentPage, ...childResult.trail] };
}

function resolveActiveTarget(segments: readonly string[]): ActiveDocTarget {
  const [sectionSlug, ...pageSegments] = segments;
  const section = docSections.find((candidate) => candidate.slug === sectionSlug) ?? FALLBACK_SECTION;
  const resolved = resolvePageByPath(section.pages, pageSegments);
  return {
    section,
    page: resolved.page,
    trail: resolved.trail,
    path: resolved.trail.map((entry) => entry.slug),
  };
}

function DocsShell({ docSegments, onNavigate, isDocsSubdomain, assetUsdPrices }: DocsShellProps): JSX.Element {
  const { section, page, trail, path } = useMemo(() => resolveActiveTarget(docSegments), [docSegments]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const homeHref: string = isDocsSubdomain ? "https://terra-classic.io" : "/";
  const pageSourcePath: string | undefined = getDocSourcePath(page);
  const editPageUrl: string = pageSourcePath
    ? `https://github.com/terra-classic-io/website/edit/main/${pageSourcePath}`
    : "https://github.com/terra-classic-io/website";
  const pageOutline = useMemo(() => {
    const contentOutline = page.sections?.map((contentSection) => ({ title: contentSection.title, id: "" }))
      ?? extractDocMarkdownHeadings(page.markdown ?? "");
    if (page.livePanel !== "treasury") {
      return contentOutline;
    }
    return [
      { title: "On-chain Treasury snapshot", id: "on-chain-treasury" },
      { title: "Community Pool holdings", id: "treasury-holdings" },
      { title: "Recent governance proposals", id: "recent-proposals" },
      ...contentOutline,
    ];
  }, [page.livePanel, page.markdown, page.sections]);
  const { previousPage, nextPage } = useMemo<{ previousPage?: DocPageWithPath; nextPage?: DocPageWithPath }>(() => {
    if (orderedDocPages.length === 0) {
      return { previousPage: undefined, nextPage: undefined };
    }

    const currentKey: string = buildDocPageKey(section.slug, path);
    const currentIndex: number = orderedDocPages.findIndex(
      (entry) => buildDocPageKey(entry.sectionSlug, entry.path) === currentKey,
    );

    if (currentIndex === -1) {
      const firstPage: DocPageWithPath | undefined = orderedDocPages[0];
      return {
        previousPage: undefined,
        nextPage: firstPage,
      };
    }

    const previous: DocPageWithPath | undefined = currentIndex > 0 ? orderedDocPages[currentIndex - 1] : undefined;
    const next: DocPageWithPath | undefined = currentIndex < orderedDocPages.length - 1 ? orderedDocPages[currentIndex + 1] : undefined;

    return { previousPage: previous, nextPage: next };
  }, [section.slug, path]);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((previous: boolean) => !previous);
  }, []);

  const handleNavigate = useCallback(
    (sectionSlug: string, pagePath?: readonly string[], options?: DocNavigationOptions) => {
      onNavigate(sectionSlug, pagePath, options);
      closeSidebar();
    },
    [closeSidebar, onNavigate],
  );

  const handleSidebarNavigate = useCallback(
    (sectionSlug: string, pagePath: readonly string[]) => {
      handleNavigate(sectionSlug, pagePath);
    },
    [handleNavigate],
  );

  useEffect(() => {
    if (!isSidebarOpen) {
      return;
    }
    if (typeof document === "undefined") {
      return;
    }
    const { body } = document;
    if (!body) {
      return;
    }

    const previousOverflow: string = body.style.overflow;
    body.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [isSidebarOpen]);

  useEffect(() => {
    if (!isSidebarOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeSidebar, isSidebarOpen]);

  return (
    <div className="relative min-h-screen bg-[#f8fafc] text-slate-900 transition-colors duration-300 dark:bg-[#020b19] dark:text-slate-50">
      <SiteHeader
        homeHref={homeHref}
        docsHref={isDocsSubdomain ? "/" : "/docs"}
        searchLabel="Search docs..."
        onExplore={() => {
          if (typeof window !== "undefined") {
            window.location.assign(`${homeHref.replace(/\/$/, "")}/ecosystem`);
          }
        }}
      />

      {isSidebarOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true" aria-labelledby={DRAWER_TITLE_ID}>
          <button
            type="button"
            onClick={closeSidebar}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            aria-label="Close documentation menu"
          />
          <aside className="relative z-10 flex h-full w-[min(320px,90vw)] flex-col overflow-hidden bg-white/95 shadow-2xl transition-transform duration-300 ease-out dark:bg-slate-950/95">
            <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3 dark:border-slate-800/60">
              <span id={DRAWER_TITLE_ID} className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-600 dark:text-slate-300">
                Documentation
              </span>
              <button
                type="button"
                onClick={closeSidebar}
                className="rounded-full border border-slate-200/60 p-1.5 text-slate-500 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700/60 dark:text-slate-300 dark:hover:border-slate-500"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-4">
              <DocSidebar
                sections={docSections}
                activeSection={section}
                activePage={page}
                activeTrail={trail}
                activePath={path}
                onNavigate={handleSidebarNavigate}
                variant="drawer"
              />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="relative z-10 mx-auto grid max-w-[1480px] gap-5 px-4 pb-16 pt-5 sm:px-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-10 xl:grid-cols-[280px_minmax(0,1fr)_250px]">
        <div className="flex flex-col gap-4 lg:hidden">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={toggleSidebar}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500"
              aria-expanded={isSidebarOpen}
              aria-controls={DRAWER_TITLE_ID}
            >
              <Menu size={16} />
            </button>
          </div>
        </div>
        <aside className="hidden rounded-2xl border border-slate-200 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.02] lg:block">
          <DocSidebar
            sections={docSections}
            activeSection={section}
            activePage={page}
            activeTrail={trail}
            activePath={path}
            onNavigate={handleSidebarNavigate}
          />
        </aside>
        <main className="min-w-0 space-y-0 overflow-hidden rounded-2xl border border-slate-200 bg-white/75 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
          <header className="relative flex min-h-[210px] items-center justify-between gap-6 overflow-hidden border-b border-slate-200 bg-gradient-to-r from-white via-white to-blue-50 px-6 py-10 dark:border-white/10 dark:from-[#061121] dark:via-[#071426] dark:to-blue-950/50 sm:px-9">
            <div className="space-y-3">
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <a href={homeHref} className="transition hover:text-blue-600 dark:hover:text-blue-400">Home</a>
                <ChevronRight size={13} aria-hidden="true" />
                <button
                  type="button"
                  onClick={() => handleNavigate(section.slug, [section.pages[0]?.slug ?? ""])}
                  className="transition hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {section.title}
                </button>
                {trail.map((entry, index) => {
                  const isCurrentPage = index === trail.length - 1;
                  const targetPath = trail.slice(0, index + 1).map((target) => target.slug);

                  return (
                    <span key={`${entry.slug}-${index}`} className="flex items-center gap-1.5">
                      <ChevronRight size={13} aria-hidden="true" />
                      {isCurrentPage ? (
                        <span className="font-medium text-slate-700 dark:text-slate-200" aria-current="page">{entry.title}</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleNavigate(section.slug, targetPath)}
                          className="transition hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {entry.title}
                        </button>
                      )}
                    </span>
                  );
                })}
              </nav>
              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
                {page.title}
              </h1>
              <p className="max-w-2xl text-base text-slate-600 dark:text-slate-300">{page.summary}</p>
            </div>
            <div className="pointer-events-none absolute -right-12 top-1/2 hidden h-60 w-60 -translate-y-1/2 items-center justify-center rounded-full border border-blue-300/30 bg-blue-500/5 shadow-[0_0_80px_rgba(37,99,235,0.16)] sm:flex dark:border-blue-500/20 dark:bg-blue-500/10">
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-600/10 shadow-[0_0_60px_rgba(37,99,235,0.25)]">
                <img src={terraClassicLogoUrl} alt="" className="h-24 w-24 opacity-90" />
              </div>
            </div>
          </header>
          {page.heroImage ? (
            <div className="px-6 pt-8 sm:px-9 sm:pt-10">
              <div className="relative h-64 overflow-hidden rounded-2xl border border-blue-200/70 bg-blue-50 shadow-sm dark:border-blue-500/20 dark:bg-[#020b19] sm:h-72">
                <img
                  src={page.heroImage.light}
                  alt={page.heroImage.alt}
                  className="h-full w-full object-cover object-[center_72%] dark:hidden"
                />
                <img
                  src={page.heroImage.dark}
                  alt={page.heroImage.alt}
                  className="hidden h-full w-full object-cover object-[center_72%] dark:block"
                />
              </div>
            </div>
          ) : null}
          <div className="px-6 py-8 sm:px-9 sm:py-10">
            <DocContent
              page={page}
              section={section}
              currentPath={path}
              onNavigate={handleNavigate}
              previousPage={previousPage}
              nextPage={nextPage}
              assetUsdPrices={assetUsdPrices}
            />
          </div>
        </main>

        <aside className="hidden space-y-4 xl:block">
          <section className="sticky top-[96px] space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white/75 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.02]">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">On this page</h2>
              <ul className="mt-5 space-y-4 border-l border-slate-200 pl-4 text-xs dark:border-white/10">
                <li className="font-semibold text-blue-600 dark:text-blue-400">{page.title}</li>
                {pageOutline.slice(0, 6).map((outlineItem) => (
                  <li key={outlineItem.title} className="text-slate-500 dark:text-slate-400">
                    {outlineItem.id ? (
                      <a href={`#${outlineItem.id}`} className="transition hover:text-blue-600 dark:hover:text-blue-400">
                        {outlineItem.title}
                      </a>
                    ) : outlineItem.title}
                  </li>
                ))}
              </ul>
            </div>
            <a href={editPageUrl} target="_blank" rel="noopener noreferrer" className="group block rounded-2xl border border-slate-200 bg-white/75 p-5 shadow-sm transition hover:border-blue-300 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-blue-500/40">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Edit this page</h2>
              <span className="mt-4 flex items-center gap-3 text-xs font-semibold text-slate-700 dark:text-slate-200"><Github size={18} /> Improve on GitHub <ArrowRight size={14} className="ml-auto transition group-hover:translate-x-1" /></span>
            </a>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default DocsShell;
