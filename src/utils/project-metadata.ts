import { ProjectLink } from '../data/projects';

type SearchableProject = Pick<ProjectLink, 'name' | 'url' | 'description' | 'categories'>;

const normalizeHostname = (url: string): string => {
  try {
    const parsed = new URL(url, 'https://terra-classic.io');
    return parsed.hostname.replace(/^www\./, '') || 'terra-classic.io';
  } catch {
    return 'terra-classic.io';
  }
};

export const matchesProjectSearch = (
  project: SearchableProject,
  searchQuery: string
): boolean => {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const searchText = `${project.name} ${project.description ?? ''} ${normalizeHostname(project.url)} ${(project.categories ?? []).join(' ')}`.toLowerCase();

  return searchText.includes(normalizedQuery);
};
