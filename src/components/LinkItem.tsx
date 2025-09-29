import React from 'react';
import {
  Wallet, BarChart2, Shuffle, Code,
  Server, Rocket, Users, CircleDollarSign, Gamepad2, Newspaper,
  ShieldCheck,
  Link2
} from 'lucide-react';
import { ProjectIndicator } from '../data/projects';

type LinkItemProps = {
  readonly name: string;
  readonly url: string;
  readonly description?: string;
  readonly indicator: ProjectIndicator;
  readonly logo?: string;
};

const iconSize: number = 18;

const iconRenderer: Record<string, React.ReactNode> = {
  wallet: <Wallet size={iconSize} />,
  exchange: <Shuffle size={iconSize} />,
  dex: <Shuffle size={iconSize} />,
  analytics: <BarChart2 size={iconSize} />,
  explorer: <BarChart2 size={iconSize} />,
  game: <Gamepad2 size={iconSize} />,
  metaverse: <Gamepad2 size={iconSize} />,
  endpoint: <Server size={iconSize} />,
  rpc: <Server size={iconSize} />,
  code: <Code size={iconSize} />,
  repository: <Code size={iconSize} />,
  bridge: <Link2 size={iconSize} />,
  news: <Newspaper size={iconSize} />,
  website: <Newspaper size={iconSize} />,
  validator: <ShieldCheck size={iconSize} />,
  nodes: <ShieldCheck size={iconSize} />,
  community: <Users size={iconSize} />,
  chat: <Users size={iconSize} />,
  lending: <CircleDollarSign size={iconSize} />,
  defi: <CircleDollarSign size={iconSize} />,
  platform: <CircleDollarSign size={iconSize} />,
  finder: <BarChart2 size={iconSize} />,
  analyticsAlt: <BarChart2 size={iconSize} />,
  swap: <Shuffle size={iconSize} />,
  trade: <Shuffle size={iconSize} />,
  default: <Rocket size={iconSize} />,
};

const iconBackgroundClassnameMap: Record<string, string> = {
  wallet: 'from-sky-500 via-blue-600 to-indigo-500',
  exchange: 'from-purple-500 via-fuchsia-500 to-pink-500',
  dex: 'from-emerald-500 via-teal-500 to-green-500',
  analytics: 'from-indigo-500 via-violet-500 to-blue-500',
  explorer: 'from-indigo-500 via-violet-500 to-blue-500',
  game: 'from-rose-500 via-pink-500 to-orange-400',
  metaverse: 'from-rose-500 via-pink-500 to-orange-400',
  endpoint: 'from-slate-500 via-zinc-500 to-slate-600',
  rpc: 'from-slate-500 via-zinc-500 to-slate-600',
  code: 'from-zinc-500 via-slate-500 to-slate-600',
  repository: 'from-zinc-500 via-slate-500 to-slate-600',
  bridge: 'from-amber-500 via-orange-500 to-yellow-500',
  news: 'from-blue-500 via-sky-500 to-cyan-500',
  website: 'from-blue-500 via-sky-500 to-cyan-500',
  validator: 'from-emerald-600 via-green-500 to-teal-500',
  nodes: 'from-emerald-600 via-green-500 to-teal-500',
  community: 'from-fuchsia-500 via-violet-500 to-purple-500',
  chat: 'from-fuchsia-500 via-violet-500 to-purple-500',
  lending: 'from-amber-500 via-amber-400 to-yellow-400',
  defi: 'from-amber-500 via-amber-400 to-yellow-400',
  platform: 'from-amber-500 via-amber-400 to-yellow-400',
  finder: 'from-indigo-500 via-violet-500 to-blue-500',
  analyticsAlt: 'from-indigo-500 via-violet-500 to-blue-500',
  swap: 'from-emerald-500 via-teal-500 to-green-500',
  trade: 'from-emerald-500 via-teal-500 to-green-500',
  default: 'from-slate-500 via-slate-400 to-slate-600',
};

const determineIconKey = (description?: string, name?: string): string => {
  if (!description && !name) {
    return 'default';
  }

  const descriptionLower: string = description?.toLowerCase() ?? '';
  const nameLower: string = name?.toLowerCase() ?? '';
  const knownKeys: string[] = Object.keys(iconRenderer);

  const matchedKey: string | undefined = knownKeys.find((key) => {
    if (key === 'default') {
      return false;
    }
    return descriptionLower.includes(key) || nameLower.includes(key);
  });

  return matchedKey ?? 'default';
};

const indicatorMeta: Record<ProjectIndicator, { readonly label: string; readonly badgeClass: string; readonly barClass: string }> = {
  onchain: {
    label: 'On-chain native',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300',
    barClass: 'from-emerald-400 via-emerald-500 to-teal-500',
  },
  hybrid: {
    label: 'Hybrid integration',
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300',
    barClass: 'from-purple-400 via-fuchsia-500 to-sky-500',
  },
  support: {
    label: 'Terra Classic supported',
    badgeClass: 'bg-sky-500/10 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300',
    barClass: 'from-sky-400 via-blue-500 to-indigo-500',
  },
};

function normalizeLogoPath(rawLogo?: string): string | undefined {
  if (!rawLogo) {
    return undefined;
  }

  if (rawLogo.startsWith('http://') || rawLogo.startsWith('https://')) {
    return rawLogo;
  }

  return rawLogo.startsWith('/') ? rawLogo : `/${rawLogo}`;
}

function LinkItem({ name, url, description, indicator, logo }: LinkItemProps): JSX.Element {
  const iconKey: string = determineIconKey(description, name);
  const iconBackgroundClassname: string = iconBackgroundClassnameMap[iconKey] ?? iconBackgroundClassnameMap.default;
  const indicatorStyle = indicatorMeta[indicator];
  const resolvedLogo: string | undefined = normalizeLogoPath(logo);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/30 bg-white/80 px-3 py-3 text-xs shadow-[0_14px_32px_-24px_rgba(15,23,42,0.55)] backdrop-blur-lg transition hover:-translate-y-1 hover:shadow-[0_22px_48px_-28px_rgba(14,116,144,0.55)] dark:border-white/10 dark:bg-slate-900/70 sm:px-4"
    >
      <div className="flex items-center gap-3">
        <div className={`relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${resolvedLogo ? 'bg-transparent' : iconBackgroundClassname} text-white shadow-lg shadow-slate-900/25 transition group-hover:scale-105`}>
          {resolvedLogo ? (
            <img src={resolvedLogo} alt={name} loading="lazy" className="h-full w-full object-contain" />
          ) : (
            iconRenderer[iconKey] ?? iconRenderer.default
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight text-slate-900 transition group-hover:text-slate-700 dark:text-white dark:group-hover:text-slate-100 sm:text-base">
            {name}
          </span>
          {description && (
            <span className="text-[9px] uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500 sm:text-[10px] sm:tracking-[0.38em]">
              {description}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2 text-[9px] uppercase tracking-[0.24em] text-slate-500 transition group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-300 sm:flex-row sm:items-center sm:justify-between sm:text-[10px] sm:tracking-[0.28em]">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-semibold ${indicatorStyle.badgeClass} sm:gap-2 sm:px-3 sm:text-[10px]`}>
          <span className={`h-[2px] w-5 rounded-full bg-gradient-to-r ${indicatorStyle.barClass} opacity-80 sm:w-6`} />
          {indicatorStyle.label}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/50 px-2.5 py-0.5 text-[9px] font-semibold tracking-[0.26em] text-sky-600 transition group-hover:translate-x-0.5 group-hover:bg-white/70 dark:bg-white/10 dark:text-sky-400 sm:px-3 sm:text-[10px] sm:tracking-[0.3em]">
          Launch
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-transparent bg-gradient-to-br from-slate-100/45 via-transparent to-sky-100/30 opacity-0 transition group-hover:border-sky-400/40 group-hover:opacity-100 dark:from-sky-500/10 dark:to-transparent" />
    </a>
  );
}

export default LinkItem;
