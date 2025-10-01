import { rgb } from "d3-color";
import type { ProjectIndicator } from "../../data/projects";

export interface CategoryPalette {
  readonly title: string;
  readonly id: string;
  readonly color: string;
  readonly hoverColor: string;
  readonly voronoiFillLight: string;
  readonly voronoiFillDark: string;
  readonly textColor: string;
}

export interface IndicatorVisual {
  readonly ringStyle: "solid" | "segmented" | "dashed";
  readonly ringColor: string;
  readonly innerDot: boolean;
}

const CATEGORY_COLOR_RAW: Record<string, string> = {
  "For developers": "#4F46E5",
  "Infrastructure & service providers": "#0EA5E9",
  "Blockchain tools": "#10B981",
  Bridges: "#F59E0B",
  Validators: "#14B8A6",
  Entertainment: "#EC4899",
  "Blockchain information": "#8B5CF6",
  Wallets: "#22C55E",
  "Markets - CEX": "#F97316",
  "Markets - DEX": "#06B6D4",
  Applications: "#EF4444",
};

const FALLBACK_CATEGORY_COLOR: string = "#334155";

const lighten = (hex: string, factor: number): string => {
  const base = rgb(hex);
  const { r, g, b } = base.brighter(factor);
  return rgb(r, g, b).formatHex();
};

const luminance = (hex: string): number => {
  const { r, g, b } = rgb(hex);
  const normalize = (value: number): number => {
    const channel = value / 255;
    if (channel <= 0.03928) {
      return channel / 12.92;
    }
    return ((channel + 0.055) / 1.055) ** 2.4;
  };
  const rLin = normalize(r);
  const gLin = normalize(g);
  const bLin = normalize(b);
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
};

const textColorForBackground = (background: string): string => {
  const lum = luminance(background);
  return lum < 0.5 ? "#F8FAFC" : "#111827";
};

const toId = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const CATEGORY_PALETTE_LOOKUP: Record<string, CategoryPalette> = Object.entries(
  CATEGORY_COLOR_RAW,
).reduce<Record<string, CategoryPalette>>((accumulator, [title, color]) => {
  const id = toId(title);
  const fill = color ?? FALLBACK_CATEGORY_COLOR;
  const palette: CategoryPalette = {
    title,
    id,
    color: fill,
    hoverColor: lighten(fill, 0.45),
    voronoiFillLight: lighten(fill, 1.4) + "1A", // ~0.1 alpha fallback
    voronoiFillDark: lighten(fill, 1.6) + "18",
    textColor: textColorForBackground(fill),
  };
  return {
    ...accumulator,
    [title]: palette,
  };
}, {});

export const INDICATOR_VISUALS: Record<ProjectIndicator, IndicatorVisual> = {
  onchain: {
    ringStyle: "solid",
    ringColor: "#16A34A",
    innerDot: false,
  },
  hybrid: {
    ringStyle: "segmented",
    ringColor: "#EAB308",
    innerDot: false,
  },
  support: {
    ringStyle: "dashed",
    ringColor: "#6B7280",
    innerDot: false,
  },
};

export const PROJECT_MIN_DIAMETER: number = 48;
export const PROJECT_MAX_DIAMETER: number = 96;
export const PROJECT_BASE_CONSTANT: number = 8;
export const PROJECT_GROWTH_FACTOR: number = 6;

export const MIN_TAP_TARGET: number = 44;

export const ZOOM_MIN: number = 0.8;
export const ZOOM_MAX: number = 2.0;

export const DRAG_SPRING_STRENGTH: number = 0.18;

export const SIMULATION_FREEZE_DELAY_MS: number = 1500;

export const CLUSTER_NEIGHBOR_COUNT: number = 3;
export const CLUSTER_LINK_STRENGTH: number = 0.38;
export const CLUSTER_LINK_DISTANCE: number = 140;
export const CROSS_CATEGORY_CHARGE: number = -22;
