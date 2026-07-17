/**
 * @fileoverview CategoryNavigation surfaces ecosystem categories as interactive filters.
 */

import { Category } from '../data/categories';
import { projects } from '../data/projects';

type CategoryNavigationProps = {
  readonly categories: Record<string, Category>;
  readonly activeCategory: string;
  readonly summaryCount: number;
  readonly onSelect: (category: string) => void;
};

const buttonBaseClassname: string = 'inline-flex items-center whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:px-4';
const activeClassname: string = 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-500 dark:bg-blue-500/12 dark:text-blue-300';
const inactiveClassname: string = 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:bg-white/[0.025] dark:text-slate-300 dark:hover:border-blue-500/40 dark:hover:text-blue-300';

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
      <ul className="no-scrollbar flex items-center gap-2 overflow-x-auto py-1">
        {filters.map((filter) => {
          const isActive: boolean = activeCategory === filter.key;
          const buttonClassname: string = `${buttonBaseClassname} ${isActive ? activeClassname : inactiveClassname}`;

          return (
            <li key={filter.key}>
              <button type="button" onClick={() => onSelect(filter.key)} className={buttonClassname}>
                <span>{filter.label}</span>
                {filter.countLabel && (
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-white/10 dark:text-slate-300">
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
