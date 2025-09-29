export type DocNavigationOptions = {
  readonly hash?: string;
};

export type DocNavigationHandler = (
  sectionSlug: string,
  pagePath?: readonly string[],
  options?: DocNavigationOptions,
) => void;
