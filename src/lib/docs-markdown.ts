export type DocMarkdownHeading = {
  readonly title: string;
  readonly id: string;
};

export function slugifyDocHeading(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[`*_~]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function extractDocMarkdownHeadings(markdown: string): readonly DocMarkdownHeading[] {
  return Array.from(markdown.matchAll(/^#{2,3}\s+(.+?)\s*#*$/gm), (match) => {
    const title = (match[1] ?? "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[`*_~]/g, "").trim();
    return { title, id: slugifyDocHeading(title) };
  }).filter((heading) => heading.title.length > 0 && heading.id.length > 0);
}
