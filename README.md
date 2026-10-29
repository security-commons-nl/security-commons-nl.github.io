# security-commons-nl.github.io

De root-site van Security Commons NL: de voorpagina, llms.txt, robots.txt en de sitemap.

Status: infrastructuur. Draait in productie; geen los product, maar ondersteunende infrastructuur.

> **Live:** [security-commons-nl.github.io](https://security-commons-nl.github.io/)

Root-site van Security Commons NL. Deze repo bestaat omdat crawlers `robots.txt`,
`llms.txt` en `sitemap.xml` uitsluitend op de domeinroot lezen; projectsites
(zoals [ai-gebruik-in-beeld](https://github.com/security-commons-nl/ai-gebruik-in-beeld))
leven op een subpad.

| Bestand | Doel |
|---|---|
| `site/build.mjs` | Genereert de landingspagina uit `site/content.md` en PROJECTEN.md in de `.github`-repo |
| `site/thema.css` | Het thema van de commons (rijksblauw, sans-koppen, topbalk en hero); ook live op `/thema.css` voor de subsites |
| `site/hero.json` | De cijfers in de hero, met bron per cijfer; `site/test_hero.mjs` telt ze na |
| `site/routes.json` | De leesroutes per rol op de voorpagina (statuut C2); `site/test_routes.mjs` controleert vorm en of elk adres bestaat |
| `site/werkplaats.md` | De werkplaatspagina (`/werkplaats/`): alle projecten met status, gearchiveerd en infrastructuur, uit PROJECTEN.md |
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

`npm ci` en daarna `node site/build.mjs`; de voorpagina komt uit `site/content.md` en `site/routes.json`, de werkplaats uit `site/werkplaats.md` en PROJECTEN.md. Testen: `python -m pytest site` en de `node site/test_*.mjs`-bestanden.

## Bijdragen

Zie de [CONTRIBUTING](https://github.com/security-commons-nl/.github/blob/main/CONTRIBUTING.md) van de organisatie: daar staat per project een formulier, ook zonder Git-ervaring.

## Licentie

EUPL-1.2, zie [LICENSE](LICENSE).
