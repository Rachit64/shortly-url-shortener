'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ApiError, createLink, getStats, type CreatedLink } from '@/lib/api';
import { loadRecent, saveRecent, type RecentLink } from '@/lib/recent';
import { QR } from './QR';

export function Shortener() {
  const [url, setUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [days, setDays] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CreatedLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [recent, setRecent] = useState<RecentLink[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => setRecent(loadRecent()), []);

  // Click totals for the recent list come from the stats endpoint.
  useEffect(() => {
    recent.forEach((l) =>
      getStats(l.slug).then(
        (s) => setCounts((c) => ({ ...c, [l.slug]: s.clicks })),
        () => {},
      ),
    );
  }, [recent]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setCopied(false);
    try {
      const link = await createLink({
        url,
        alias: alias.trim() || undefined,
        expiresInDays: days ? Number(days) : undefined,
      });
      setResult(link);
      setRecent(saveRecent({ slug: link.slug, shortUrl: link.shortUrl, url: link.url, at: Date.now() }));
    } catch (err) {
      setResult(null);
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(result!.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <>
      <form className="card" onSubmit={submit}>
        <label htmlFor="url">Long link</label>
        <input
          id="url"
          className="input big"
          placeholder="https://example.com/a/very/long/link"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />

        <div className="row">
          <div>
            <label htmlFor="alias">Custom alias <span className="hint">(optional)</span></label>
            <input id="alias" className="input" placeholder="my-link" value={alias} maxLength={30} onChange={(e) => setAlias(e.target.value)} spellCheck={false} />
          </div>
          <div>
            <label htmlFor="days">Expires</label>
            <select id="days" className="input" value={days} onChange={(e) => setDays(e.target.value)}>
              <option value="">Never</option>
              <option value="1">After 1 day</option>
              <option value="7">After 7 days</option>
              <option value="30">After 30 days</option>
            </select>
          </div>
        </div>

        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary" disabled={busy || !url.trim()}>{busy ? 'Shortening…' : 'Shorten'}</button>
      </form>

      {result && (
        <section className="card result" aria-label="Your short link" aria-live="polite">
          <div className="result-main">
            <p className="label">Your short link</p>
            <p className="short">{result.shortUrl}</p>
            <div className="actions">
              <button type="button" className="btn primary" onClick={copy}>{copied ? 'Copied ✓' : 'Copy'}</button>
              <Link href={`/stats/${result.slug}`} className="btn">View stats</Link>
            </div>
            {result.expiresAt && <p className="hint">Expires {new Date(result.expiresAt).toLocaleDateString()}</p>}
          </div>
          <QR text={result.shortUrl} filename={`qr-${result.slug}`} />
        </section>
      )}

      {recent.length > 0 && (
        <section aria-label="Recent links">
          <h2 className="h2">Recent links</h2>
          <ul className="list">
            {recent.map((l) => (
              <li key={l.slug}>
                <div className="grow">
                  <Link href={`/stats/${l.slug}`} className="slug">{l.slug}</Link>
                  <span className="dest" title={l.url}>{l.url}</span>
                </div>
                <span className="count">{counts[l.slug] ?? '–'} <small>clicks</small></span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
