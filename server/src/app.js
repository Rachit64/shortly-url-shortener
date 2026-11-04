import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { linksRouter } from './routes/links.js';
import { redirectRouter } from './routes/redirect.js';

export function createApp(cfg) {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  app.use('/api', cors({ origin: cfg.webOrigin }), express.json({ limit: '8kb' }), linksRouter(cfg));
  app.use(redirectRouter(cfg));

  // Errors thrown anywhere above end up here (Express 5 forwards async errors automatically).
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    if (err.status) return res.status(err.status).json({ error: err.message });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Request body was not valid JSON.' });
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  });
  return app;
}
