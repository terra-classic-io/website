import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ProjectLink, projects } from '../data/projects';
import { categories } from '../data/categories';
import LinkItem from './LinkItem';
import { ChevronDown } from 'lucide-react';
import { getOrCreateDailySeed, shuffleWithSeed } from '../utils/random';

interface SectionProps {
  readonly category: keyof typeof categories;
  readonly sortMode: 'alpha' | 'random';
  readonly prioritizeOnchain: boolean;
}

const panelClassname: string = 'relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-[0_24px_60px_-42px_rgba(37,99,235,0.45)] dark:border-white/10 dark:bg-[#061121] dark:hover:border-blue-500/30 md:p-7';
const gradientEdgeClassname: string = 'absolute inset-y-7 left-0 w-[3px] rounded-r-full bg-gradient-to-b from-blue-500 via-blue-400 to-transparent';
const highlightOrbClassname: string = 'pointer-events-none absolute -right-14 top-16 hidden h-44 w-44 rounded-full bg-blue-500/[0.06] blur-3xl dark:bg-blue-500/10 md:block';

const MAX_VISIBLE_LINKS = 4;
const SERVER_SEED: string = 'server-seed';

const CategorySection: React.FC<SectionProps> = ({ category, sortMode, prioritizeOnchain }) => {
  const sectionId: string = categories[category].title.toLowerCase().replace(/\s+/g, '-');
  const links: ProjectLink[] = useMemo(
    () => projects.filter((project) => project.categories?.includes(category)),
    [category]
  );
  const resourceCountLabel: string = `${links.length} resources`;
  const hasOverflow: boolean = useMemo(
    () => links.length > MAX_VISIBLE_LINKS,
    [links.length]
  );
  const [hiddenCount, setHiddenCount] = useState<number>(Math.max(links.length - MAX_VISIBLE_LINKS, 0));
  const listRef = useRef<HTMLUListElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(!hasOverflow);
  const [isAtTop, setIsAtTop] = useState<boolean>(true);
  const [dailySeed, setDailySeed] = useState<string>(SERVER_SEED);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    setDailySeed(getOrCreateDailySeed('terra-category-order'));
  }, []);

  useEffect(() => {
    setIsAtBottom(!hasOverflow);
    setIsAtTop(true);
    setHiddenCount(Math.max(links.length - MAX_VISIBLE_LINKS, 0));
  }, [links.length, hasOverflow]);

  const handleScroll = useCallback(() => {
    if (!listRef.current) {
      return;
    }
    const { scrollTop, clientHeight, scrollHeight } = listRef.current;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 6;
    setIsAtBottom(atBottom);
    setIsAtTop(scrollTop <= 6);
    if (hasOverflow) {
      const approxPerCard = scrollHeight / links.length;
      const visibleGuess = Math.min(
        Math.round((scrollTop + clientHeight) / approxPerCard),
        links.length
      );
      setHiddenCount(Math.max(links.length - visibleGuess, 0));
    }
  }, [links.length, hasOverflow]);

  const handleNudge = useCallback(() => {
    if (!listRef.current) {
      return;
    }
    listRef.current.scrollBy({ top: 220, behavior: 'smooth' });
  }, []);

  const handleScrollUp = useCallback(() => {
    if (!listRef.current) {
      return;
    }
    listRef.current.scrollBy({ top: -220, behavior: 'smooth' });
  }, []);

  const sortedLinks = useMemo(() => {
    const baseList = links;
    const randomized = dailySeed && sortMode === 'random' ? shuffleWithSeed(baseList, `${dailySeed}-${category}`) : baseList.slice().sort((a, b) => a.name.localeCompare(b.name));
    if (!prioritizeOnchain) {
      return randomized;
    }
    const onchain = randomized.filter(link => link.indicator === 'onchain');
    const others = randomized.filter(link => link.indicator !== 'onchain');
    return [...onchain, ...others];
  }, [links, category, dailySeed, prioritizeOnchain, sortMode]);

  return (
    <section id={sectionId} className="scroll-mt-40 h-full">
      <article className={panelClassname}>
        <span className={gradientEdgeClassname} aria-hidden="true" />
        <span className={highlightOrbClassname} aria-hidden="true" />
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="pl-1 md:pl-3">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              {categories[category].title}
            </h2>
            {categories[category].description && (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {categories[category].description}
              </p>
            )}
          </div>
          {resourceCountLabel && (
            <span className="inline-flex shrink-0 items-center self-start rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              {resourceCountLabel.toUpperCase()}
            </span>
          )}
        </div>
        <div className="relative mt-6 flex-1">
          <ul
            id={`${sectionId}-links`}
            ref={listRef}
            onScroll={handleScroll}
            className={`category-scroll grid gap-3 pr-0 pb-10 transition-all duration-300 ${
              hasOverflow ? 'max-h-[430px] overflow-y-auto pr-1' : 'max-h-full'
            }`}
          >
            {sortedLinks.map(link => (
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
          <div
            className={`pointer-events-none absolute inset-x-0 -bottom-2 flex h-24 items-end justify-center rounded-b-[28px] bg-gradient-to-t from-white via-white/85 to-transparent pb-1 transition-opacity duration-300 dark:from-slate-950 dark:via-slate-900/75 ${
              hasOverflow && !isAtBottom ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {hasOverflow && !isAtBottom && (
              <button
                type="button"
                onClick={handleNudge}
                className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:bg-[#071426] dark:text-slate-200"
                aria-controls={`${sectionId}-links`}
              >
                {Math.max(hiddenCount, 1)} more
                <ChevronDown size={14} className="translate-y-0.5" />
              </button>
            )}
          </div>
          <div
            className={`pointer-events-none absolute inset-x-0 -top-2 flex h-20 items-start justify-center rounded-t-[28px] bg-gradient-to-b from-white via-white/80 to-transparent pt-5 transition-opacity duration-300 dark:from-slate-950 dark:via-slate-900/75 ${
              hasOverflow && !isAtTop ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {hasOverflow && !isAtTop && (
              <button
                type="button"
                onClick={handleScrollUp}
                className="pointer-events-auto inline-flex items-center justify-center rounded-full bg-white/90 p-2 text-slate-600 shadow-[0_10px_20px_-18px_rgba(96,165,250,0.6)] transition hover:bg-white dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-900"
                aria-controls={`${sectionId}-links`}
                aria-label="Scroll up"
              >
                <ChevronDown size={14} className="-rotate-180" />
              </button>
            )}
          </div>
        </div>
      </article>
    </section>
  );
};

export default CategorySection;
