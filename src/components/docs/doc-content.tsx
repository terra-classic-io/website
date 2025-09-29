import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import type {
  DocBlock,
  DocBulletListBlock,
  DocCalloutBlock,
  DocChecklistBlock,
  DocContentSection,
  DocEndpointGroupBlock,
  DocLinkCardGridBlock,
  DocOrderedListBlock,
  DocParagraphBlock,
} from "../../types/doc-content";
import type { DocPage } from "../../types/doc-page";
import type { DocSection } from "../../types/doc-section";
import type { DocNavigationHandler } from "../../types/doc-navigation";

const CALLOUT_STYLE: Record<DocCalloutBlock["variant"], string> = {
  info: "border-sky-200/60 bg-sky-50/60 text-slate-700 dark:border-sky-900/60 dark:bg-sky-900/30 dark:text-slate-200",
  warning:
    "border-amber-200/60 bg-amber-50/60 text-slate-700 dark:border-amber-900/60 dark:bg-amber-900/30 dark:text-slate-200",
  success:
    "border-emerald-200/60 bg-emerald-50/60 text-slate-700 dark:border-emerald-900/60 dark:bg-emerald-900/30 dark:text-slate-200",
};

const LINK_CARD_ACCENTS: Record<NonNullable<DocLinkCardGridBlock["cards"][number]["accent"]>, string> = {
  sky: "hover:border-sky-400/80 hover:shadow-sky-400/20",
  violet: "hover:border-violet-400/80 hover:shadow-violet-400/20",
  emerald: "hover:border-emerald-400/80 hover:shadow-emerald-400/20",
  indigo: "hover:border-indigo-400/80 hover:shadow-indigo-400/20",
};

type DocContentProps = {
  readonly page: DocPage;
  readonly section: DocSection;
  readonly currentPath: readonly string[];
  readonly onNavigate: DocNavigationHandler;
};

const CODE_COPY_FEEDBACK_DURATION_MS = 1600 as const;
const EXTERNAL_LINK_PATTERN = /^https?:\/\//i;

function renderParagraph(block: DocParagraphBlock, index: number): JSX.Element {
  const emphasisClass = block.emphasis === "muted" ? "text-slate-500 dark:text-slate-400" : "text-slate-600 dark:text-slate-200";
  return (
    <p key={`paragraph-${index}`} className={`text-base leading-relaxed ${emphasisClass}`}>
      {block.text}
    </p>
  );
}

function renderCallout(block: DocCalloutBlock, index: number): JSX.Element {
  const style = CALLOUT_STYLE[block.variant];
  return (
    <div key={`callout-${index}`} className={`rounded-2xl border p-5 shadow-sm backdrop-blur ${style}`}>
      <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-300">
        {block.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{block.body}</p>
    </div>
  );
}

function renderBulletList(block: DocBulletListBlock, index: number): JSX.Element {
  return (
    <ul key={`bullet-${index}`} className="space-y-3 text-base text-slate-600 dark:text-slate-200">
      {block.items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          {block.icon === "check" ? (
            <Check className="mt-1 h-4 w-4 text-emerald-500" aria-hidden="true" />
          ) : (
            <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-slate-400" />
          )}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function renderOrderedList(block: DocOrderedListBlock, index: number): JSX.Element {
  return (
    <div key={`ordered-${index}`}>
      {block.title ? (
        <h3 className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-300">
          {block.title}
        </h3>
      ) : null}
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-base text-slate-600 dark:text-slate-200">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </div>
  );
}

function renderChecklist(block: DocChecklistBlock, index: number): JSX.Element {
  return (
    <div key={`checklist-${index}`} className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-950/50">
      <h3 className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-300">
        {block.title}
      </h3>
      <ul className="mt-3 space-y-2 text-base text-slate-600 dark:text-slate-200">
        {block.items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <Check className="mt-1 h-4 w-4 text-emerald-500" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function renderEndpoints(block: DocEndpointGroupBlock, index: number): JSX.Element {
  return (
    <article
      key={`endpoint-${index}`}
      className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm transition hover:-translate-y-1 hover:border-sky-400/60 hover:shadow-xl dark:border-slate-800/60 dark:bg-slate-950/50 dark:hover:border-sky-500/40"
    >
      <h3 className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-300">
        {block.title}
      </h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{block.description}</p>
      <ul className="mt-4 space-y-3">
        {block.endpoints.map((endpoint) => (
          <li key={endpoint.url} className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600 dark:text-sky-300">
              {endpoint.type}
            </p>
            <a
              href={endpoint.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 break-all text-sm font-medium text-slate-900 underline-offset-4 hover:underline dark:text-slate-50"
            >
              {endpoint.url}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </article>
  );
}

function renderLinkCards(block: DocLinkCardGridBlock, index: number): JSX.Element {
  return (
    <div key={`cards-${index}`} className="space-y-4">
      {block.title ? (
        <h3 className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-300">
          {block.title}
        </h3>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {block.cards.map((card) => {
          const accentClass = card.accent ? LINK_CARD_ACCENTS[card.accent] : "hover:border-slate-300/80 hover:shadow-slate-300/20";
          return (
            <a
              key={card.url}
              href={card.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group block h-full rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm transition hover:-translate-y-1 dark:border-slate-800/60 dark:bg-slate-950/50 ${accentClass}`}
            >
              <p className="text-base font-semibold text-slate-900 transition group-hover:text-sky-600 dark:text-slate-50">
                {card.title}
              </p>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{card.description}</p>
              <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-600 transition group-hover:translate-x-1 dark:text-sky-300">
                Explore
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function renderBlock(block: DocBlock, index: number): JSX.Element | null {
  switch (block.kind) {
    case "paragraph":
      return renderParagraph(block, index);
    case "callout":
      return renderCallout(block, index);
    case "bullet-list":
      return renderBulletList(block, index);
    case "ordered-list":
      return renderOrderedList(block, index);
    case "checklist":
      return renderChecklist(block, index);
    case "endpoint-group":
      return renderEndpoints(block, index);
    case "link-card-grid":
      return renderLinkCards(block, index);
    default:
      return null;
  }
}

function renderSection(section: DocContentSection): JSX.Element {
  return (
    <section key={section.title} className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-white/90 via-white/75 to-white/95 p-8 shadow-xl shadow-slate-900/5 ring-1 ring-slate-200/60 dark:border-slate-800/60 dark:from-slate-950/90 dark:via-slate-950/60 dark:to-slate-900/70 dark:ring-slate-800/80">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            {section.title}
          </h2>
          {section.description ? (
            <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-300">{section.description}</p>
          ) : null}
        </div>
        <div className="mt-4 space-y-6">
          {section.blocks.map((block, index) => renderBlock(block, index))}
        </div>
      </div>
    </section>
  );
}

type MarkdownCodeBlockProps = {
  readonly language: string;
  readonly code: string;
};

function MarkdownCodeBlock({ language, code }: MarkdownCodeBlockProps): JSX.Element {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = useCallback(async () => {
    if (typeof navigator === "undefined" || typeof navigator.clipboard === "undefined") {
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), CODE_COPY_FEEDBACK_DURATION_MS);
    } catch (error) {
      console.error("Failed to copy code", error);
    }
  }, [code]);

  const displayLanguage = language.length > 0 ? language.toUpperCase() : undefined;

  return (
    <div className="group relative my-6">
      {displayLanguage ? (
        <span className="absolute left-0 top-0 z-10 inline-flex items-center gap-1 rounded-br-lg rounded-tl-lg border border-slate-200/80 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm backdrop-blur transition dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-200">
          {displayLanguage}
        </span>
      ) : null}
      <pre className="max-h-[640px] overflow-auto rounded-2xl border border-slate-200/70 bg-slate-900/95 px-5 pb-5 pt-8 text-sm leading-relaxed text-slate-100 shadow-xl shadow-slate-900/40 dark:border-slate-800/60 dark:bg-slate-950">
        <code className={`whitespace-pre language-${language}`}>{code}</code>
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-lg border border-slate-200/70 bg-white/85 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-400 hover:text-sky-600 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-sky-500/60 dark:hover:text-sky-300 md:opacity-0 md:pointer-events-none group-hover:md:opacity-100 group-hover:md:pointer-events-auto md:focus-visible:opacity-100 md:focus-visible:pointer-events-auto"
      >
        {copied ? <Check className="h-3 w-3" aria-hidden="true" /> : <Copy className="h-3 w-3" aria-hidden="true" />}
        <span>{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}

type MarkdownCodeComponentProps = HTMLAttributes<HTMLElement> & {
  readonly inline?: boolean;
  readonly className?: string;
  readonly children?: ReactNode;
};

const mergeClassNames = (base: string, custom?: string): string => [base, custom].filter(Boolean).join(" ");

const DOCS_ROOT_SEGMENT = "docs" as const;

const splitPathSegments = (path: string): string[] =>
  path
    .split("/")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);

const isExternalHref = (href?: string): boolean => {
  if (!href) {
    return false;
  }
  return EXTERNAL_LINK_PATTERN.test(href) || href.startsWith("//");
};

const splitHrefAndHash = (href: string): { path: string; hash: string } => {
  const [pathPart = "", hashPart = ""] = href.split("#");
  return {
    path: pathPart,
    hash: hashPart.length > 0 ? `#${hashPart}` : "",
  };
};

const resolveRelativeDocPath = (path: string, currentPath: readonly string[]): string[] => {
  const segments = splitPathSegments(path);
  if (segments.length === 0) {
    return [...currentPath];
  }

  const resolved: string[] = [...currentPath.slice(0, Math.max(currentPath.length - 1, 0))];
  segments.forEach((segment) => {
    if (segment === ".") {
      return;
    }
    if (segment === "..") {
      if (resolved.length > 0) {
        resolved.pop();
      }
      return;
    }
    resolved.push(segment);
  });

  return resolved;
};

type InlineCopyCodeProps = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
  readonly code: string;
  readonly className: string;
};

function InlineCopyCode({ code, className, ...rest }: InlineCopyCodeProps): JSX.Element {
  const [copied, setCopied] = useState<boolean>(false);
  const resetTimeoutRef = useRef<number | null>(null);

  const clearScheduledReset = useCallback(() => {
    if (resetTimeoutRef.current !== null) {
      window.clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = null;
    }
  }, []);

  const scheduleReset = useCallback(() => {
    clearScheduledReset();
    resetTimeoutRef.current = window.setTimeout(() => {
      setCopied(false);
      resetTimeoutRef.current = null;
    }, CODE_COPY_FEEDBACK_DURATION_MS);
  }, [clearScheduledReset]);

  const handleCopy = useCallback(async () => {
    if (typeof navigator === "undefined" || typeof navigator.clipboard === "undefined") {
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      scheduleReset();
    } catch (error) {
      console.error("Failed to copy inline code", error);
    }
  }, [code, scheduleReset]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLSpanElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleCopy();
      }
    },
    [handleCopy],
  );

  useEffect(() => () => clearScheduledReset(), [clearScheduledReset]);

  const interactiveClassName = [
    className,
    "relative",
    "cursor-pointer",
    "transition",
    "duration-150",
    "ease-out",
    "hover:border-slate-300/70",
    "hover:bg-slate-100/80",
    "focus-visible:outline",
    "focus-visible:outline-2",
    "focus-visible:outline-offset-2",
    "focus-visible:outline-sky-500",
    "dark:hover:border-slate-700/60",
    "dark:hover:bg-slate-900/60",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      {...rest}
      role="button"
      tabIndex={0}
      onClick={handleCopy}
      onKeyDown={handleKeyDown}
      className={interactiveClassName}
      aria-label={copied ? "Copied to clipboard" : `Copy ${code}`}
      data-copied={copied ? "true" : "false"}
    >
      {code}
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Copied to clipboard" : `Copy ${code}`}
      </span>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900/95 px-2 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-white shadow transition-opacity duration-150 dark:bg-slate-700/95 ${
          copied ? "opacity-100" : "opacity-0"
        }`}
      >
        Copied
      </span>
    </span>
  );
}

const createMarkdownComponents = (
  onNavigate: DocContentProps["onNavigate"],
  sectionSlug: string,
  currentPath: readonly string[],
): Components => ({
  h1: ({ node, className, ...props }) => (
    <h1
      {...props}
      className={mergeClassNames(
        "mt-12 text-4xl font-semibold tracking-tight text-slate-900 first:mt-0 dark:text-slate-50",
        className,
      )}
    />
  ),
  h2: ({ node, className, ...props }) => (
    <h2
      {...props}
      className={mergeClassNames("mt-10 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50", className)}
    />
  ),
  h3: ({ node, className, ...props }) => (
    <h3
      {...props}
      className={mergeClassNames("mt-8 text-2xl font-semibold text-slate-900 dark:text-slate-100", className)}
    />
  ),
  h4: ({ node, className, ...props }) => (
    <h4
      {...props}
      className={mergeClassNames("mt-7 text-xl font-semibold text-slate-900 dark:text-slate-100", className)}
    />
  ),
  h5: ({ node, className, ...props }) => (
    <h5
      {...props}
      className={mergeClassNames("mt-6 text-lg font-semibold text-slate-900 dark:text-slate-100", className)}
    />
  ),
  h6: ({ node, className, ...props }) => (
    <h6
      {...props}
      className={mergeClassNames("mt-6 text-base font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200", className)}
    />
  ),
  p: ({ node, className, children, ...props }) => (
    <p
      {...props}
      className={mergeClassNames("mt-5 text-[17px] leading-6 text-slate-600 first:mt-0 dark:text-slate-200", className)}
    >
      {children}
    </p>
  ),
  ul: ({ node, className, children, ...props }) => (
    <ul
      {...props}
      className={mergeClassNames(
        "mt-4 list-disc space-y-3 pl-7 text-[17px] leading-6 text-slate-600 first:mt-0 dark:text-slate-200",
        className,
      )}
    >
      {children}
    </ul>
  ),
  ol: ({ node, className, children, ...props }) => (
    <ol
      {...props}
      className={mergeClassNames(
        "mt-4 list-decimal space-y-3 pl-7 text-[17px] leading-6 text-slate-600 first:mt-0 dark:text-slate-200",
        className,
      )}
    >
      {children}
    </ol>
  ),
  li: ({ node, className, children, ...props }) => (
    <li
      {...props}
      className={mergeClassNames("marker:text-slate-400 dark:marker:text-slate-500 pl-1", className)}
    >
      <div className="relative left-[-0.25rem] text-[17px] leading-6 text-slate-600 dark:text-slate-200">
        {children}
      </div>
    </li>
  ),
  strong: ({ node, className, ...props }) => (
    <strong {...props} className={mergeClassNames("font-semibold text-slate-900 dark:text-slate-100", className)} />
  ),
  em: ({ node, className, ...props }) => (
    <em {...props} className={mergeClassNames("text-slate-600 dark:text-slate-200", className)} />
  ),
  hr: ({ node, className, ...props }) => (
    <hr {...props} className={mergeClassNames("my-10 border-slate-200 dark:border-slate-800", className)} />
  ),
  blockquote: ({ node, className, children, ...props }) => (
    <blockquote
      {...props}
      className={mergeClassNames(
        "mt-7 border-l-4 border-sky-500/50 bg-sky-500/5 px-7 py-5 text-[17px] italic leading-6 text-slate-600 first:mt-0 dark:border-sky-500/40 dark:bg-slate-900/40 dark:text-slate-200",
        className,
      )}
    >
      <div className="space-y-4">{children}</div>
    </blockquote>
  ),
  table: ({ node, className, children, ...props }) => (
    <div className="mt-7 overflow-hidden rounded-2xl border border-slate-200/70 first:mt-0 dark:border-slate-800/60">
      <table {...props} className={mergeClassNames("w-full text-left text-sm text-slate-600 dark:text-slate-200", className)}>
        {children}
      </table>
    </div>
  ),
  thead: ({ node, className, children, ...props }) => (
    <thead
      {...props}
      className={mergeClassNames(
        "bg-slate-100/80 text-xs uppercase tracking-[0.2em] text-slate-500 dark:bg-slate-900/60 dark:text-slate-300",
        className,
      )}
    >
      {children}
    </thead>
  ),
  tbody: ({ node, className, children, ...props }) => (
    <tbody
      {...props}
      className={mergeClassNames("divide-y divide-slate-200 text-[15px] leading-7 dark:divide-slate-800", className)}
    >
      {children}
    </tbody>
  ),
  tr: ({ node, className, children, ...props }) => (
    <tr {...props} className={mergeClassNames("bg-white/80 last:border-b-0 dark:bg-slate-950/40", className)}>{children}</tr>
  ),
  th: ({ node, className, children, ...props }) => (
    <th {...props} className={mergeClassNames("px-4 py-3 font-semibold", className)}>{children}</th>
  ),
  td: ({ node, className, children, ...props }) => (
    <td {...props} className={mergeClassNames("px-4 py-3 align-top text-[15px] leading-7", className)}>{children}</td>
  ),
  a: ({ node, className, children, href, ...props }) => {
    if (!href || href.startsWith("#")) {
      return (
        <a
          {...props}
          href={href}
          className={mergeClassNames("font-medium text-sky-600 underline-offset-4 hover:underline dark:text-sky-300", className)}
        >
          {children}
        </a>
      );
    }

    const { path: linkPath, hash } = splitHrefAndHash(href);

    if (isExternalHref(linkPath)) {
      return (
        <a
          {...props}
          href={href}
          className={mergeClassNames("font-medium text-sky-600 underline-offset-4 hover:underline dark:text-sky-300", className)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </a>
      );
    }

    const navigateWithOptions = (targetSectionSlug: string, targetPageSegments: readonly string[]) => {
      if (hash.length > 0) {
        onNavigate(targetSectionSlug, targetPageSegments, { hash });
        return;
      }
      onNavigate(targetSectionSlug, targetPageSegments);
    };

    if (href.startsWith("/")) {
      const absoluteSegments = splitPathSegments(linkPath);
      const trimmedSegments = absoluteSegments[0] === DOCS_ROOT_SEGMENT ? absoluteSegments.slice(1) : absoluteSegments;

      if (trimmedSegments.length === 0) {
        const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
          event.preventDefault();
          navigateWithOptions(sectionSlug, currentPath);
        };

        return (
          <a
            {...props}
            href={href}
            onClick={handleClick}
            className={mergeClassNames("font-medium text-sky-600 underline-offset-4 hover:underline dark:text-sky-300", className)}
          >
            {children}
          </a>
        );
      }

      const [targetSectionSlug, ...targetPageSegments] = trimmedSegments;

      const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        navigateWithOptions(targetSectionSlug ?? sectionSlug, targetPageSegments);
      };

      return (
        <a
          {...props}
          href={href}
          onClick={handleClick}
          className={mergeClassNames("font-medium text-sky-600 underline-offset-4 hover:underline dark:text-sky-300", className)}
        >
          {children}
        </a>
      );
    }

    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      const targetPageSegments = resolveRelativeDocPath(linkPath, currentPath);
      navigateWithOptions(sectionSlug, targetPageSegments);
    };

    return (
      <a
        {...props}
        href={href}
        onClick={handleClick}
        className={mergeClassNames("font-medium text-sky-600 underline-offset-4 hover:underline dark:text-sky-300", className)}
      >
        {children}
      </a>
    );
  },
  code: ({ inline, className, children, ...props }: MarkdownCodeComponentProps) => {
    const codeContent = String(children).replace(/\n$/, "");
    const languageMatch = /language-([\w-]+)/.exec(className ?? "");
    const language = languageMatch?.[1] ?? "";
    const shouldRenderInline = inline || (!className && !codeContent.includes("\n"));

    if (shouldRenderInline) {
      const combinedClassName = [
        "inline-block",
        "align-middle",
        "whitespace-nowrap",
        "rounded-lg",
        "border",
        "border-slate-200/80",
        "bg-slate-100/80",
        "px-2",
        "py-0.5",
        "font-mono",
        "text-[13px]",
        "font-medium",
        "tracking-tight",
        "text-slate-700",
        "shadow-inner",
        "dark:border-slate-800/70",
        "dark:bg-slate-900/60",
        "dark:text-slate-100",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ");

      return <InlineCopyCode code={codeContent} className={combinedClassName} />;
    }

    return <MarkdownCodeBlock language={language} code={codeContent} />;
  },
});

function renderMarkdown(content: string, components: Components): JSX.Element {
  return (
    <article className="mx-auto max-w-3xl ml-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </article>
  );
}

function DocContent({ page, section, currentPath, onNavigate }: DocContentProps): JSX.Element {
  const childPages = useMemo<readonly DocPage[]>(() => page.children ?? [], [page.children]);
  const hasStructuredSections = Boolean(page.sections && page.sections.length > 0);
  const markdownContent = useMemo<string>(() => (page.markdown ?? "").trim(), [page.markdown]);
  const markdownComponents = useMemo<Components>(
    () => createMarkdownComponents(onNavigate, section.slug, currentPath),
    [onNavigate, section.slug, currentPath],
  );
  const hasMarkdown = markdownContent.length > 0;

  return (
    <div className="space-y-10">
      {hasStructuredSections ? page.sections?.map((sectionBlock) => renderSection(sectionBlock)) : null}
      {!hasStructuredSections && hasMarkdown ? renderMarkdown(markdownContent, markdownComponents) : null}
      {!hasStructuredSections && !hasMarkdown ? (
        <div className="rounded-3xl border border-dashed border-slate-300/70 bg-white/60 p-10 text-sm text-slate-600 dark:border-slate-700/70 dark:bg-slate-950/40 dark:text-slate-300">
          <p>This chapter acts as a directory. Select a subpage from the menu to continue.</p>
        </div>
      ) : null}
      {childPages.length > 0 ? (
        <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm dark:border-slate-800/60 dark:bg-slate-950/60">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">In this section</h2>
          <ul className="mt-4 space-y-2">
            {childPages.map((child) => {
              const targetPath = [...currentPath, child.slug];
              return (
                <li key={child.slug}>
                  <button
                    type="button"
                    onClick={() => onNavigate(section.slug, targetPath)}
                    className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900/70 dark:hover:text-slate-50"
                  >
                    <span className="truncate font-medium">{child.title}</span>
                    <ArrowUpRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export default DocContent;
