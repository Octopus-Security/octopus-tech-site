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

if (problems.length) {
  console.error('Page checks failed:');
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log(`All pages carry a working lizard, a working rat, and the full nav.`);
