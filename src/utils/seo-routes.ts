import { docSections } from "../data/docs";
import type { DocPage } from "../types/doc-page";
import type { DocSection } from "../types/doc-section";
import { LAST_UPDATE } from "../generated/build-info";
import { SITE_ORIGIN } from "./seo";

const ROOT_ROUTES = new Set<string>(["/", "/bubbles"]);
const DOCS_PREFIX = "/docs";
const CANONICAL_HOSTNAME = new URL(SITE_ORIGIN).hostname;

export type SeoRouteResolution = {
  readonly statusCode: 200 | 404;
  readonly redirectPath?: string;
};

export const normalizePathname = (pathname: string): string => {
  if (!pathname || pathname === "/") {
    return "/";
  }

  const withoutTrailingSlashes = pathname.replace(/\/+$/, "");
  return withoutTrailingSlashes || "/";
};

const safeDecodeSegment = (segment: string): string | null => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
};

const toSegments = (pathname: string): readonly string[] | null => {
  const decodedSegments = normalizePathname(pathname)
    .split("/")
    .filter(Boolean)
    .map(safeDecodeSegment);

  return decodedSegments.some((segment) => segment === null)
    ? null
    : (decodedSegments as string[]);
};

const findPage = (
  pages: readonly DocPage[],
  segments: readonly string[],
): DocPage | null => {
  let currentPages = pages;
  let currentPage: DocPage | null = null;

  for (const segment of segments) {
    currentPage = currentPages.find((page) => page.slug === segment) ?? null;
    if (!currentPage) {
      return null;
    }
    currentPages = currentPage.children ?? [];
  }

  return currentPage;
};

export const buildDocPath = (
  sectionSlug: string,
  pagePath: readonly string[] = [],
): string => {
  if (sectionSlug === "start" && pagePath.length <= 1 && pagePath[0] !== undefined && pagePath[0] !== "start") {
    return `${DOCS_PREFIX}/start/${pagePath[0]}`;
  }

  if (sectionSlug === "start" && (pagePath.length === 0 || (pagePath.length === 1 && pagePath[0] === "start"))) {
    return `${DOCS_PREFIX}/start`;
  }

  const suffix = pagePath.length > 0 ? `/${pagePath.join("/")}` : "";
  return `${DOCS_PREFIX}/${sectionSlug}${suffix}`;
};

const firstPagePath = (section: DocSection): string => {
  const firstPage = section.pages[0];
  return firstPage
    ? buildDocPath(section.slug, [firstPage.slug])
    : `${DOCS_PREFIX}/${section.slug}`;
};

const resolveDocsRoute = (pathname: string): SeoRouteResolution => {
  if (pathname === DOCS_PREFIX) {
    return { statusCode: 200, redirectPath: buildDocPath("start", ["start"]) };
  }

  const segments = toSegments(pathname);
  if (!segments || segments[0] !== "docs") {
    return { statusCode: 404 };
  }

  const [, sectionSlug, ...pageSegments] = segments;
  const section = docSections.find((entry) => entry.slug === sectionSlug);
  if (!section) {
    return { statusCode: 404 };
  }

  if (section.slug === "start" && pageSegments.length === 0) {
    return { statusCode: 200 };
  }

  if (section.slug === "start" && pageSegments.length === 1 && pageSegments[0] === "start") {
    return { statusCode: 200, redirectPath: buildDocPath("start", ["start"]) };
  }

  if (pageSegments.length === 0) {
    return { statusCode: 200, redirectPath: firstPagePath(section) };
  }

  return findPage(section.pages, pageSegments)
    ? { statusCode: 200 }
    : { statusCode: 404 };
};

export const resolveSeoRoute = (pathname: string): SeoRouteResolution => {
  const normalized = normalizePathname(pathname);

  if (normalized !== pathname && pathname !== "/") {
    return { statusCode: 200, redirectPath: normalized };
  }

  if (ROOT_ROUTES.has(normalized)) {
    return { statusCode: 200 };
  }

  if (normalized === DOCS_PREFIX || normalized.startsWith(`${DOCS_PREFIX}/`)) {
    return resolveDocsRoute(normalized);
  }

  return { statusCode: 404 };
};

export const getCanonicalRedirectUrl = (url: URL): string | null => {
  let targetPath = url.pathname;
  let shouldRedirectHost = false;

  if (url.hostname === `docs.${CANONICAL_HOSTNAME}`) {
    targetPath = `${DOCS_PREFIX}${url.pathname === "/" ? "" : url.pathname}`;
    shouldRedirectHost = true;
  } else if (url.hostname === `www.${CANONICAL_HOSTNAME}`) {
    shouldRedirectHost = true;
  }

  const normalizedTargetPath = normalizePathname(targetPath);
  const routeResolution = resolveSeoRoute(normalizedTargetPath);
  const resolvedTargetPath = routeResolution.redirectPath ?? normalizedTargetPath;
  const shouldRedirectPath = resolvedTargetPath !== url.pathname;

  if (!shouldRedirectHost && !shouldRedirectPath) {
    return null;
  }

  const redirectUrl = new URL(resolvedTargetPath, `${SITE_ORIGIN}/`);
  redirectUrl.search = url.search;
  return redirectUrl.toString();
};

const collectPagePaths = (
  section: DocSection,
  pages: readonly DocPage[],
  parentPath: readonly string[] = [],
): string[] => {
  const paths: string[] = [];

  pages.forEach((page) => {
    const currentPath = [...parentPath, page.slug];
    paths.push(buildDocPath(section.slug, currentPath));

    if (page.children && page.children.length > 0) {
      paths.push(...collectPagePaths(section, page.children, currentPath));
    }
  });

  return paths;
};

export const getCanonicalSitemapPaths = (): readonly string[] => {
  const docPaths = docSections.flatMap((section) =>
    collectPagePaths(section, section.pages),
  );

  return Array.from(new Set(["/", "/bubbles", ...docPaths]));
};

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

export const buildSitemapXml = (siteOrigin = SITE_ORIGIN): string => {
  const origin = siteOrigin.replace(/\/$/, "");
  const urlEntries = getCanonicalSitemapPaths()
    .map((path) => {
      const url = path === "/" ? `${origin}/` : `${origin}${path}`;
      return [
        "  <url>",
        `    <loc>${escapeXml(url)}</loc>`,
        `    <lastmod>${LAST_UPDATE}</lastmod>`,
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlEntries,
    "</urlset>",
    "",
  ].join("\n");
};
