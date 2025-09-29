import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Category } from '../data/projects';
import LinkItem from './LinkItem';
import { ChevronDown } from 'lucide-react';
import { getOrCreateDailySeed, shuffleWithSeed } from '../utils/random';

interface SectionProps {
  readonly category: Category;
  readonly sortMode: 'alpha' | 'random';
  readonly prioritizeOnchain: boolean;
}

const panelClassname: string = 'relative flex flex-col h-full overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white/90 via-white/75 to-white/95 p-6 pb-10 shadow-xl shadow-slate-900/5 ring-1 ring-slate-200/60 transition hover:-translate-y-1 hover:shadow-2xl dark:border-slate-800/60 dark:bg-gradient-to-br dark:from-slate-950/90 dark:via-slate-950/60 dark:to-slate-900/70 dark:ring-slate-800/80 md:rounded-[32px] md:p-8 md:pb-12';
const gradientEdgeClassname: string = 'absolute inset-y-6 left-6 hidden w-px rounded-full bg-gradient-to-b from-sky-400/70 via-transparent to-indigo-500/40 md:block';
const highlightOrbClassname: string = 'pointer-events-none absolute -right-14 top-16 hidden h-44 w-44 rounded-full bg-sky-500/10 blur-3xl dark:bg-sky-500/25 md:block';

const MAX_VISIBLE_LINKS = 1;

const CategorySection: React.FC<SectionProps> = ({ category, sortMode, prioritizeOnchain }) => {
  const sectionId: string = category.title.toLowerCase().replace(/\s+/g, '-');
  const resourceCountLabel: string = `${category.links.length} resources`;
  const hasOverflow: boolean = useMemo(
    () => category.links.length > MAX_VISIBLE_LINKS,
    [category.links.length]
  );
  const [hiddenCount, setHiddenCount] = useState<number>(Math.max(category.links.length - MAX_VISIBLE_LINKS, 0));
  const listRef = useRef<HTMLUListElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState<boolean>(!hasOverflow);
  const [isAtTop, setIsAtTop] = useState<boolean>(true);
  const [dailySeed] = useState<string>(() => (typeof window === 'undefined' ? 'server-seed' : getOrCreateDailySeed('terra-category-order')));

  useEffect(() => {
    setIsAtBottom(!hasOverflow);
    setIsAtTop(true);
    setHiddenCount(Math.max(category.links.length - MAX_VISIBLE_LINKS, 0));
  }, [category.links.length, hasOverflow]);

  const handleScroll = useCallback(() => {
    if (!listRef.current) {
      return;
    }
    const { scrollTop, clientHeight, scrollHeight } = listRef.current;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 6;
    setIsAtBottom(atBottom);
    setIsAtTop(scrollTop <= 6);
    if (hasOverflow) {
      const approxPerCard = scrollHeight / category.links.length;
      const visibleGuess = Math.min(
        Math.round((scrollTop + clientHeight) / approxPerCard),
        category.links.length
      );
      setHiddenCount(Math.max(category.links.length - visibleGuess, 0));
    }
  }, [category.links.length, hasOverflow]);

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
    const baseList = category.links;
    const randomized = dailySeed && sortMode === 'random' ? shuffleWithSeed(baseList, `${dailySeed}-${category.title}`) : baseList.slice().sort((a, b) => a.name.localeCompare(b.name));
    if (!prioritizeOnchain) {
      return randomized;
    }
    const onchain = randomized.filter(link => link.indicator === 'onchain');
    const others = randomized.filter(link => link.indicator !== 'onchain');
    return [...onchain, ...others];
  }, [category.links, category.title, dailySeed, prioritizeOnchain, sortMode]);

  return (
    <section id={sectionId} className="scroll-mt-40 h-full">
      <article className={panelClassname}>
        <span className={gradientEdgeClassname} aria-hidden="true" />
        <span className={highlightOrbClassname} aria-hidden="true" />
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="pl-0 md:pl-10">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {category.title}
            </h2>
            {category.description && (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {category.description}
              </p>
            )}
          </div>
          {resourceCountLabel && (
            <span className="inline-flex shrink-0 items-center self-start rounded-full border border-slate-300/60 bg-white/40 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500 backdrop-blur dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400 md:text-[11px] md:tracking-[0.35em]">
              {resourceCountLabel.toUpperCase()}
            </span>
          )}
        </div>
        <div className="relative mt-6 ml-0 md:mt-8 md:ml-3 flex-1">
          <ul
            id={`${sectionId}-links`}
            ref={listRef}
            onScroll={handleScroll}
            className={`category-scroll grid gap-3 pr-0 pb-10 transition-all duration-300 ${
              hasOverflow ? 'max-h-[420px] overflow-y-auto pr-1' : 'max-h-full'
            }`}
          >
            {sortedLinks.map(link => (
              <li key={link.url}>
                <LinkItem
                  name={link.name}
                  url={link.url}
                  description={link.description}
                  indicator={link.indicator}
                  logo={link.logo}
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
                className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-600 shadow-[0_12px_24px_-16px_rgba(96,165,250,0.6)] transition hover:bg-white dark:bg-transparent dark:text-slate-200 dark:hover:bg-slate-900 md:px-5 md:text-[11px] md:tracking-[0.45em]"
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
