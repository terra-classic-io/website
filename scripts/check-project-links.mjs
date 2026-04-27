#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const filePath = path.resolve(process.cwd(), "src/data/projects.ts");
const source = fs.readFileSync(filePath, "utf8");

const urlMatches = [...source.matchAll(/url:\s*['"`]([^'"`]+)['"`]/g)].map((match) => match[1]);
const nameMatches = [...source.matchAll(/name:\s*['"`]([^'"`]+)['"`]/g)].map((match) => match[1]);

const duplicates = urlMatches.filter((url, index) => urlMatches.indexOf(url) !== index);
const invalidUrls = urlMatches.filter((url) => !url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("/"));
const duplicateNames = nameMatches.filter((name, index) => nameMatches.indexOf(name) !== index);

if (invalidUrls.length > 0) {
  console.error("Invalid URLs found:");
  invalidUrls.forEach((url) => console.error(` - ${url}`));
}

if (duplicates.length > 0) {
  console.error("Duplicate URLs found:");
  [...new Set(duplicates)].forEach((url) => console.error(` - ${url}`));
}

if (duplicateNames.length > 0) {
  console.error("Duplicate project names found:");
  [...new Set(duplicateNames)].forEach((name) => console.error(` - ${name}`));
}

if (invalidUrls.length > 0 || duplicates.length > 0 || duplicateNames.length > 0) {
  process.exit(1);
}

console.log(`Checked ${nameMatches.length} projects. No duplicate names, duplicate URLs, or malformed URLs found.`);
