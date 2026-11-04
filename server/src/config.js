const trimSlash = (s) => s.replace(/\/+$/, '');

export function loadConfig(env = process.env) {
  const webOrigin = trimSlash(env.WEB_ORIGIN || 'http://localhost:3000');
  return {
    port: Number(env.PORT) || 4000,
    mongoUri: env.MONGODB_URI || '', // empty = start a local dev database
    webOrigin, // where the Next.js app lives (CORS + "not found" redirects)
    baseUrl: trimSlash(env.BASE_URL || webOrigin), // short links look like <baseUrl>/<slug>
  };
}
