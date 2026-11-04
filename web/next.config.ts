import type { NextConfig } from 'next';

// Short links look like <this site>/<slug>. Any path that is not a page of this app
// falls through to the API, which answers with the redirect.
const API = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const config: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return { beforeFiles: [], afterFiles: [], fallback: [{ source: '/:slug', destination: `${API}/:slug` }] };
  },
};

export default config;
