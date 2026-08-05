import { useEffect, useState } from "react";
import { ArrowRight, Github } from "lucide-react";
import { scheduleNonCriticalTask } from "../utils/schedule-non-critical-task";

const CORE_RELEASE_API_URL = "https://api.github.com/repos/classic-terra/core/releases/latest";
const CORE_RELEASES_URL = "https://github.com/classic-terra/core/releases";
const CORE_RELEASE_CACHE_KEY = "terra-classic-latest-core-release-v1";
const CORE_RELEASE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

type CoreRelease = {
  readonly tag: string;
  readonly publishedAt: string;
  readonly url: string;
};

type CachedCoreRelease = {
  readonly release: CoreRelease;
  readonly fetchedAt: number;
};

function parseCoreRelease(value: unknown): CoreRelease | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const release = value as Record<string, unknown>;
  if (
    typeof release.tag_name !== "string"
    || typeof release.published_at !== "string"
    || typeof release.html_url !== "string"
    || release.draft === true
    || release.prerelease === true
  ) {
    return null;
  }

  return {
    tag: release.tag_name,
    publishedAt: release.published_at,
    url: release.html_url,
  };
}

function readCachedRelease(): CachedCoreRelease | null {
  try {
    const cachedValue = window.localStorage.getItem(CORE_RELEASE_CACHE_KEY);
    if (!cachedValue) {
      return null;
    }

    const cached = JSON.parse(cachedValue) as Partial<CachedCoreRelease>;
    const release = parseCoreRelease({
      tag_name: cached.release?.tag,
      published_at: cached.release?.publishedAt,
      html_url: cached.release?.url,
    });

    if (!release || typeof cached.fetchedAt !== "number") {
      return null;
    }

    return { release, fetchedAt: cached.fetchedAt };
  } catch {
    return null;
  }
}

function cacheRelease(release: CoreRelease): void {
  try {
    window.localStorage.setItem(CORE_RELEASE_CACHE_KEY, JSON.stringify({
      release,
      fetchedAt: Date.now(),
    } satisfies CachedCoreRelease));
  } catch {
    // Storage can be unavailable in private browsing; the live result is still displayed.
  }
}

function formatReleaseDate(publishedAt: string): string {
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) {
    return "recently";
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function CoreReleaseBanner(): JSX.Element {
  const [release, setRelease] = useState<CoreRelease | null>(null);

  useEffect(() => {
    const cached = readCachedRelease();
    if (cached) {
      setRelease(cached.release);
      if (Date.now() - cached.fetchedAt < CORE_RELEASE_CACHE_TTL_MS) {
        return undefined;
      }
    }

    const controller = new AbortController();

    async function loadLatestRelease(): Promise<void> {
      try {
        const response = await fetch(CORE_RELEASE_API_URL, { signal: controller.signal });
        if (!response.ok) {
          return;
        }

        const latestRelease = parseCoreRelease(await response.json());
        if (!latestRelease) {
          return;
        }

        setRelease(latestRelease);
        cacheRelease(latestRelease);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    const cancelScheduledFetch = scheduleNonCriticalTask(() => {
      void loadLatestRelease();
    });

    return () => {
      cancelScheduledFetch();
      controller.abort();
    };
  }, []);

  const releaseUrl = release?.url ?? CORE_RELEASES_URL;

  return (
    <aside
      className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white/75 px-4 py-2 text-xs text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.025] dark:text-slate-300 sm:px-5"
      aria-live="polite"
    >
      <Github size={16} className="shrink-0 text-blue-600 dark:text-blue-400" />
      <strong className="hidden font-semibold text-slate-900 dark:text-white sm:inline">
        {release ? "Latest Terra Core release" : "Terra Core releases"}
      </strong>
      <span className="rounded-full bg-blue-600/10 px-2.5 py-1 font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
        {release?.tag ?? "Official builds"}
      </span>
      <span className="hidden h-4 w-px bg-slate-200 dark:bg-white/10 md:block" />
      <span className="line-clamp-1">
        {release
          ? `Official stable release published ${formatReleaseDate(release.publishedAt)}.`
          : "Follow the official releases published by the Terra Core maintainers."}
      </span>
      <a
        href={releaseUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-auto hidden shrink-0 items-center gap-2 font-semibold text-blue-600 transition hover:text-blue-500 sm:inline-flex dark:text-blue-400"
      >
        {release ? "View release" : "View releases"}
        <ArrowRight size={15} />
      </a>
    </aside>
  );
}

export default CoreReleaseBanner;
