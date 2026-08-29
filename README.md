# security-commons-nl.github.io

De root-site van Security Commons NL: de voorpagina, llms.txt, robots.txt en de sitemap.

Status: infrastructuur. Draait in productie; geen los product, maar ondersteunende infrastructuur.

> **Live:** [security-commons-nl.github.io](https://security-commons-nl.github.io/)

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

## Voor wie

Beheerders van de commons; bezoekers zien alleen het resultaat.

## Snel starten

`npm ci` en daarna `node site/build.mjs`; de voorpagina komt uit het org-profiel.

## Bijdragen

Zie de [CONTRIBUTING](https://github.com/security-commons-nl/.github/blob/main/CONTRIBUTING.md) van de organisatie: daar staat per project een formulier, ook zonder Git-ervaring.

## Licentie

EUPL-1.2, zie [LICENSE](LICENSE).
