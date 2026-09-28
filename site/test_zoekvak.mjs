// Het zoekvak op de voorpagina: draait de zoeklogica uit site/zoekvak.js op een index.
//
//   node site/test_zoekvak.mjs                          # op de fixture (CI)
//   node site/test_zoekvak.mjs pad/naar/zoekindex.json  # op de echte index uit de normen-repo
//
// De fixture is een uitsnede van normen/zoekindex.json van 28-09-2026. De vragen zijn wat een ISO of privacy
// officer echt intypt: een VNG-stuk, een DPIA, een normnummer, een afkorting.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const HIER = dirname(fileURLToPath(import.meta.url));
const pad = process.argv[2] || join(HIER, 'fixtures', 'zoekindex.json');
const index = JSON.parse(readFileSync(pad, 'utf8'));
const omgeving = {};
vm.runInNewContext(readFileSync(join(HIER, 'zoekvak.js'), 'utf8'), { globalThis: omgeving, window: omgeving });
const zoek = omgeving.CommonsZoek.maakZoeker(index, [
  { t: 'aanvalspaden', u: '/aanvalspaden/', z: 'Zelfcheck: een uur, alleen te doen, achttien paden' },
]);

let fout = 0;
function check(naam, ok) {
  console.log(`${ok ? 'ok  ' : 'FOUT'} ${naam}`);
  if (!ok) fout++;
}
const titels = (lijst) => lijst.map((r) => r.t.toLowerCase());

let r = zoek('vng beleid');
check('vng beleid vindt stukken van de IBD (zoekwoord VNG)', r.anderen.some((s) => s.w.includes('IBD')));
r = zoek('DPIA');
check('dpia vindt de DPIA-stukken in de kennisbank', titels(r.kennisbank).some((t) => t.includes('dpia')));
check('dpia vindt ook stukken bij anderen', r.anderen.length > 0);
r = zoek('bio 8.5');
check('bio 8.5 zet maatregel 8.5 bovenaan', r.normen.length > 0 && r.normen[0].w === 'BIO 2.0 8.5');
check('de link wijst naar de normwijzer', r.normen[0] && r.normen[0].u === '/normen/normwijzer.html#bio2/8.5');
r = zoek('verwerkingsregister');
check('verwerkingsregister vindt AVG artikel 30 (trefwoord)', r.normen.some((n) => n.w === 'AVG A30'));
r = zoek('mfa');
check('mfa vindt tweefactor (synoniem)', [...r.kennisbank, ...r.anderen, ...r.normen].length > 0);
r = zoek('continuïteit');
check('accenten tellen niet', r.kennisbank.length > 0);
r = zoek('zelfcheck');
check('de instrumenten op de pagina doen mee', r.instrumenten.length === 1);
check('lege vraag geeft niets', zoek('  ') === null);
r = zoek('xyzzy onzin');
check('onzin geeft vier lege groepen', Object.values(r).every((l) => l.length === 0));
r = zoek('ai');
check('ai vindt iets', r.kennisbank.length + r.anderen.length > 0);
check('kort woord alleen aan het begin van een woord', [...r.kennisbank, ...r.anderen].every((s) => s._zoek.includes(' ai')));

if (fout) {
  console.error(`${fout} controle(s) mislukt`);
  process.exit(1);
}
console.log('zoekvak ok');
