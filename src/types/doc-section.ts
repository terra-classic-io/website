import type { DocPage } from "./doc-page";

export type DocSection = {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly pages: readonly DocPage[];
};
