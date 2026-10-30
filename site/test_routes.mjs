// De leesroutes (statuut C2, plan 29-10-2026): vorm van site/routes.json, en elk adres bestaat echt.
// Een route die naar een dode pagina wijst, is erger dan geen route: de lezer volgt hem.
//
//   node site/build.mjs && node site/test_routes.mjs
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(ROOT, 'site', 'routes.json'), 'utf8'));
const html = readFileSync(join(ROOT, 'dist', 'index.html'), 'utf8');

let fout = 0;
function check(naam, ok) {
  console.log(`${ok ? 'ok  ' : 'FOUT'} ${naam}`);
  if (!ok) fout++;
}

// 1. Vorm.
const rollen = data.routes.map((r) => r.rol);
check('vijf routes: CISO, ISO, Privacy officer, Bestuurder, Eerste honderd dagen',
  JSON.stringify(rollen) === JSON.stringify(['CISO', 'ISO', 'Privacy officer', 'Bestuurder', 'Eerste honderd dagen']));
check('elke route heeft een unieke id', new Set(data.routes.map((r) => r.id)).size === data.routes.length);
check('elke route heeft soort rol of situatie', data.routes.every((r) => r.soort === 'rol' || r.soort === 'situatie'));
check('minstens vier rollen en een situatie', data.routes.filter((r) => r.soort === 'rol').length >= 4 && data.routes.some((r) => r.soort === 'situatie'));
check('eerste honderd dagen is een situatie, geen rol', data.routes.find((r) => r.id === 'eerste-honderd-dagen').soort === 'situatie');
for (const r of data.routes) {
  check(`${r.rol}: de vraag eindigt op een vraagteken`, r.vraag.endsWith('?'));
  check(`${r.rol}: vijf tot acht stappen (${r.stappen.length})`, r.stappen.length >= 5 && r.stappen.length <= 8);
  check(`${r.rol}: geen dubbele stap`, new Set(r.stappen.map((s) => s.url)).size === r.stappen.length);
  for (const s of r.stappen) {
    check(`${r.rol}: "${s.titel}" wijst naar de commons zelf`, s.url.startsWith('https://security-commons-nl.github.io/'));
    check(`${r.rol}: "${s.titel}" heeft een waarom van een zin`,
      typeof s.waarom === 'string' && s.waarom.length >= 30 && s.waarom.length <= 160 && s.waarom.trim().endsWith('.'));
    check(`${r.rol}: "${s.titel}" noemt geen repo-naam of github.com (C1)`,
      !/github\.com/.test(s.url) && !/github\.com/.test(s.waarom));
    check(`${r.rol}: "${s.titel}" staat op de voorpagina`, html.includes(`href="${s.url}"`));
  }
}
check('geen em-dash in routes.json', !JSON.stringify(data).includes(String.fromCharCode(8212)));

// 1b. Een instrument in een route hoort de lat te halen (statuut C5). Een prototype dat er al stond, mag
// blijven tot zijn eerstvolgende aanraking; dat is een waarschuwing, geen fout, zodat het zichtbaar blijft.
const projectenPad = [join(ROOT, 'org-profile', 'PROJECTEN.md'), join(ROOT, '..', '.github', 'PROJECTEN.md')]
  .find((p) => existsSync(p));
check('PROJECTEN.md gevonden voor de statuscontrole', Boolean(projectenPad));
const projecten = new Map();
for (const regel of readFileSync(projectenPad, 'utf8').split(/\r?\n/)) {
  const m = regel.match(/^\| \[([^\]]+)\]\([^)]*\) \| ([^|]+?) \| ([^|]+?) \|/);
  if (m) projecten.set(m[1], { status: m[2], vorm: m[3] });
}
check('PROJECTEN.md bevat projecten met status en vorm', projecten.size >= 5);
let waarschuwingen = 0;
for (const r of data.routes) {
  for (const s of r.stappen) {
    const naam = new URL(s.url).pathname.split('/')[1];
    const p = projecten.get(naam);
    if (p && p.vorm === 'instrument' && p.status !== 'in gebruik') {
      waarschuwingen++;
      console.log(`LET OP ${r.rol}: "${s.titel}" is een instrument met status ${p.status} (C5: haalt de lat bij de eerstvolgende aanraking)`);
      if (process.env.GITHUB_ACTIONS) console.log(`::warning::Route ${r.rol}: ${naam} is ${p.status}, haalt de lat (C5) nog niet`);
    }
  }
}
console.log(`${waarschuwingen} instrument(en) onder de lat in een route`);

// 2. Elk adres bestaat. De commons staat op GitHub Pages; een 404 daar is een echte 404.
const urls = [...new Set(data.routes.flatMap((r) => r.stappen.map((s) => s.url)))];
for (const url of urls) {
  let status;
  try {
    const r = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    status = r.status;
    if (status === 405 || status === 403) {
      const g = await fetch(url, { method: 'GET', redirect: 'follow' });
      status = g.status;
    }
  } catch (e) {
    status = `onbereikbaar (${e.message})`;
  }
  check(`${url} geeft 200 (${status})`, status === 200);
}

if (fout) {
  console.error(`\n${fout} fout(en) in de routes`);
  process.exit(1);
}
console.log('\nroutes ok');
