// De rolkiezer en de suggestie uit je profiel (plan het profiel, stap 3): het echte script uit de gebouwde
// voorpagina, op de echte routes, met een nagebootste browser (localStorage, sessionStorage, fetch).
//
//   node site/build.mjs && node site/test_rolkiezer.mjs
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(ROOT, 'dist', 'index.html'), 'utf8');
const routes = JSON.parse(readFileSync(join(ROOT, 'site', 'routes.json'), 'utf8')).routes;
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((s) => s.includes("'commons-rol'"));

let fout = 0;
function check(naam, ok, extra) {
  console.log(`${ok ? 'ok  ' : 'FOUT'} ${naam}${ok || extra === undefined ? '' : `  (${extra})`}`);
  if (!ok) fout++;
}

function el(tag, attrs = {}) {
  const e = { tag, attrs: { ...attrs }, hidden: false, textContent: '', kinderen: [], klassen: new Set(), _h: {},
    getAttribute(n) { return n in this.attrs ? this.attrs[n] : null; },
    setAttribute(n, v) { this.attrs[n] = String(v); },
    addEventListener(s, f) { this._h[s] = f; },
    appendChild(k) { this.kinderen = this.kinderen.filter((x) => x !== k); this.kinderen.push(k); return k; },
    classList: null };
  e.classList = { add: (c) => e.klassen.add(c), contains: (c) => e.klassen.has(c) };
  return e;
}

async function draai({ rol = null, profiel = null, sessie = {}, regels = null } = {}) {
  const rolRoutes = routes.filter((r) => r.soort === 'rol');
  const blokken = routes.map((r) => el('div', { 'data-route': r.id, id: `route-${r.id}` }));
  const sectie = el('section');
  blokken.filter((b) => rolRoutes.some((r) => r.id === b.attrs['data-route'])).forEach((b) => sectie.appendChild(b));
  sectie.querySelectorAll = () => sectie.kinderen.slice();
  const knoppen = rolRoutes.map((r) => el('button', { 'data-rol': r.id, 'aria-pressed': 'false' }));
  const kiezer = el('div'); kiezer.hidden = true; kiezer.querySelectorAll = () => knoppen;
  const alle = el('button'); alle.hidden = true;
  const vak = el('div'); vak.hidden = true;
  const ids = { rolkiezer: kiezer, 'routes-rollen': sectie, 'rol-alle': alle, profielsuggestie: vak };
  blokken.forEach((b) => { ids[b.attrs.id] = b; });
  const opslag = { 'commons-rol': rol === null ? null : JSON.stringify(rol), 'commons-profiel': profiel === null ? null : JSON.stringify(profiel) };
  const s = { ...sessie };
  const document = { getElementById: (id) => ids[id] || null, querySelectorAll: () => blokken, createElement: (t) => el(t) };
  const localStorage = { getItem: (k) => (k in opslag ? opslag[k] : null), setItem: (k, v) => { opslag[k] = v; } };
  const sessionStorage = { getItem: (k) => (k in s ? s[k] : null), setItem: (k, v) => { s[k] = v; } };
  let opgehaald = 0;
  const fetch = async () => { opgehaald++; return { ok: !!regels, json: async () => ({ regels: regels || [] }) }; };
  new Function('document', 'localStorage', 'sessionStorage', 'fetch', script)(document, localStorage, sessionStorage, fetch);
  await new Promise((r) => setTimeout(r, 10));
  const tekst = (e) => [e.textContent, ...e.kinderen.map(tekst)].join('');
  return { kiezer, sectie, knoppen, alle, vak, opslag, s, blokken, opgehaald,
    volgorde: () => sectie.kinderen.map((b) => b.attrs['data-route']),
    zichtbaar: () => sectie.kinderen.filter((b) => !b.hidden).map((b) => b.attrs['data-route']),
    suggestie: () => tekst(vak), links: () => vak.kinderen.flatMap((p) => p.kinderen.filter((k) => k.tag === 'a').map((a) => a.href)) };
}

const ROLLEN = routes.filter((r) => r.soort === 'rol').map((r) => r.id);
// Twee regels in de vorm van kennisbank/profielregels.json: een met een situatie, een die alleen stukken raakt.
const startend = [{ id: 'startend', als: { capaciteit: ['geen'], volwassenheid: ['startend'] }, dan: { situatie: 'eerste-honderd-dagen' },
  waarom: 'Je begint met informatiebeveiliging, dus de route van de eerste honderd dagen past.' },
  { id: 'cbw', als: { cbw: ['essentieel'] }, dan: { normen: ['Cbw'] }, waarom: 'Alleen stukken, geen route.' }];

check('het script staat op de voorpagina', !!script);

let r = await draai();
check('zonder rol: de kiezer verschijnt, alle rollen zichtbaar in de gewone volgorde',
  !r.kiezer.hidden && JSON.stringify(r.volgorde()) === JSON.stringify(ROLLEN) && r.zichtbaar().length === ROLLEN.length);
check('zonder rol: geen knop "Toon alle rollen"', r.alle.hidden);
check('zonder profiel: geen suggestie en niets opgehaald', r.vak.hidden && r.opgehaald === 0);

r = await draai({ rol: ['privacy-officer', 'iso'] });
check('twee rollen gekozen: die staan vooraan, in de volgorde van de routes',
  JSON.stringify(r.volgorde().slice(0, 2)) === JSON.stringify(['iso', 'privacy-officer']), r.volgorde().join(' '));
check('de andere rollen zijn ingeklapt, niet weg', JSON.stringify(r.zichtbaar()) === JSON.stringify(['iso', 'privacy-officer']) && r.volgorde().length === ROLLEN.length);
check('de knoppen staan aan voor de gekozen rollen',
  r.knoppen.filter((k) => k.attrs['aria-pressed'] === 'true').map((k) => k.attrs['data-rol']).sort().join() === 'iso,privacy-officer');
check('"Toon alle rollen" zegt hoeveel er meer zijn', !r.alle.hidden && r.alle.textContent.includes(`${ROLLEN.length - 2} meer`), r.alle.textContent);
r.alle._h.click();
check('na "Toon alle rollen" zijn alle rollen zichtbaar', r.zichtbaar().length === ROLLEN.length);

r = await draai({ rol: ['ciso', 'bestaat-niet'] });
check('een onbekende rol in de opslag wordt genegeerd', JSON.stringify(r.zichtbaar()) === JSON.stringify(['ciso']));

r = await draai();
r.knoppen.find((k) => k.attrs['data-rol'] === 'bestuurder')._h.click();
check('een rol aanklikken bewaart hem onder commons-rol', r.opslag['commons-rol'] === '["bestuurder"]', r.opslag['commons-rol']);
check('en zet hem vooraan', r.volgorde()[0] === 'bestuurder');
r.knoppen.find((k) => k.attrs['data-rol'] === 'bestuurder')._h.click();
check('nog een keer klikken zet hem uit en alles is weer zichtbaar', r.opslag['commons-rol'] === '[]' && r.zichtbaar().length === ROLLEN.length);

r = await draai({ profiel: { capaciteit: 'geen' }, regels: startend });
check('profiel zonder eigen ISO: suggestie naar de eerste honderd dagen',
  !r.vak.hidden && r.links().includes('#route-eerste-honderd-dagen') && r.suggestie().includes('eerste honderd dagen'), r.suggestie());
check('de voorgestelde situatie krijgt een markering', r.blokken.find((b) => b.attrs['data-route'] === 'eerste-honderd-dagen').klassen.has('route-voorgesteld'));
check('een regel zonder route of situatie geeft geen suggestie', !r.suggestie().includes('Alleen stukken'));
check('de suggestie wijst naar /profiel/', r.links().includes('/profiel/'));
const weg = r.vak.kinderen.flatMap((p) => p.kinderen).find((k) => k.tag === 'button');
weg._h.click();
check('"Niet meer tonen" verbergt hem voor de sessie', r.vak.hidden && r.s['commons-suggestie'] === 'weg');

r = await draai({ rol: ['iso'], profiel: { cbw: ['essentieel'] }, regels: [{ id: 'b', als: { cbw: ['essentieel'] }, dan: { route: 'bestuurder' }, waarom: 'Onder de Cbw hoort het bestuur erbij.' }] });
check('een voorgestelde rolroute blijft zichtbaar naast de gekozen rol', r.zichtbaar().includes('bestuurder') && r.zichtbaar().includes('iso'), r.zichtbaar().join(' '));
r.knoppen.find((k) => k.attrs['data-rol'] === 'ciso')._h.click();
check('en blijft zichtbaar na een klik op een andere rol (bevinding 4)', r.zichtbaar().includes('bestuurder'), r.zichtbaar().join(' '));

r = await draai({ profiel: { capaciteit: 'geen' }, regels: startend, sessie: { 'commons-suggestie': 'weg' } });
check('weggeklikt in deze sessie: niets opgehaald, geen suggestie', r.vak.hidden && r.opgehaald === 0);

r = await draai({ profiel: { cbw: 'essentieel' }, regels: startend });
check('profiel dat geen route raakt: geen suggestie', r.vak.hidden);

r = await draai({ profiel: { capaciteit: 'geen' }, regels: null });
check('regels niet te laden: geen suggestie en geen fout', r.vak.hidden);

if (fout) { console.error(`\n${fout} fout(en)`); process.exit(1); }
console.log('\nrolkiezer ok');
