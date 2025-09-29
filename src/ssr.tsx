import React from "react";
import type { AppState } from "./App";
import App, { DEFAULT_STATE } from "./App";
import { HelmetProvider } from "react-helmet-async";
import { StaticRouter } from "react-router-dom/server";

declare const __SSR_TARGET__: "node" | "webworker";

type RenderOptions = {
  readonly userAgent?: string;
};

type RenderResult = {
  readonly html: string;
  readonly head: string;
  readonly initialState: string;
};

const MOBILE_REGEX = /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i;

const createInitialState = (userAgent: string): AppState => ({
  tokens: {
    LUNC: { ...DEFAULT_STATE.tokens.LUNC },
    USTC: { ...DEFAULT_STATE.tokens.USTC },
  },
  staking: { ...DEFAULT_STATE.staking },
  isMobile: MOBILE_REGEX.test(userAgent),
});

const renderToMarkup = async (component: React.ReactElement): Promise<string> => {
  if (__SSR_TARGET__ === "webworker") {
    const { renderToReadableStream } = await import("react-dom/server.edge");
    const stream = await renderToReadableStream(component);
    const { allReady } = stream as ReadableStream<Uint8Array> & { allReady?: Promise<void> };
    if (allReady) {
      await allReady;
    }
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let markup = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      if (value) {
        markup += decoder.decode(value, { stream: true });
      }
    }
    markup += decoder.decode();
    return markup;
  }

  const { renderToString } = await import("react-dom/server");
  return renderToString(component);
};

export const render = async (url: string, { userAgent = "" }: RenderOptions = {}): Promise<RenderResult> => {
  const initialState = createInitialState(userAgent);
  const helmetContext: Record<string, unknown> = {};
  const { pathname, hostname } = new URL(url, "http://localhost");

  const element = (
    <HelmetProvider context={helmetContext}>
      <StaticRouter location={pathname}>
        <App initialState={initialState} initialHostname={hostname} />
      </StaticRouter>
    </HelmetProvider>
  );

  const html = await renderToMarkup(element);

  const helmet = helmetContext?.helmet as {
    title?: { toString(): string };
    meta?: { toString(): string };
    link?: { toString(): string };
    script?: { toString(): string };
    style?: { toString(): string };
    noscript?: { toString(): string };
  } | undefined;

  const head = [
    helmet?.title?.toString(),
    helmet?.meta?.toString(),
    helmet?.link?.toString(),
    helmet?.script?.toString(),
    helmet?.style?.toString(),
    helmet?.noscript?.toString(),
  ]
    .filter(Boolean)
    .join("\n");

  return {
    html,
    head,
    initialState: JSON.stringify(initialState).replace(/</g, "\\u003c"),
  };
};
