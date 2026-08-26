# Toolpagina

Op deze pagina verschijnen de scan-tools van Security Commons NL: gratis, onafhankelijke
tooling waarmee publieke organisaties zichzelf van buitenaf kunnen toetsen — van website en
SaaS-keten tot code-repo's en aanvalsoppervlak.

## De bedoeling

Veel publieke organisaties laten zich periodiek toetsen door externe partijen. Dat is
waardevol, maar het kan vaker, sneller en zonder factuur. Een groot deel van wat van
buitenaf zichtbaar is, kun je continu zelf controleren. En je eigen binnenkant — je
servers, je applicatielandschap — kun je toetsen met gegevens die je al hebt, zonder dat
iemand van buiten hoeft mee te kijken. Daar zijn deze tools voor.

Waar elke tool aan voldoet:

1. **Gratis en zonder bijbedoeling.** Geen kosten, geen verborgen upsell, geen commercieel
   belang. Wat je scant en wat eruit komt, is van jou.
2. **Regelgebaseerd en navolgbaar.** Bevindingen komen uit controleerbare regels, niet uit
   een black box. Waar AI wordt ingezet — bijvoorbeeld voor een samenvatting — staat dat er
   duidelijk bij.
3. **Open source onder EUPL-1.2.** De broncode verschijnt op GitHub onder deze organisatie,
   zodat iedere publieke organisatie kan meekijken, zelf hosten en voortbouwen.
4. **Toetsen, niet aanvallen.** De tools lezen alleen: ze kijken naar wat openbaar zichtbaar
   is of naar een kopie van je eigen gegevens, veranderen niets en belasten niets. Een
   bevinding is een startpunt voor onderzoek, geen oordeel.

## Beschikbaar

De tools staan in twee groepen: wat je van buitenaf toetst, en wat je van binnenuit toetst
met gegevens die je al hebt.

### Van buitenaf

#### publicatiescan

**Publicatiehygiëne: staan er persoonsgegevens in je eigen openbare publicaties?**

Gemeenten publiceren doorlopend: officiële bekendmakingen, raadsinformatie, besluitenlijsten,
bijlagen. In die stroom kan een burgerservicenummer, rekeningnummer of adres meeliften dat er
niet hoort. Meestal in een bijlage die niemand meer heeft opengeslagen.

De publicatiescan haalt je publicaties op en controleert ze op persoonsgegevens, tot in de
bijlagen bij een besluit — daar zit het risico, niet in de kennisgeving erboven. De detectie
is deterministisch: een BSN wordt getoetst met de elfproef, een IBAN met mod-97, en een naam
met een woonadres eronder is het patroon van een echt publicatielek. Geen kansberekening, geen
black box; elke bevinding is terug te leiden tot de regel die hem vond. Ingescande documenten
zonder tekstlaag leest hij desgewenst met OCR, on-prem, zodat de gegevens op je eigen machine
blijven. Alle gevonden waarden staan gemaskeerd in het rapport, inclusief de andere
persoonsgegevens die toevallig in hetzelfde tekstfragment stonden. Het rapport is dus zelf
geen datalek.

Wat de scan aankan: de landelijke bekendmakingen-API (KOOP/SRU) inclusief de externe bijlagen,
de terinzageleggingen op mijnpublicaties.nl, en de raadsinformatiesystemen (Qualigraf/Parlaeus,
iBabs en Open Raadsinformatie), naast een gewone crawl van je eigen website. Onderbreken mag, de
status staat in een lokale database en de volgende run pakt de wachtrij op waar hij gebleven was.

Belangrijk: **het rapport ordent en maskeert, het oordeelt niet.** Een elfproef-geldige reeks
van negen cijfers is niet automatisch een BSN. Elke bevinding vraagt menselijke beoordeling,
en de meeste zijn geen lek.

[Broncode en handleiding](https://github.com/security-commons-nl/publicatiescan) · EUPL-1.2

### Van binnenuit

#### iamscan

**Wie kan op je Linux-servers root worden, en langs welke route?**

De toegang tot applicaties is meestal wel belegd, de laag eronder niet: lokale accounts,
sudo-regels die ooit tijdelijk waren, SSH-sleutels zonder eigenaar. Niemand kan uit het hoofd
zeggen wie er op welke machine root kan worden. Bij een audit loop je daar telkens tegenaan.

iamscan leest een kopie van de configbestanden die een Linux-host over toegang prijsgeeft —
`passwd`, `sudoers`, de SSH-sleutels — en beantwoordt die ene vraag. De detectie is
deterministisch: een sudo-regel op `tar` of `systemctl` oogt beperkt, maar die commando's geven
als root een shell terug, en dat is dus volledige root; een tweede account met UID 0 is technisch
root buiten alles wat op de naam root is ingeregeld; een SSH-sleutel die meerdere accounts opent,
vermengt identiteiten. Elke bevinding draagt de configregel waarop hij berust, dus alles is zonder
de tool na te rekenen.

De tool praat niet met de servers. Je voert hem een kopie van de bestanden; er is geen verbinding,
geen agent en geen wijziging. Het rapport is een self-contained HTML-bestand dat naar A4 print, met
een matrix wie waar root wordt en de bevindingen op ernst. Een optionele AI-duiding vat het samen
in gewone taal — de bevindingen zelf komen uit de bestanden, niet uit het model.

Belangrijk: **een lege uitkomst is geen schone uitkomst.** Draai de verzameling als root, anders
blijven juist de gevoelige regels onleesbaar; het rapport zegt zelf welke bronnen het miste.

[Broncode en handleiding](https://github.com/security-commons-nl/iamscan) · EUPL-1.2

#### blast-radius

**Wat valt er om als een component uitvalt?**

Als deze server, database of koppeling uitvalt, welke applicaties en welke bedrijfsprocessen vallen
dan mee om? Die keten zit vaak wel in een CMDB, maar niemand rekent hem door. Pas als er iets
omvalt, blijkt hoe ver het reikt.

blast-radius leest een export van je landschap — een lijst componenten en hun koppelingen, als JSON
of CSV — en rekent de keten voor je door: per component alles wat er stroomopwaarts aan hangt, tot
aan de processen. Het laat zien welke componenten de grootste blast radius hebben (die ene switch
waar alles onder hangt) en welke kritieke processen op een enkele applicatie steunen, zonder
uitwijk. Geen kansberekening, geen black box; de uitkomst volgt rechtstreeks uit de koppelingen die
je aanlevert. In de interactieve graaf klik je een component en zie je oplichten wat omvalt, of een
proces en zie je waar het op steunt.

De tool verwerkt een export die je zelf aanlevert, op je eigen machine. Belangrijk: **hij toont
gevolg, geen kans.** Dat een component veel raakt bij uitval, zegt niets over hoe waarschijnlijk die
uitval is; dat blijft een aparte, risico-gedreven afweging.

[Broncode en handleiding](https://github.com/security-commons-nl/blast-radius) · EUPL-1.2

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
