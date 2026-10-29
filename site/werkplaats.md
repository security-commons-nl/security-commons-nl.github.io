# De werkplaats: alle projecten en de code erachter

De [voorpagina](/) is het product: routes per rol en de keten van vier vragen. Dit is de werkplaats:
elk project van de commons met zijn status, en de weg naar de broncode op GitHub. Hier kom je als je
code wilt draaien, wilt meelezen hoe iets is gebouwd, of wilt meebouwen. Voor alles wat je in je browser
doet, hoef je hier niet te zijn.

De lijst komt uit de projectentabel in de repo `.github` (redactiestatuut B9); de statuslabels volgen
B8: *in gebruik* draait echt en heeft groene tests, *prototype* werkt zonder belofte over volledigheid,
*concept* is een ontwerp zonder werkende code. Bij twijfel geldt het lagere label.

## Alle projecten

<!-- PROJECTEN_GROEPEN -->

<!-- GEARCHIVEERD -->

**Tooling van anderen.** Open tools en kennisbanken van buiten de commons die we bruikbaar vinden, met per bron wat het is, wanneer je het inzet en welke wegingen erbij horen: [Externe referenties: security-tooling en kennisbanken](https://security-commons-nl.github.io/kennisbank/security/referenties-tooling/) in de kennisbank.

## Onderliggende infrastructuur

Eén repo bevat geen op zichzelf staand product, maar maakt een ander wel mogelijk:

- [anonimizer-proxy](https://github.com/security-commons-nl/anonimizer-proxy), minimale Cloudflare Worker die de Mistral-API forwardt, zodat anonimizer-browser werkt zonder dat eindgebruikers een eigen Mistral-account hoeven aan te maken. Forward-only, geen opslag, geen logging van inhoud. Zie de [DPA-template](https://github.com/security-commons-nl/.github/blob/main/DPA-template.md) voor de verwerkersrol.
- [security-commons-nl.github.io](https://github.com/security-commons-nl/security-commons-nl.github.io), de site-build: de voorpagina, deze pagina, `llms.txt`, `robots.txt` en de sitemap.
- [.github](https://github.com/security-commons-nl/.github), het redactiestatuut, de principes, de architectuur, de plannen en de projectentabel.

## Hoe het in elkaar zit

Hoe het geheel samenhangt staat in [ARCHITECTUUR.md](https://github.com/security-commons-nl/.github/blob/main/ARCHITECTUUR.md). De regels waaraan elk project voldoet staan in het [redactiestatuut](https://github.com/security-commons-nl/.github/blob/main/REDACTIESTATUUT.md); `repo-compliance.yml` controleert ze bij elke push. Wat er open staat, over alle repositories heen, staat op [de backlog](/backlog/). Waarom dingen zijn zoals ze zijn: [BESLUITEN.md](https://github.com/security-commons-nl/.github/blob/main/BESLUITEN.md) en de [plannen](https://github.com/security-commons-nl/.github/tree/main/plannen).

## Meebouwen

Een issue of discussion is een volwaardige bijdrage. Nog nooit een issue geopend? In [CONTRIBUTING.md](https://github.com/security-commons-nl/.github/blob/main/CONTRIBUTING.md) staat per project een formulier dat je alleen hoeft in te vullen, ook zonder GitHub-account of Git-ervaring.
