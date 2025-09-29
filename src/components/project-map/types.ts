import type { ProjectIndicator } from "../../data/projects";

export type PointTuple = readonly [number, number];
export type Polygon = ReadonlyArray<PointTuple>;

export interface ProjectMapCategory {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly color: string;
  readonly hoverColor: string;
  readonly voronoiFillLight: string;
  readonly voronoiFillDark: string;
  readonly textColor: string;
  readonly centroid: PointTuple;
  readonly polygon: Polygon;
  readonly projectCount: number;
  readonly isEmpty: boolean;
}

export interface ProjectMapNode {
  readonly id: string;
  readonly name: string;
  readonly shortLabel: string;
  readonly description?: string;
  readonly indicator: ProjectIndicator;
  readonly url: string;
  readonly categoryId: string;
  readonly categoryTitle: string;
  readonly radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number;
  fy?: number;
  readonly color: string;
  readonly textColor: string;
  readonly indicatorRingColor: string;
  readonly indicatorRingStyle: "solid" | "segmented" | "dashed";
  readonly hasInnerDot: boolean;
  readonly monogram: string;
  readonly searchTerms: string;
  readonly seed: number;
  readonly centroid: PointTuple;
  readonly polygon: Polygon;
  readonly hasLogo: boolean;
  readonly logoSrc?: string;
  logoImage?: HTMLImageElement;
  readonly iconKey: string;
  iconImage?: HTMLImageElement;
  readonly tooltip: string;
}

export type ProjectMapEdgeStyle = "default" | "hub" | "bridge";

export interface ProjectMapEdge {
  readonly source: string;
  readonly target?: string;
  readonly targetCategoryId?: string;
  readonly style?: ProjectMapEdgeStyle;
}

export interface ProjectMapLayout {
  readonly categories: readonly ProjectMapCategory[];
  readonly nodes: readonly ProjectMapNode[];
  readonly edges: readonly ProjectMapEdge[];
  readonly width: number;
  readonly height: number;
}

export interface FilterState {
  readonly activeCategories: readonly string[];
  readonly searchQuery: string;
}

export interface InteractionState {
  readonly hoveredNodeId: string | null;
  readonly focusedNodeId: string | null;
  readonly zoom: number;
  readonly translation: readonly [number, number];
}
