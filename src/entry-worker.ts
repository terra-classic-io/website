import type { Fetcher, PagesFunction, Response as CfResponse } from "@cloudflare/workers-types";
import { render } from "./ssr";

const TEMPLATE_PATH = "/index.html";

const readTemplate = async (context: Parameters<PagesFunction>[0]): Promise<string> => {
  const assetUrl = new URL(TEMPLATE_PATH, context.request.url);
  const assetsFetcher = (context.env as { ASSETS?: Fetcher }).ASSETS;

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

export const onRequest: PagesFunction = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const userAgent = request.headers.get("user-agent") ?? "";

  try {
    const baseTemplate = await readTemplate(context);
    const { html, head, initialState } = await render(url.toString(), { userAgent });
    const responseHtml = baseTemplate
      .replace("<!-- SSR_HEAD -->", head ?? "")
      .replace("<!-- SSR_APP -->", html ?? "")
      .replace("<!-- SSR_STATE -->", initialState ?? "{}");

    return new Response(responseHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    }) as unknown as CfResponse;
  } catch (error) {
    console.error("Failed to render", error);
    return new Response("Internal Server Error", { status: 500 }) as unknown as CfResponse;
  }
};
