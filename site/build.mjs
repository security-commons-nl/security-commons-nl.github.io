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
const STATIC_FILES = ['robots.txt', 'llms.txt', 'sitemap.xml', '.nojekyll'];

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
  if (key.includes('actief') || key.includes('live')) return 'badge badge-actief';
  if (key.includes('ontwikkeling') || key.includes('cli')) return 'badge badge-bouw';
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
    const link = row[0].text.match(/\[(.+?)\]\((.+?)\)/);
    if (!link) return '';
    const status = row[1].text.trim();
    return [
      `<a class="card" href="${escapeHtml(link[2])}" style="--d:${i}">`,
      `<span class="card-top"><span class="card-title">${escapeHtml(link[1])}</span>`,
      `<span class="${statusClass(status)}">${escapeHtml(status)}</span></span>`,
      `<span class="card-desc">${marked.parseInline(stripLinks(row[2].text))}</span>`,
      `<span class="card-doelgroep">${marked.parseInline(stripLinks(row[3].text))}</span>`,
      `</a>`,
    ].join('');
  });
  return `<div class="cards">${cards.join('\n')}</div>`;
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
<style>
${css}
</style>
</head>
<body>
<main class="inner">
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
function buildLandingPage() {
  const markdown = readFileSync(PROFILE_README, 'utf8');
  const tokens = marked.lexer(markdown, { gfm: true });
  const banner = [
    `<a class="toolbanner" href="/tools/"><strong>Toolpagina</strong> — gratis scan-tools om je`,
    ` organisatie van buitenaf te toetsen <span aria-hidden="true">→</span></a>`,
  ].join('');
  return pageShell({
    title: 'Security Commons NL — open securitykennis voor de publieke sector',
    description: 'Publieke organisaties bouwen samen aan digitale weerbaarheid: kennis, tooling en aanpakken, open source onder EUPL-1.2.',
    canonical: 'https://security-commons-nl.github.io/',
    body: banner + rewriteLinks(tokens.map(renderToken).join('')),
    generatedFrom: 'de organisatie-README',
  });
}

/**
 * Assembles the tools page from tools.md.
 * @returns {string} Full HTML document.
 */
function buildToolsPage() {
  const markdown = readFileSync(join(ROOT, 'tools.md'), 'utf8');
  const tokens = marked.lexer(markdown, { gfm: true });
  const backlink = `<p class="backlink"><a href="/">← Security Commons NL</a></p>`;
  return pageShell({
    title: 'Toolpagina — Security Commons NL',
    description: 'Gratis, onafhankelijke scan-tools voor de publieke sector: websitecompliance, digitale soevereiniteit, repo-veiligheid en OSINT.',
    canonical: 'https://security-commons-nl.github.io/tools/',
    body: backlink + tokens.map(renderToken).join(''),
    generatedFrom: '<a href="https://github.com/security-commons-nl/security-commons-nl.github.io/blob/main/tools.md">tools.md</a>',
  });
}

mkdirSync(join(ROOT, 'dist', 'tools'), { recursive: true });
writeFileSync(join(ROOT, 'dist', 'index.html'), buildLandingPage());
writeFileSync(join(ROOT, 'dist', 'tools', 'index.html'), buildToolsPage());
for (const file of STATIC_FILES) copyFileSync(join(ROOT, file), join(ROOT, 'dist', file));
console.log('Wrote dist/index.html, dist/tools/index.html and static root files');
