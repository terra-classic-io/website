
import { ProjectLink } from '../data/projects';

export type DerivedProjectMetadata = {
  readonly featured: boolean;
  readonly official: boolean;
  readonly platformLabel: 'Docs' | 'Mobile' | 'API' | 'Web';
  readonly hostnameLabel: string;
  readonly searchText: string;
};

const FEATURED_PROJECTS = new Set<string>([
  'Documentation',
  'Terra Station',
  'Galaxy Station',
  'Terraport',
  'Terraswap',
  'Validator.Info',
  'LUNC Metrics',
  'LuncScan',
  'Coinhall',
  'Osmosis',
  'Juris Protocol',
  'Keplr',
]);

const OFFICIAL_PROJECTS = new Set<string>([
  'Documentation',
  'Terra Station',
  'GitHub',
  'Common.xyz',
]);

const normalizeHostname = (url: string): string => {
  try {
    const parsed = new URL(url, 'https://terra-classic.io');
    return parsed.hostname.replace(/^www\./, '') || 'terra-classic.io';
  } catch {
    return 'terra-classic.io';
  }
};

export const deriveProjectMetadata = (
  project: Pick<ProjectLink, 'name' | 'url' | 'description' | 'categories'>
): DerivedProjectMetadata => {
  const haystack = `${project.name} ${project.description ?? ''} ${(project.categories ?? []).join(' ')}`.toLowerCase();
  const isMobile =
    haystack.includes('mobile') ||
    haystack.includes('play.google.com') ||
    project.url.includes('play.google.com');
  const isDocs = haystack.includes('documentation') || project.url.startsWith('/docs');
  const isApi =
    haystack.includes('endpoint') ||
    haystack.includes('api') ||
    haystack.includes('rpc') ||
    haystack.includes('grpc') ||
    haystack.includes('lcd');

  const platformLabel: DerivedProjectMetadata['platformLabel'] = isDocs
    ? 'Docs'
    : isMobile
      ? 'Mobile'
      : isApi
        ? 'API'
        : 'Web';

  return {
    featured: FEATURED_PROJECTS.has(project.name),
    official: OFFICIAL_PROJECTS.has(project.name) || haystack.includes('official'),
    platformLabel,
    hostnameLabel: normalizeHostname(project.url),
    searchText: `${project.name} ${project.description ?? ''} ${normalizeHostname(project.url)} ${(project.categories ?? []).join(' ')}`.toLowerCase(),
  };
};

export const matchesProjectSearch = (
  project: Pick<ProjectLink, 'name' | 'url' | 'description' | 'categories'>,
  searchQuery: string
): boolean => {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const metadata = deriveProjectMetadata(project);
  return metadata.searchText.includes(normalizedQuery);
};
