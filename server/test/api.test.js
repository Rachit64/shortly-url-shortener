import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';
import { connect, disconnect } from '../src/db.js';
import { Click } from '../src/models/Click.js';
import { Link } from '../src/models/Link.js';
import { browserOf, isBot, parseUrl } from '../src/util.js';

process.env.NODE_ENV = 'test';
const SAFARI = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
const cfg = loadConfig({ BASE_URL: 'http://short.test', WEB_ORIGIN: 'http://web.test' });

let server;
let origin;
before(async () => {
  await connect('', { persist: false });
  server = createApp(cfg).listen(0);
  await new Promise((r) => server.once('listening', r));
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  server.closeAllConnections();
  server.close();
  await disconnect();
});

const call = (method, path, body, headers = {}) =>
  fetch(origin + path, {
    method,
    redirect: 'manual',
    headers: { 'user-agent': SAFARI, ...(body ? { 'content-type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
const create = async (body) => {
  const res = await call('POST', '/api/links', body);
  return { status: res.status, json: await res.json() };
};

describe('helpers', () => {
  test('parseUrl accepts good links and rejects bad ones', () => {
    assert.equal(parseUrl('example.com/a?b=1'), 'https://example.com/a?b=1');
    for (const bad of ['', 'ftp://example.com', 'javascript:alert(1)', 'http://localhost', 'not a url', 'http://short.test/x']) {
      assert.throws(() => parseUrl(bad, ['short.test']), { status: 422 }, bad);
    }
  });
  test('browser and bot detection', () => {
    assert.equal(browserOf(SAFARI), 'Safari');
    assert.equal(isBot('Slackbot-LinkExpanding 1.0'), true);
    assert.equal(isBot(SAFARI), false);
  });
});

describe('API', () => {
  test('creates a short link with a random slug', async () => {
    const { status, json } = await create({ url: 'https://example.com/long/path' });
    assert.equal(status, 201);
    assert.match(json.slug, /^[2-9a-hjkmnp-z]{6}$/);
    assert.equal(json.shortUrl, `http://short.test/${json.slug}`);
  });

  test('custom alias works once, then conflicts', async () => {
    assert.equal((await create({ url: 'https://example.com', alias: 'My-Launch' })).json.slug, 'my-launch');
    assert.equal((await create({ url: 'https://example.com', alias: 'my-launch' })).status, 409);
    assert.equal((await create({ url: 'https://example.com', alias: 'api' })).status, 422);
    assert.equal((await create({ url: 'https://example.com', alias: 'x' })).status, 422);
  });

  test('rejects an invalid url', async () => {
    const { status, json } = await create({ url: 'javascript:alert(1)' });
    assert.equal(status, 422);
    assert.ok(json.error);
  });

  test('redirect sends the visitor on and counts the click', async () => {
    const { json } = await create({ url: 'https://example.com/target' });
    const res = await call('GET', `/${json.slug}`, null, { referer: 'https://news.ycombinator.com/item?id=1' });
    assert.equal(res.status, 302);
    assert.equal(res.headers.get('location'), 'https://example.com/target');

    await call('GET', `/${json.slug}`, null, { 'user-agent': 'Slackbot-LinkExpanding 1.0' }); // bot: redirected, not counted
    const stats = await (await call('GET', `/api/links/${json.slug}/stats`)).json();
    assert.equal(stats.clicks, 1);
    assert.deepEqual(stats.browsers, [{ name: 'Safari', clicks: 1 }]);
    assert.deepEqual(stats.referrers, [{ name: 'news.ycombinator.com', clicks: 1 }]);
    assert.equal(stats.days.length, 7);
    assert.equal(stats.days.at(-1).clicks, 1);
    assert.equal(stats.recent.length, 1);
  });

  test('unknown and expired links go to the not-found page', async () => {
    assert.equal((await call('GET', '/nope-nope')).headers.get('location'), 'http://web.test/link-not-found');
    const { json } = await create({ url: 'https://example.com', expiresInDays: 1 });
    await Link.updateOne({ slug: json.slug }, { expiresAt: new Date(Date.now() - 1000) });
    assert.equal((await call('GET', `/${json.slug}`)).headers.get('location'), 'http://web.test/link-not-found');
    assert.equal(await Click.countDocuments({ slug: json.slug }), 0);
  });

  test('stats for a missing link is a 404', async () => {
    assert.equal((await call('GET', '/api/links/missing/stats')).status, 404);
  });
});
