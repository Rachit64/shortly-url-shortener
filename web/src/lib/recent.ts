// The last few links created in this browser, kept in localStorage (no accounts needed).
export interface RecentLink {
  slug: string;
  shortUrl: string;
  url: string;
  at: number;
}

const KEY = 'shortener.recent';

export function loadRecent(): RecentLink[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveRecent(link: RecentLink): RecentLink[] {
  const next = [link, ...loadRecent().filter((l) => l.slug !== link.slug)].slice(0, 8);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage blocked: the list just won't persist */
  }
  return next;
}
