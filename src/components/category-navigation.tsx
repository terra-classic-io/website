/**
 * @fileoverview CategoryNavigation surfaces ecosystem categories as interactive filters.
 */

import { Category, projects } from '../data/projects';

type CategoryNavigationProps = {
  readonly categories: Record<string, Category>;
  readonly activeCategory: string;
  readonly summaryCount: number;
  readonly onSelect: (category: string) => void;
};

const buttonBaseClassname: string = 'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:px-4 sm:py-2 sm:text-sm';
const activeClassname: string = 'border-sky-400 bg-sky-500 text-white shadow-lg shadow-sky-500/30 dark:border-sky-500 dark:bg-sky-500/80';
const inactiveClassname: string = 'border-slate-300/70 bg-white/20 text-slate-600 hover:border-slate-400 hover:bg-white/60 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-900/70 dark:hover:text-white';

/**
 * CategoryNavigation renders scrollable pills for filtering the ecosystem list.
 */
function CategoryNavigation({ categories, activeCategory, summaryCount, onSelect }: CategoryNavigationProps): JSX.Element {
  const totalResourcesLabel: string = `${summaryCount}+`;
  const filters: { readonly label: string; readonly key: string; readonly countLabel?: string }[] = [
    { label: 'All resources', key: 'All', countLabel: totalResourcesLabel },
    ...Object.keys(categories).map((category) => ({
      label: categories[category].title,
      key: category,
      countLabel: `${projects.filter((project) => project.categories?.includes(category)).length}`,
    })),
  ];

  return (
    <nav className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-16 bg-gradient-to-r from-slate-50 via-slate-50/50 to-transparent dark:from-slate-950 dark:via-slate-950/70 sm:block" />
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-16 bg-gradient-to-l from-slate-50 via-slate-50/50 to-transparent dark:from-slate-950 dark:via-slate-950/70 sm:block" />
      <ul className="no-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 py-3 sm:-mx-0 sm:gap-3 sm:py-4 sm:pr-8">
        {filters.map((filter) => {
          const isActive: boolean = activeCategory === filter.key;
          const buttonClassname: string = `${buttonBaseClassname} ${isActive ? activeClassname : inactiveClassname}`;

          return (
            <li key={filter.key}>
              <button type="button" onClick={() => onSelect(filter.key)} className={buttonClassname}>
                <span>{filter.label}</span>
                {filter.countLabel && (
                  <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-900/40 dark:text-slate-300">
                    {filter.countLabel}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default CategoryNavigation;
