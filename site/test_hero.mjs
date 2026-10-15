// De hero en het thema van de voorpagina (thema B1, 15-10-2026).
// 1. Elk cijfer in de bewijsregel klopt met de bron (site/hero.json noemt bron en veld).
// 2. De voorpagina heeft topbalk, hero met kop, twee knoppen en de bewijsregel, in die volgorde.
// 3. Het thema staat als los bestand in dist/ voor de subsites, en laadt niets van buiten.
//
//   node site/build.mjs && node site/test_hero.mjs
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'dist', 'index.html'), 'utf8');
const hero = JSON.parse(readFileSync(join(ROOT, 'site', 'hero.json'), 'utf8'));

let fout = 0;
function check(naam, ok) {
  console.log(`${ok ? 'ok  ' : 'FOUT'} ${naam}`);
  if (!ok) fout++;
}

// 1. Cijfers tegen de bron. Geen bron = belofte (0 accounts); die telt niet.
const metBron = hero.bewijs.filter((b) => b.bron);
check('minstens drie cijfers hebben een bron', metBron.length >= 3);
for (const b of metBron) {
  let echt;
  try {
    const r = await fetch(b.bron);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    const v = data[b.veld];
    echt = Array.isArray(v) ? v.length : Object.keys(v ?? {}).length;
  } catch (e) {
    echt = `onbereikbaar (${e.message})`;
  }
  check(`${b.cijfer} ${b.label}: bron zegt ${echt}`, echt === b.cijfer);
  check(`het cijfer ${b.cijfer} staat in de bewijsregel`, html.includes(`<li><b>${b.cijfer}</b>`));
}

// 2. Opbouw van de bovenkant.
const pos = (s) => html.indexOf(s);
check('body heeft class thema', html.includes('<body class="thema">'));
check('topbalk met logo', pos('class="topbalk"') !== -1 && pos('src="/logo.png"') > pos('class="topbalk"'));
check('hero na de topbalk', pos('class="hero"') > pos('class="topbalk"'));
check('kop in de hero', /<section class="hero">[\s\S]*?<h1[^>]*>Praktische kennis en tools voor security, privacy en continuïteit<\/h1>/.test(html));
check('precies één h1', (html.match(/<h1[\s>]/g) || []).length === 1);
check('twee knoppen: zelfcheck en kennisbank',
  pos('class="knop" href="/aanvalspaden/"') > pos('class="hero"') && pos('knop-tweede" href="/kennisbank/"') !== -1);
check('bewijsregel in de hero, vóór main', pos('class="bewijs"') > pos('class="hero"') && pos('class="bewijs"') < pos('<main'));
check('zoekvak na de hero', pos('id="commons-zoekvak"') > pos('</section>'));
check('geen losse HERO-markering meer zichtbaar', !html.includes('<!-- HERO') && !html.includes('<!-- BEWIJS'));
check('geen em-dash', !html.includes('—'));

// 3. Thema als los bestand en zonder externe bronnen.
check('dist/thema.css bestaat', existsSync(join(ROOT, 'dist', 'thema.css')));
const css = readFileSync(join(ROOT, 'site', 'thema.css'), 'utf8');
check('thema laadt geen externe fonts of bestanden', !/@import|url\(\s*['"]?https?:/i.test(css));
check('geen externe stylesheets of scripts op de voorpagina',
  !/<link[^>]+rel="stylesheet"/i.test(html) && !/<script[^>]+src="https?:/i.test(html));

console.log(fout ? `\n${fout} fout(en)` : '\nalles goed');
process.exit(fout ? 1 : 0);
