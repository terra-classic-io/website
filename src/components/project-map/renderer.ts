import type { ProjectMapCategory, ProjectMapEdge, ProjectMapNode } from "./types";

export interface RenderTransform {
  readonly zoom: number;
  readonly translateX: number;
  readonly translateY: number;
}

export interface RenderTheme {
  readonly mode: "light" | "dark";
}

export interface RenderFilters {
  readonly activeCategoryIds: readonly string[];
  readonly highlightedNodeId: string | null;
  readonly focusedNodeId: string | null;
  readonly searchMatches: ReadonlySet<string>;
}

export interface RenderContext {
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  readonly pixelRatio: number;
  readonly width: number;
  readonly height: number;
}

export interface RenderConfig {
  readonly renderContext: RenderContext;
  readonly categories: readonly ProjectMapCategory[];
  readonly nodes: readonly ProjectMapNode[];
  readonly edges: readonly ProjectMapEdge[];
  readonly transform: RenderTransform;
  readonly filters: RenderFilters;
  readonly theme: RenderTheme;
}

const CATEGORY_DIM_OPACITY: number = 0.25;
const CATEGORY_DIM_SCALE: number = 0.92;
const SEARCH_DIM_OPACITY: number = 0.15;
const SEARCH_DIM_SCALE: number = 0.88;
const HOVER_SCALE: number = 1.06;
const HOVER_SHADOW_DARK = "rgba(15, 23, 42, 0.45)";
const HOVER_SHADOW_LIGHT = "rgba(15, 23, 42, 0.2)";

const SEGMENT_DASH_RATIO: number = 0.2;
const HALO_MIN_RADIUS: number = 220;
const HALO_MAX_RADIUS: number = 460;
const EDGE_OPACITY_LIGHT: number = 0.22;
const EDGE_OPACITY_DARK: number = 0.5;

type VisibilityState = {
  readonly opacity: number;
  readonly scale: number;
};

const hexToRgba = (hex: string, alpha: number): string => {
  const sanitized = hex.replace("#", "");
  const value = sanitized.length === 3
    ? sanitized
        .split("")
        .map((char) => `${char}${char}`)
        .join("")
    : sanitized;
  const numeric = Number.parseInt(value, 16);
  const r = (numeric >> 16) & 255;
  const g = (numeric >> 8) & 255;
  const b = numeric & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const fillCanvasBackground = (renderContext: RenderContext, theme: RenderTheme): void => {
  const { context, canvas } = renderContext;
  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  if (theme.mode === "dark") {
    gradient.addColorStop(0, "#050918");
    gradient.addColorStop(0.45, "#0b1630");
    gradient.addColorStop(0.72, "#061227");
    gradient.addColorStop(1, "#040a1a");
  } else {
    gradient.addColorStop(0, "#f8fafc");
    gradient.addColorStop(0.4, "#e8f1ff");
    gradient.addColorStop(0.75, "#f0f9ff");
    gradient.addColorStop(1, "#f8fafc");
  }
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.restore();
};

const computePolygonBounds = (polygon: readonly (readonly [number, number])[]): {
  readonly width: number;
  readonly height: number;
} => {
  if (polygon.length === 0) {
    return { width: 0, height: 0 };
  }
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const [x, y] of polygon) {
    if (x < minX) {
      minX = x;
    }
    if (y < minY) {
      minY = y;
    }
    if (x > maxX) {
      maxX = x;
    }
    if (y > maxY) {
      maxY = y;
    }
  }
  return {
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
  };
};

const traceRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void => {
  const clampedRadius = Math.min(radius, width / 2, height / 2);
  context.moveTo(x + clampedRadius, y);
  context.lineTo(x + width - clampedRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + clampedRadius);
  context.lineTo(x + width, y + height - clampedRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - clampedRadius, y + height);
  context.lineTo(x + clampedRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - clampedRadius);
  context.lineTo(x, y + clampedRadius);
  context.quadraticCurveTo(x, y, x + clampedRadius, y);
  context.closePath();
};

type IconDrawFunction = (context: CanvasRenderingContext2D, radius: number, color: string, baseAlpha: number) => void;

const ICON_KEY_ALIASES: Record<string, string> = {
  dex: "exchange",
  swap: "exchange",
  trade: "exchange",
  analytics: "analytics",
  analyticsAlt: "analytics",
  explorer: "analytics",
  finder: "analytics",
  metaverse: "game",
  endpoint: "endpoint",
  rpc: "endpoint",
  repository: "code",
  nodes: "validator",
  chat: "community",
  defi: "lending",
  platform: "lending",
};

const resolveIconKey = (iconKey: string): string => {
  const normalized = iconKey.trim().toLowerCase();
  return ICON_KEY_ALIASES[normalized] ?? normalized;
};

const drawWalletIcon: IconDrawFunction = (context, radius, color, baseAlpha) => {
  context.save();
  const width = radius * 1.4;
  const height = radius * 0.9;
  const x = -width / 2;
  const y = -height / 2;

  context.beginPath();
  traceRoundedRect(context, x, y, width, height, height * 0.28);
  context.globalAlpha = baseAlpha * 0.22;
  context.fillStyle = color;
  context.fill();

  context.globalAlpha = baseAlpha;
  context.lineWidth = Math.max(1.2, radius * 0.14);
  context.strokeStyle = color;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.stroke();

  const strapHeight = height * 0.35;
  const strapWidth = width * 0.65;
  const strapX = x + width - strapWidth;
  const strapY = y - strapHeight * 0.5;
  context.beginPath();
  traceRoundedRect(context, strapX, strapY, strapWidth, strapHeight, strapHeight * 0.4);
  context.globalAlpha = baseAlpha * 0.28;
  context.fillStyle = color;
  context.fill();

  context.globalAlpha = baseAlpha;
  context.beginPath();
  context.arc(strapX + strapWidth * 0.25, strapY + strapHeight / 2, Math.max(1.2, radius * 0.14), 0, Math.PI * 2);
  context.fillStyle = color;
  context.fill();
  context.restore();
};

const drawExchangeIcon: IconDrawFunction = (context, radius, color, baseAlpha) => {
  context.save();
  context.globalAlpha = baseAlpha;
  context.strokeStyle = color;
  context.lineWidth = Math.max(1.6, radius * 0.18);
  context.lineCap = "round";
  context.lineJoin = "round";

  context.beginPath();
  context.moveTo(-radius * 0.95, -radius * 0.3);
  context.lineTo(radius * 0.85, -radius * 0.3);
  context.lineTo(radius * 0.5, -radius * 0.7);
  context.moveTo(radius * 0.85, -radius * 0.3);
  context.lineTo(radius * 0.5, 0.1 * radius);
  context.stroke();

  context.beginPath();
  context.moveTo(radius * 0.95, radius * 0.3);
  context.lineTo(-radius * 0.85, radius * 0.3);
  context.lineTo(-radius * 0.5, radius * 0.7);
  context.moveTo(-radius * 0.85, radius * 0.3);
  context.lineTo(-radius * 0.5, -0.1 * radius);
  context.stroke();
  context.restore();
};

const drawAnalyticsIcon: IconDrawFunction = (context, radius, color, baseAlpha) => {
  context.save();
  const barWidth = radius * 0.35;
  const spacing = radius * 0.15;
  const baseY = radius * 0.75;
  const heights = [radius * 1.2, radius * 0.9, radius * 0.6];

  context.fillStyle = color;
  for (let index = 0; index < 3; index += 1) {
    const x = -barWidth * 1.5 - spacing + index * (barWidth + spacing);
    context.globalAlpha = baseAlpha * (0.28 + index * 0.08);
    context.fillRect(x, baseY - heights[index], barWidth, heights[index]);
  }
  context.restore();
};

const drawGameIcon: IconDrawFunction = (context, radius, color, baseAlpha) => {
  context.save();
  context.globalAlpha = baseAlpha;
  context.strokeStyle = color;
  context.lineWidth = Math.max(1.4, radius * 0.16);
  context.lineCap = "round";
  context.lineJoin = "round";

  const width = radius * 1.8;
  const height = radius * 1.0;
  context.beginPath();
  context.moveTo(-width / 2, height * 0.2);
  context.bezierCurveTo(-radius * 0.9, -radius * 0.85, radius * 0.9, -radius * 0.85, width / 2, height * 0.2);
  context.bezierCurveTo(width * 0.55, radius * 0.9, width * 0.2, radius * 0.8, 0, radius * 0.45);
  context.bezierCurveTo(-width * 0.2, radius * 0.8, -width * 0.55, radius * 0.9, -width / 2, height * 0.2);
  context.stroke();

  context.beginPath();
  context.moveTo(-radius * 0.35, -radius * 0.05);
  context.lineTo(-radius * 0.35, radius * 0.3);
  context.moveTo(-radius * 0.5, radius * 0.12);
  context.lineTo(-radius * 0.18, radius * 0.12);
  context.stroke();

  context.beginPath();
  context.arc(radius * 0.4, radius * 0.1, radius * 0.2, 0, Math.PI * 2);
  context.moveTo(radius * 0.2, -radius * 0.2);
  context.arc(radius * 0.2, -radius * 0.2, radius * 0.08, 0, Math.PI * 2);
  context.stroke();
  context.restore();
};

const drawEndpointIcon: IconDrawFunction = (context, radius, color, baseAlpha) => {
  context.save();
  const width = radius * 1.5;
  const height = radius * 0.6;
  const x = -width / 2;
  const yTop = -radius * 0.8;
  const yBottom = -height / 2;

  context.lineWidth = Math.max(1.2, radius * 0.14);
  context.strokeStyle = color;
  context.lineCap = "round";
  context.lineJoin = "round";

  context.beginPath();
  traceRoundedRect(context, x, yTop, width, height, height * 0.35);
  context.globalAlpha = baseAlpha * 0.22;
  context.fillStyle = color;
  context.fill();

  context.globalAlpha = baseAlpha;
  context.stroke();

  context.beginPath();
  traceRoundedRect(context, x, yBottom, width, height, height * 0.35);
  context.globalAlpha = baseAlpha * 0.22;
  context.fillStyle = color;
  context.fill();

  context.globalAlpha = baseAlpha;
  context.stroke();

  context.beginPath();
  context.arc(x + width * 0.1, yTop + height / 2, radius * 0.08, 0, Math.PI * 2);
  context.arc(x + width * 0.1, yBottom + height / 2, radius * 0.08, 0, Math.PI * 2);
  context.fillStyle = color;
  context.fill();
  context.restore();
};

const drawCodeIcon: IconDrawFunction = (context, radius, color, baseAlpha) => {
  context.save();
  context.globalAlpha = baseAlpha;
  context.strokeStyle = color;
  context.lineWidth = Math.max(1.4, radius * 0.16);
  context.lineCap = "round";
  context.lineJoin = "round";

  context.beginPath();
  context.moveTo(-radius * 0.8, 0);
  context.lineTo(-radius * 0.2, -radius * 0.6);
  context.lineTo(-radius * 0.2, radius * 0.6);
  context.closePath();
  context.stroke();

  context.beginPath();
  context.moveTo(radius * 0.8, 0);
  context.lineTo(radius * 0.2, -radius * 0.6);
  context.lineTo(radius * 0.2, radius * 0.6);
  context.closePath();
  context.stroke();
  context.restore();
};

const drawBridgeIcon: IconDrawFunction = (context, radius, color, baseAlpha) => {
  context.save();
  context.globalAlpha = baseAlpha;
  context.strokeStyle = color;
  context.lineWidth = Math.max(1.3, radius * 0.16);
  context.lineCap = "round";
  context.lineJoin = "round";

  const spanRadius = radius * 0.9;
  context.beginPath();
  context.arc(0, radius * 0.2, spanRadius, Math.PI, 0);
  context.stroke();

  context.beginPath();
  context.moveTo(-spanRadius, radius * 0.2);
  context.lineTo(-spanRadius, radius * 0.75);
  context.moveTo(spanRadius, radius * 0.2);
  context.lineTo(spanRadius, radius * 0.75);
  context.stroke();

  context.beginPath();
  context.moveTo(-spanRadius * 0.6, radius * 0.2);
  context.lineTo(-spanRadius * 0.6, radius * 0.65);
  context.moveTo(0, radius * 0.2);
  context.lineTo(0, radius * 0.65);
  context.moveTo(spanRadius * 0.6, radius * 0.2);
  context.lineTo(spanRadius * 0.6, radius * 0.65);
  context.stroke();
  context.restore();
};

const drawNewsIcon: IconDrawFunction = (context, radius, color, baseAlpha) => {
  context.save();
  const width = radius * 1.4;
  const height = radius * 1.1;
  const x = -width / 2;
  const y = -height / 2;

  context.beginPath();
  traceRoundedRect(context, x, y, width, height, radius * 0.2);
  context.globalAlpha = baseAlpha * 0.2;
  context.fillStyle = color;
  context.fill();

  context.globalAlpha = baseAlpha;
  context.lineWidth = Math.max(1.1, radius * 0.12);
  context.strokeStyle = color;
  context.stroke();

  context.lineWidth = Math.max(1, radius * 0.08);
  const lineCount = 4;
  for (let index = 0; index < lineCount; index += 1) {
    const lineY = y + height * 0.2 + index * (height * 0.18);
    const lineWidthPx = width * (index === 0 ? 0.8 : 0.6);
    context.beginPath();
    context.moveTo(x + width * 0.15, lineY);
    context.lineTo(x + width * 0.15 + lineWidthPx, lineY);
    context.stroke();
  }
  context.restore();
};

const drawWebsiteIcon: IconDrawFunction = (context, radius, color, baseAlpha) => {
  context.save();
  context.globalAlpha = baseAlpha;
  context.strokeStyle = color;
  context.lineWidth = Math.max(1.3, radius * 0.14);
  context.beginPath();
  context.arc(0, 0, radius * 0.75, 0, Math.PI * 2);
  context.stroke();

  context.lineWidth = Math.max(1, radius * 0.1);
  context.beginPath();
  context.arc(0, 0, radius * 0.75, Math.PI / 2, (3 * Math.PI) / 2);
  context.arc(0, 0, radius * 0.35, (3 * Math.PI) / 2, Math.PI / 2);
  context.stroke();

  context.beginPath();
  context.moveTo(-radius * 0.75, 0);
  context.lineTo(radius * 0.75, 0);
  context.moveTo(0, -radius * 0.75);
  context.lineTo(0, radius * 0.75);
  context.stroke();
  context.restore();
};

const drawValidatorIcon: IconDrawFunction = (context, radius, color, baseAlpha) => {
  context.save();
  context.globalAlpha = baseAlpha;
  context.strokeStyle = color;
  context.lineWidth = Math.max(1.3, radius * 0.16);
  context.lineCap = "round";
  context.lineJoin = "round";

  context.beginPath();
  context.moveTo(0, -radius * 0.9);
  context.lineTo(radius * 0.8, -radius * 0.5);
  context.lineTo(radius * 0.65, radius * 0.6);
  context.lineTo(0, radius * 0.95);
  context.lineTo(-radius * 0.65, radius * 0.6);
  context.lineTo(-radius * 0.8, -radius * 0.5);
  context.closePath();
  context.stroke();

  context.beginPath();
  context.moveTo(-radius * 0.3, 0);
  context.lineTo(-radius * 0.05, radius * 0.35);
  context.lineTo(radius * 0.35, -radius * 0.25);
  context.stroke();
  context.restore();
};

const drawCommunityIcon: IconDrawFunction = (context, radius, color, baseAlpha) => {
  context.save();
  context.globalAlpha = baseAlpha;
  context.strokeStyle = color;
  context.lineWidth = Math.max(1.1, radius * 0.14);
  context.lineCap = "round";
  context.lineJoin = "round";

  context.beginPath();
  context.arc(-radius * 0.4, -radius * 0.2, radius * 0.35, 0, Math.PI * 2);
  context.arc(radius * 0.45, -radius * 0.05, radius * 0.4, 0, Math.PI * 2);
  context.stroke();

  context.beginPath();
  context.moveTo(-radius * 0.85, radius * 0.6);
  context.quadraticCurveTo(-radius * 0.4, radius * 0.1, 0, radius * 0.55);
  context.quadraticCurveTo(radius * 0.45, radius * 0.9, radius * 0.9, radius * 0.6);
  context.stroke();
  context.restore();
};

const drawLendingIcon: IconDrawFunction = (context, radius, color, baseAlpha) => {
  context.save();
  const ellipseRadiusX = radius * 0.8;
  const ellipseRadiusY = radius * 0.35;

  context.globalAlpha = baseAlpha * 0.24;
  context.fillStyle = color;
  for (let index = 0; index < 3; index += 1) {
    const offsetY = index * ellipseRadiusY * 0.6;
    context.beginPath();
    context.ellipse(0, offsetY, ellipseRadiusX, ellipseRadiusY, 0, 0, Math.PI * 2);
    context.fill();
  }

  context.globalAlpha = baseAlpha;
  context.strokeStyle = color;
  context.lineWidth = Math.max(1, radius * 0.1);
  for (let index = 0; index < 3; index += 1) {
    const offsetY = index * ellipseRadiusY * 0.6;
    context.beginPath();
    context.ellipse(0, offsetY, ellipseRadiusX, ellipseRadiusY, 0, Math.PI, 0, false);
    context.stroke();
  }
  context.restore();
};

const drawDefaultIcon: IconDrawFunction = (context, radius, color, baseAlpha) => {
  context.save();
  context.globalAlpha = baseAlpha;
  context.strokeStyle = color;
  context.lineWidth = Math.max(1.3, radius * 0.16);
  context.lineCap = "round";
  context.lineJoin = "round";

  context.beginPath();
  context.moveTo(0, -radius * 0.95);
  context.bezierCurveTo(radius * 0.6, -radius * 0.4, radius * 0.45, radius * 0.2, 0, radius * 0.95);
  context.bezierCurveTo(-radius * 0.45, radius * 0.2, -radius * 0.6, -radius * 0.4, 0, -radius * 0.95);
  context.stroke();

  context.beginPath();
  context.moveTo(0, -radius * 0.45);
  context.lineTo(radius * 0.28, -radius * 0.05);
  context.moveTo(0, -radius * 0.45);
  context.lineTo(-radius * 0.28, -radius * 0.05);
  context.stroke();

  context.beginPath();
  context.arc(0, radius * 0.4, radius * 0.22, 0, Math.PI * 2);
  context.stroke();
  context.restore();
};

const ICON_DRAWERS: Record<string, IconDrawFunction> = {
  wallet: drawWalletIcon,
  exchange: drawExchangeIcon,
  analytics: drawAnalyticsIcon,
  game: drawGameIcon,
  endpoint: drawEndpointIcon,
  code: drawCodeIcon,
  bridge: drawBridgeIcon,
  news: drawNewsIcon,
  website: drawWebsiteIcon,
  validator: drawValidatorIcon,
  community: drawCommunityIcon,
  lending: drawLendingIcon,
  default: drawDefaultIcon,
};

const drawCategoryIcon = (
  context: CanvasRenderingContext2D,
  iconKey: string,
  radius: number,
  color: string,
  baseAlpha: number,
): void => {
  const resolvedKey = resolveIconKey(iconKey);
  const drawer = ICON_DRAWERS[resolvedKey] ?? ICON_DRAWERS.default;
  drawer(context, radius, color, baseAlpha);
};

const computeNodeVisibility = (
  node: ProjectMapNode,
  filters: RenderFilters,
): { readonly opacity: number; readonly scale: number } => {
  const { highlightedNodeId, focusedNodeId, activeCategoryIds, searchMatches } = filters;
  const categoryMatch = activeCategoryIds.length === 0 || activeCategoryIds.includes(node.categoryId);
  const searchMatch = searchMatches.size === 0 || searchMatches.has(node.id);

  if (!categoryMatch && !searchMatch) {
    return { opacity: SEARCH_DIM_OPACITY, scale: SEARCH_DIM_SCALE };
  }
  if (!categoryMatch) {
    return { opacity: CATEGORY_DIM_OPACITY, scale: CATEGORY_DIM_SCALE };
  }
  if (!searchMatch) {
    return { opacity: SEARCH_DIM_OPACITY, scale: SEARCH_DIM_SCALE };
  }
  if (node.id === highlightedNodeId || node.id === focusedNodeId) {
    return { opacity: 1.0, scale: HOVER_SCALE };
  }
  if (focusedNodeId && focusedNodeId !== node.id) {
    return { opacity: CATEGORY_DIM_OPACITY, scale: CATEGORY_DIM_SCALE };
  }
  return { opacity: 1.0, scale: 1.0 };
};

const computeHaloRadius = (category: ProjectMapCategory): number => {
  const { width, height } = computePolygonBounds(category.polygon);
  const dimension = Math.max(width, height, HALO_MIN_RADIUS);
  const projectBoost = Math.sqrt(Math.max(category.projectCount, 1)) * 22;
  return Math.min(HALO_MAX_RADIUS, dimension * 0.6 + projectBoost);
};

const drawCategoryHalos = (
  context: CanvasRenderingContext2D,
  categories: readonly ProjectMapCategory[],
  transform: RenderTransform,
  pixelRatio: number,
  theme: RenderTheme,
): void => {
  context.save();
  context.scale(pixelRatio, pixelRatio);
  context.translate(transform.translateX, transform.translateY);
  context.scale(transform.zoom, transform.zoom);
  for (const category of categories) {
    const centroidX = category.centroid[0];
    const centroidY = category.centroid[1];
    const haloRadius = computeHaloRadius(category);
    const gradient = context.createRadialGradient(
      centroidX,
      centroidY,
      haloRadius * 0.1,
      centroidX,
      centroidY,
      haloRadius,
    );
    const baseAlpha = theme.mode === "dark" ? 0.28 : 0.12;
    gradient.addColorStop(0, hexToRgba(category.color, baseAlpha));
    gradient.addColorStop(0.5, hexToRgba(category.color, baseAlpha * 0.35));
    gradient.addColorStop(1, hexToRgba(category.color, 0));
    context.beginPath();
    context.arc(centroidX, centroidY, haloRadius, 0, Math.PI * 2);
    context.fillStyle = gradient;
    context.fill();
  }
  context.restore();
};

interface ClusterEdge {
  readonly source: ProjectMapNode;
  readonly target: ProjectMapNode;
}

const resolveClusterEdges = (
  edges: readonly ProjectMapEdge[],
  nodes: readonly ProjectMapNode[],
): readonly ClusterEdge[] => {
  if (edges.length === 0) {
    return [];
  }
  const lookup = new Map<string, ProjectMapNode>();
  for (const node of nodes) {
    lookup.set(node.id, node);
  }
  const resolved: ClusterEdge[] = [];
  for (const edge of edges) {
    const source = lookup.get(edge.source);
    const target = lookup.get(edge.target ?? '');
    if (source && target) {
      resolved.push({ source, target });
    }
  }
  return resolved;
};

const drawClusterEdges = (
  context: CanvasRenderingContext2D,
  edges: readonly ClusterEdge[],
  transform: RenderTransform,
  pixelRatio: number,
  theme: RenderTheme,
  visibilityMap: Map<string, VisibilityState>,
): void => {
  if (edges.length === 0) {
    return;
  }
  const baseOpacity = theme.mode === "dark" ? EDGE_OPACITY_DARK : EDGE_OPACITY_LIGHT;
  context.save();
  context.scale(pixelRatio, pixelRatio);
  context.translate(transform.translateX, transform.translateY);
  context.scale(transform.zoom, transform.zoom);
  context.lineCap = "round";
  for (const edge of edges) {
    const sourceVisibility = visibilityMap.get(edge.source.id);
    const targetVisibility = visibilityMap.get(edge.target.id);
    if (!sourceVisibility || !targetVisibility) {
      continue;
    }
    const combinedOpacity = Math.min(sourceVisibility.opacity, targetVisibility.opacity) * baseOpacity;
    if (combinedOpacity <= 0.02) {
      continue;
    }
    context.globalAlpha = combinedOpacity;
    context.lineWidth = Math.max(1.2, 3 / transform.zoom);
    const strokeAlpha = theme.mode === "dark" ? 0.65 : 0.32;
    context.strokeStyle = hexToRgba(edge.source.color, strokeAlpha);
    context.beginPath();
    context.moveTo(edge.source.x, edge.source.y);
    context.lineTo(edge.target.x, edge.target.y);
    context.stroke();
  }
  context.restore();
};

const drawNodeRing = (
  context: CanvasRenderingContext2D,
  node: ProjectMapNode,
  radius: number,
  strokeWidth: number,
  opacity: number,
  scale: number,
): void => {
  context.save();
  const brightenedOpacity = scale > 1.01 ? Math.min(1, opacity + 0.15) : opacity;
  context.globalAlpha = brightenedOpacity;
  context.lineWidth = strokeWidth;
  context.strokeStyle = node.indicatorRingColor;
  context.setLineDash([]);
  switch (node.indicatorRingStyle) {
    case "segmented":
      context.setLineDash([radius * SEGMENT_DASH_RATIO, radius * SEGMENT_DASH_RATIO]);
      break;
    case "dashed":
      context.setLineDash([4, 6]);
      break;
    default:
      break;
  }
  context.beginPath();
  context.arc(0, 0, radius - strokeWidth / 2, 0, Math.PI * 2);
  context.stroke();
  context.restore();
};

const drawInnerDot = (
  context: CanvasRenderingContext2D,
  node: ProjectMapNode,
  radius: number,
  opacity: number,
): void => {
  context.save();
  context.globalAlpha = opacity;
  context.fillStyle = node.indicatorRingColor;
  const dotRadius = Math.max(3, radius * 0.18);
  const offset = radius * 0.55;
  context.beginPath();
  context.arc(offset, -offset, dotRadius, 0, Math.PI * 2);
  context.fill();
  context.restore();
};

const drawBubble = (
  context: CanvasRenderingContext2D,
  node: ProjectMapNode,
  visibility: { readonly opacity: number; readonly scale: number },
  theme: RenderTheme,
): void => {
  const diameter = node.radius * 2 * visibility.scale;
  const centerX = node.x;
  const centerY = node.y;

  context.save();
  context.translate(centerX, centerY);
  context.scale(visibility.scale, visibility.scale);

  const shadowColor = theme.mode === "dark" ? HOVER_SHADOW_DARK : HOVER_SHADOW_LIGHT;
  context.shadowColor = shadowColor;
  context.shadowBlur = visibility.scale > 1.01 ? 32 : 12;
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 12 * (visibility.scale - 1.0);

  context.beginPath();
  context.fillStyle = node.color;
  context.globalAlpha = visibility.opacity;
  context.arc(0, 0, node.radius, 0, Math.PI * 2);
  context.fill();

  context.shadowColor = "transparent";
  const ringWidth = Math.max(2, diameter * 0.04);
  drawNodeRing(context, node, node.radius, ringWidth, visibility.opacity, visibility.scale);

  if (node.hasInnerDot) {
    drawInnerDot(context, node, node.radius, visibility.opacity);
  }

  context.globalAlpha = visibility.opacity;
  if (node.hasLogo && node.logoImage && node.logoImage.complete && node.logoImage.naturalWidth > 0) {
    const inset = Math.max(8, node.radius * 0.3);
    const logoSize = node.radius * 2 - inset;
    context.save();
    context.beginPath();
    context.arc(0, 0, node.radius - inset / 2, 0, Math.PI * 2);
    context.clip();
    context.drawImage(node.logoImage, -logoSize / 2, -logoSize / 2, logoSize, logoSize);
    context.restore();
  } else {
    drawCategoryIcon(context, node.iconKey, node.radius * 0.7, node.textColor, visibility.opacity);
  }

  context.restore();
};

export const renderProjectMap = (config: RenderConfig): void => {
  const {
    renderContext,
    categories,
    nodes,
    edges,
    transform,
    filters,
    theme,
  } = config;
  const { context, canvas, pixelRatio } = renderContext;

  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.restore();

  fillCanvasBackground(renderContext, theme);

  const clusterEdges = resolveClusterEdges(edges, nodes);

  drawCategoryHalos(context, categories, transform, pixelRatio, theme);

  context.save();
  context.scale(pixelRatio, pixelRatio);
  context.translate(transform.translateX, transform.translateY);
  context.scale(transform.zoom, transform.zoom);

  const visibilityMap = new Map<string, VisibilityState>();
  for (const node of nodes) {
    const visibility = computeNodeVisibility(node, filters);
    visibilityMap.set(node.id, visibility);
  }
  context.restore();

  drawClusterEdges(context, clusterEdges, transform, pixelRatio, theme, visibilityMap);

  context.save();
  context.scale(pixelRatio, pixelRatio);
  context.translate(transform.translateX, transform.translateY);
  context.scale(transform.zoom, transform.zoom);

  for (const node of nodes) {
    const visibility = visibilityMap.get(node.id) ?? { opacity: 1, scale: 1 };
    drawBubble(context, node, visibility, theme);
  }

  context.restore();
};
