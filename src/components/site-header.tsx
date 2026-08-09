import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { ArrowRight, Menu, Search, X } from "lucide-react";
import terraClassicLogoUrl from "../assets/terra-classic.svg";
import ThemeToggle from "./ThemeToggle";

const SiteSearchModal = lazy(() => import("./site-search-modal"));

type SiteHeaderProps = {
  readonly homeHref?: string;
  readonly docsHref?: string;
  readonly searchLabel?: string;
  readonly onExplore?: () => void;
};

type NavigationItem = {
  readonly label: string;
  readonly href: string;
};

function SiteHeader({
  homeHref = "/",
  docsHref = "/docs",
  searchLabel = "Search ecosystem...",
  onExplore,
}: SiteHeaderProps): JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const docsBase = docsHref.endsWith("/") ? docsHref.slice(0, -1) : docsHref;
  const navigation: readonly NavigationItem[] = [
    { label: "Learn", href: `${docsBase}/learn/overview` },
    { label: "Assets", href: `${docsBase}/learn/stablecoins` },
    { label: "Validators", href: `${docsBase}/full-node/validators` },
    { label: "Governance", href: `${docsBase}/learn/governance` },
    { label: "Developers", href: `${docsBase}/develop/overview` },
    { label: "Documentation", href: docsHref },
  ];

  const closeMenu = (): void => setIsMenuOpen(false);
  const closeSearch = useCallback((): void => setIsSearchOpen(false), []);

  useEffect(() => {
    const handleSearchShortcut = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, []);

  return (
    <header className="sticky top-0 z-[70] border-b border-slate-200/70 bg-white/95 backdrop-blur-2xl dark:border-white/10 dark:bg-[#020b19]">
      <div className="mx-auto flex h-[76px] max-w-[1480px] items-center gap-5 px-5 sm:px-8 lg:px-10">
        <a href={homeHref} className="flex shrink-0 items-center gap-3" aria-label="Terra Classic home">
          <img src={terraClassicLogoUrl} alt="" className="h-11 w-11 shrink-0 object-contain" aria-hidden="true" />
          <span className="hidden text-lg font-bold tracking-[-0.03em] text-slate-950 dark:text-white sm:inline sm:text-xl">
            Terra Classic
          </span>
        </a>

        <nav className="ml-auto hidden items-center gap-7 xl:flex" aria-label="Primary navigation">
          {navigation.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-[13px] font-semibold text-slate-700 transition hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 xl:ml-4 xl:flex">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-500 shadow-sm transition hover:border-blue-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-400 dark:hover:border-blue-500/40 dark:hover:text-white"
            aria-label={searchLabel}
          >
            <Search size={16} />
            <span className="hidden 2xl:inline">{searchLabel}</span>
            <kbd className="ml-1 hidden items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-500 2xl:inline-flex">⌘ K</kbd>
          </button>
          <ThemeToggle variant="minimal" size="sm" />
          <button
            type="button"
            onClick={onExplore}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-[0_12px_30px_-12px_rgba(37,99,235,0.8)] transition hover:-translate-y-0.5 hover:bg-blue-500"
          >
            Explore ecosystem
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2 xl:hidden">
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300"
            aria-label={searchLabel}
          >
            <Search size={18} />
          </button>
          <ThemeToggle variant="minimal" size="sm" />
          <button
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-white"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
          >
            {isMenuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <div className="border-t border-slate-200 bg-white px-5 py-5 dark:border-white/10 dark:bg-[#020b19] xl:hidden">
          <nav className="mx-auto grid max-w-[1480px] gap-1" aria-label="Mobile navigation">
            {navigation.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={closeMenu}
                className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
              >
                {item.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                closeMenu();
                onExplore?.();
              }}
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
            >
              Explore ecosystem
              <ArrowRight size={16} />
            </button>
          </nav>
        </div>
      ) : null}

      {isSearchOpen ? (
        <Suspense fallback={null}>
          <SiteSearchModal homeHref={homeHref} docsHref={docsHref} onClose={closeSearch} />
        </Suspense>
      ) : null}
    </header>
  );
}

export default SiteHeader;
