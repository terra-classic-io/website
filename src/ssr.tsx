import React from "react";
import type { AppState } from "./App";
import App, { DEFAULT_STATE } from "./App";
import { HelmetProvider } from "react-helmet-async";
import { StaticRouter } from "react-router-dom/server";
import { ThemeProvider } from "./contexts/ThemeContext";

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
  // Use universal renderToString for both Node and Workers for compatibility.
  const { renderToString } = await import("react-dom/server");
  return renderToString(component);
};

export const render = async (url: string, { userAgent = "" }: RenderOptions = {}): Promise<RenderResult> => {
  const initialState = createInitialState(userAgent);
  const helmetContext: Record<string, unknown> = {};
  const { pathname, hostname } = new URL(url, "http://localhost");

  const element = (
    <HelmetProvider context={helmetContext}>
      <ThemeProvider>
        <StaticRouter location={pathname}>
          <App initialState={initialState} initialHostname={hostname} />
        </StaticRouter>
      </ThemeProvider>
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
