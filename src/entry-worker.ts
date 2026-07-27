import type {
  ExportedHandler,
  Fetcher,
  Request as CfRequest,
  Response as CfResponse,
} from "@cloudflare/workers-types";
import { render } from "./ssr";
import { docSeoSections } from "./generated/doc-seo";
import type { DocSeoPage } from "./types/doc-seo";
import { LAST_UPDATE } from "./generated/build-info";

// On Pages client build (CF_PAGES_BUILD), we emit to dist/ root.
const TEMPLATE_PATH = "/index.html";
const PRODUCTION_URL = "https://terra-classic.io";
const PUBLIC_PREVIEW_HOSTNAME = "terra-classic-v2-preview.pages.dev";

const normalizePathname = (pathname: string): string => {
  if (pathname === "/") {
    return pathname;
  }
  return pathname.replace(/\/+$/, "");
};

const collectDocPaths = (sectionSlug: string, pages: readonly DocSeoPage[], parentPath: readonly string[] = []): string[] => {
  const paths: string[] = [];

  pages.forEach((page) => {
    const pagePath = [...parentPath, page.slug];
    paths.push(`/docs/${sectionSlug}/${pagePath.join("/")}`);
    if (page.children?.length) {
      paths.push(...collectDocPaths(sectionSlug, page.children, pagePath));
    }
  });

  return paths;
};

const docPaths = docSeoSections.flatMap((section) => collectDocPaths(section.slug, section.pages));
const knownMainPaths = new Set<string>(["/", "/ecosystem", "/docs", ...docPaths]);
const knownDocsSubdomainPaths = new Set<string>([
  "/",
  ...docPaths.map((path) => path.replace(/^\/docs/, "")),
]);
const mainDocRedirects = new Map<string, string>([
  ["/docs", "/docs/start/start"],
  ...docSeoSections.map((section) => [
    `/docs/${section.slug}`,
    `/docs/${section.slug}/${section.pages[0]?.slug ?? ""}`,
  ] as const),
]);
const subdomainDocRedirects = new Map<string, string>([
  ["/", "/start/start"],
  ...docSeoSections.map((section) => [
    `/${section.slug}`,
    `/${section.slug}/${section.pages[0]?.slug ?? ""}`,
  ] as const),
]);

const isNonIndexableHostname = (hostname: string): boolean => (
  (hostname.endsWith(".pages.dev") && hostname !== PUBLIC_PREVIEW_HOSTNAME)
  || hostname === "localhost"
  || hostname === "127.0.0.1"
);

const isDocsHostname = (hostname: string): boolean => hostname.startsWith("docs.");

const xmlEscape = (value: string): string => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&apos;");

const buildSitemap = (): string => {
  const urls = ["/", "/ecosystem", ...docPaths];
  const entries = urls.map((path) => (
    `  <url>\n    <loc>${xmlEscape(`${PRODUCTION_URL}${path}`)}</loc>\n    <lastmod>${LAST_UPDATE}</lastmod>\n  </url>`
  ));

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
};

const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Language": "en",
};

/**
 * Read the base HTML template from Cloudflare Pages static assets.
 */
const readTemplate = async (request: CfRequest, assetsFetcher?: Fetcher): Promise<string> => {
  const assetUrl = new URL(TEMPLATE_PATH, request.url);

  if (assetsFetcher) {
    const response = await assetsFetcher.fetch(assetUrl.toString());
    if (!response.ok) {
      throw new Error(`Unable to load template: ${response.status}`);
    }
    return await response.text();
  }

  const fallbackResponse = await fetch(assetUrl.toString());
  if (!fallbackResponse.ok) {
    throw new Error(`Unable to load template: ${fallbackResponse.status}`);
  }
  return await fallbackResponse.text();
};

const resolveAssetUrl = (request: CfRequest): string | null => {
  const assetUrl = new URL(request.url);
  if (!assetUrl.pathname.startsWith("/public/")) {
    return null;
  }

  assetUrl.pathname = assetUrl.pathname.replace("/public/", "/");
  return assetUrl.toString();
};

/**
 * Handle SSR for a request.
 */
const handleRequest = async (
  request: CfRequest,
  env: { ASSETS?: Fetcher }
): Promise<CfResponse> => {
  const url = new URL(request.url);
  const userAgent = request.headers.get("user-agent") ?? "";
  const pathname = normalizePathname(url.pathname);
  const hostname = url.hostname.toLowerCase();
  const nonIndexableHostname = isNonIndexableHostname(hostname);

  if (pathname === "/robots.txt") {
    const body = nonIndexableHostname
      ? "User-agent: *\nDisallow: /\n"
      : `User-agent: *\nAllow: /\n\nSitemap: ${PRODUCTION_URL}/sitemap.xml\n`;
    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        ...securityHeaders,
      },
    }) as unknown as CfResponse;
  }

  if (pathname === "/sitemap.xml") {
    return new Response(buildSitemap(), {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        ...securityHeaders,
      },
    }) as unknown as CfResponse;
  }

  if (pathname === "/bubbles") {
    url.pathname = "/ecosystem";
    return Response.redirect(url.toString(), 301) as unknown as CfResponse;
  }

  const docRedirect = isDocsHostname(hostname)
    ? subdomainDocRedirects.get(pathname)
    : mainDocRedirects.get(pathname);
  if (docRedirect) {
    url.pathname = docRedirect;
    return Response.redirect(url.toString(), 301) as unknown as CfResponse;
  }

  if (env.ASSETS && (
    pathname.startsWith("/assets/")
    || pathname.startsWith("/images/")
    || pathname.startsWith("/logos/")
    || pathname.startsWith("/favicon")
    || pathname.startsWith("/apple-touch-icon")
    || pathname.startsWith("/og-")
    || pathname === "/site.webmanifest"
    || pathname === "/llms.txt"
  )) {
    const directAssetResponse = await env.ASSETS.fetch(request);
    if (!directAssetResponse.ok) {
      return directAssetResponse as unknown as CfResponse;
    }
    const directContentType = directAssetResponse.headers.get("content-type") || "";
    if (!directContentType.includes("text/html")) {
      return directAssetResponse as unknown as CfResponse;
    }
  }

  // Try to serve static assets first
  if (env.ASSETS) {
    const rewrittenAssetUrl = resolveAssetUrl(request);
    const assetResp = rewrittenAssetUrl
      ? await env.ASSETS.fetch(rewrittenAssetUrl)
      : await env.ASSETS.fetch(request);
    const contentType = assetResp.headers.get("content-type") || "";
    // Return non-HTML assets directly (css, js, images, etc.)
    if (assetResp.ok && !contentType.includes("text/html")) {
      return assetResp as unknown as CfResponse;
    }
  }

  const baseTemplate = await readTemplate(request, env.ASSETS);
  const { html, head, initialState } = await render(url.toString(), { userAgent });
  const knownPath = isDocsHostname(hostname)
    ? knownDocsSubdomainPaths.has(pathname)
    : knownMainPaths.has(pathname);
  const status = knownPath ? 200 : 404;

  const responseHtml = baseTemplate
    .replace("<!-- SSR_HEAD -->", head ?? "")
    .replace("<!-- SSR_APP -->", html ?? "")
    .replace("<!-- SSR_STATE -->", initialState ?? "{}");

  return new Response(responseHtml, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
      ...(nonIndexableHostname || status === 404 ? { "X-Robots-Tag": "noindex, nofollow" } : {}),
      ...securityHeaders,
    },
  }) as unknown as CfResponse;
};

const worker: ExportedHandler<{ ASSETS: Fetcher }> = {
  /**
   * Cloudflare Pages single worker entry.
   */
  fetch: async (request, env, _) => {
    try {
      return await handleRequest(request, env);
    } catch (error) {
      console.error("Failed to render", error);
      return new Response("Internal Server Error", { status: 500 }) as unknown as CfResponse;
    }
  },
};

export default worker;
