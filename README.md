# Shortly — URL Shortener

A full-stack URL shortener built with Next.js, React, TypeScript, Express, and MongoDB. Create short links, share QR codes, and view click statistics without creating an account.

## Features

- Generate short links with optional custom aliases and expiry dates.
- Copy links and download QR codes.
- Track total clicks, daily activity over the last seven days, browsers, referrers, and recent visits.
- Filter recognized bots and link previews out of click counts.
- Keep recent links in the browser's local storage.
- Adjust text size, contrast, and font through the accessibility menu.
- Validate URLs and rate-limit link creation.

## Requirements

- A recent Node.js version; Node.js 24 or newer is recommended.
- npm.
- Internet access for dependency installation and the automatic MongoDB binary download on first use.
- Docker is optional if you prefer to run MongoDB through Docker Compose.

## Quick Start

From the project root:

```bash
npm run install:all
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The Express API runs at [http://localhost:4000](http://localhost:4000).

No environment files or separate database installation are needed for the default development setup. Without `MONGODB_URI`, the API starts a local MongoDB process and persists data in `server/.data/mongo/`. The MongoDB binary is downloaded on first use. Press `Ctrl+C` to stop both applications.

## Configuration

Copy the example files if you need to change the defaults:

```bash
cp server/.env.example server/.env
cp web/.env.example web/.env.local
```

### API Environment Variables

Set these in `server/.env`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Empty | MongoDB connection string; an empty value starts the local development database. |
| `PORT` | `4000` | Express API port. |
| `WEB_ORIGIN` | `http://localhost:3000` | Frontend origin for CORS and missing-link redirects. |
| `BASE_URL` | Value of `WEB_ORIGIN` | Public base URL used to generate short links. |

### Frontend Environment Variables

Set these in `web/.env.local`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | API URL reachable by the browser. |
| `API_URL` | `NEXT_PUBLIC_API_URL`, then `http://localhost:4000` | API URL used by the Next.js short-link rewrite. |

Set frontend URLs before building because public environment variables and rewrites are resolved during the build.

### MongoDB with Docker

```bash
docker compose up -d
```

Then set this in `server/.env` and restart the application:

```dotenv
MONGODB_URI=mongodb://127.0.0.1:27017/terse
```

Docker Compose stores database data in the `mongo-data` volume. Stop MongoDB with `docker compose down`.

## Commands

Run these from the project root:

| Command | Purpose |
| --- | --- |
| `npm run install:all` | Install API and frontend dependencies. |
| `npm run dev` | Start both applications with development reload. |
| `npm test` | Run API tests using an isolated temporary MongoDB instance. |
| `npm --prefix web run typecheck` | Check frontend TypeScript types. |
| `npm run build` | Build the Next.js frontend. |
| `npm start` | Start both applications after building. |

For a deployment, configure a persistent MongoDB connection and the public frontend/API URLs before building. The automatic MongoDB fallback is intended for development and depends on the server's development dependencies.

## API Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/links` | Create a link with `url`, optional `alias`, and optional `expiresInDays`. |
| `GET` | `/api/links/:slug/stats` | Retrieve link details and click statistics. |
| `GET` | `/:slug` | Redirect to the destination and record eligible visits. |

Example:

```bash
curl -X POST http://localhost:4000/api/links -H 'Content-Type: application/json' -d '{"url":"https://example.com/article","alias":"my-article","expiresInDays":7}'
```

Custom aliases use 3–30 lowercase letters, numbers, hyphens, or underscores and must start with a letter or number. Submitted aliases are normalized to lowercase. Reserved routes cannot be used. The API accepts expiry periods from 1 to 365 days; the UI offers common presets.

## Project Structure

```text
.
├── docker-compose.yml       # Optional MongoDB service
├── package.json             # Commands for both applications
├── scripts/dev.mjs          # Starts and stops the API and frontend together
├── server/
│   ├── .env.example         # API configuration template
│   ├── src/
│   │   ├── models/          # Link and click schemas
│   │   ├── routes/          # Link creation, statistics, and redirects
│   │   ├── app.js           # Express application and middleware
│   │   ├── config.js        # API configuration
│   │   ├── db.js            # MongoDB connection and local fallback
│   │   └── index.js         # API entry point
│   └── test/                # API and helper tests
└── web/
    ├── .env.example         # Frontend configuration template
    └── src/
        ├── app/            # Next.js pages and global styles
        ├── components/     # Shortener, statistics, QR, and accessibility UI
        └── lib/            # API client and recent-link storage
```

The browser loads the Next.js frontend and calls the Express API for link creation and statistics. Next.js forwards short-link paths to Express, which looks up the destination in MongoDB and issues a redirect.

Dependency lockfiles and environment examples are included in version control. Local environment files, dependencies, database contents, logs, and generated build output are excluded by `.gitignore`.
