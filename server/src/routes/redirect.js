import { Router } from 'express';
import { Click } from '../models/Click.js';
import { Link } from '../models/Link.js';
import { browserOf, isBot, refererHost } from '../util.js';

const SLUG = /^[a-z0-9][a-z0-9_-]{2,29}$/;

export function redirectRouter(cfg) {
  const router = Router();

  // GET /:slug  ->  302 to the original URL, recording the visit.
  router.get('/:slug', async (req, res) => {
    const slug = req.params.slug.toLowerCase();
    if (!SLUG.test(slug)) return res.status(404).type('text/plain').send('Not found');

    const link = await Link.findOne({ slug });
    const expired = link?.expiresAt && link.expiresAt <= new Date();
    if (!link || expired) return res.redirect(302, `${cfg.webOrigin}/link-not-found`);

    const ua = req.get('user-agent') ?? '';
    if (req.method === 'GET' && !isBot(ua)) {
      await Promise.all([
        Link.updateOne({ _id: link._id }, { $inc: { clicks: 1 } }),
        Click.create({ slug, browser: browserOf(ua), referrer: refererHost(req.get('referer')) }),
      ]);
    }
    res.set('Cache-Control', 'no-store'); // never let a browser cache the redirect, or clicks go uncounted
    res.redirect(302, link.url);
  });

  return router;
}
