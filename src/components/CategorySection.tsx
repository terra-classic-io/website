
import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, SearchX, Sparkles } from 'lucide-react';
import { ProjectLink, projects } from '../data/projects';
import { categories } from '../data/categories';
import LinkItem from './LinkItem';
import { getOrCreateDailySeed, shuffleWithSeed } from '../utils/random';
import { deriveProjectMetadata, matchesProjectSearch } from '../utils/project-metadata';

interface SectionProps {
  readonly category: keyof typeof categories;
  readonly sortMode: 'alpha' | 'random';
  readonly prioritizeOnchain: boolean;
  readonly searchQuery: string;
  readonly featuredOnly: boolean;
}

const panelClassname: string = 'relative flex flex-col h-full overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white/90 via-white/75 to-white/95 p-6 pb-8 shadow-xl shadow-slate-900/5 ring-1 ring-slate-200/60 transition hover:-translate-y-1 hover:shadow-2xl dark:border-slate-800/60 dark:bg-gradient-to-br dark:from-slate-950/90 dark:via-slate-950/60 dark:to-slate-900/70 dark:ring-slate-800/80 md:rounded-[32px] md:p-8';
const gradientEdgeClassname: string = 'absolute inset-y-6 left-6 hidden w-px rounded-full bg-gradient-to-b from-sky-400/70 via-transparent to-indigo-500/40 md:block';
const highlightOrbClassname: string = 'pointer-events-none absolute -right-14 top-16 hidden h-44 w-44 rounded-full bg-sky-500/10 blur-3xl dark:bg-sky-500/25 md:block';
const INITIAL_VISIBLE_LINKS = 6;
const SERVER_SEED: string = 'server-seed';

const CategorySection: React.FC<SectionProps> = ({
  category,
  sortMode,
  prioritizeOnchain,
  searchQuery,
  featuredOnly,
}) => {
  const [showAll, setShowAll] = useState<boolean>(false);
  const sectionId: string = categories[category].title.toLowerCase().replace(/\s+/g, '-');
  const links: ProjectLink[] = useMemo(
    () => projects.filter((project) => project.categories?.includes(category)),
    [category]
  );

  const dailySeed = useMemo<string>(() => {
    if (typeof window === 'undefined') {
      return SERVER_SEED;
    }
    return getOrCreateDailySeed('terra-category-order');
  }, []);

  const sortedLinks = useMemo(() => {
    const randomized = dailySeed && sortMode === 'random'
      ? shuffleWithSeed(links, `${dailySeed}-${category}`)
      : links.slice().sort((a, b) => a.name.localeCompare(b.name));

    if (!prioritizeOnchain) {
      return randomized;
    }

    const onchain = randomized.filter((link) => link.indicator === 'onchain');
    const others = randomized.filter((link) => link.indicator !== 'onchain');
    return [...onchain, ...others];
  }, [links, category, dailySeed, prioritizeOnchain, sortMode]);

  const filteredLinks = useMemo(() => {
    return sortedLinks.filter((project) => {
      const metadata = deriveProjectMetadata(project);
      if (featuredOnly && !metadata.featured) {
        return false;
      }
      return matchesProjectSearch(project, searchQuery);
    });
  }, [featuredOnly, searchQuery, sortedLinks]);

  const visibleLinks = showAll ? filteredLinks : filteredLinks.slice(0, INITIAL_VISIBLE_LINKS);
  const hiddenCount = Math.max(filteredLinks.length - visibleLinks.length, 0);
  const featuredCount = useMemo(
    () => filteredLinks.filter((project) => deriveProjectMetadata(project).featured).length,
    [filteredLinks]
  );

  return (
    <section id={sectionId} className="scroll-mt-40 h-full">
      <article className={panelClassname}>
        <span className={gradientEdgeClassname} aria-hidden="true" />
        <span className={highlightOrbClassname} aria-hidden="true" />

        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="pl-0 md:pl-10">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {categories[category].title}
            </h2>
            {categories[category].description && (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {categories[category].description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <span className="inline-flex shrink-0 items-center self-start rounded-full border border-slate-300/60 bg-white/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500 backdrop-blur dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400 md:text-[11px] md:tracking-[0.35em]">
              {filteredLinks.length} results
            </span>
            {featuredCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-700 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
                <Sparkles size={12} />
                {featuredCount} featured
              </span>
            )}
          </div>
        </div>

        <div className="relative mt-6 ml-0 md:mt-8 md:ml-3 flex-1">
          {filteredLinks.length === 0 ? (
            <div className="flex min-h-[180px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300/80 bg-slate-50/80 px-6 py-10 text-center dark:border-slate-800 dark:bg-slate-950/40">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200/70 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <SearchX size={22} />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  No matches in this category
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Try a broader search term or switch off the featured filter.
                </p>
              </div>
            </div>
          ) : (
            <>
              <ul className="grid gap-3">
                {visibleLinks.map((link) => (
                  <li key={link.url + link.name}>
                    <LinkItem
                      name={link.name}
                      url={link.url}
                      description={link.description}
                      indicator={link.indicator}
                      logo={link.logo}
                      darkLogo={link.darkLogo}
                      wip={link.wip}
                    />
                  </li>
                ))}
              </ul>

              {filteredLinks.length > INITIAL_VISIBLE_LINKS && (
                <div className="mt-5 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setShowAll((previous) => !previous)}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300/70 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-500"
                    aria-expanded={showAll}
                  >
                    {showAll ? (
                      <>
                        Show less
                        <ChevronUp size={14} />
                      </>
                    ) : (
                      <>
                        {hiddenCount} more
                        <ChevronDown size={14} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </article>
    </section>
  );
};

export default CategorySection;
