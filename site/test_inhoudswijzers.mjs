// De inhoudswijzers op de domeinroot zijn afgeleid, nooit met de hand bijgehouden (statuut B4).
// De kennisbank schrijft bij elke build zelf een volledige sitemap.xml en llms.txt (kennisbank/tools/build.py).
// Deze repo telt en somt de stukken van de kennisbank dus niet zelf op, maar verwijst: robots.txt naar
// beide sitemaps, llms.txt naar kennisbank/llms.txt. Deze test blokkeert als dat handwerk terugkomt.
//
//   node site/test_inhoudswijzers.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const lees = (f) => readFileSync(join(ROOT, f), 'utf8');
const robots = lees('robots.txt');
const llms = lees('llms.txt');

let fout = 0;
function check(naam, ok) {
  console.log(`${ok ? 'ok  ' : 'FOUT'} ${naam}`);
  if (!ok) fout++;
}

check('robots.txt wijst naar de sitemap van het domein',
  /^Sitemap: https:\/\/security-commons-nl\.github\.io\/sitemap\.xml$/m.test(robots));
check('robots.txt wijst naar de sitemap van de kennisbank',
  /^Sitemap: https:\/\/security-commons-nl\.github\.io\/kennisbank\/sitemap\.xml$/m.test(robots));
check('robots.txt sluit niets uit', !/^Disallow:\s*\S/m.test(robots));
check('llms.txt verwijst naar de lijst van de kennisbank',
  llms.includes('https://security-commons-nl.github.io/kennisbank/llms.txt'));

const kbRegel = (llms.match(/^- \[Kennisbank\]\([^)]*\):.*$/m) || [''])[0];
check('llms.txt heeft een regel voor de kennisbank', kbRegel !== '');
check('die regel telt de stukken niet met de hand (geen "NN stukken")', !/\b\d+\s+stukken\b/.test(kbRegel));

console.log(fout ? `\n${fout} fout(en)` : '\nalles goed');
process.exit(fout ? 1 : 0);
