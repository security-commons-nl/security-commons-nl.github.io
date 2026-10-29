// De profielpagina (plan stap 9): gebouwd, met het formulier en de knoppen, de gedeelde bewaarnaam, en
// niets van buiten het domein behalve het schema van de kennisbank.
//
//   node site/build.mjs && node site/test_profiel.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'dist', 'profiel', 'index.html'), 'utf8');
const js = readFileSync(join(ROOT, 'site', 'profiel.js'), 'utf8');
const voor = readFileSync(join(ROOT, 'dist', 'index.html'), 'utf8');

let fout = 0;
function check(naam, ok) {
  console.log(`${ok ? 'ok  ' : 'FOUT'} ${naam}`);
  if (!ok) fout++;
}

check('canonical op /profiel/', html.includes('href="https://security-commons-nl.github.io/profiel/"'));
check('het formulier en de meldregel staan op de pagina', html.includes('id="profiel"') && html.includes('id="profiel-melding"'));
for (const id of ['profiel-wis', 'profiel-bestand', 'profiel-laad', 'profiel-laadveld', 'profiel-link', 'profiel-stand']) {
  check(`knop of veld ${id}`, html.includes(`id="${id}"`));
}
check('het script staat inline op de pagina', html.includes("var SLEUTEL = 'commons-profiel'"));
// marked maakt alinea's van code zodra er een lege regel in het HTML-blok zit, en <em> van onderstrepingen;
// op 29-10 brak dat de pagina stil. Het blok van <script> tot </script> rond het script mag geen HTML bevatten.
const si = html.indexOf('var SLEUTEL');
const blok = html.slice(html.lastIndexOf('<script>', si), html.indexOf('</script>', si));
check('het script is heel gebleven (geen <p> of <em> erin)', !/<\/?(p|em)>/.test(blok));
check('het script parseert als JavaScript', (() => { try { new Function(blok.replace('<script>', '')); return true; } catch (e) { return false; } })());
check('het schema komt van de kennisbank op dit domein', js.includes("'/kennisbank/profiel.json'"));
check('geen fetch naar een ander domein', !/fetch\(['"]https?:/.test(js));
check('de link draagt het profiel achter het hekje', js.includes("'#p='"));
check('onbekende waarden vallen weg bij laden (schoon)', js.includes('function schoon('));
check('de naam van de organisatie komt nergens in het profiel', !/naam\s*:/.test(js) && !/organisatienaam/.test(js));
check('geen em-dash', !html.includes(String.fromCharCode(8212)));
check('de topbalk wijst naar het profiel', /href="\/profiel\/">Profiel</.test(html));
check('de voorpagina wijst naar het profiel', voor.includes('href="/profiel/"'));
check('sitemap kent /profiel/', readFileSync(join(ROOT, 'sitemap.xml'), 'utf8').includes('https://security-commons-nl.github.io/profiel/'));
check('llms.txt kent /profiel/', readFileSync(join(ROOT, 'llms.txt'), 'utf8').includes('/profiel/'));

if (fout) { console.error(`\n${fout} fout(en)`); process.exit(1); }
console.log('\nprofiel ok');
