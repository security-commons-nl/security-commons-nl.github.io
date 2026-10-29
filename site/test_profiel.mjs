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
check('een subvraag wordt een eigen vraag (zoals de generator hem schrijft)', js.includes('hoort_bij'));
check('een bestand zonder geldig profiel wist niets', js.includes('bevat geen geldig profiel'));
check('een link zonder geldig profiel wist niets', js.includes('De link bevat geen geldig profiel'));
check('de naam van de organisatie komt nergens in het profiel', !/naam\s*:/.test(js) && !/organisatienaam/.test(js));
check('geen em-dash', !html.includes(String.fromCharCode(8212)));
// Stap 4: het voorstel van de assistent.
for (const id of ['profiel-voorstel', 'voorstel-laad', 'voorstel-bestand', 'voorstel-blok', 'voorstel-tabel', 'voorstel-overnemen', 'voorstel-sluiten']) {
  check(`voorstel: ${id}`, html.includes(`id="${id}"`));
}
check('voorstel: verwijst naar de AI-hulp van de beleidsset', html.includes('/kennisbank/governance/beleidsset-informatiebeveiliging/beleidsset-ai.html'));
check('voorstel: het blok is verborgen tot er een voorstel is', /id="voorstel-blok" class="voorstel-blok" hidden/.test(html));
check('de topbalk wijst naar het profiel', /href="\/profiel\/">Profiel</.test(html));
check('de voorpagina wijst naar het profiel', voor.includes('href="/profiel/"'));
check('sitemap kent /profiel/', readFileSync(join(ROOT, 'sitemap.xml'), 'utf8').includes('https://security-commons-nl.github.io/profiel/'));
check('llms.txt kent /profiel/', readFileSync(join(ROOT, 'llms.txt'), 'utf8').includes('/profiel/'));

// Gedrag van het voorstel: het echte script met een nagebootste browser. Alleen geldige antwoord-id's
// worden overgenomen, alleen wat is aangevinkt, en een regel zonder kloppend citaat staat uit.
{
  const schema = { versie: 't', vragen: [
    { id: 'type', vraag: 'Wat voor organisatie?', meerdere: false, antwoorden: [{ id: 'gemeente', label: 'Gemeente' }, { id: 'provincie', label: 'Provincie' }] },
    { id: 'ketens', vraag: 'Welke voorzieningen?', meerdere: true, antwoorden: [{ id: 'digid', label: 'DigiD' }, { id: 'suwinet', label: 'Suwinet' }] },
    { id: 'cbw', vraag: 'Cbw?', meerdere: false, antwoorden: [{ id: 'belangrijk', label: 'Belangrijk' }] }] };
  const voorstel = { formaat: 'beleidsset-voorstel', tool: 'beleidsset', opdracht: 'profiel', gemaakt: '2026-10-29', leverancier: 'Ollama (lokaal)', model: 'x',
    items: [
      { code: 'type', antwoorden: ['gemeente'], bronregel: 'De gemeente telt 60.000 inwoners.', citaat_klopt: true },
      { code: 'ketens', antwoorden: ['digid', 'verzonnen'], bronregel: 'Wij zijn aangesloten op DigiD.', citaat_klopt: true },
      { code: 'cbw', antwoorden: ['belangrijk'], bronregel: 'Niet woordelijk in de tekst.', citaat_klopt: false },
      { code: 'bestaatniet', antwoorden: ['x'], bronregel: 'y', citaat_klopt: true }] };
  const els = {}; const opslag = {};
  const mk = (tag) => { const e = { tag, kinderen: [], attrs: {}, hidden: false, textContent: '', value: '', checked: false, _h: {}, files: null, className: '',
    appendChild(k) { this.kinderen.push(k); return k; }, removeChild(k) { this.kinderen = this.kinderen.filter((x) => x !== k); },
    get firstChild() { return this.kinderen[0] || null; }, setAttribute(n, v) { this.attrs[n] = v; }, getAttribute(n) { return this.attrs[n] ?? null; },
    addEventListener(s, f) { this._h[s] = f; }, click() { if (this._h.click) this._h.click(); }, querySelectorAll() { return []; } }; return e; };
  for (const id of ['profiel', 'profiel-melding', 'profiel-stand', 'profiel-wis', 'profiel-bestand', 'profiel-laad', 'profiel-laadveld', 'profiel-link',
    'voorstel-laad', 'voorstel-bestand', 'voorstel-blok', 'voorstel-herkomst', 'voorstel-tabel', 'voorstel-overnemen', 'voorstel-sluiten']) els[id] = mk('div');
  els['voorstel-blok'].hidden = true;
  const vinkjes = () => els['voorstel-tabel'].kinderen.flatMap((tr) => tr.kinderen.flatMap((td) => td.kinderen)).filter((x) => x.type === 'checkbox');
  const document = { getElementById: (id) => els[id] || null, createElement: mk,
    querySelectorAll: (sel) => (sel === '#voorstel-tabel input:checked' ? vinkjes().filter((v) => v.checked) : []) };
  const formulier = {};
  els.profiel.querySelectorAll = (sel) => {
    const m = sel.match(/input\[name="([^"]+)"\]:checked/);
    if (m) return (formulier[m[1]] || []).map((value) => ({ value }));
    return [];
  };
  const localStorage = { getItem: (k) => opslag[k] ?? null, setItem: (k, v) => { opslag[k] = v; }, removeItem: (k) => { delete opslag[k]; } };
  let lezerTekst = '';
  function FileReader() { this.readAsText = () => { this.result = lezerTekst; this.onload(); }; }
  const fetch = async () => ({ ok: true, json: async () => schema });
  // Het gebouwde blok, niet de bron: zo test dit ook de omzetting door de build (review 29-10).
  const scriptBron = blok.replace('<script>', '');
  new Function('document', 'localStorage', 'fetch', 'FileReader', 'location', 'history', 'navigator', 'Blob', 'URL', 'prompt', 'atob', 'btoa', 'escape', 'unescape', scriptBron)(
    document, localStorage, fetch, FileReader, { hash: '', origin: 'http://x', pathname: '/profiel/' }, { replaceState() {} }, {}, function () {}, {}, () => {}, atob, btoa, escape, unescape);
  await new Promise((r) => setTimeout(r, 20));
  check('gedrag: de knoppen van het voorstel zijn verbonden', typeof els['voorstel-laad']._h.click === 'function' && typeof els['voorstel-overnemen']._h.click === 'function');
  lezerTekst = JSON.stringify(voorstel);
  els['voorstel-bestand'].files = [{}];
  els['voorstel-bestand']._h.change();
  const rijen = els['voorstel-tabel'].kinderen.length - 1;
  check('gedrag: drie geldige voorstellen getoond, een met onbekende vraag overgeslagen', rijen === 3 && els['voorstel-herkomst'].textContent.includes('1 voorstel(len)'), `${rijen} rijen; ${els['voorstel-herkomst'].textContent}`);
  check('gedrag: het blok verschijnt en er is nog niets bewaard', !els['voorstel-blok'].hidden && !opslag['commons-profiel']);
  const v = vinkjes();
  check('gedrag: een regel zonder kloppend citaat staat uit', v.length === 3 && v[0].checked && v[1].checked && !v[2].checked);
  els['voorstel-overnemen']._h.click();
  const bewaard = JSON.parse(opslag['commons-profiel'] || '{}');
  check('gedrag: alleen het aangevinkte en geldige komt in het profiel', JSON.stringify(bewaard) === JSON.stringify({ type: 'gemeente', ketens: ['digid'] }), opslag['commons-profiel']);
  check('gedrag: het citaat staat niet in het profiel', !String(opslag['commons-profiel']).includes('inwoners'));
  lezerTekst = JSON.stringify({ formaat: 'iets-anders', items: [] });
  els['voorstel-bestand']._h.change();
  check('gedrag: een ander bestand wordt geweigerd', els['profiel-melding'].textContent.includes('geen voorstel'));
}

if (fout) { console.error(`\n${fout} fout(en)`); process.exit(1); }
console.log('\nprofiel ok');
