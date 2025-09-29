import React from "react";
import type { LucideIcon } from "lucide-react";
import {
  Wallet,
  BarChart2,
  Shuffle,
  Globe,
  Code,
  Server,
  Rocket,
  Users,
  CircleDollarSign,
  Gamepad2,
  Newspaper,
  ShieldCheck,
  Link2,
} from "lucide-react";

export type ProjectIconDescriptor = {
  readonly name?: string;
  readonly description?: string;
  readonly categoryTitle?: string;
};

const iconComponentMap: Record<string, LucideIcon> = {
  wallet: Wallet,
  exchange: Shuffle,
  dex: Shuffle,
  analytics: BarChart2,
  explorer: BarChart2,
  game: Gamepad2,
  metaverse: Gamepad2,
  endpoint: Server,
  rpc: Server,
  code: Code,
  repository: Code,
  bridge: Link2,
  news: Newspaper,
  website: Globe,
  validator: ShieldCheck,
  nodes: ShieldCheck,
  community: Users,
  chat: Users,
  lending: CircleDollarSign,
  defi: CircleDollarSign,
  platform: CircleDollarSign,
  finder: BarChart2,
  analyticsAlt: BarChart2,
  swap: Shuffle,
  trade: Shuffle,
  default: Rocket,
};

const iconGradientMap: Record<string, string> = {
  wallet: "linear-gradient(135deg, #0ea5e9, #2563eb, #6366f1)",
  exchange: "linear-gradient(135deg, #a855f7, #d946ef, #ec4899)",
  dex: "linear-gradient(135deg, #10b981, #14b8a6, #0d9488)",
  analytics: "linear-gradient(135deg, #6366f1, #7c3aed, #2563eb)",
  explorer: "linear-gradient(135deg, #6366f1, #7c3aed, #2563eb)",
  game: "linear-gradient(135deg, #f43f5e, #ec4899, #fb923c)",
  metaverse: "linear-gradient(135deg, #f43f5e, #ec4899, #fb923c)",
  endpoint: "linear-gradient(135deg, #64748b, #475569, #334155)",
  rpc: "linear-gradient(135deg, #64748b, #475569, #334155)",
  code: "linear-gradient(135deg, #71717a, #4b5563, #1f2937)",
  repository: "linear-gradient(135deg, #71717a, #4b5563, #1f2937)",
  bridge: "linear-gradient(135deg, #f59e0b, #f97316, #fbbf24)",
  news: "linear-gradient(135deg, #3b82f6, #0ea5e9, #06b6d4)",
  website: "linear-gradient(135deg, #3b82f6, #0ea5e9, #06b6d4)",
  validator: "linear-gradient(135deg, #059669, #10b981, #14b8a6)",
  nodes: "linear-gradient(135deg, #059669, #10b981, #14b8a6)",
  community: "linear-gradient(135deg, #d946ef, #a855f7, #7c3aed)",
  chat: "linear-gradient(135deg, #d946ef, #a855f7, #7c3aed)",
  lending: "linear-gradient(135deg, #f59e0b, #fbbf24, #fde047)",
  defi: "linear-gradient(135deg, #f59e0b, #fbbf24, #fde047)",
  platform: "linear-gradient(135deg, #f59e0b, #fbbf24, #fde047)",
  finder: "linear-gradient(135deg, #6366f1, #7c3aed, #3b82f6)",
  analyticsAlt: "linear-gradient(135deg, #6366f1, #7c3aed, #3b82f6)",
  swap: "linear-gradient(135deg, #0ea5e9, #14b8a6, #10b981)",
  trade: "linear-gradient(135deg, #0ea5e9, #14b8a6, #10b981)",
  default: "linear-gradient(135deg, #64748b, #475569, #1f2937)",
};

export const determineProjectIconKey = (descriptor: ProjectIconDescriptor): string => {
  const { name, description, categoryTitle } = descriptor;
  const lowerName: string = name?.toLowerCase() ?? "";
  const lowerDescription: string = description?.toLowerCase() ?? "";
  const lowerCategory: string = categoryTitle?.toLowerCase() ?? "";
  const knownKeys: readonly string[] = Object.keys(iconComponentMap);

  for (const key of knownKeys) {
    if (key === "default") {
      continue;
    }
    if (lowerName.includes(key) || lowerDescription.includes(key) || lowerCategory.includes(key)) {
      return key;
    }
  }
  return "default";
};

export const getProjectIconGradient = (iconKey: string): string => iconGradientMap[iconKey] ?? iconGradientMap.default;

export const renderProjectIcon = (
  iconKey: string,
  options?: {
    readonly size?: number;
    readonly className?: string;
    readonly strokeWidth?: number;
    readonly color?: string;
  },
): React.ReactNode => {
  const IconComponent = iconComponentMap[iconKey] ?? iconComponentMap.default;
  const size: number = options?.size ?? 18;
  const strokeWidth: number = options?.strokeWidth ?? 1.8;
  return (
    <IconComponent
      size={size}
      strokeWidth={strokeWidth}
      className={options?.className}
      color={options?.color}
    />
  );
};
