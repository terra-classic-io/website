import type { DocContentSection } from "./doc-content";

export type DocPage = {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly heroImage?: {
    readonly light: string;
    readonly dark: string;
    readonly alt: string;
  };
  readonly livePanel?: "treasury" | "governance";
  readonly sections?: readonly DocContentSection[];
  readonly markdown?: string;
  readonly children?: readonly DocPage[];
};
