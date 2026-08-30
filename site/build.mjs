// Build script: renders the organisation profile README
// (security-commons-nl/.github -> profile/README.md, checked out by the
// workflow into org-profile/) as the root landing page. Static root files
// (robots.txt, llms.txt, sitemap.xml) are copied to dist/ unchanged.
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { marked } from 'marked';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROFILE_README = join(ROOT, 'org-profile', 'profile', 'README.md');
const RAW_BASE = 'https://raw.githubusercontent.com/security-commons-nl/.github/main/profile/';
const BLOB_BASE = 'https://github.com/security-commons-nl/.github/blob/main/profile/';
// llms.txt en sitemap.xml worden gegenereerd uit de projectentabel (statuut B9),
// niet gekopieerd.
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
 * @param {string} status Status text, e.g. "Actief".
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
 * Renders the projects table (Project|Status|Wat|Doelgroep) as a card grid.
 * @param {object} token Marked table token.
 * @returns {string} Card grid HTML.
 */
function projectCards(token) {
  const cards = token.rows.map((row, i) => {
    const project = projectFromRow(row);
    if (!project) return '';
    // De kaart is zelf een anchor: nooit een tweede anchor erin nesten, dat breekt
    // de kaart in tweeen. Een live-versie wordt daarom het doel van de kaart zelf,
    // met een tekstlabel in plaats van een losse link.
    const href = project.live || project.repo;
    const opener = project.live ? `<span class="card-open">${escapeHtml(project.liveLabel)}</span>` : '';
    return [
      `<a class="card" href="${escapeHtml(href)}" style="--d:${i}">`,
      `<span class="card-top"><span class="card-title">${escapeHtml(project.naam)}</span>`,
      `<span class="${statusClass(project.status)}">${escapeHtml(project.status)}</span></span>`,
      `<span class="card-desc">${marked.parseInline(stripLinks(project.wat))}</span>`,
      `<span class="card-doelgroep">${marked.parseInline(stripLinks(project.doelgroep))}</span>`,
      opener,
      `</a>`,
    ].join('');
  });
  return `<div class="cards">${cards.join('\n')}</div>`;
}

/**
 * Reads one row of the projects table into a project object.
 * Columns: Project | Status | Wat is het? | Direct openen | Doelgroep.
 * @param {object[]} row Marked table row.
 * @returns {?object} Project, or null when the row has no project link.
 */
function projectFromRow(row) {
  const link = row[0].text.match(/\[(.+?)\]\((.+?)\)/);
  if (!link) return null;
  const openCell = (row[3] ? row[3].text : '').trim();
  const open = openCell.match(/\[(.+?)\]\((.+?)\)/);
  return {
    naam: link[1],
    repo: link[2],
    status: row[1].text.trim(),
    wat: row[2].text,
    live: open ? open[2] : null,
    liveLabel: open ? open[1] : '',
    doelgroep: row[4] ? row[4].text : '',
  };
}

/**
 * Parses the projects table out of the organisation profile README.
 * @returns {object[]} Projects.
 */
function readProjects() {
  const tokens = marked.lexer(readFileSync(PROFILE_README, 'utf8'), { gfm: true });
  const table = tokens.find(
    (tok) => tok.type === 'table' && tok.header.some((h) => h.text.toLowerCase() === 'status'),
  );
  if (!table) throw new Error('Projectentabel niet gevonden in profile/README.md');
  return table.rows.map(projectFromRow).filter(Boolean);
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
 * hand-written section untouched. The rest of llms.txt (source files, datasets,
 * KQL queries) is richer than the projects table and stays hand-written.
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
  // Nog geen markers: het blok vlak voor de Optional-sectie invoegen.
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
    const isProjects = token.header.some((h) => h.text.toLowerCase() === 'status');
    if (isProjects) return projectCards(token);
    return `<div class="tablewrap">${marked.parser([token])}</div>`;
  }
  if (token.type === 'blockquote') {
    return `<div class="callout">${marked.parser(token.tokens)}</div>`;
  }
  if (token.type === 'heading' && token.depth === 2) {
    const id = token.text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `<h2 id="${id}">${marked.parseInline(token.text)}</h2>`;
  }
  return marked.parser([token]);
}

/**
 * Rewrites relative README links and images to absolute GitHub URLs.
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

/**
 * Assembles the landing page from the organisation profile README.
 * @returns {string} Full HTML document.
 */
/**
 * Een korte claim voor op een kaart. De kolom "Wat is het?" is een volledige omschrijving; hier past
 * de eerste deelzin. Blijft die te lang, dan knippen we op de laatste komma die nog past.
 */
function kaartTekst(tekst) {
  let kort = tekst.split(/[:;.]/)[0].trim();
  if (kort.length < 15) kort = tekst.trim();
  if (kort.length > 105) {
    const komma = kort.lastIndexOf(',', 105);
    kort = (komma > 40 ? kort.slice(0, komma) : kort.slice(0, 105)).trim();
  }
  return kort;
}

function uitgelicht() {
  const rijen = readProjects().filter((pr) => pr.live).slice(0, 3);
  if (rijen.length < 3) throw new Error(`Minder dan drie projecten met een live link (${rijen.length})`);
  const kaarten = rijen.map((pr) => `
    <a class="kaart" href="${escapeHtml(pr.live)}">
      <span class="kaart-naam">${escapeHtml(pr.naam)}</span>
      <span class="kaart-wat">${escapeHtml(kaartTekst(pr.wat))}</span>
      <span class="kaart-voor">${escapeHtml(pr.doelgroep)}</span>
    </a>`).join('');
  return `<section class="uitgelicht" aria-label="Uitgelicht">${kaarten}</section>`;
}

// Het blok tussen <!-- kant --> in het profiel is geschreven vanuit GitHub en wijst naar de site.
// Hier is het andersom: de lezer staat op de site, dus de verwijzing gaat naar de broncode.
const KANT_SITE = `### \u279c [github.com/security-commons-nl](https://github.com/security-commons-nl/)

Je bent op de voorkant: alle kennis en tools staan hieronder, direct te openen in je browser. De
broncode staat op GitHub, voor wie wil meelezen of meebouwen.`;

/**
 * Wisselt het kant-blok om naar de site-variant.
 * @param {string} markdown Het profiel zoals het op GitHub staat.
 * @returns {string} Markdown voor de site.
 */
function wisselKant(markdown) {
  const blok = /<!-- kant -->[\s\S]*?<!-- \/kant -->/;
  if (!blok.test(markdown)) throw new Error('Blok <!-- kant --> ontbreekt in het profiel');
  return markdown.replace(blok, KANT_SITE);
}

function buildLandingPage() {
  const markdown = wisselKant(readFileSync(PROFILE_README, 'utf8'));
  const tokens = marked.lexer(markdown, { gfm: true });
  const i = tokens.findIndex((t) => t.type === 'heading' && t.text === 'Direct aan de slag');
  if (i === -1) throw new Error('Kop "Direct aan de slag" ontbreekt in het profiel');
  // Na de inleidende alinea onder de kop; marked zet space-tokens tussen de blokken.
  let na = tokens.findIndex((t, n) => n > i && t.type === 'paragraph');
  if (na === -1) throw new Error('Geen alinea onder "Direct aan de slag"');
  const h = uitgelicht();
  tokens.splice(na + 1, 0, { type: 'html', block: true, raw: h, text: h });
  return pageShell({
    title: 'Security Commons NL: open securitykennis voor de publieke sector',
    description: 'Publieke organisaties bouwen samen aan digitale weerbaarheid: kennis, tooling en aanpakken, open source onder EUPL-1.2.',
    canonical: 'https://security-commons-nl.github.io/',
    body: rewriteLinks(tokens.map(renderToken).join('')),
    generatedFrom: 'de organisatie-README',
  });
}

/**
 * De toolpagina is opgeheven (29-08-2026): de projectentabel op de landingspagina is de enige lijst
 * van eigen tools (statuut B9), en tooling van anderen staat in de kennisbank. Deze pagina blijft
 * bestaan als doorverwijzing, zodat een eerder gedeelde link niet doodloopt.
 *
 * @returns {string} Volledig HTML-document dat naar de landingspagina stuurt.
 */
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

mkdirSync(join(ROOT, 'dist', 'tools'), { recursive: true });
writeFileSync(join(ROOT, 'dist', 'index.html'), buildLandingPage());
writeFileSync(join(ROOT, 'dist', 'tools', 'index.html'), buildToolsRedirect());
// llms.txt en sitemap.xml worden bijgewerkt, niet overschreven: het projectenblok
// is gegenereerd, de handgeschreven secties blijven staan (statuut B9).
for (const [naam, inhoud] of [['llms.txt', updateLlmsTxt()], ['sitemap.xml', updateSitemap()]]) {
  writeFileSync(join(ROOT, naam), inhoud);
  writeFileSync(join(ROOT, 'dist', naam), inhoud);
}
for (const file of STATIC_FILES) {
  mkdirSync(dirname(join(ROOT, 'dist', file)), { recursive: true });
  copyFileSync(join(ROOT, file), join(ROOT, 'dist', file));
}
console.log('Wrote dist/index.html, dist/tools/index.html, llms.txt, sitemap.xml and static root files');
