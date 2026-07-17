# Toolpagina

Op deze pagina verschijnen de scan-tools van Security Commons NL: gratis, onafhankelijke
tooling waarmee publieke organisaties zichzelf van buitenaf kunnen toetsen — van website en
SaaS-keten tot code-repo's en aanvalsoppervlak.

## De bedoeling

Veel publieke organisaties laten zich periodiek toetsen door externe partijen. Dat is
waardevol, maar het kan vaker, sneller en zonder factuur: een groot deel van wat van
buitenaf zichtbaar is, kun je continu zelf controleren. Daar zijn deze tools voor.

Waar elke tool aan voldoet:

1. **Gratis en zonder bijbedoeling.** Geen kosten, geen verborgen upsell, geen commercieel
   belang. Wat je scant en wat eruit komt, is van jou.
2. **Regelgebaseerd en navolgbaar.** Bevindingen komen uit controleerbare regels, niet uit
   een black box. Waar AI wordt ingezet — bijvoorbeeld voor een samenvatting — staat dat er
   duidelijk bij.
3. **Open source onder EUPL-1.2.** De broncode verschijnt op GitHub onder deze organisatie,
   zodat iedere publieke organisatie kan meekijken, zelf hosten en voortbouwen.
4. **Toetsen, niet aanvallen.** De tools kijken alleen naar wat openbaar zichtbaar is en
   belasten niets. Een bevinding is een startpunt voor onderzoek, geen oordeel.

## Beschikbaar

### publicatiescan

**Publicatiehygiëne: staan er persoonsgegevens in je eigen openbare publicaties?**

Gemeenten publiceren doorlopend: officiële bekendmakingen, raadsinformatie, besluitenlijsten,
bijlagen. In die stroom kan een burgerservicenummer, rekeningnummer of adres meeliften dat er
niet hoort. Meestal in een bijlage die niemand meer heeft opengeslagen.

De publicatiescan haalt je publicaties op en controleert de tekstlaag op persoonsgegevens.
De detectie is deterministisch: een BSN wordt getoetst met de elfproef, een IBAN met mod-97.
Geen AI, geen kansberekening, geen black box. Elke bevinding is terug te leiden tot de regel
die hem vond. Alle gevonden waarden staan gemaskeerd in het rapport, inclusief de andere
persoonsgegevens die toevallig in hetzelfde tekstfragment stonden. Het rapport is dus zelf
geen datalek.

Wat de scan aankan: de landelijke bekendmakingen-API (KOOP/SRU) en raadsinformatiesystemen
(Qualigraf/Parlaeus), naast een gewone crawl van je eigen website. Onderbreken mag, de status
staat in een lokale database en de volgende run pakt de wachtrij op waar hij gebleven was.

Belangrijk: **het rapport ordent en maskeert, het oordeelt niet.** Een elfproef-geldige reeks
van negen cijfers is niet automatisch een BSN. Elke bevinding vraagt menselijke beoordeling,
en de meeste zijn geen lek.

[Broncode en handleiding](https://github.com/security-commons-nl/publicatiescan) · EUPL-1.2

## Wat eraan komt

De volgende tools zijn in voorbereiding, langs vier lijnen:

- **Websitecompliance** — voldoet de eigen website aan beveiligings-, toegankelijkheids- en
  privacyverwachtingen?
- **Digitale soevereiniteit** — welke buitenlandse diensten en jurisdicties zitten er in een
  SaaS-dienst of website?
- **Code-repoveiligheid** — staan er secrets, kwetsbare dependencies of persoonsgegevens in
  publieke repo's?
- **Aanvalsoppervlak (OSINT)** — wat ziet een buitenstaander van de eigen organisatie?

Zodra een tool klaar is voor gebruik, verschijnt hij hier met een beschrijving en een link.

## Meedenken

Suggesties voor tools, of ervaring met een van deze onderwerpen? Open een
[discussion](https://github.com/security-commons-nl/.github/discussions) of een issue op
[github.com/security-commons-nl](https://github.com/security-commons-nl).
