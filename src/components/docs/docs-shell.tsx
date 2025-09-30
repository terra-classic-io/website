import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, Menu, X } from "lucide-react";
import type { DocPage } from "../../types/doc-page";
import type { DocSection } from "../../types/doc-section";
import DocContent from "./doc-content";
import DocSidebar from "./doc-sidebar";
import { docSections } from "../../data/docs";
import ThemeToggle from "../ThemeToggle";
import type { DocNavigationOptions } from "../../types/doc-navigation";
import type { DocPageWithPath } from "../../types/doc-page-with-path";

type DocsShellProps = {
  readonly docSegments: readonly string[];
  readonly onNavigate: (sectionSlug: string, pagePath?: readonly string[], options?: DocNavigationOptions) => void;
  readonly isDocsSubdomain: boolean;
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

function DocsShell({ docSegments, onNavigate, isDocsSubdomain }: DocsShellProps): JSX.Element {
  const { section, page, trail, path } = useMemo(() => resolveActiveTarget(docSegments), [docSegments]);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

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
    <div className="relative min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-50">
      <Helmet>
        <title>{`${page.title} · Terra Classic Docs`}</title>
        <meta
          name="description"
          content="Terra Classic documentation covering full node operations, network endpoints, wallets, and governance."
        />
      </Helmet>

      <div className="pointer-events-none fixed inset-x-0 top-[-15%] h-[420px] bg-gradient-to-b from-sky-200/60 via-transparent to-transparent dark:from-sky-800/40" />
      <div className="pointer-events-none fixed left-[-12%] top-1/4 hidden h-72 w-72 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-500/25 md:block" />
      <div className="pointer-events-none fixed right-[-14%] top-1/3 hidden h-80 w-80 rounded-full bg-indigo-400/15 blur-[120px] dark:bg-indigo-500/20 md:block" />

      <div className="fixed top-3 right-3 z-40 sm:top-6 sm:right-6">
        <ThemeToggle variant="pill" size="sm" />
      </div>

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

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-16 pt-12 sm:px-10 lg:flex-row lg:px-12">
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
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500"
            >
              <ArrowLeft size={16} />
              Back
            </Link>
          </div>
        </div>
        <aside className="hidden lg:block lg:w-72">
          <DocSidebar
            sections={docSections}
            activeSection={section}
            activePage={page}
            activeTrail={trail}
            activePath={path}
            onNavigate={handleSidebarNavigate}
          />
        </aside>
        <main className="flex-1 space-y-8">
          <header className="hidden items-start justify-between gap-6 lg:flex">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
                {section.title}
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {page.title}
              </h1>
              <p className="max-w-2xl text-base text-slate-600 dark:text-slate-300">{page.summary}</p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <Link
                to={window.location.hostname === "docs.terra-classic.io" ? "https://terra-classic.io" : "/"}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 px-5 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500"
              >
                <ArrowLeft size={16} />
                Back to ecosystem
              </Link>
            </div>
          </header>
          <div className="lg:hidden">
            <p className="mt-4 text-base text-slate-600 dark:text-slate-300">{page.summary}</p>
          </div>
          <DocContent
            page={page}
            section={section}
            currentPath={path}
            onNavigate={handleNavigate}
            previousPage={previousPage}
            nextPage={nextPage}
          />
        </main>
      </div>
    </div>
  );
}

export default DocsShell;
