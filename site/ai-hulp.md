# AI-hulp met je eigen sleutel

Sommige instrumenten in deze commons hebben een aparte pagina waar AI je invoerwerk overneemt: een
procesoverzicht of een CMDB-export omzetten naar het datamodel van de tool. Je gebruikt daarvoor je
eigen sleutel bij je eigen leverancier. Wij hebben geen account, geen server en geen sleutel.

Deze pagina legt uit wat dat precies inhoudt, wat er wel en niet naar buiten gaat, en waarom het risico
beperkt is. Beperkt, niet nul: hoe groot het is, bepaal je zelf met twee keuzes, namelijk welk model je
kiest en wat je erin plakt.

> **In één zin:** het instrument praat nooit met een leverancier, de AI-pagina alleen op jouw verzoek en
> met jouw sleutel, en wat eruit komt is een voorstel dat je per regel zelf overneemt.

## Wat het doet

Het invoerwerk. Een instrument als [procescheck](https://security-commons-nl.github.io/procescheck/)
vraagt om processen, applicaties en hun samenhang. Die staan meestal al ergens: in een Word-document,
een CMDB-export, een lijst uit een beheertool. De AI-hulp zet zo'n stuk tekst of tabel om naar de
structuur die de tool verwacht, en levert dat af als bestand.

Wat het niet doet: beoordelen. De AI stelt geen classificatie voor, rekent geen scores uit en bepaalt
geen prioriteiten. Die regels staan open in de tool zelf en zijn na te rekenen. Een taalmodel dat
daarin meebeslist, maakt de uitkomst onnavolgbaar, en dan is de tool zijn doel voorbij.

## Wat er naar buiten gaat, en wat niet

| Gaat naar de leverancier | Blijft op je apparaat |
|---|---|
| De tekst of tabel die je zelf plakt of kiest | Je dossier: alles wat je in de tool hebt ingevuld |
| De opdracht (systeemprompt) en het gevraagde antwoordformaat | De rekenregels, drempels en normteksten van de tool |
| | Je sleutel na het sluiten van de tab |
| | Het voorstel dat je terugkrijgt, en wat je ervan overneemt |

Het instrument zelf heeft geen netwerk. Dat is niet een belofte maar een controle: de pagina draait
onder een Content Security Policy met `default-src 'none'`, en een test in de bouw weigert een `fetch`
in de code van de tool. Alleen de AI-pagina mag naar buiten, en die staat op een eigen adres
(`/<tool>/ai/`). Open je die nooit, dan gebeurt er nooit iets.

Je sleutel staat in `sessionStorage`: hij verdwijnt zodra je de tab sluit. Niet in `localStorage`, niet
in het dossier, niet in het voorstel, niet in een adresbalk. Er zit een knop *Sleutel vergeten* naast.

## Drie manieren, van weinig naar meer risico

Welke van de drie je kiest, bepaalt wie jouw tekst te zien krijgt. Dat is de belangrijkste knop die je
zelf omzet.

| Manier | Wie ziet je tekst | Wat je moet regelen |
|---|---|---|
| **Lokaal model** (Ollama op je eigen machine of in je eigen netwerk) | Niemand buiten je netwerk | Niets. Geen verwerker, geen doorgifte, geen DPIA-vraag. Wel: een lokaal model is doorgaans minder goed, dus controleer het voorstel scherper. |
| **Eigen sleutel bij een leverancier** (bijvoorbeeld Mistral in de EU) | Die leverancier, onder jouw eigen contract | Jij bent verwerkingsverantwoordelijke, zij verwerker. Kijk naar bewaartermijn, of ze op je invoer trainen, en waar de verwerking plaatsvindt. Dat staat in jouw contract, niet in het onze. |
| **Gedeelde proxy** (zoals [anonimizer-proxy](https://github.com/security-commons-nl/anonimizer-proxy) doet voor anonimizer-browser) | De leverancier plus de beheerder van de proxy | Een extra verwerkersrol, dus een verwerkersovereenkomst. Er ligt een [DPA-template](https://github.com/security-commons-nl/.github/blob/main/DPA-template.md) klaar. De proxy is forward-only en logt geen inhoud, maar hij staat wel in de keten. |

Wij adviseren een Europese leverancier, en noemen Mistral als standaard in de keuzelijst. Dat is een
advies, geen dwang: elk endpoint dat de OpenAI-vorm spreekt werkt, en het veld staat open.

## Wat je niet meestuurt

Het risico zit zelden in de tool en bijna altijd in wat je plakt. Een processenlijst met de namen van
teamleiders erin is een verzameling persoonsgegevens. Een CMDB-export beschrijft je aanvalsoppervlak.
Dat wordt niet minder waar doordat er AI tussen zit.

1. **Geen persoonsgegevens** als je ze kunt weglaten. Rollen en functies werken net zo goed als namen:
   "Teamleider Burgerzaken" doet in het voorstel precies wat "J. de Vries" zou doen.
2. **Nooit bijzondere categorieën** (gezondheid, strafrechtelijke gegevens, vakbond, geloof) en nooit
   gerubriceerde of departementaal vertrouwelijke informatie. Ook niet "even als test".
3. **Geen contract- of offertegeheimen**, en geen ruwe securityexports met concrete kwetsbaarheden en
   adressen. Werk in dat geval met een uittreksel of met een lokaal model.
4. **Neem een uittreksel, niet het hele dossier.** De AI-hulp knipt de invoer op stukken van hoogstens
   24.000 tekens en zegt vooraf hoeveel aanroepen het kost. Minder invoer is bovendien een beter
   voorstel: een model dat vijftien bladzijden krijgt, verzint eerder iets.

Doe je een DPIA of een gegevensbeschermingstoets: de verwerking is "omzetten van door de gebruiker
aangeleverde tekst naar een gestructureerd voorstel", de rechtsgrond en de doelbinding komen uit je
eigen proces, en de doorgifte is die van jouw contract met je leverancier. Wij zijn geen partij in die
keten, tenzij je de gedeelde proxy gebruikt.

## Waarom het een voorstel blijft

De AI schrijft nooit in je dossier. Dat is de kern van het ontwerp, en het is op drie manieren
dichtgezet.

1. **Je krijgt een bestand, geen wijziging.** De AI-pagina levert een voorstel-JSON. In de tool leg je
   dat ernaast: nieuw, bestaand, conflict, of niet in de bron. Je kiest per regel, en pas dan verandert
   er iets. Samenvoegen vult alleen lege velden en verwijdert nooit iets.
2. **Elk item draagt een letterlijk citaat.** De regel uit jouw invoer waar het op gebaseerd is, staat
   erbij. De controle knipt dat citaat op zinseinden en eist dat elk stuk woordelijk in je invoer
   voorkomt. Een verzonnen zin valt daar om, en dat ziet je op het scherm voor je iets overneemt.
3. **Elke overname is terug te vinden.** In het dossier staat per veld dat het uit een AI-voorstel komt,
   met de datum, de leverancier, het model en de sha256 van de invoer. Dat laatste is de vingerafdruk,
   niet de invoer zelf: het voorstel draagt nooit je oorspronkelijke tekst en nooit je sleutel.

Wat dus overblijft aan werk: lezen wat er voorgesteld wordt en beslissen. Dat is precies het werk dat
niet automatiseerbaar hoort te zijn.

## Waar het nu zit

De AI-hulp staat bij [procescheck](https://security-commons-nl.github.io/procescheck/ai/). Hij wordt
uitgebreid naar de [meting van aanvalspaden](https://security-commons-nl.github.io/aanvalspaden/meting/),
de [zelfcheck](https://security-commons-nl.github.io/aanvalspaden/) en de
[CSIR Assessment Tool](https://security-commons-nl.github.io/csir-assessment-tool/), in die volgorde.

Alle instrumenten werken volledig zonder AI. De hulp is opt-in en blijft dat: hij scheelt typewerk, en
dat is de hele belofte.

De prompts en de antwoordschema's zijn geen geheim. Ze staan als data in `ai/opdrachten.json` in de
repository van de tool, samen met de vaste regels die het model meekrijgt en de voorbeelden waarmee de
tests draaien. Wie wil weten wat er precies gevraagd wordt, leest dat bestand.

---

Dit past bij het principe dat in [PRINCIPLES.md](https://github.com/security-commons-nl/.github/blob/main/PRINCIPLES.md)
staat: AI is een middel, nooit een doel, en altijd controleerbaar. Terug naar de
[voorpagina](/).
