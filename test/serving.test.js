'use strict';

/**
 * The cache policy and the deploy stamp, for the site the incident happened on.
 *
 * 2026-09-05: a menu fix here was correct, deployed, and verified in a real
 * browser — and still broken for the person looking at it. The edge was serving
 * August's stylesheet: cf-cache-status HIT, age 1332, last-modified Mon 17 Aug.
 *
 * tools/stamp-assets.mjs answered that by putting a content hash in the asset
 * URLs. That is the real fix and it was only half of one: the origin sent NO
 * cache headers at all, so the PAGE carrying the new URL could itself be served
 * from cache — handing out the old ?v= and defeating the stamping silently.
 * nginx.conf now makes HTML no-cache, which is the half that was missing.
 *
 * Run: node --test test/*.test.js
 */

const { test }         = require('node:test');
const assert           = require('node:assert');
const fs               = require('node:fs');
const path             = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const pub  = path.join(root, 'public');
const conf = fs.readFileSync(path.join(root, 'nginx.conf'), 'utf8');
const df   = fs.readFileSync(path.join(root, 'Dockerfile'), 'utf8');

const block = (marker) => {
  const at = conf.indexOf(marker);
  assert.ok(at > 0, `nginx.conf has no ${marker}`);
  return conf.slice(at, conf.indexOf('}', at));
};

const pages = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith('.html')) pages.push(full);
  }
})(pub);

test('there are pages to check — otherwise everything below passes vacuously', () => {
  assert.ok(pages.length >= 3, `found ${pages.length} pages`);
});

test('the stamper reports every page current', () => {
  const out = execFileSync(process.execPath, [path.join(root, 'tools', 'stamp-assets.mjs'), '--check'],
    { cwd: root, encoding: 'utf8' });
  assert.match(out, /Asset stamps are current/);
});

/**
 * The half that was missing. A stamped URL is no help if the page carrying it
 * is itself served from cache — the visitor gets last week's page linking last
 * week's ?v=, and the stamping does nothing at all.
 */
test('HTML is never cached, so a new ?v= actually reaches the browser', () => {
  assert.match(block('location ~* \\.html$'), /Cache-Control "no-cache"/);
  assert.match(block('location = /'), /Cache-Control "no-cache"/,
    'the bare root is a page too, and it is the one most people land on');
});

test('every local CSS and JS link on every page carries a content stamp', () => {
  const unstamped = [];
  for (const page of pages) {
    const html = fs.readFileSync(page, 'utf8');
    for (const m of html.matchAll(/(?:href|src)="([^"]+\.(?:css|js))(\?v=[0-9a-f]+)?"/g)) {
      const [, url, stamp] = m;
      if (/^https?:\/\//.test(url)) continue;   // a CDN's URL is its own problem
      if (!stamp) unstamped.push(`${path.relative(root, page)} → ${url}`);
    }
  }
  assert.deepEqual(unstamped, [],
    'these link an unversioned asset — run `npm run stamp`');
});

test('the Dockerfile writes /api/build, and hashes before creating it', () => {
  assert.match(df, /html\/api\/build/, 'the Dockerfile does not write an /api/build document');
  assert.match(df, /sha256sum/, 'the stamp is not derived from the files');
  assert.match(df, /"service":"octopus-technology"/, 'the document does not name this service');
  assert.ok(df.indexOf('sha256sum') < df.indexOf('mkdir -p /usr/share/nginx/html/api'),
    'api/ is created before the hash is taken — the stamp would cover its own output');
});

test('nginx serves /api/build as JSON and never caches it', () => {
  const b = block('location = /api/build');
  assert.match(b, /default_type application\/json/, '/api/build would be served as text');
  assert.match(b, /Cache-Control "no-store"/,
    'a cached deploy-check answers for the deploy before the one you are asking about');
});

test('the custom config is actually installed, not just present in the repo', () => {
  // A config file nobody copies is a config file that does nothing, and it
  // looks exactly like one that works.
  assert.match(df, /COPY nginx\.conf \/etc\/nginx\/conf\.d\/default\.conf/,
    'nginx.conf is not copied over the stock default — none of the rules above apply');
});
