import { Delaunay } from "d3-delaunay";
import { ProjectLink, projects } from "../../data/projects";
import { categories as sourceCategories } from "../../data/categories";
import { clampNodeToViewport } from "./geometry";
import { createMulberry32, stringToSeed } from "../../utils/random";
import terraClassicLogoUrl from "../../assets/terra-classic.svg";
import {
  CATEGORY_PALETTE_LOOKUP,
  INDICATOR_VISUALS,
  PROJECT_BASE_CONSTANT,
  PROJECT_GROWTH_FACTOR,
  PROJECT_MAX_DIAMETER,
  PROJECT_MIN_DIAMETER,
} from "./constants";
import {
  PointTuple,
  Polygon,
  ProjectMapCategory,
  ProjectMapEdge,
  ProjectMapLayout,
  ProjectMapNode,
} from "./types";
import { determineProjectIconKey } from "../../utils/project-icons";

interface LayoutOptions {
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly categories?: (keyof typeof sourceCategories)[];
}

interface HubNodeConfig {
  readonly id: string;
  readonly name: string;
  readonly radius: number;
  readonly color: string;
  readonly textColor: string;
  readonly indicatorRingColor: string;
  readonly indicatorRingStyle: ProjectMapNode["indicatorRingStyle"];
  readonly description?: string;
  readonly logoSrc?: string;
}

interface ExternalNodeConfig {
  readonly id: string;
  readonly name: string;
  readonly radius: number;
  readonly color: string;
  readonly textColor: string;
  readonly indicatorRingColor: string;
  readonly indicatorRingStyle: ProjectMapNode["indicatorRingStyle"];
  readonly categoryTitle: string;
  readonly url?: string;
}

const GRID_COLUMNS: number = 12;
const MIN_CELL_SIZE: number = 220;
const MAX_CELL_SIZE: number = 320;
const COLUMN_DENOMINATOR: number = 6;

const sanitizeText = (value?: string): string => (value ?? "").trim();

const computeCellSize = (viewportWidth: number): number => {
  const candidate: number = viewportWidth / COLUMN_DENOMINATOR;
  const clamped: number = Math.max(MIN_CELL_SIZE, Math.min(candidate, MAX_CELL_SIZE));
  return clamped;
};

const clampNumber = (value: number, minValue: number, maxValue: number): number => {
  if (value < minValue) {
    return minValue;
  }
  if (value > maxValue) {
    return maxValue;
  }
  return value;
};

const createCategoryId = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const computeShortLabel = (name: string): string => {
  const sanitized = sanitizeText(name);
  if (sanitized.length <= 18) {
    return sanitized;
  }
  return `${sanitized.slice(0, 16)}…`;
};

const computeMonogram = (name: string): string => {
  const sanitized = sanitizeText(name);
  const parts: string[] = sanitized.split(/\s+/g).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const first: string = parts[0].charAt(0);
  const last: string = parts[parts.length - 1].charAt(0);
  return `${first}${last}`.toUpperCase();
};

const computeDiameter = (name: string): number => {
  const sanitized = sanitizeText(name);
  const effectiveLength: number = Math.min(sanitized.length, 16);
  const diameter = PROJECT_BASE_CONSTANT + PROJECT_GROWTH_FACTOR * Math.sqrt(effectiveLength);
  return clampNumber(diameter, PROJECT_MIN_DIAMETER, PROJECT_MAX_DIAMETER);
};

const buildCategoryPalette = (title: string) => {
  const palette = CATEGORY_PALETTE_LOOKUP[title];
  if (palette) {
    return palette;
  }
  return {
    title,
    id: createCategoryId(title),
    color: "#334155",
    hoverColor: "#475569",
    voronoiFillLight: "#47556926",
    voronoiFillDark: "#47556923",
    textColor: "#F8FAFC",
  };
};

const normalizeLink = (
  link: ProjectLink,
  categoryTitle: string,
  centroid: readonly [number, number],
  polygon: readonly (readonly [number, number])[],
  seed: number,
): ProjectMapNode => {
  const diameter: number = computeDiameter(link.name);
  const radius: number = diameter / 2;
  const palette = buildCategoryPalette(categoryTitle);
  const indicatorVisual = INDICATOR_VISUALS[link.indicator];
  const sanitizedDescription = sanitizeText(link.description);
  const tooltipText = sanitizedDescription.length > 0 ? sanitizedDescription : "No description provided.";
  const iconKey = determineProjectIconKey({
    name: link.name,
    description: sanitizedDescription,
    categoryTitle,
  });

  return {
    id: `${createCategoryId(categoryTitle)}-${createCategoryId(link.name)}`,
    name: link.name,
    shortLabel: computeShortLabel(link.name),
    description: sanitizedDescription.length > 0 ? sanitizedDescription : undefined,
    indicator: link.indicator,
    url: link.url,
    categoryId: palette.id,
    categoryTitle,
    radius,
    x: centroid[0] + (seed % 32) - 16,
    y: centroid[1] + ((seed >>> 4) % 32) - 16,
    vx: 0,
    vy: 0,
    color: palette.color,
    textColor: palette.textColor,
    indicatorRingColor: indicatorVisual.ringColor,
    indicatorRingStyle: indicatorVisual.ringStyle,
    hasInnerDot: indicatorVisual.innerDot,
    monogram: computeMonogram(link.name),
    searchTerms: `${link.name.toLowerCase()} ${sanitizedDescription.toLowerCase()}`.trim(),
    seed,
    centroid,
    polygon,
    hasLogo: Boolean((link as { logo?: string }).logo),
    logoSrc: (link as { logo?: string }).logo,
    iconKey,
    tooltip: `Open ${link.name}${sanitizedDescription.length > 0 ? `: ${sanitizedDescription}` : ""}`,
  };
};

const computeCategoryCentroids = (
  categories: (keyof typeof sourceCategories)[],
  viewportWidth: number,
  viewportHeight: number,
): PointTuple[] => {
  const cellSize: number = computeCellSize(viewportWidth);
  const horizontalMargin: number = Math.max(cellSize * 0.4, 48);
  const verticalMargin: number = Math.max(cellSize * 0.35, 64);
  const usableWidth: number = Math.max(viewportWidth - horizontalMargin * 2, cellSize * 2);
  const columns: number = Math.min(GRID_COLUMNS, Math.max(2, Math.floor(usableWidth / cellSize)));
  const rows: number = Math.ceil(categories.length / columns);
  const gridWidth: number = columns * cellSize;
  const gridHeight: number = rows * cellSize;
  const horizontalOffset: number = Math.max((viewportWidth - gridWidth) / 2, horizontalMargin);
  const verticalOffset: number = Math.max((viewportHeight - gridHeight) / 2, verticalMargin);

  return categories.map((_, index) => {
    const columnIndex: number = index % columns;
    const rowIndex: number = Math.floor(index / columns);
    const x: number = horizontalOffset + columnIndex * cellSize + cellSize / 2;
    const y: number = verticalOffset + rowIndex * cellSize + cellSize / 2;
    return [x, y] as PointTuple;
  });
};

const computeCategoryPolygons = (
  centroids: readonly PointTuple[],
  width: number,
  height: number,
): Polygon[] => {
  if (centroids.length === 0) {
    return [];
  }
  const clampedCentroids = centroids.map(([x, y]) => [
    clampNumber(x, 140, width - 140),
    clampNumber(y, 160, height - 120),
  ] as PointTuple);
  const delaunay = Delaunay.from(clampedCentroids.map((point) => [point[0], point[1]] as [number, number]));
  const voronoi = delaunay.voronoi([0, 0, width, height]);
  return clampedCentroids.map((_, index) => {
    const cell = voronoi.cellPolygon(index) ?? [];
    return cell.map((pair) => [clampNumber(pair[0], 64, width - 64), clampNumber(pair[1], 96, height - 96)] as PointTuple) as Polygon;
  });
};

const buildHubCategoryEdges = (
  categories: readonly ProjectMapCategory[],
): ProjectMapEdge[] => categories.map((category) => ({
  source: HUB_NODE.id,
  targetCategoryId: category.id,
  style: "hub",
}));

const buildHubNodeEdges = (nodes: readonly ProjectMapNode[]): ProjectMapEdge[] =>
  nodes
    .filter((node) => node.id !== HUB_NODE.id && node.id !== EXTERNAL_NODE.id)
    .map((node) => ({
      source: HUB_NODE.id,
      target: node.id,
      style: "hub",
    }));

const buildBridgeEdges = (nodes: readonly ProjectMapNode[]): ProjectMapEdge[] =>
  nodes
    .filter((node) => node.categoryTitle === EXTERNAL_NODE.categoryTitle)
    .map((node) => ({
      source: EXTERNAL_NODE.id,
      target: node.id,
      style: "bridge",
    }));

const HUB_NODE: HubNodeConfig = {
  id: "terra-classic-hub",
  name: "Terra Classic",
  radius: 72,
  color: "#0f172a",
  textColor: "#f8fafc",
  indicatorRingColor: "#38bdf8",
  indicatorRingStyle: "solid",
  description: "Explore the Terra Classic ecosystem",
  logoSrc: terraClassicLogoUrl,
};

const EXTERNAL_NODE: ExternalNodeConfig = {
  id: "cosmos-chains",
  name: "Cosmos Chains",
  radius: 56,
  color: "#4c1d95",
  textColor: "#ede9fe",
  indicatorRingColor: "#a855f7",
  indicatorRingStyle: "dashed",
  categoryTitle: "Bridges",
  url: "https://cosmos.network",
};

const createHubNode = (centroid: PointTuple, polygon: Polygon): ProjectMapNode => ({
  id: HUB_NODE.id,
  name: HUB_NODE.name,
  shortLabel: HUB_NODE.name,
  description: HUB_NODE.description,
  indicator: "support",
  url: "https://classic.terra.money",
  categoryId: "terra-hub",
  categoryTitle: "Network Hub",
  radius: HUB_NODE.radius,
  x: centroid[0],
  y: centroid[1],
  vx: 0,
  vy: 0,
  color: HUB_NODE.color,
  textColor: HUB_NODE.textColor,
  indicatorRingColor: HUB_NODE.indicatorRingColor,
  indicatorRingStyle: HUB_NODE.indicatorRingStyle,
  hasInnerDot: false,
  monogram: "TC",
  searchTerms: "terra classic network hub",
  seed: stringToSeed(HUB_NODE.id),
  centroid,
  polygon,
  hasLogo: Boolean(HUB_NODE.logoSrc),
  logoSrc: HUB_NODE.logoSrc,
  tooltip: "Open Terra Classic hub",
  fx: centroid[0],
  fy: centroid[1],
  iconKey: determineProjectIconKey({
    name: HUB_NODE.name,
    description: HUB_NODE.description,
    categoryTitle: "Network Hub",
  }),
});

const createExternalNode = (centroid: PointTuple, polygon: Polygon): ProjectMapNode => ({
  id: EXTERNAL_NODE.id,
  name: EXTERNAL_NODE.name,
  shortLabel: EXTERNAL_NODE.name,
  indicator: "support",
  url: EXTERNAL_NODE.url ?? "https://cosmos.network",
  categoryId: EXTERNAL_NODE.id,
  categoryTitle: EXTERNAL_NODE.categoryTitle,
  radius: EXTERNAL_NODE.radius,
  x: centroid[0],
  y: centroid[1],
  vx: 0,
  vy: 0,
  color: EXTERNAL_NODE.color,
  textColor: EXTERNAL_NODE.textColor,
  indicatorRingColor: EXTERNAL_NODE.indicatorRingColor,
  indicatorRingStyle: EXTERNAL_NODE.indicatorRingStyle,
  hasInnerDot: false,
  monogram: "CC",
  searchTerms: "cosmos chains bridges",
  seed: stringToSeed(EXTERNAL_NODE.id),
  centroid,
  polygon,
  hasLogo: false,
  tooltip: "Explore Cosmos chains",
  fx: centroid[0],
  fy: centroid[1],
  iconKey: determineProjectIconKey({
    name: EXTERNAL_NODE.name,
    categoryTitle: EXTERNAL_NODE.categoryTitle,
  }),
});

export const createProjectMapLayout = (
  options: LayoutOptions,
): ProjectMapLayout => {
  const { viewportWidth, viewportHeight } = options;
  const categorySource: (keyof typeof sourceCategories)[] = options.categories ?? Object.keys(sourceCategories);

  const centroids: PointTuple[] = computeCategoryCentroids(categorySource, viewportWidth, viewportHeight);
  const polygons: Polygon[] = computeCategoryPolygons(centroids, viewportWidth, viewportHeight);

  const categories: ProjectMapCategory[] = categorySource.map((category, index) => {
    const palette = buildCategoryPalette(sourceCategories[category].title);
    const polygon: Polygon = polygons[index] ?? ([] as Polygon);
    const centroid: PointTuple = centroids[index] ?? ([viewportWidth / 2, viewportHeight / 2] as PointTuple);
    return {
      id: palette.id,
      title: sourceCategories[category].title,
      description: sourceCategories[category].description,
      color: palette.color,
      hoverColor: palette.hoverColor,
      voronoiFillLight: palette.voronoiFillLight,
      voronoiFillDark: palette.voronoiFillDark,
      textColor: palette.textColor,
      centroid,
      polygon,
      projectCount: projects.filter((project) => project.categories?.includes(category)).length,
      isEmpty: projects.filter((project) => project.categories?.includes(category)).length === 0,
    };
  });

  const seenProjects: Set<string> = new Set();
  const baseNodes: ProjectMapNode[] = categorySource.flatMap((category, index) => {
    const centroid: PointTuple = categories[index]?.centroid ?? ([viewportWidth / 2, viewportHeight / 2] as PointTuple);
    const polygon: Polygon = categories[index]?.polygon ?? [[centroid[0] - 40, centroid[1] - 40], [centroid[0] + 40, centroid[1] + 40]] as Polygon;
    const categorySeed: number = stringToSeed(`${category}-${projects.filter((project) => project.categories?.includes(category)).length}`);
    const categoryRng = createMulberry32(categorySeed);
    return projects.filter((project) => project.categories?.includes(category)).map((project) => {
      if (seenProjects.has(project.name)) {
        return null;
      }
      seenProjects.add(project.name);
      const seed = stringToSeed(`${category}-${project.name}`) ^ Math.floor(categoryRng() * 1_000_000);
      const node = normalizeLink(project, sourceCategories[category].title, centroid, polygon, seed);
      node.fx = undefined;
      node.fy = undefined;
      clampNodeToViewport(node, viewportWidth, viewportHeight);
      return node;
    }).filter((node) => node !== null) as ProjectMapNode[];
  });

  const layoutCenter: PointTuple = [viewportWidth / 2, viewportHeight / 2];
  const hubNode: ProjectMapNode = createHubNode(layoutCenter, [[layoutCenter[0] - 20, layoutCenter[1] - 20], [layoutCenter[0] + 20, layoutCenter[1] + 20]] as Polygon);

  const bridgesCategory = categories.find((category) => category.title === EXTERNAL_NODE.categoryTitle);
  const bridgeCentroid: PointTuple = bridgesCategory?.centroid ?? ([layoutCenter[0] + 260, layoutCenter[1]] as PointTuple);
  const directionX: number = bridgeCentroid[0] - layoutCenter[0];
  const directionY: number = bridgeCentroid[1] - layoutCenter[1];
  const length: number = Math.hypot(directionX, directionY) || 1;
  const normalizedX = directionX / length;
  const normalizedY = directionY / length;
  const externalDistance: number = HUB_NODE.radius + EXTERNAL_NODE.radius + 160;
  const externalCenterX = layoutCenter[0] + normalizedX * externalDistance;
  const externalCenterY = layoutCenter[1] + normalizedY * externalDistance;
  const externalPosition: PointTuple = [
    clampNumber(externalCenterX, EXTERNAL_NODE.radius + 120, viewportWidth - EXTERNAL_NODE.radius - 120),
    clampNumber(externalCenterY, EXTERNAL_NODE.radius + 120, viewportHeight - EXTERNAL_NODE.radius - 120),
  ] as PointTuple;
  const externalNode: ProjectMapNode = createExternalNode(externalPosition, [[externalPosition[0] - 20, externalPosition[1] - 20], [externalPosition[0] + 20, externalPosition[1] + 20]] as Polygon);

  const nodes: ProjectMapNode[] = [...baseNodes, hubNode, externalNode];

  const edges: ProjectMapEdge[] = [
    ...buildHubCategoryEdges(categories),
    ...buildHubNodeEdges(nodes),
    ...buildBridgeEdges(baseNodes),
  ];

  return {
    categories: categories,
    nodes,
    edges,
    width: viewportWidth,
    height: viewportHeight,
  };
};

export const DEFAULT_LAYOUT_WIDTH: number = 1600;
export const DEFAULT_LAYOUT_HEIGHT: number = 900;

export const createDefaultProjectMapLayout = (): ProjectMapLayout =>
  createProjectMapLayout({
    viewportWidth: DEFAULT_LAYOUT_WIDTH,
    viewportHeight: DEFAULT_LAYOUT_HEIGHT,
  });
