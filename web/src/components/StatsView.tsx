'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ApiError, getStats, type Stats } from '@/lib/api';
import { QR } from './QR';

const weekday = (iso: string) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en', { weekday: 'short', timeZone: 'UTC' });

function TopList({ title, rows }: { title: string; rows: { name: string; clicks: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.clicks));
  return (
    <div className="card">
      <h2 className="h2">{title}</h2>
      {rows.length === 0 ? (
        <p className="hint">No clicks yet.</p>
      ) : (
        <ul className="bars">
          {rows.map((r) => (
            <li key={r.name}>
              <span>{r.name}</span>
              <span className="track"><span className="fill" style={{ width: `${(r.clicks / max) * 100}%` }} /></span>
              <b>{r.clicks}</b>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function StatsView({ slug }: { slug: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  // Load once, then refresh every 5 seconds so new clicks show up.
  useEffect(() => {
    let alive = true;
    const load = () =>
      getStats(slug).then(
        (s) => alive && (setStats(s), setError('')),
        (e) => alive && setError(e instanceof ApiError ? e.message : 'Something went wrong.'),
      );
    load();
    const id = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [slug]);

  if (error && !stats) {
    return (
      <div className="card center">
        <h1 className="title small">Statistics unavailable</h1>
        <p className="lede">{error}</p>
        <Link href="/" className="btn primary">Back to home</Link>
      </div>
    );
  }
  if (!stats) return <p className="lede">Loading…</p>;

  const peak = Math.max(1, ...stats.days.map((d) => d.clicks));

  return (
    <>
      <Link href="/" className="back">← Back</Link>
      <h1 className="title small">{stats.slug}</h1>
      <p className="lede">
        <a href={stats.shortUrl}>{stats.shortUrl}</a> → <span className="dest-inline">{stats.url}</span>
      </p>

      <div className="summary">
        <div className="card stat"><p className="label">Total clicks</p><p className="big-num">{stats.clicks}</p></div>
        <div className="card stat"><p className="label">Created</p><p className="mid-num">{new Date(stats.createdAt).toLocaleDateString()}</p></div>
        <div className="card stat">
          <p className="label">Expires</p>
          <p className="mid-num">{stats.expiresAt ? new Date(stats.expiresAt).toLocaleDateString() : 'Never'}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="h2">Clicks, last 7 days</h2>
        <div className="chart" role="img" aria-label={`Clicks per day: ${stats.days.map((d) => `${weekday(d.date)} ${d.clicks}`).join(', ')}`}>
          {stats.days.map((d) => (
            <div key={d.date} className="col">
              <span className="val">{d.clicks}</span>
              <span className="bar" style={{ height: `${Math.max(2, (d.clicks / peak) * 100)}%` }} />
              <span className="day">{weekday(d.date)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="two">
        <TopList title="Browsers" rows={stats.browsers} />
        <TopList title="Referrers" rows={stats.referrers} />
      </div>

      <div className="two">
        <div className="card">
          <h2 className="h2">Latest clicks</h2>
          {stats.recent.length === 0 ? (
            <p className="hint">Open the short link and it will appear here.</p>
          ) : (
            <table>
              <thead><tr><th>Time</th><th>Browser</th><th>From</th></tr></thead>
              <tbody>
                {stats.recent.map((c, i) => (
                  <tr key={i}><td>{new Date(c.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td><td>{c.browser}</td><td>{c.referrer}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card">
          <h2 className="h2">QR code</h2>
          <QR text={stats.shortUrl} filename={`qr-${stats.slug}`} />
        </div>
      </div>
    </>
  );
}
