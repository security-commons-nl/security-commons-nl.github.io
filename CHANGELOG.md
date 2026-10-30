# Wijzigingen aan de voorpagina

Nieuwste bovenaan. Wat er op https://security-commons-nl.github.io/ verandert; de projectenlijst zelf komt uit
PROJECTEN.md in de repo `.github`.

## 2026-10

- 30-10: De routetest waarschuwt voor een instrument in een route dat de lat (statuut C5) nog niet haalt: een
  regel `LET OP` in de log en een `::warning` in de CI, geen fout. Een prototype dat er al stond, blijft tot zijn
  eerstvolgende aanraking; zo blijft het zichtbaar. Nu geldt dat alleen voor de procescheck. De routetest draait
  daarvoor nu ook in de CI; sinds 29-10 stond hij er niet in, zodat ook een dode route-link niet werd gevangen.
- 30-10: `llms.txt` beschrijft het profiel zoals het nu werkt (voorpagina, kennisbank en beleidsset lezen het;
  het voorstel van de AI-hulp is op `/profiel/` over te nemen).
- 29-10: **AI-hulp wijst naar je profiel (plan het profiel, stap 5).** De uitleg op `/ai-hulp/` noemt dat het
  voorstel voor de contextvragen ook op `/profiel/` te laden is, en dan voor de hele commons geldt.
- 29-10: **De assistent vult het profiel (plan het profiel, stap 4).** Op `/profiel/` laad je het voorstel dat de
  AI-hulp van de beleidsset maakt (opdracht "Contextvragen beantwoorden uit een beschrijving van je organisatie",
  eigen sleutel of lokaal model). Per vraag zie je het voorstel en het citaat; een regel waarvan het citaat niet in
  je document staat, staat uit. Alleen wat je aanvinkt en wat in de vragenlijst bestaat, komt in het profiel; het
  citaat nooit. Geen nieuwe AI-code: de citaatcontrole blijft op een plek. `/profiel/` noemt nu ook waar het
  profiel doorwerkt (voorpagina en kennisbank).
- 29-10: **Rol en situatie, en een suggestie uit je profiel (plan het profiel, stap 3).** `routes.json` heeft per
  route een `soort`: vier rollen en de situatie "eerste honderd dagen", met dezelfde id's. Boven de routes een
  rolkiezer (meer rollen tegelijk, bewaard onder `commons-rol`): gekozen rollen vooraan, de andere achter "Toon
  alle rollen". Situaties staan in een eigen rij, "Zit je hierin?". Met een profiel leest de pagina
  `/kennisbank/profielregels.json` en stelt een route of situatie voor, met het waarom en een knop om het voor de
  sessie weg te klikken. Inline scripts gaan door een `inlineScript()` die de twee valkuilen van marked afvangt;
  `site/test_rolkiezer.mjs` toetst het gedrag.
- 29-10: **Jouw profiel (`/profiel/`, plan stap 9).** Zestien vragen uit `profiel.json` van de kennisbank, als
  vaste keuzes zonder naam of inventaris, ingevuld in de browser onder de bewaarnaam `commons-profiel` die elke
  pagina op dit domein kan lezen. Knoppen: opslaan als bestand, laden uit bestand, link kopieren (profiel achter
  het hekje, verlaat de browser niet), wissen. Onbekende waarden vallen bij laden weg. De beleidsset leest
  hetzelfde profiel; de voorpagina en de kennisbank volgen. Topbalk heeft een knop Profiel.
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
