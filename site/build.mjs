// Build script: renders the root landing page from site/content.md and PROJECTEN.md.
// Static root files (robots.txt, llms.txt, sitemap.xml) are copied to dist/.
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { marked } from 'marked';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_FILE = join(ROOT, 'site', 'content.md');

// PROJECTEN.md is de enige bron (statuut B9).
function vindProjectenBestand() {
  const paden = [
    join(ROOT, 'org-profile', 'PROJECTEN.md'),
    join(ROOT, '..', '.github', 'PROJECTEN.md'),
    join(ROOT, 'org-profile', 'profile', 'README.md'),
    join(ROOT, '..', '.github', 'profile', 'README.md'),
  ];
  for (const pad of paden) {
    if (existsSync(pad)) return pad;
  }
  throw new Error('PROJECTEN.md niet gevonden in org-profile/ of .github/');
}

const PROJECTEN_FILE = vindProjectenBestand();
const RAW_BASE = 'https://raw.githubusercontent.com/security-commons-nl/.github/main/';
const BLOB_BASE = 'https://github.com/security-commons-nl/.github/blob/main/';

const STATIC_FILES = ['robots.txt', '.nojekyll', '.well-known/security.txt', 'favicon.svg',
  'favicon.ico', 'logo.png'];

/**
 * Escapes HTML special characters in raw text.
 * @param {string} text Raw text.
 * @returns {string} HTML-safe text.
 */
function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

/**
 * Maps a project status to a badge CSS class.
 * @param {string} status Status text, e.g. "in gebruik".
 * @returns {string} CSS class string.
 */
function statusClass(status) {
  const key = status.toLowerCase();
  if (key.includes('in gebruik')) return 'badge badge-actief';
  if (key.includes('prototype')) return 'badge badge-bouw';
  if (key.includes('gearchiveerd')) return 'badge badge-archief';
  return 'badge badge-concept';
}

/**
 * Replaces Markdown links with their plain text. Needed inside cards: the
 * card itself is an anchor, and nested anchors are invalid HTML.
 * @param {string} text Markdown text.
 * @returns {string} Text with links flattened.
 */
function stripLinks(text) {
  return text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
}

/**
 * Reads one row of the projects table into a project object.
 * Columns: Project | Status | Vorm | Wat is het? | Direct openen | Doelgroep
 * (ook compatibel met oudere 5-koloms tabel zonder Vorm).
 * @param {object[]} row Marked table row.
 * @returns {?object} Project, or null when the row has no project link.
 */
function projectFromRow(row) {
  const link = row[0].text.match(/\[(.+?)\]\((.+?)\)/);
  if (!link) return null;
  const hasVorm = row.length >= 6;
  const vorm = hasVorm ? row[2].text.trim().toLowerCase() : 'instrument';
  const wat = hasVorm ? row[3].text : row[2].text;
  const openCell = (hasVorm ? (row[4] ? row[4].text : '') : (row[3] ? row[3].text : '')).trim();
  const open = openCell.match(/\[(.+?)\]\((.+?)\)/);
  const doelgroep = hasVorm ? (row[5] ? row[5].text : '') : (row[4] ? row[4].text : '');
  return {
    naam: link[1],
    repo: link[2],
    status: row[1].text.trim(),
    vorm: vorm,
    wat: wat,
    live: open ? open[2] : null,
    liveLabel: open ? open[1] : '',
    doelgroep: doelgroep,
    waarvoor: (hasVorm && row[6] ? row[6].text : '').trim().toLowerCase(),
  };
}

/**
 * Parses the projects table out of PROJECTEN.md.
 * @returns {object[]} Projects.
 */
function readProjects() {
  const tokens = marked.lexer(readFileSync(PROJECTEN_FILE, 'utf8'), { gfm: true });
  const table = tokens.find(
    (tok) => tok.type === 'table' && tok.header.some((h) => h.text.toLowerCase() === 'status'),
  );
  if (!table) throw new Error('Projectentabel niet gevonden in ' + PROJECTEN_FILE);
  return table.rows.map(projectFromRow).filter(Boolean);
}

/**
 * Renders a single project card.
 * @param {object} project Project data.
 * @param {number} i Card index for staggered animation.
 * @returns {string} Card HTML.
 */
// De vorm zegt wat je krijgt als je klikt. Hij was de indeling van de pagina en is nu een label:
// de indeling volgt de vraag, de vorm blijft de belofte (statuut B14).
const VORM_LABEL = {
  instrument: 'in je browser',
  kennis: 'leeswerk',
  dataset: 'dataset',
  script: 'lokaal script',
};

function renderCard(project, i) {
  const href = project.live || project.repo;
  const opener = project.live ? `<span class="card-open">${escapeHtml(project.liveLabel)}</span>` : '';
  const vorm = VORM_LABEL[project.vorm]
    ? `<span class="badge badge-vorm">${escapeHtml(VORM_LABEL[project.vorm])}</span>` : '';
  return [
    `<a class="card" href="${escapeHtml(href)}" style="--d:${i}">`,
    `<span class="card-top"><span class="card-title">${escapeHtml(project.naam)}</span>`,
    `<span class="card-labels">${vorm}`,
    `<span class="${statusClass(project.status)}">${escapeHtml(project.status)}</span></span></span>`,
    `<span class="card-desc">${marked.parseInline(stripLinks(project.wat))}</span>`,
    `<span class="card-doelgroep">${marked.parseInline(stripLinks(project.doelgroep))}</span>`,
    opener,
    `</a>`,
  ].join('');
}

/**
 * Renders project cards grouped by form (statuut B14).
 * @returns {string} HTML for project groups.
 */
function projectGroepen() {
  const projects = readProjects();
  // Ingedeeld naar de vraag waarmee iemand binnenkomt, niet naar de technische vorm: die staat als
  // label op de kaart. De sleutel is de kolom Waarvoor in PROJECTEN.md (statuut B9).
  const groepen = [
    {
      id: 'vaststellen',
      titel: 'Vaststellen hoe je ervoor staat',
      uitleg: 'Zelfcheck, meting en toetsing: van een uur alleen aan tafel tot bewijs uit je eigen exports.',
    },
    {
      id: 'aanpakken',
      titel: 'Aanpakken en inrichten',
      uitleg: 'Werkende kennis en draaiboeken uit de praktijk van publieke organisaties, met de keuzes die het verschil maken.',
    },
    {
      id: 'aantonen',
      titel: 'Aantonen en overtuigen',
      uitleg: 'Wat je met een maatregel aantoont in BIO 2.0, NIST CSF, Wpg en AVG, en hoe je het gesprek met bestuurders voert.',
    },
    {
      id: 'delen',
      titel: 'Veilig delen en publiceren',
      uitleg: 'Documenten anonimiseren en publicaties nalopen voordat ze de deur uit gaan.',
    },
  ];

  let html = '';
  let cardIdx = 0;
  for (const g of groepen) {
    const items = projects.filter((p) => p.waarvoor === g.id);
    if (items.length === 0) continue;
    html += `<h3>${escapeHtml(g.titel)}</h3>\n`;
    html += `<p class="groep-uitleg">${escapeHtml(g.uitleg)}</p>\n`;
    html += `<div class="cards">\n${items.map((p) => renderCard(p, cardIdx++)).join('\n')}\n</div>\n`;
  }

  const rest = projects.filter((p) => !groepen.some((g) => g.id === p.waarvoor));
  if (rest.length > 0) {
    html += `<h3>Overige projecten</h3>\n`;
    html += `<div class="cards">\n${rest.map((p) => renderCard(p, cardIdx++)).join('\n')}\n</div>\n`;
  }
  return html;
}

/**
 * Extracts the Gearchiveerd block from PROJECTEN.md.
 * @returns {string} HTML for archived section.
 */
function gearchiveerdBlok() {
  const raw = readFileSync(PROJECTEN_FILE, 'utf8');
  const m = raw.match(/\*\*Gearchiveerd:\*\*[\s\S]*?(?=\n\n\*\*|\n## |$)/);
  if (!m) return '';
  return `<p>${marked.parseInline(m[0])}</p>`;
}

/**
 * Renders the generated projects block for llms.txt: every project from the
 * organisation profile, grouped by status label (redactiestatuut B8).
 * @returns {string} Markdown block, without surrounding markers.
 */
function projectsBlock() {
  const projects = readProjects();
  const line = (p) => {
    const wat = stripLinks(p.wat).replace(/\s+/g, ' ').trim().replace(/\.$/, '');
    const bron = p.live ? ` Broncode: ${p.repo}` : '';
    return `- [${p.naam}](${p.live || p.repo}): ${wat}.${bron}`;
  };
  const groep = (kop, status, uitleg) => {
    const rows = projects.filter((pr) => pr.status.toLowerCase() === status);
    if (rows.length === 0) return '';
    return `### ${kop}\n\n${uitleg}\n\n${rows.map(line).join('\n')}\n\n`;
  };
  return (
    'Gegenereerd uit de projectentabel van het organisatieprofiel; statuslabels volgen het\n' +
    'redactiestatuut B8.\n\n' +
    groep('In gebruik', 'in gebruik', 'Draait echt en heeft groene tests of CI.') +
    groep('Prototype', 'prototype', 'Werkt en is te draaien, zonder belofte over volledigheid of onderhoud.') +
    groep('Concept', 'concept', 'Ontwerp, plan of documentatie; nog geen werkende code.')
  ).trimEnd();
}

/**
 * Replaces the generated projects block inside llms.txt, leaving every
 * hand-written section untouched.
 * @returns {string} Updated llms.txt content.
 */
function updateLlmsTxt() {
  const pad = join(ROOT, 'llms.txt');
  const huidig = readFileSync(pad, 'utf8');
  const START = '<!-- projecten:start (gegenereerd, niet met de hand bewerken) -->';
  const EIND = '<!-- projecten:eind -->';
  const blok = `${START}\n\n${projectsBlock()}\n\n${EIND}`;
  const i = huidig.indexOf(START);
  const j = huidig.indexOf(EIND);
  if (i !== -1 && j > i) {
    return huidig.slice(0, i) + blok + huidig.slice(j + EIND.length);
  }
  const optional = huidig.indexOf('## Optional');
  const sectie = `## Alle projecten\n\n${blok}\n\n`;
  if (optional === -1) return `${huidig.trimEnd()}\n\n${sectie}`;
  return huidig.slice(0, optional) + sectie + huidig.slice(optional);
}

/**
 * Merges the sitemap: existing entries keep their verified lastmod, and every
 * project page on this domain that is still missing gets added.
 * @returns {string} Updated sitemap.xml content.
 */
function updateSitemap() {
  const pad = join(ROOT, 'sitemap.xml');
  const huidig = readFileSync(pad, 'utf8');
  const vandaag = new Date().toISOString().slice(0, 10);
  const entries = [];
  const seen = new Set();
  const re = /<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>\s*<\/url>/g;
  let m;
  while ((m = re.exec(huidig)) !== null) {
    entries.push({ loc: m[1], lastmod: m[2] });
    seen.add(m[1]);
  }
  const kandidaten = [
    'https://security-commons-nl.github.io/',
    'https://security-commons-nl.github.io/ai-hulp/',
    'https://security-commons-nl.github.io/backlog/',
    ...readProjects().map((pr) => pr.live).filter(Boolean),
  ];
  for (const loc of kandidaten) {
    if (loc.startsWith('https://security-commons-nl.github.io/') && !seen.has(loc)) {
      entries.push({ loc, lastmod: vandaag });
      seen.add(loc);
    }
  }
  const body = entries
    .map((e) => `  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schema/sitemap/0.9">\n${body}\n</urlset>\n`;
}

/**
 * Renders one Markdown token, upgrading recognized structures.
 * @param {object} token Marked token.
 * @returns {string} HTML for this token.
 */
function renderToken(token) {
  if (token.type === 'table') {
    return `<div class="tablewrap">${marked.parser([token])}</div>`;
  }
  if (token.type === 'blockquote') {
    return `<div class="callout">${marked.parser(token.tokens)}</div>`;
  }
  if (token.type === 'heading' && token.depth === 2) {
    const id = token.text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `<h2 id="${id}">${marked.parseInline(token.text)}</h2>`;
  }
  if (token.type === 'html') {
    return token.raw;
  }
  return marked.parser([token]);
}

/**
 * Rewrites relative links and images to absolute GitHub URLs.
 * @param {string} html Rendered HTML.
 * @returns {string} HTML with absolute URLs.
 */
function rewriteLinks(html) {
  return html
    .replace(/src="(?!https?:|\/)([^"]+)"/g, `src="${RAW_BASE}$1"`)
    .replace(/href="(?!https?:|#|\/|mailto:)([^"]+)"/g, `href="${BLOB_BASE}$1"`);
}

/**
 * Wraps rendered body content in the shared page shell.
 * @param {{title: string, description: string, canonical: string, body: string, generatedFrom: string}} page Page data.
 * @returns {string} Full HTML document.
 */
function pageShell(page) {
  const css = readFileSync(join(ROOT, 'site', 'landing.css'), 'utf8');
  return `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${page.title}</title>
<meta name="description" content="${page.description}">
<link rel="canonical" href="${page.canonical}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate icon" href="/favicon.ico" sizes="32x32">
<style>
${css}
</style>
</head>
<body>
<main class="inner">
<img class="merk" src="/logo.png" width="88" height="88"
     alt="Logo Security Commons NL: een uil boven gebouwen van de publieke sector">
${page.body}
</main>
<footer class="inner">
  <p>Bron: <a href="https://github.com/security-commons-nl">github.com/security-commons-nl</a> ·
     Voor geautomatiseerde systemen: <a href="/llms.txt">llms.txt</a> en <a href="/robots.txt">robots.txt</a> ·
     Deze pagina wordt automatisch gegenereerd uit ${page.generatedFrom}.</p>
</footer>
</body>
</html>
`;
}

function kaartTekst(tekst) {
  let kort = tekst.split(/[:;.]/)[0].trim();
  if (kort.length < 15) kort = tekst.trim();
  if (kort.length > 105) {
    const komma = kort.lastIndexOf(',', 105);
    kort = (komma > 40 ? kort.slice(0, komma) : kort.slice(0, 105)).trim();
  }
  return kort;
}

/**
 * The three highlighted cards. Statuut B9: the first three rows with a live link, so the editorial
 * order of PROJECTEN.md decides what is on top. The questions above the names are editorial text and
 * come from the placeholder in content.md, not from this file.
 * @param {string[]} vragen One question per card, in the same order.
 * @returns {string} HTML for the highlight section.
 */
function uitgelicht(vragen) {
  const rijen = readProjects().filter((p) => p.live).slice(0, 3);
  if (rijen.length < 3) throw new Error(`Minder dan drie projecten met een live link (${rijen.length})`);
  const kaarten = rijen.map((pr, i) => `
    <a class="kaart" href="${escapeHtml(pr.live)}">
      ${vragen[i] ? `<span class="kaart-vraag">${escapeHtml(vragen[i])}</span>` : ''}
      <span class="kaart-naam">${escapeHtml(pr.naam)}</span>
      <span class="kaart-wat">${escapeHtml(kaartTekst(pr.wat))}</span>
      <span class="kaart-voor">${escapeHtml(pr.doelgroep)}</span>
    </a>`).join('');
  return `<section class="uitgelicht" aria-label="Uitgelicht">${kaarten}</section>`;
}

function buildLandingPage() {
  let content = readFileSync(CONTENT_FILE, 'utf8');
  // De vragen boven de drie kaarten staan bij de placeholder in content.md; redactionele tekst hoort
  // niet in deze build. Zonder vragen blijven het gewone kaarten.
  const merk = content.match(/<!-- UITGELICHT(?::([^>]*))? -->/);
  const vragen = merk && merk[1] ? merk[1].split('|').map((v) => v.trim()) : [];
  content = content.replace(merk ? merk[0] : '<!-- UITGELICHT -->', uitgelicht(vragen));
  content = content.replace('<!-- PROJECTEN_GROEPEN -->', projectGroepen());
  content = content.replace('<!-- GEARCHIVEERD -->', gearchiveerdBlok());

  const tokens = marked.lexer(content, { gfm: true });
  return pageShell({
    title: 'Security Commons NL: open securitykennis voor de publieke sector',
    description: 'Publieke organisaties bouwen samen aan digitale weerbaarheid: kennis, tooling en aanpakken, open source onder EUPL-1.2.',
    canonical: 'https://security-commons-nl.github.io/',
    body: rewriteLinks(tokens.map(renderToken).join('')),
    generatedFrom: 'PROJECTEN.md en de site-bronnen',
  });
}

// De uitleg over de AI-hulp met eigen sleutel. Eigen pagina, want het geldt voor alle
// instrumenten met een AI-hulp en niet voor een van de tools in het bijzonder.
function buildAiHulpPage() {
  const content = readFileSync(join(ROOT, 'site', 'ai-hulp.md'), 'utf8');
  const tokens = marked.lexer(content, { gfm: true });
  return pageShell({
    title: 'AI-hulp met je eigen sleutel: Security Commons NL',
    description: 'Wat de opt-in AI-hulp in onze instrumenten doet, wat er wel en niet naar buiten gaat, en hoe je zelf bepaalt hoe groot het risico is.',
    canonical: 'https://security-commons-nl.github.io/ai-hulp/',
    body: rewriteLinks(tokens.map(renderToken).join('')),
    generatedFrom: 'site/ai-hulp.md',
  });
}

// ── De backlog ────────────────────────────────────────────────────────────────────────────────
// Issues voor wat mensen bedenken, een gegenereerde pagina voor wat het systeem zelf ziet (besluit
// 30-08-2026). Deze pagina haalt bij elke build de open issues en pull requests van de org op, plus
// de barrieres zonder handleiding uit de aanvalspaden. Alleen "Nu aan de beurt" in backlog.md is
// handwerk. Valt de API uit, dan bouwt de site gewoon door en zegt de pagina dat de lijst ontbreekt.

const ORG = 'security-commons-nl';
const ISSUES_URL = `https://api.github.com/search/issues?q=org:${ORG}+is:open+archived:false&per_page=100`;
const GEVRAAGD_URL = `https://raw.githubusercontent.com/${ORG}/aanvalspaden/main/mappingen/gevraagd.json`;
const NORMEN_URL = 'https://security-commons-nl.github.io/aanvalspaden/normen/';

/**
 * Fetches JSON, or reads a local file when an override is set (tests, offline builds).
 * @param {string} url
 * @param {string|undefined} bestand Path from the environment that replaces the fetch.
 */
async function haalJson(url, bestand) {
  if (bestand) return JSON.parse(readFileSync(bestand, 'utf8'));
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'security-commons-nl-site' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const r = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`HTTP ${r.status} bij ${url}`);
  return r.json();
}

/** Groups open items by kind: plan, schrijfopdracht, idee, pull request, or without a label. */
function groepeerBacklog(items) {
  const groepen = { plan: [], schrijfopdracht: [], idee: [], pr: [], overig: [] };
  for (const it of items) {
    const labels = (it.labels || []).map((l) => (typeof l === 'string' ? l : l.name));
    const item = {
      repo: it.repository_url.split('/').pop(),
      nummer: it.number,
      titel: it.title,
      url: it.html_url,
      labels,
    };
    if (it.pull_request) groepen.pr.push(item);
    else if (labels.includes('plan')) groepen.plan.push(item);
    else if (labels.includes('schrijfopdracht')) groepen.schrijfopdracht.push(item);
    else if (labels.includes('idee')) groepen.idee.push(item);
    else groepen.overig.push(item);
  }
  for (const lijst of Object.values(groepen)) {
    lijst.sort((a, b) => a.repo.localeCompare(b.repo) || a.nummer - b.nummer);
  }
  return groepen;
}

function backlogLijst(items) {
  if (items.length === 0) return '<p class="leeg">Niets open.</p>';
  const regels = items.map((it) =>
    `<li><a href="${escapeHtml(it.url)}"><code>${escapeHtml(it.repo)}#${it.nummer}</code></a> ${escapeHtml(it.titel)}</li>`);
  return `<ul class="backlog">\n${regels.join('\n')}\n</ul>`;
}

function backlogGroep(kop, uitleg, items) {
  return `<h2 id="${kop.toLowerCase().replace(/[^a-z0-9]+/g, '-')}">${escapeHtml(kop)} <span class="telling">${items.length}</span></h2>\n` +
    `<p>${uitleg}</p>\n${backlogLijst(items)}\n`;
}

function gatenBlok(gevraagd) {
  const rijen = (gevraagd.gevraagd || []).map((g) =>
    `<li><code>${escapeHtml(g.barriere)}</code> <span class="cluster">${escapeHtml(g.cluster)}</span>: ${escapeHtml(g.zou_moeten_dekken)}</li>`);
  return `<h2 id="gaten-uit-de-data">Gaten uit de data <span class="telling">${rijen.length}</span></h2>\n` +
    `<p>Barrieres uit de zelfcheck waar nog geen handleiding bij ligt. Dit is geen issue: de lijst komt uit ` +
    `<code>mappingen/gevraagd.json</code> in de aanvalspaden en verdwijnt zodra de kennisbank het stuk heeft. ` +
    `Op <a href="${NORMEN_URL}">Van aanvalspad naar norm</a> staat per barriere een knop om mee te schrijven.</p>\n` +
    (rijen.length ? `<ul class="backlog">\n${rijen.join('\n')}\n</ul>\n` : '<p class="leeg">Elke barriere heeft een handleiding.</p>\n');
}

/**
 * Renders the generated part of the backlog page.
 * @param {{issues: object|null, gevraagd: object|null, fout: string|null}} bron
 */
function backlogBlok(bron) {
  let html = '';
  if (bron.issues) {
    const g = groepeerBacklog(bron.issues.items || []);
    html += backlogGroep('Open plannen', 'Bouwwerk met een uitgeschreven plan erachter, in de repo waar het landt. Het planbestand is het waarom, het issue is de stand.', g.plan);
    html += backlogGroep('Schrijfopdrachten', 'Stukken die de kennisbank nog mist. Wie het weet, schrijft het; het issue zegt wat het moet dekken.', g.schrijfopdracht);
    html += backlogGroep('Ideeen', 'Sprongen: iets dat er nog helemaal niet is en waar nog geen plan voor ligt.', g.idee);
    if (g.overig.length) html += backlogGroep('Zonder label', 'Open issues die nog geen van de drie labels dragen.', g.overig);
    html += backlogGroep('Onderhoud', 'Open pull requests, meestal van de robot die afhankelijkheden bijhoudt.', g.pr);
  } else {
    html += `<div class="callout"><p><strong>De issues konden bij deze build niet worden opgehaald</strong> (${escapeHtml(bron.fout || 'onbekende reden')}). ` +
      `Kijk rechtstreeks op <a href="https://github.com/issues?q=org%3A${ORG}+is%3Aopen">github.com</a>; bij de volgende build staat de lijst er weer.</p></div>\n`;
  }
  if (bron.gevraagd) {
    html += gatenBlok(bron.gevraagd);
  } else {
    html += `<div class="callout"><p><strong>De gaten uit de aanvalspaden konden niet worden opgehaald</strong> (${escapeHtml(bron.gevraagdFout || 'onbekende reden')}).</p></div>\n`;
  }
  return html;
}

async function haalBacklogBron() {
  const bron = { issues: null, gevraagd: null, fout: null, gevraagdFout: null };
  try {
    bron.issues = await haalJson(ISSUES_URL, process.env.BACKLOG_ISSUES_FILE);
  } catch (e) {
    bron.fout = e.message;
    console.warn(`backlog: issues niet opgehaald: ${e.message}`);
  }
  try {
    bron.gevraagd = await haalJson(GEVRAAGD_URL, process.env.BACKLOG_GEVRAAGD_FILE);
  } catch (e) {
    bron.gevraagdFout = e.message;
    console.warn(`backlog: gevraagd.json niet opgehaald: ${e.message}`);
  }
  return bron;
}

async function buildBacklogPage() {
  const bron = await haalBacklogBron();
  const content = readFileSync(join(ROOT, 'site', 'backlog.md'), 'utf8').replace('<!-- BACKLOG -->', backlogBlok(bron));
  const tokens = marked.lexer(content, { gfm: true });
  return pageShell({
    title: 'Backlog: Security Commons NL',
    description: 'Wat er open staat in de commons, over alle repositories heen: open plannen, schrijfopdrachten, ideeen, onderhoud en de gaten die uit de data volgen.',
    canonical: 'https://security-commons-nl.github.io/backlog/',
    body: rewriteLinks(tokens.map(renderToken).join('')),
    generatedFrom: 'de open issues op GitHub, mappingen/gevraagd.json van de aanvalspaden en site/backlog.md',
  });
}

function buildToolsRedirect() {
  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=/">
<link rel="canonical" href="https://security-commons-nl.github.io/">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="alternate icon" href="/favicon.ico" sizes="32x32">
<meta name="robots" content="noindex">
<title>Verplaatst naar de hoofdpagina</title>
</head>
<body>
<p>De toolpagina is opgegaan in de <a href="/">hoofdpagina</a>: daar staat de projectentabel met alle
tools. Tooling van anderen staat in de
<a href="https://security-commons-nl.github.io/kennisbank/security/referenties-tooling/">kennisbank</a>.</p>
</body>
</html>
`;
}

for (const map of ['tools', 'ai-hulp', 'backlog']) {
  mkdirSync(join(ROOT, 'dist', map), { recursive: true });
}
writeFileSync(join(ROOT, 'dist', 'index.html'), buildLandingPage());
writeFileSync(join(ROOT, 'dist', 'tools', 'index.html'), buildToolsRedirect());
writeFileSync(join(ROOT, 'dist', 'ai-hulp', 'index.html'), buildAiHulpPage());
writeFileSync(join(ROOT, 'dist', 'backlog', 'index.html'), await buildBacklogPage());

for (const [naam, inhoud] of [['llms.txt', updateLlmsTxt()], ['sitemap.xml', updateSitemap()]]) {
  writeFileSync(join(ROOT, naam), inhoud);
  writeFileSync(join(ROOT, 'dist', naam), inhoud);
}
for (const file of STATIC_FILES) {
  mkdirSync(dirname(join(ROOT, 'dist', file)), { recursive: true });
  copyFileSync(join(ROOT, file), join(ROOT, 'dist', file));
}
console.log('Wrote dist/index.html, dist/ai-hulp/index.html, dist/backlog/index.html, dist/tools/index.html, llms.txt, sitemap.xml and static root files');
