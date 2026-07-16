import type {
  ExportedHandler,
  Fetcher,
  Request as CfRequest,
  Response as CfResponse,
} from "@cloudflare/workers-types";
import { render } from "./ssr";
import {
  buildSitemapXml,
  getCanonicalRedirectUrl,
  resolveSeoRoute,
} from "./utils/seo-routes";

// On Pages client build (CF_PAGES_BUILD), we emit to dist/ root.
const TEMPLATE_PATH = "/index.html";
const HTML_CACHE_CONTROL = "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";
const NOT_FOUND_CACHE_CONTROL = "private, max-age=300";

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
  const pathname = url.pathname;

  const canonicalRedirectUrl = getCanonicalRedirectUrl(url);
  if (canonicalRedirectUrl) {
    return Response.redirect(canonicalRedirectUrl, 308) as unknown as CfResponse;
  }

  if (pathname === "/sitemap.xml") {
    return new Response(request.method === "HEAD" ? null : buildSitemapXml(), {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "X-Content-Type-Options": "nosniff",
      },
    }) as unknown as CfResponse;
  }

  if (env.ASSETS && (pathname.startsWith("/assets/") || pathname.startsWith("/favicon") || pathname.startsWith("/robots") || pathname.startsWith("/manifest"))) {
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
  const { statusCode } = resolveSeoRoute(pathname);

  const responseHtml = baseTemplate
    .replace("<!-- SSR_HEAD -->", head ?? "")
    .replace("<!-- SSR_APP -->", html ?? "")
    .replace("<!-- SSR_STATE -->", initialState ?? "{}");

  return new Response(request.method === "HEAD" ? null : responseHtml, {
    status: statusCode,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": statusCode === 404 ? NOT_FOUND_CACHE_CONTROL : HTML_CACHE_CONTROL,
      "X-Robots-Tag": statusCode === 404 ? "noindex, follow" : "index, follow",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
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
