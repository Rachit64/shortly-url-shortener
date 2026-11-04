export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface CreatedLink {
  slug: string;
  shortUrl: string;
  url: string;
  expiresAt: string | null;
}

export interface Stats {
  slug: string;
  shortUrl: string;
  url: string;
  createdAt: string;
  expiresAt: string | null;
  clicks: number;
  days: { date: string; clicks: number }[];
  browsers: { name: string; clicks: number }[];
  referrers: { name: string; clicks: number }[];
  recent: { time: string; browser: string; referrer: string }[];
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API_URL + path, { cache: 'no-store', ...init });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the API running?');
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, body?.error ?? 'Something went wrong.');
  return body as T;
}

export const createLink = (input: { url: string; alias?: string; expiresInDays?: number }) =>
  request<CreatedLink>('/api/links', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });

export const getStats = (slug: string) => request<Stats>(`/api/links/${encodeURIComponent(slug)}/stats`);
