import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { connect, disconnect } from './db.js';

const config = loadConfig();
await connect(config.mongoUri);

const server = createApp(config).listen(config.port, () => {
  console.log(`[api] http://localhost:${config.port}   short links: ${config.baseUrl}/<slug>`);
});

async function shutdown() {
  server.closeAllConnections();
  server.close();
  await disconnect().catch(() => {});
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
