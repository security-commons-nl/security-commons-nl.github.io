# security-commons-nl

> Open kennis en tooling voor digitale weerbaarheid, gemaakt door en voor publieke organisaties. Gratis, open source, van ons allemaal.

### ➜ [github.com/security-commons-nl](https://github.com/security-commons-nl/)

Je bent op de voorkant: alle kennis en tools staan hieronder, direct te openen in je browser. De broncode staat op GitHub, voor wie wil meelezen of meebouwen.

## Direct aan de slag

Voor CISO's, ISO's en bestuurders bij gemeenten, provincies, waterschappen en uitvoeringsorganisaties. Alles hieronder werkt vandaag, in je browser, zonder account en zonder factuur. De kern is een keten van vier vragen rond de achttien aanvalspaden van de publieke sector:

<!-- UITGELICHT: Waar sta ik? | Hoe pak ik het aan? | Wat toon ik aan? -->

1. **Hoe sta ik ervoor?** De [zelfcheck](https://security-commons-nl.github.io/aanvalspaden/): een uur, alleen te doen, achttien paden en drie acties voor morgen.
2. **Hoe pak ik het aan?** Per barriere een [handleiding in de kennisbank](https://security-commons-nl.github.io/kennisbank/security/#handleidingen), met de alternatieven ernaast, en een uitnodiging waar er nog geen is.
3. **Wat toon ik hiermee aan?** De [normverankering](https://security-commons-nl.github.io/normen/): BIO 2.0, ISO 27001, NIST CSF 2.0, het Wpg-kader en de AVG, en waar de zelfcheck ophoudt.
4. **Wat zegt mijn eigen data?** De [meting](https://security-commons-nl.github.io/aanvalspaden/meting/): 41 meetregels op exports die je al hebt, van firewallconfig tot een Linux-dump, met per aanvalspad het bewijs en de witte vlekken hardop.

Zoek je iets om te lezen of te hergebruiken, begin dan bij de [kennisbank](https://security-commons-nl.github.io/kennisbank/); die is ingedeeld op vakgebied, met de telling per vakgebied bovenaan.

Sommige instrumenten hebben een opt-in AI-hulp die het invoerwerk overneemt, met je eigen sleutel bij je eigen leverancier. Wat dat inhoudt, wat er wel en niet naar buiten gaat en hoe je zelf bepaalt hoe groot het risico is, staat op [AI-hulp met je eigen sleutel](/ai-hulp/).

## Alle projecten

<!-- PROJECTEN_GROEPEN -->

<!-- GEARCHIVEERD -->

**Tooling van anderen.** Open tools en kennisbanken van buiten de commons die we bruikbaar vinden, met per bron wat het is, wanneer je het inzet en welke wegingen erbij horen: [Externe referenties: security-tooling en kennisbanken](https://security-commons-nl.github.io/kennisbank/security/referenties-tooling/) in de kennisbank.

## Waarom dit bestaat

Publieke organisaties werken voor informatiebeveiliging, privacy en continuiteit intensief samen met marktpartijen. Dat is waardevol, maar wie de inrichting van zijn governance aan de markt overlaat, geeft de regie uit handen. Daarom bouwen we samen: een organisatie die het wiel opnieuw uitvindt is kwetsbaar, tien die kennis en tooling delen vormen een beweging. Publiek geld betekent publieke code. AI is een middel, nooit een doel, en altijd controleerbaar. De volledige principes staan in [PRINCIPLES.md](https://github.com/security-commons-nl/.github/blob/main/PRINCIPLES.md).

## Meedoen

Dit is geen verkooppraatje; er is niets te kopen. Begin met kijken, draai het lokaal, geef feedback of bouw mee. Open een [discussion](https://github.com/security-commons-nl/.github/discussions) of een issue in een van de repositories. Nog nooit een issue geopend? In [CONTRIBUTING.md](https://github.com/security-commons-nl/.github/blob/main/CONTRIBUTING.md) staat per project een formulier dat je alleen hoeft in te vullen, ook zonder GitHub-account of Git-ervaring, en wat je daarna van ons mag verwachten.

In voorbereiding, als richting en niet als toezegging: websitecompliance, digitale soevereiniteit, code-repoveiligheid en aanvalsoppervlak (OSINT). Een tool verschijnt hierboven in de lijst zodra hij werkt; tot die tijd bestaat hij niet.

## Onderliggende infrastructuur

Eén repo bevat geen op zichzelf staand product, maar maakt een ander wel mogelijk:

- [anonimizer-proxy](https://github.com/security-commons-nl/anonimizer-proxy), minimale Cloudflare Worker die de Mistral-API forwardt, zodat anonimizer-browser werkt zonder dat eindgebruikers een eigen Mistral-account hoeven aan te maken. Forward-only, geen opslag, geen logging van inhoud. Zie de [DPA-template](https://github.com/security-commons-nl/.github/blob/main/DPA-template.md) voor de verwerkersrol.

## Over dit platform

Hoe het geheel in elkaar zit, welke repositories er zijn en hoe ze samenhangen, staat in [ARCHITECTUUR.md](https://github.com/security-commons-nl/.github/blob/main/ARCHITECTUUR.md). De opt-in AI-hulp in de instrumenten staat uitgelegd op [AI-hulp met je eigen sleutel](/ai-hulp/): eigen sleutel, eigen leverancier, een voorstel in plaats van een wijziging.

Deze community staat momenteel op GitHub. Op termijn zullen we overstappen naar een EU-gebaseerd alternatief (zoals [Codeberg](https://codeberg.org)), in lijn met onze principes van digitale soevereiniteit.

---

*Een initiatief van de publieke sector, voor de publieke sector.*
