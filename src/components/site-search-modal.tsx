import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, CornerDownLeft, FileText, LayoutGrid, Search, X } from "lucide-react";
import { categories } from "../data/categories";
import { docSections } from "../data/docs";
import { projects } from "../data/projects";
import type { DocPage } from "../types/doc-page";
import type { DocSection } from "../types/doc-section";
import ResilientImage from "./resilient-image";

type SearchResultKind = "page" | "documentation" | "project";

type SearchRecord = {
  readonly id: string;
  readonly kind: SearchResultKind;
  readonly title: string;
  readonly description: string;
  readonly eyebrow: string;
  readonly href: string;
  readonly searchableText: string;
  readonly body?: string;
  readonly logo?: string;
  readonly darkLogo?: string;
};

type RankedSearchRecord = SearchRecord & {
  readonly score: number;
  readonly preview?: string;
};

type SiteSearchModalProps = {
  readonly homeHref: string;
  readonly docsHref: string;
  readonly onClose: () => void;
};

type DocumentationEntry = {
  readonly id: string;
  readonly sectionSlug: string;
  readonly sectionTitle: string;
  readonly path: readonly string[];
  readonly title: string;
  readonly summary: string;
  readonly body: string;
};

const SEARCH_RESULT_LIMIT = 14;
const PREVIEW_LENGTH = 170;

const normalizeText = (value: string): string => value
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/\s+/g, " ")
  .trim();

const normalizeMarkdown = (value: string): string => value
  .replace(/```[\s\S]*?```/g, " ")
  .replace(/`([^`]+)`/g, " $1 ")
  .replace(/!\[([^\]]*)\]\([^)]+\)/g, " $1 ")
  .replace(/\[([^\]]+)\]\([^)]+\)/g, " $1 ")
  .replace(/^#{1,6}\s+/gm, "")
  .replace(/[*_~>|-]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const joinBasePath = (base: string, path: string): string => {
  const normalizedBase = base === "/" ? "" : base.replace(/\/$/, "");
  return `${normalizedBase}${path}` || "/";
};

const normalizeLogoPath = (value?: string): string | undefined => value?.replace(/^\/public/, "");

const collectDocumentationEntries = (
  section: DocSection,
  pages: readonly DocPage[],
  parentPath: readonly string[] = [],
): DocumentationEntry[] => pages.flatMap((page) => {
  const path = [...parentPath, page.slug];
  const current: DocumentationEntry = {
    id: `documentation-${section.slug}-${path.join("-")}`,
    sectionSlug: section.slug,
    sectionTitle: section.title,
    path,
    title: page.title,
    summary: page.summary,
    body: normalizeMarkdown(page.markdown ?? ""),
  };
  const children = page.children
    ? collectDocumentationEntries(section, page.children, path)
    : [];
  return [current, ...children];
});

const documentationEntries: readonly DocumentationEntry[] = docSections.flatMap((section) =>
  collectDocumentationEntries(section, section.pages),
);

const buildPreview = (body: string, terms: readonly string[]): string | undefined => {
  if (!body) {
    return undefined;
  }
  const normalizedBody = normalizeText(body);
  const matchIndex = terms
    .map((term) => normalizedBody.indexOf(term))
    .filter((index) => index >= 0)
    .sort((left, right) => left - right)[0];
  if (typeof matchIndex !== "number") {
    return undefined;
  }
  const start = Math.max(0, matchIndex - 55);
  const end = Math.min(body.length, start + PREVIEW_LENGTH);
  return `${start > 0 ? "…" : ""}${body.slice(start, end).trim()}${end < body.length ? "…" : ""}`;
};

const rankRecord = (record: SearchRecord, normalizedQuery: string, terms: readonly string[]): RankedSearchRecord | null => {
  const title = normalizeText(record.title);
  const description = normalizeText(record.description);
  const eyebrow = normalizeText(record.eyebrow);
  const searchableText = normalizeText(record.searchableText);
  const body = normalizeText(record.body ?? "");
  let score = 0;

  if (title === normalizedQuery) score += 240;
  if (title.startsWith(normalizedQuery)) score += 150;
  if (title.includes(normalizedQuery)) score += 110;
  if (description.includes(normalizedQuery)) score += 65;
  if (eyebrow.includes(normalizedQuery)) score += 35;
  if (searchableText.includes(normalizedQuery)) score += 30;
  if (body.includes(normalizedQuery)) score += 22;

  terms.forEach((term) => {
    if (title.includes(term)) score += 28;
    if (description.includes(term)) score += 15;
    if (eyebrow.includes(term)) score += 8;
    if (searchableText.includes(term)) score += 7;
    if (body.includes(term)) score += 4;
  });

  const allTermsPresent = terms.every((term) =>
    [title, description, eyebrow, searchableText, body].some((field) => field.includes(term)),
  );
  if (allTermsPresent) score += 35;

  if (score === 0) {
    return null;
  }

  return {
    ...record,
    score,
    preview: record.body ? buildPreview(record.body, terms) : undefined,
  };
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const highlightMatches = (text: string, query: string): ReactNode => {
  const terms = Array.from(new Set(query.trim().split(/\s+/).filter(Boolean)));
  if (terms.length === 0) {
    return text;
  }
  const pattern = new RegExp(`(${terms.sort((left, right) => right.length - left.length).map(escapeRegExp).join("|")})`, "gi");
  return text.split(pattern).map((segment, index) => {
    const isMatch = terms.some((term) => normalizeText(term) === normalizeText(segment));
    return isMatch ? (
      <mark key={`${segment}-${index}`} className="rounded bg-blue-100 px-0.5 text-blue-700 dark:bg-blue-500/25 dark:text-blue-200">
        {segment}
      </mark>
    ) : <Fragment key={`${segment}-${index}`}>{segment}</Fragment>;
  });
};

function SiteSearchModal({ homeHref, docsHref, onClose }: SiteSearchModalProps): JSX.Element | null {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const normalizedQuery = normalizeText(query);

  const records = useMemo<readonly SearchRecord[]>(() => {
    const pageRecords: readonly SearchRecord[] = [
      {
        id: "page-home",
        kind: "page",
        title: "Terra Classic home",
        description: "Network overview, live assets, community projects, and core resources.",
        eyebrow: "Page",
        href: joinBasePath(homeHref, "/"),
        searchableText: "home homepage terra classic network overview",
      },
      {
        id: "page-ecosystem",
        kind: "page",
        title: "Ecosystem directory",
        description: "Browse Terra Classic projects by category or open the interactive project map.",
        eyebrow: "Page",
        href: joinBasePath(homeHref, "/ecosystem"),
        searchableText: "ecosystem directory projects resources bubble map",
      },
    ];

    const docRecords: readonly SearchRecord[] = documentationEntries.map((entry) => ({
      id: entry.id,
      kind: "documentation",
      title: entry.title,
      description: entry.summary,
      eyebrow: `Documentation · ${entry.sectionTitle}`,
      href: joinBasePath(docsHref, `/${entry.sectionSlug}/${entry.path.join("/")}`),
      searchableText: `${entry.sectionTitle} ${entry.title} ${entry.summary}`,
      body: entry.body,
    }));

    const projectRecords: readonly SearchRecord[] = projects.map((project, index) => {
      const categoryTitles = (project.categories ?? [])
        .map((category) => categories[category]?.title ?? category)
        .join(", ");
      return {
        id: `project-${project.name}-${index}`,
        kind: "project",
        title: project.name,
        description: project.description ?? "Terra Classic ecosystem project",
        eyebrow: categoryTitles ? `Ecosystem · ${categoryTitles}` : "Ecosystem project",
        href: `${joinBasePath(homeHref, "/ecosystem")}?q=${encodeURIComponent(project.name)}`,
        searchableText: `${project.name} ${project.description ?? ""} ${categoryTitles}`,
        logo: normalizeLogoPath(project.logo),
        darkLogo: normalizeLogoPath(project.darkLogo),
      };
    });

    return [...pageRecords, ...docRecords, ...projectRecords];
  }, [docsHref, homeHref]);

  const results = useMemo<readonly RankedSearchRecord[]>(() => {
    if (!normalizedQuery) {
      const suggestedIds = new Set([
        "page-ecosystem",
        "documentation-learn-stablecoins",
        "documentation-learn-treasury",
        "documentation-develop-overview",
        "documentation-learn-governance",
      ]);
      return records
        .filter((record) => suggestedIds.has(record.id))
        .map((record) => ({ ...record, score: 0 }));
    }
    const terms = Array.from(new Set(normalizedQuery.split(/\s+/).filter(Boolean)));
    return records
      .map((record) => rankRecord(record, normalizedQuery, terms))
      .filter((record): record is RankedSearchRecord => record !== null)
      .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
      .slice(0, SEARCH_RESULT_LIMIT);
  }, [normalizedQuery, records]);

  useEffect(() => {
    inputRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [normalizedQuery]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    document.getElementById(`site-search-result-${activeIndex}`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => results.length > 0 ? (current + 1) % results.length : 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => results.length > 0 ? (current - 1 + results.length) % results.length : 0);
    } else if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      window.location.assign(results[activeIndex].href);
    }
  };

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-start justify-center px-4 pb-8 pt-[8vh] sm:pt-[10vh]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close site search"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-search-title"
        className="relative z-10 flex max-h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_100px_rgba(2,11,25,0.45)] dark:border-white/15 dark:bg-[#061121]"
      >
        <h2 id="site-search-title" className="sr-only">Search Terra Classic</h2>
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-4 dark:border-white/10 sm:px-5">
          <Search size={21} className="shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search documentation, projects, and resources…"
            className="min-w-0 flex-1 bg-transparent text-base text-slate-950 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500 sm:text-lg"
            role="combobox"
            aria-expanded="true"
            aria-autocomplete="list"
            aria-controls="site-search-results"
            aria-activedescendant={results.length > 0 ? `site-search-result-${activeIndex}` : undefined}
          />
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:text-slate-400 dark:hover:border-blue-500/50 dark:hover:text-blue-300"
            aria-label="Close search"
          >
            <X size={18} />
          </button>
        </div>

        <div id="site-search-results" role="listbox" className="min-h-0 flex-1 overflow-y-auto p-2 sm:p-3">
          <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
            {normalizedQuery ? `${results.length} result${results.length === 1 ? "" : "s"}` : "Suggested destinations"}
          </p>
          {results.length > 0 ? (
            <div className="space-y-1">
              {results.map((result, index) => {
                const isActive = index === activeIndex;
                const resultDescription = result.preview ?? result.description;
                return (
                  <a
                    id={`site-search-result-${index}`}
                    key={result.id}
                    href={result.href}
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setActiveIndex(index)}
                    onFocus={() => setActiveIndex(index)}
                    onClick={onClose}
                    className={`group flex items-center gap-3 rounded-xl border px-3 py-3 transition sm:px-4 ${isActive
                      ? "border-blue-300 bg-blue-50 text-slate-950 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-white"
                      : "border-transparent text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white text-blue-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-blue-400">
                      {result.logo ? (
                        <>
                          <ResilientImage
                            src={result.logo}
                            alt=""
                            className={`h-7 w-7 object-contain ${result.darkLogo ? "dark:hidden" : ""}`}
                            fallback={<LayoutGrid size={18} />}
                          />
                          {result.darkLogo ? (
                            <ResilientImage
                              src={result.darkLogo}
                              alt=""
                              className="hidden h-7 w-7 object-contain dark:block"
                              fallback={<LayoutGrid size={18} />}
                            />
                          ) : null}
                        </>
                      ) : result.kind === "project" ? (
                        <LayoutGrid size={18} />
                      ) : (
                        <FileText size={18} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{highlightMatches(result.title, query)}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">{highlightMatches(resultDescription, query)}</span>
                      <span className="mt-1 block truncate text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600/80 dark:text-blue-400/80">{result.eyebrow}</span>
                    </span>
                    {isActive ? <CornerDownLeft size={16} className="shrink-0 text-blue-600 dark:text-blue-400" aria-hidden="true" /> : <ArrowUpRight size={15} className="shrink-0 text-slate-300 transition group-hover:text-blue-500 dark:text-slate-600" aria-hidden="true" />}
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="m-3 rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center dark:border-white/15">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No result found</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Try a project name, a feature, or a documentation topic.</p>
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200 bg-slate-50 px-4 py-3 text-[10px] text-slate-500 dark:border-white/10 dark:bg-[#020b19]/60 dark:text-slate-400 sm:px-5">
          <span><kbd className="search-kbd">↑</kbd> <kbd className="search-kbd">↓</kbd> navigate</span>
          <span><kbd className="search-kbd">Enter</kbd> open</span>
          <span><kbd className="search-kbd">Esc</kbd> close</span>
          <span className="ml-auto hidden sm:inline">Documentation and ecosystem search</span>
        </footer>
      </section>
    </div>,
    document.body,
  );
}

export default SiteSearchModal;
