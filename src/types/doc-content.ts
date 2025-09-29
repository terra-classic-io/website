export type DocParagraphBlock = {
  readonly kind: "paragraph";
  readonly text: string;
  readonly emphasis?: "normal" | "muted";
};

export type DocCalloutBlock = {
  readonly kind: "callout";
  readonly title: string;
  readonly body: string;
  readonly variant: "info" | "warning" | "success";
};

export type DocBulletListBlock = {
  readonly kind: "bullet-list";
  readonly title?: string;
  readonly items: readonly string[];
  readonly icon?: "dot" | "check";
};

export type DocOrderedListBlock = {
  readonly kind: "ordered-list";
  readonly title?: string;
  readonly items: readonly string[];
};

export type DocEndpoint = {
  readonly label: string;
  readonly type: "LCD" | "RPC" | "gRPC" | "FCD";
  readonly url: string;
};

export type DocEndpointGroupBlock = {
  readonly kind: "endpoint-group";
  readonly title: string;
  readonly description: string;
  readonly endpoints: readonly DocEndpoint[];
};

export type DocLinkCard = {
  readonly title: string;
  readonly description: string;
  readonly url: string;
  readonly accent?: "sky" | "violet" | "emerald" | "indigo";
};

export type DocLinkCardGridBlock = {
  readonly kind: "link-card-grid";
  readonly title?: string;
  readonly cards: readonly DocLinkCard[];
};

export type DocChecklistBlock = {
  readonly kind: "checklist";
  readonly title: string;
  readonly items: readonly string[];
};

export type DocBlock =
  | DocParagraphBlock
  | DocCalloutBlock
  | DocBulletListBlock
  | DocOrderedListBlock
  | DocEndpointGroupBlock
  | DocLinkCardGridBlock
  | DocChecklistBlock;

export type DocContentSection = {
  readonly title: string;
  readonly description?: string;
  readonly blocks: readonly DocBlock[];
};
