import type { DocContentSection } from "./doc-content";

export type DocPage = {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly sections?: readonly DocContentSection[];
  readonly markdown?: string;
  readonly children?: readonly DocPage[];
};
