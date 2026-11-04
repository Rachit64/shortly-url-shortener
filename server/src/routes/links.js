import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { Click } from '../models/Click.js';
import { Link } from '../models/Link.js';
import { HttpError, parseUrl, randomSlug } from '../util.js';

const ALIAS = /^[a-z0-9][a-z0-9_-]{2,29}$/;
const RESERVED = new Set(['api', 'stats', 'health', 'link-not-found']);
const DAY = 86_400_000;

export function linksRouter(cfg) {
  const router = Router();
  const selfHosts = [cfg.baseUrl, cfg.webOrigin].map((u) => new URL(u).host);

  const createLimit = rateLimit({
    windowMs: 10 * 60_000,
    limit: 60,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV === 'test',
    handler: (_req, res) => res.status(429).json({ error: 'Too many links created. Try again in a few minutes.' }),
  });

  // Create a short link.  Body: { url, alias?, expiresInDays? }
  router.post('/links', createLimit, async (req, res) => {
    const { alias, expiresInDays } = req.body ?? {};
    const url = parseUrl(req.body?.url, selfHosts);

    let expiresAt = null;
    if (expiresInDays) {
      const days = Number(expiresInDays);
      if (!Number.isInteger(days) || days < 1 || days > 365) throw new HttpError(422, 'Expiry must be 1–365 days.');
      expiresAt = new Date(Date.now() + days * DAY);
    }

    let link;
    if (alias) {
      const slug = String(alias).trim().toLowerCase();
      if (!ALIAS.test(slug) || RESERVED.has(slug)) {
        throw new HttpError(422, 'Alias must be 3–30 letters, numbers, - or _ (and not a reserved word).');
      }
      try {
        link = await Link.create({ slug, url, expiresAt });
      } catch (err) {
        if (err.code === 11000) throw new HttpError(409, 'That alias is already taken.');
        throw err;
      }
    } else {
      // Random slug; on the rare collision (duplicate key) just try another.
      for (let i = 0; !link; i++) {
        if (i >= 8) throw new HttpError(503, 'Could not generate a free short code. Try again.');
        try {
          link = await Link.create({ slug: randomSlug(i < 4 ? 6 : 7), url, expiresAt });
        } catch (err) {
          if (err.code !== 11000) throw err;
        }
      }
    }
    res.status(201).json({ slug: link.slug, shortUrl: `${cfg.baseUrl}/${link.slug}`, url: link.url, expiresAt });
  });

  // Statistics for one link.
  router.get('/links/:slug/stats', async (req, res) => {
    const slug = req.params.slug.toLowerCase();
    const link = await Link.findOne({ slug }).lean();
    if (!link) throw new HttpError(404, 'No such link.');

    const start = new Date(Date.now() - 6 * DAY);
    start.setUTCHours(0, 0, 0, 0);
    const top = (field) => [
      { $match: { slug } },
      { $group: { _id: `$${field}`, n: { $sum: 1 } } },
      { $sort: { n: -1 } },
      { $limit: 5 },
    ];
    const [perDay, browsers, referrers, recent] = await Promise.all([
      Click.aggregate([
        { $match: { slug, ts: { $gte: start } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$ts' } }, n: { $sum: 1 } } },
      ]),
      Click.aggregate(top('browser')),
      Click.aggregate(top('referrer')),
      Click.find({ slug }).sort({ ts: -1 }).limit(10).lean(),
    ]);

    const counts = new Map(perDay.map((d) => [d._id, d.n]));
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start.getTime() + i * DAY).toISOString().slice(0, 10);
      return { date, clicks: counts.get(date) ?? 0 };
    });

    res.json({
      slug: link.slug,
      shortUrl: `${cfg.baseUrl}/${link.slug}`,
      url: link.url,
      createdAt: link.createdAt,
      expiresAt: link.expiresAt,
      clicks: link.clicks,
      days,
      browsers: browsers.map((b) => ({ name: b._id, clicks: b.n })),
      referrers: referrers.map((r) => ({ name: r._id || 'Direct', clicks: r.n })),
      recent: recent.map((c) => ({ time: c.ts, browser: c.browser, referrer: c.referrer || 'Direct' })),
    });
  });

  return router;
}
