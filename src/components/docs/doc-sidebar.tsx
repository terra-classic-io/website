import React, { Fragment, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { ChevronRight, Search, X } from "lucide-react";
import type { DocPage } from "../../types/doc-page";
import type { DocSection } from "../../types/doc-section";

const SECTION_BUTTON_CLASSES =
  "w-full rounded-xl border border-transparent px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500 transition hover:border-sky-300/60 hover:text-slate-900 dark:text-slate-400 dark:hover:border-sky-500/40 dark:hover:text-slate-50";

const SECTION_BUTTON_ACTIVE_CLASSES =
  "border-sky-400/60 bg-white/80 text-slate-900 shadow-sm dark:border-sky-500/40 dark:bg-slate-900/70 dark:text-slate-50";

const PAGE_LINK_CLASSES =
  "flex w-full items-center gap-2 rounded-lg py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900/70 dark:hover:text-slate-50";

const PAGE_LINK_ACTIVE_CLASSES =
  "bg-slate-100 font-semibold text-slate-900 dark:bg-slate-900/80 dark:text-slate-50";

const PAGE_LINK_ANCESTOR_CLASSES = "text-slate-700 dark:text-slate-200";

type DocSidebarVariant = "default" | "drawer";

type DocSidebarProps = {
  readonly sections: readonly DocSection[];
  readonly activeSection: DocSection;
  readonly activePage: DocPage;
  readonly activeTrail: readonly DocPage[];
  readonly activePath: readonly string[];
  readonly onNavigate: (sectionSlug: string, pagePath: readonly string[]) => void;
  readonly variant?: DocSidebarVariant;
};

type SearchResult = {
  readonly key: string;
  readonly sectionSlug: string;
  readonly sectionTitle: string;
  readonly pagePath: readonly string[];
  readonly title: string;
  readonly summary?: string;
  readonly markdownText: string;
  readonly score: number;
  readonly preview?: string;
};

const BASE_INDENT_PX = 16;
const NESTED_INDENT_STEP_PX = 18;
const SEARCH_PREVIEW_LENGTH = 160;

function normalizeSearchText(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, " $1 ")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, " $1 ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, " $1 ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~>|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSearchPreview(content: string, queryTerms: readonly string[]): string | undefined {
  if (!content) {
    return undefined;
  }

  const normalizedContent = content.trim();
  if (!normalizedContent) {
    return undefined;
  }

  const lowerContent = normalizedContent.toLowerCase();
  const matchIndexes = queryTerms
    .map((term) => lowerContent.indexOf(term))
    .filter((index) => index >= 0)
    .sort((left, right) => left - right);

  const firstMatchIndex = matchIndexes[0] ?? 0;
  const startIndex = Math.max(0, firstMatchIndex - 45);
  const endIndex = Math.min(normalizedContent.length, startIndex + SEARCH_PREVIEW_LENGTH);
  const preview = normalizedContent.slice(startIndex, endIndex).trim();

  if (!preview) {
    return undefined;
  }

  const prefix = startIndex > 0 ? "..." : "";
  const suffix = endIndex < normalizedContent.length ? "..." : "";
  return `${prefix}${preview}${suffix}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function collectSearchResults(
  section: DocSection,
  pages: readonly DocPage[],
  ancestors: readonly string[] = [],
): SearchResult[] {
  const results: SearchResult[] = [];

  pages.forEach((page) => {
    const pagePath: readonly string[] = [...ancestors, page.slug];
    const markdownText = normalizeSearchText(page.markdown ?? "");
    results.push({
      key: `${section.slug}/${pagePath.join("/")}`,
      sectionSlug: section.slug,
      sectionTitle: section.title,
      pagePath,
      title: page.title,
      summary: page.summary,
      markdownText,
      score: 0,
    });

    if (page.children && page.children.length > 0) {
      results.push(...collectSearchResults(section, page.children, pagePath));
    }
  });

  return results;
}

function DocSidebar(props: DocSidebarProps): JSX.Element {
  const {
    sections,
    activeSection,
    activePage,
    activeTrail,
    activePath,
    onNavigate,
    variant = "default",
  } = props;
  const [searchQuery, setSearchQuery] = useState<string>("");
  const trailSlugSet = useMemo<Set<string>>(() => new Set(activeTrail.map((page) => page.slug)), [activeTrail]);
  const containerClassName: string =
    variant === "drawer"
      ? "flex h-full flex-col gap-10 overflow-y-auto pr-4"
      : "fixed top-24 w-72 -mt-3 flex h-[calc(100vh-6rem)] flex-col gap-10 overflow-y-auto pr-6";
  const normalizedQuery: string = searchQuery.trim().toLowerCase();

  const searchResults = useMemo<SearchResult[]>(() => {
    if (!normalizedQuery) {
      return [];
    }

    const queryTerms: readonly string[] = normalizedQuery.split(/\s+/).filter(Boolean);
    const flattenedResults: SearchResult[] = sections.flatMap((section) => collectSearchResults(section, section.pages));

    return flattenedResults
      .map((result) => {
        const titleLower = result.title.toLowerCase();
        const summaryLower = (result.summary ?? "").toLowerCase();
        const sectionLower = result.sectionTitle.toLowerCase();
        const markdownLower = result.markdownText.toLowerCase();

        let score = 0;

        if (titleLower === normalizedQuery) {
          score += 200;
        }
        if (titleLower.startsWith(normalizedQuery)) {
          score += 120;
        }
        if (titleLower.includes(normalizedQuery)) {
          score += 90;
        }
        if (summaryLower.includes(normalizedQuery)) {
          score += 55;
        }
        if (sectionLower.includes(normalizedQuery)) {
          score += 25;
        }
        if (markdownLower.includes(normalizedQuery)) {
          score += 20;
        }

        queryTerms.forEach((term) => {
          if (titleLower.includes(term)) {
            score += 24;
          }
          if (summaryLower.includes(term)) {
            score += 12;
          }
          if (sectionLower.includes(term)) {
            score += 6;
          }
          if (markdownLower.includes(term)) {
            score += 4;
          }
        });

        const allTermsPresent = queryTerms.every((term) =>
          [titleLower, summaryLower, sectionLower, markdownLower].some((field) => field.includes(term)),
        );
        if (allTermsPresent) {
          score += 30;
        }

        const preview = buildSearchPreview(result.markdownText, queryTerms);

        return {
          ...result,
          score,
          preview,
        };
      })
      .filter((result) => result.score > 0)
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return left.title.localeCompare(right.title);
      });
  }, [normalizedQuery, sections]);

  const highlightMatches = (text: string, query: string): React.ReactNode => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return text;
    }

    const queryTerms = Array.from(new Set(trimmedQuery.split(/\s+/).filter(Boolean)));
    if (queryTerms.length === 0) {
      return text;
    }

    const pattern = new RegExp(`(${queryTerms.map((term) => escapeRegExp(term)).join("|")})`, "gi");
    const segments = text.split(pattern);

    return segments.map((segment, index) => {
      const isMatch = queryTerms.some((term) => term.toLowerCase() === segment.toLowerCase());

      if (!isMatch) {
        return <Fragment key={`${segment}-${index}`}>{segment}</Fragment>;
      }

      return (
        <mark
          key={`${segment}-${index}`}
          className="rounded bg-amber-200 px-0.5 text-inherit dark:bg-amber-400/40"
        >
          {segment}
        </mark>
      );
    });
  };

  const renderPageTree = (page: DocPage, section: DocSection, depth: number, ancestors: readonly string[]): JSX.Element => {
    const isActiveSectionEntry = section.slug === activeSection.slug;
    const isCurrentPage = isActiveSectionEntry && page.slug === activePage.slug;
    const isAncestor = isActiveSectionEntry && trailSlugSet.has(page.slug) && !isCurrentPage;
    const pagePathSegments: readonly string[] = [...ancestors, page.slug];
    const isActivePath = isActiveSectionEntry && activePath.length === pagePathSegments.length && activePath.every((segment, index) => segment === pagePathSegments[index]);
    const paddingLeftValue: number = BASE_INDENT_PX + depth * NESTED_INDENT_STEP_PX;
    const style: CSSProperties = { paddingLeft: paddingLeftValue };
    const classes: string[] = [PAGE_LINK_CLASSES];
    if (isCurrentPage && isActivePath) {
      classes.push(PAGE_LINK_ACTIVE_CLASSES, "border-l-2", "border-sky-500", "dark:border-sky-400");
    } else if (isAncestor) {
      classes.push(PAGE_LINK_ANCESTOR_CLASSES);
    }

    const childPages: readonly DocPage[] = page.children ?? [];
    const shouldShowChildren = childPages.length > 0 && (isCurrentPage || isAncestor);
    const caretRotationClass = shouldShowChildren ? "rotate-90" : "";
    const expandedHeightClass = childPages.length > 0 ? `max-h-[${childPages.length * 56}px]` : "max-h-0";
    const collapsedHeightClass = "max-h-0";
    const childListClassName = shouldShowChildren
      ? `space-y-1 overflow-hidden transition-all duration-300 ease-out opacity-100 ${expandedHeightClass}`
      : `space-y-1 overflow-hidden transition-all duration-300 ease-in opacity-0 pointer-events-none ${collapsedHeightClass}`;

    return (
      <li key={page.slug} className="space-y-1">
        <button
          type="button"
          onClick={() => onNavigate(section.slug, pagePathSegments)}
          className={classes.join(" ")}
          style={style}
          aria-expanded={childPages.length > 0 ? shouldShowChildren : undefined}
        >
          <span className="flex items-center gap-1 truncate">
            <span className="truncate">{page.title}</span>
            {childPages.length > 0 ? (
              <ChevronRight size={14} className={`transition-transform duration-200 ${caretRotationClass}`} />
            ) : null}
          </span>
        </button>
        {shouldShowChildren ? (
          <ul className={childListClassName}>
            {childPages.map((child) => renderPageTree(child, section, depth + 1, pagePathSegments))}
          </ul>
        ) : childPages.length > 0 ? (
          <ul className={childListClassName} aria-hidden="true">
            {childPages.map((child) => renderPageTree(child, section, depth + 1, pagePathSegments))}
          </ul>
        ) : null}
      </li>
    );
  };

  return (
    <nav className={containerClassName}>
      <div className="space-y-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-3 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
          <label htmlFor={`docs-search-${variant}`} className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
            Search docs
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2 text-slate-500 focus-within:border-sky-400/70 focus-within:text-sky-600 dark:border-slate-700/70 dark:bg-slate-950/80 dark:text-slate-400 dark:focus-within:border-sky-500/60 dark:focus-within:text-sky-400">
            <Search size={16} />
            <input
              id={`docs-search-${variant}`}
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search guides, modules, wallets..."
              className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-50 dark:placeholder:text-slate-500"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="rounded-full p-1 transition hover:bg-slate-200/70 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>
          {normalizedQuery ? (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {searchResults.length} result{searchResults.length === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
      </div>

      {normalizedQuery ? (
        <div className="space-y-4">
          {searchResults.length > 0 ? (
            <ul className="space-y-2">
              {searchResults.map((result) => {
                const isActive =
                  result.sectionSlug === activeSection.slug &&
                  activePath.length === result.pagePath.length &&
                  activePath.every((segment, index) => segment === result.pagePath[index]);

                return (
                  <li key={result.key}>
                    <button
                      type="button"
                      onClick={() => onNavigate(result.sectionSlug, result.pagePath)}
                      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                        isActive
                          ? "border-sky-400/70 bg-sky-50 text-slate-900 shadow-sm dark:border-sky-500/50 dark:bg-slate-900 dark:text-slate-50"
                          : "border-slate-200/80 bg-white/80 text-slate-700 hover:border-sky-300/60 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-sky-500/40 dark:hover:bg-slate-900"
                      }`}
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{highlightMatches(result.title, normalizedQuery)}</p>
                        {result.summary ? (
                          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                            {highlightMatches(result.summary, normalizedQuery)}
                          </p>
                        ) : null}
                        {!result.summary && result.preview ? (
                          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                            {highlightMatches(result.preview, normalizedQuery)}
                          </p>
                        ) : null}
                        {result.summary && result.preview && !result.summary.toLowerCase().includes(normalizedQuery) ? (
                          <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                            {highlightMatches(result.preview, normalizedQuery)}
                          </p>
                        ) : null}
                        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                          {highlightMatches(result.sectionTitle, normalizedQuery)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300/80 px-4 py-5 text-sm text-slate-500 dark:border-slate-700/70 dark:text-slate-400">
              No documentation pages match that search yet.
            </div>
          )}
        </div>
      ) : (
        <>
          {sections.map((section) => {
            const isActiveSection = section.slug === activeSection.slug;
            return (
              <div key={section.slug}>
                <button
                  type="button"
                  onClick={() => {
                    const firstPage = section.pages[0];
                    if (firstPage) {
                      onNavigate(section.slug, [firstPage.slug]);
                    }
                  }}
                  className={`${SECTION_BUTTON_CLASSES} ${isActiveSection ? SECTION_BUTTON_ACTIVE_CLASSES : ""}`}
                >
                  {section.title}
                </button>
                <ul className="mt-1">
                  {section.pages.map((page) => renderPageTree(page, section, 0, []))}
                </ul>
              </div>
            );
          })}
        </>
      )}
    </nav>
  );
}

export default DocSidebar;
