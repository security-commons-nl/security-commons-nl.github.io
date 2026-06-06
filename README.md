# security-commons-nl.github.io

Root-site van Security Commons NL. Deze repo bestaat omdat crawlers `robots.txt`,
`llms.txt` en `sitemap.xml` uitsluitend op de domeinroot lezen; projectsites
(zoals [Handelingsperspectief](https://github.com/security-commons-nl/Handelingsperspectief))
leven op een subpad.

| Bestand | Doel |
|---|---|
| `site/build.mjs` | Genereert de landingspagina uit de [organisatie-README](https://github.com/security-commons-nl/.github/blob/main/profile/README.md) |
| `robots.txt` | Alle crawlers en AI-systemen expliciet en vendor-neutraal toegestaan |
| `llms.txt` | Inhoudswijzer voor LLM's/agents ([llmstxt.org](https://llmstxt.org)) |
| `sitemap.xml` | Sitemap voor zoekmachines |

De workflow bouwt bij elke push, en daarnaast **elk uur** (cron): wijzigingen aan de
organisatie-README in de `.github`-repo kunnen deze repo niet rechtstreeks triggeren,
dus die komen binnen een uur door. Direct nodig? Start de workflow handmatig
(Actions → *Build and deploy Pages* → *Run workflow*).

## Licentie

[EUPL-1.2](LICENSE) (European Union Public Licence v1.2).

### Gebruikte software en afhankelijkheden

| Software / afhankelijkheid | Gebruik | Licentie |
|---|---|---|
| [marked](https://github.com/markedjs/marked) 18.0.5 | Markdown-naar-HTML-conversie in de sitebuild (alleen buildtijd) | MIT |
| GitHub Actions (`actions/checkout`, `actions/setup-node`, `actions/upload-pages-artifact`, `actions/deploy-pages`) | Automatische build en publicatie naar GitHub Pages | MIT |
