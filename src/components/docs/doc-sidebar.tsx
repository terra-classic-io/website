import React, { useMemo } from "react";
import type { CSSProperties } from "react";
import { ChevronRight } from "lucide-react";
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

type DocSidebarProps = {
  readonly sections: readonly DocSection[];
  readonly activeSection: DocSection;
  readonly activePage: DocPage;
  readonly activeTrail: readonly DocPage[];
  readonly activePath: readonly string[];
  readonly onNavigate: (sectionSlug: string, pagePath: readonly string[]) => void;
};

const BASE_INDENT_PX = 16;
const NESTED_INDENT_STEP_PX = 18;

function DocSidebar({ sections, activeSection, activePage, activeTrail, activePath, onNavigate }: DocSidebarProps): JSX.Element {
  const trailSlugSet = useMemo<Set<string>>(() => new Set(activeTrail.map((page) => page.slug)), [activeTrail]);

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
    <nav className="sticky top-24 flex h-[calc(100vh-6rem)] flex-col gap-10 overflow-y-auto pr-6">
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
    </nav>
  );
}

export default DocSidebar;
