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

const NAV = ['index.html', 'projects.html', 'writing.html', 'contact.html', 'about.html', 'apps.html'];
const problems = [];

for (const file of htmlFiles(PUBLIC).sort()) {
  const rel = relative(PUBLIC, file);
  const src = readFileSync(file, 'utf8');
  const count = re => (src.match(re) || []).length;

  const button = count(/class="lizardButton"/g);
  const audio  = count(/id="lizardSound"/g);
  const script = count(/<script src="[^"]*scripts\/main\.js"><\/script>/g);

  if (button === 0) { problems.push(`${rel}: no lizard button`); continue; }

  // Each has to appear exactly once. Twice is as wrong as never: two copies of
  // main.js register the handlers twice, so one click plays the sound twice and
  // drops forty lizards.
  if (audio !== 1)  problems.push(`${rel}: expected 1 <audio id="lizardSound">, found ${audio}`);
  if (script !== 1) problems.push(`${rel}: expected 1 main.js script tag, found ${script}`);
  if (button !== 1) problems.push(`${rel}: expected 1 lizard button, found ${button}`);

  // Relative depth has to match where the file actually sits.
  const prefix = '../'.repeat(rel.split('/').length - 1);
  if (script === 1 && !src.includes(`src="${prefix}scripts/main.js"`)) {
    problems.push(`${rel}: main.js path is wrong for this directory (expected "${prefix}scripts/main.js")`);
  }

  for (const page of NAV) {
    if (!src.includes(`href="${prefix}${page}"`)) problems.push(`${rel}: nav is missing ${page}`);
  }
}

// ── The apps grid ─────────────────────────────────────────────────────────────
//
// Same failure shape as the lizard: a card with a category that has no filter
// button renders fine and looks correct, right up until someone clicks a filter
// — then it disappears and cannot be reached by any combination of clicks. A
// button with no cards is the mirror image, filtering the grid to nothing.
// Neither throws, and neither is visible on the default "All" view, which is
// the one you check after editing.
{
  const src = readFileSync(join(PUBLIC, 'apps.html'), 'utf8');
  const cats = new Set([...src.matchAll(/data-category="([^"]+)"/g)].map(m => m[1]));
  const filters = new Set([...src.matchAll(/data-filter="([^"]+)"/g)].map(m => m[1]));
  filters.delete('all');

  for (const c of cats) {
    if (!filters.has(c)) problems.push(`apps.html: category "${c}" has cards but no filter button`);
  }
  for (const f of filters) {
    if (!cats.has(f)) problems.push(`apps.html: filter button "${f}" matches no cards`);
  }

  // Every card should point somewhere, and the estate's own links should use the
  // real subdomain — author is at write.…, planner at plan.…, and guessing from
  // the repo name gives you a host that does not resolve.
  for (const m of src.matchAll(/<a class="app-card[^"]*"[^>]*href="([^"]*)"/g)) {
    if (!/^https?:\/\/\S+/.test(m[1])) problems.push(`apps.html: card with a non-absolute href "${m[1]}"`);
  }
}

if (problems.length) {
  console.error('Page checks failed:');
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log(`All pages carry a working lizard, a working rat, and the full nav.`);
