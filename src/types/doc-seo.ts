export type DocSeoPage = {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly children?: readonly DocSeoPage[];
};

export type DocSeoSection = {
  readonly slug: string;
  readonly title: string;
  readonly pages: readonly DocSeoPage[];
};
