import { randomInt } from 'node:crypto';

// No 0/o/1/l/i so codes survive being read aloud.
const ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz';

export const randomSlug = (length = 6) =>
  Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Accepts "example.com/x" or a full http(s) URL. Returns the normalised URL string. */
export function parseUrl(input, selfHosts = []) {
  let raw = String(input ?? '').trim();
  if (!raw) throw new HttpError(422, 'Enter a link to shorten.');
  if (raw.length > 2048) throw new HttpError(422, 'That link is too long (max 2048 characters).');
  if (!/^[a-z][a-z0-9+.-]*:/i.test(raw)) raw = `https://${raw}`;
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new HttpError(422, 'That does not look like a valid link.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new HttpError(422, 'Only http and https links can be shortened.');
  }
  if (!url.hostname.includes('.')) throw new HttpError(422, 'The link needs a domain, like example.com.');
  if (selfHosts.includes(url.host)) throw new HttpError(422, 'That link already points to this service.');
  return url.href;
}

export function browserOf(ua = '') {
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\/|Opera/.test(ua)) return 'Opera';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua)) return 'Safari';
  return 'Other';
}

// Link previews and crawlers should be redirected but not counted as visitors.
export const isBot = (ua = '') => !ua || /bot|crawl|spider|preview|curl|wget|python|headless/i.test(ua);

export function refererHost(referer = '') {
  try {
    return new URL(referer).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}
