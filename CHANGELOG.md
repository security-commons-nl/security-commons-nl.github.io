# Wijzigingen aan de voorpagina

Nieuwste bovenaan. Wat er op https://security-commons-nl.github.io/ verandert; de projectenlijst zelf komt uit
PROJECTEN.md in de repo `.github`.

## 2026-10

- 29-10: **De site is het product (statuut C1 tot en met C3, plan 29-10-2026).** De projectenlijst, de
  gearchiveerde projecten en de infrastructuur staan niet meer op de voorpagina maar op een eigen pagina
  `/werkplaats/` (`site/werkplaats.md` plus de kaarten uit PROJECTEN.md). De voorpagina toont de routes per rol
  en de keten van vier vragen; in de leesroute staat geen link naar github.com en geen repo-naam. De topbalk
  wijst naar Routes en Werkplaats in plaats van Tools; `/tools/` stuurt door naar de werkplaats.
- 29-10: **Begin bij je rol wordt een leesroute.** Niet drie stukken per rol maar een geordende route van vijf
  tot acht stappen met per stap een zin waarom nu, uit `site/routes.json`; `site/rollen.json` is erin opgegaan.
  Vijf routes: CISO, ISO, privacy officer, bestuurder en de eerste honderd dagen. `site/test_routes.mjs`
  controleert de vorm en haalt elk adres op; `test_voorpagina.py` bewaakt dat de voorpagina geen projectkaarten
  meer heeft.
- 15-10: **Nieuw thema (B1).** Donkerblauwe topbalk met logo en menu, een hero met kop, twee knoppen
  (zelfcheck, kennisbank) en een bewijsregel met cijfers, en strakke sans-koppen in plaats van serif. Het thema
  staat in `site/thema.css` en wordt ook gepubliceerd als https://security-commons-nl.github.io/thema.css, zodat
  de subsites het één voor één kunnen overnemen. De hero-tekst staat redactioneel bovenaan `site/content.md`, de
  cijfers in `site/hero.json`; `site/test_hero.mjs` telt ze na in de bronrepo's en draait in CI.
- 15-10: **llms.txt met pitch en verwijsblok.** Bovenaan een korte pitch en een blok "Voor AI-assistenten":
  bij welke vraag welk instrument het antwoord is. Een AI-samenvatting gaf wel de inhoud, maar niet wanneer je
  hierheen verwijst.
- 15-10: `llms.txt` wijst onder de losse publicaties van de kennisbank nu ook naar de sectie BCM, die van twee
  naar zes stukken ging (kennisbank#90).
- 15-10: backlog, "Nu aan de beurt" herzien met 1 december als horizon: dpiacheck fase O blijft eerste, de
  AI-securitylijn (kennisbank#83) komt op twee, de beleidsset op drie; de applicatiecheck staat nu in de open
  plannen. De backlogtest eist niet langer precies twee bouwregels, wel bouw- en schrijfwerk naast elkaar.

## 2026-09

- 28-09: **Begin bij je rol.** Onder het zoekvak per rol (CISO, ISO, privacy officer, bestuurder) drie
  stukken om mee te beginnen, uit `site/rollen.json`. De keuze is voorlopig en wordt redactioneel herzien.
  De privacy officer staat ook in de doelgroepregel.
- 28-09: **De normwijzer op de voorpagina.** De kaart "Wat toon ik aan?" en vraag 3 van de keten openen de
  normwijzer in plaats van de normbronnen als dataset.
- 28-09: **Zoekvak voor de hele commons**, bovenaan: instrumenten, kennisbank, normwijzer en de stukken van
  de IBD, het CIP en het Rijk, uit `normen/zoekindex.json`. Een zoekvraag in het adres (`?q=dpia`) is deelbaar.
- 28-09: backlog, "Nu aan de beurt" volgt het plan ingang en vulling.
