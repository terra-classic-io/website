import type { ProjectMapCategory, ProjectMapNode } from "./types";

export interface Point {
  readonly x: number;
  readonly y: number;
}

const clamp = (value: number, minValue: number, maxValue: number): number => {
  if (value < minValue) {
    return minValue;
  }
  if (value > maxValue) {
    return maxValue;
  }
  return value;
};

export const pointInPolygon = (
  point: Point,
  polygon: readonly (readonly [number, number])[],
): boolean => {
  if (polygon.length < 3) {
    return true;
  }
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const [xi, yi] = polygon[index];
    const [xj, yj] = polygon[previous];
    const intersect = yi > point.y !== yj > point.y
      && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
};

export const projectPointIntoPolygon = (
  point: Point,
  polygon: readonly (readonly [number, number])[],
  centroid: readonly [number, number],
): Point => {
  if (polygon.length < 3 || pointInPolygon(point, polygon)) {
    return point;
  }
  const [cx, cy] = centroid;
  const directionX = point.x - cx;
  const directionY = point.y - cy;
  let bestX = cx;
  let bestY = cy;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < polygon.length; index += 1) {
    const [x1, y1] = polygon[index];
    const [x2, y2] = polygon[(index + 1) % polygon.length];
    const edgeDX = x2 - x1;
    const edgeDY = y2 - y1;
    const edgeLengthSquared = edgeDX * edgeDX + edgeDY * edgeDY;
    if (edgeLengthSquared === 0) {
      continue;
    }
    const tNumerator = (directionX * (x1 - cx)) + (directionY * (y1 - cy));
    const tDenominator = (directionX * edgeDX) + (directionY * edgeDY);
    if (Math.abs(tDenominator) < 1e-6) {
      continue;
    }
    const t = -tNumerator / tDenominator;
    if (t < 0 || t > 1) {
      continue;
    }
    const intersectionX = x1 + t * edgeDX;
    const intersectionY = y1 + t * edgeDY;
    const distance = (intersectionX - point.x) ** 2 + (intersectionY - point.y) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestX = intersectionX;
      bestY = intersectionY;
    }
  }

  return {
    x: bestX,
    y: bestY,
  };
};

export const clampNodeToCategory = (
  node: ProjectMapNode,
  category: ProjectMapCategory,
  width: number,
  height: number,
): void => {
  const safeX = clamp(node.x, node.radius, width - node.radius);
  const safeY = clamp(node.y, node.radius, height - node.radius);
  const candidate: Point = { x: safeX, y: safeY };
  if (!pointInPolygon(candidate, category.polygon)) {
    const projected = projectPointIntoPolygon(candidate, category.polygon, category.centroid);
    node.x = clamp(projected.x, node.radius, width - node.radius);
    node.y = clamp(projected.y, node.radius, height - node.radius);
    return;
  }
  node.x = safeX;
  node.y = safeY;
};

export const clampNodeToViewport = (
  node: ProjectMapNode,
  width: number,
  height: number,
): void => {
  node.x = clamp(node.x, node.radius, width - node.radius);
  node.y = clamp(node.y, node.radius, height - node.radius);
};
