/**
 * check-pages.mjs — the lizard must work on every page.
 *
 * This is not a joke check. The buttons had been dead on two pages for a long
 * time and nobody noticed, because the failure is silent: the button renders,
 * you click it, and nothing happens. There is no error, no missing asset, no
 * broken layout. It looks fine.
 *
 * main.js guards the lizard behind `if (lizardButton && lizardSound)`, so a
 * page carrying the button but not the <audio> element gets an inert control
 * rather than a noisy failure. Every page needs all three parts, and each part
 * lives in a different place in the file, which is exactly the kind of thing a
 * person copying a page forgets.
 *
 * Also checks the nav is the same everywhere — a page that quietly stops
 * linking to a section is the same class of silent rot.
 *
 *   node tools/check-pages.mjs
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public');

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const full = join(dir, e.name);
    if (e.isDirectory()) return htmlFiles(full);
    return e.name.endsWith('.html') ? [full] : [];
  });
}

const NAV = ['index.html', 'projects.html', 'writing.html', 'contact.html', 'about.html', 'learn.html'];
// The Apps link is the auth hub, not a page here: apps.html was retired and
// apps.octopustechnology.net now redirects there (see nginx.conf).
const HUB_URL = 'https://auth.octopustechnology.net/';
const problems = [];

for (const file of htmlFiles(PUBLIC).sort()) {
  const rel = relative(PUBLIC, file);
  const src = readFileSync(file, 'utf8');
  const count = re => (src.match(re) || []).length;

  const button = count(/class="lizardButton"/g);
  const audio  = count(/id="lizardSound"/g);
  const script = count(/<script src="[^"]*scripts\/main\.js(\?v=[a-f0-9]+)?"><\/script>/g);

  if (button === 0) { problems.push(`${rel}: no lizard button`); continue; }

  // Each has to appear exactly once. Twice is as wrong as never: two copies of
  // main.js register the handlers twice, so one click plays the sound twice and
  // drops forty lizards.
  if (audio !== 1)  problems.push(`${rel}: expected 1 <audio id="lizardSound">, found ${audio}`);
  if (script !== 1) problems.push(`${rel}: expected 1 main.js script tag, found ${script}`);
  if (button !== 1) problems.push(`${rel}: expected 1 lizard button, found ${button}`);

  // Relative depth has to match where the file actually sits.
  // The asset links carry a `?v=<hash>` cache stamp (tools/stamp-assets.mjs),
  // so match the path and allow the query string after it. Matching the bare
  // path exactly is what this check did until 2026-09-05, and stamping the
  // assets made every page look as though it had lost its script tag.
  const prefix = '../'.repeat(rel.split('/').length - 1);
  const scriptSrc = new RegExp(`src="${prefix.replace(/\./g, '\\.')}scripts/main\\.js(\\?v=[a-f0-9]+)?"`);
  if (script === 1 && !scriptSrc.test(src)) {
    problems.push(`${rel}: main.js path is wrong for this directory (expected "${prefix}scripts/main.js")`);
  }

  // The legal links must be on every page (Octopus Education takes payments).
  for (const page of ['terms.html', 'privacy.html', 'refunds.html', 'contact.html']) {
    if (!src.includes(`href="${prefix}${page}"`)) problems.push(`${rel}: footer is missing ${page}`);
  }

  for (const page of NAV) {
    if (!src.includes(`href="${prefix}${page}"`)) problems.push(`${rel}: nav is missing ${page}`);
  }
  if (!src.includes(`<a href="${HUB_URL}">Apps</a>`)) problems.push(`${rel}: nav Apps link must point at ${HUB_URL}`);
  if (/href="(\.\.\/)?apps\.html"/.test(src)) problems.push(`${rel}: links to the retired apps.html`);
}

// ── Project links actually resolve (opt-in: needs the network) ───────────────
//
// `node tools/check-pages.mjs --links`
//
// Every "See more on GitHub" link on the projects page was a promise to a
// stranger, and three of them were 404s: octopus-auth, octopus-edm and
// octopus-shopper were all flipped private after the page was written, and
// nothing connected those two facts. The card still rendered, the link still
// looked right, and only a visitor clicking it ever found out.
//
// Offline by default because a build should not need the network, and because a
// GitHub rate-limit would otherwise fail the check for a reason that has nothing
// to do with the page.
if (process.argv.includes('--links')) {
  const projects = (await import('../content/projects.js')).default;
  const linked = projects.filter(p => p.url);
  await Promise.all(linked.map(async p => {
    try {
      const res = await fetch(p.url, { method: 'HEAD', redirect: 'follow' });
      if (!res.ok) {
        problems.push(`projects: "${p.name}" links to ${p.url} — HTTP ${res.status}. `
          + 'If the repo went private, set url: null so the card simply has no link.');
      }
    } catch (err) {
      problems.push(`projects: "${p.name}" link ${p.url} could not be checked — ${err.message}`);
    }
  }));
  console.log(`Checked ${linked.length} project link(s).`);
}

if (problems.length) {
  console.error('Page checks failed:');
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log(`All pages carry a working lizard, a working rat, and the full nav.`);
