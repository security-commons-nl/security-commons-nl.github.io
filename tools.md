# Toolpagina

Gratis, onafhankelijke scan-tools waarmee publieke organisaties zichzelf van buitenaf kunnen
toetsen — van website en SaaS-keten tot code-repo's en aanvalsoppervlak. De bevindingen zijn
regelgebaseerd; waar AI wordt ingezet (zoals een optionele bestuurderssamenvatting) staat dat
er duidelijk bij. Geen kosten, geen verborgen upsell, geen commercieel belang.

| Tool | Status | Wat is het? | Doelgroep |
|---|---|---|---|
| [Site Guardian](https://siteguardian.publicvibes.nl) | Live | Compliance-scanner voor gemeentewebsites: security headers, toegankelijkheid (WCAG 2.2 AA), privacy/trackers en overheidsstandaarden — open de [live tool](https://siteguardian.publicvibes.nl) | Webredacties, CISO's en ISO's bij gemeenten |
| [SoevereinScan](https://scan.publicvibes.nl/soeverein/) | Live | Digitale-soevereiniteitsscanner: welke buitenlandse diensten, servers en jurisdicties zitten in een SaaS-dienst of website, niveau 0–5 conform het DICTU-toetsingsinstrument — open de [live tool](https://scan.publicvibes.nl/soeverein/) | CISO's, architecten en inkopers bij publieke organisaties |
| [Git Guardian](https://gitguardian.publicvibes.nl) | Live | Dagelijkse scan van publieke GitHub-repo's op secrets, kwetsbare dependencies en Nederlandse persoonsgegevens (BSN, IBAN) met e-mailrapport — open de [live tool](https://gitguardian.publicvibes.nl) | Ontwikkelteams en beheerders van publieke code |
| [OSINT-Tools](#osint-tools) | CLI | Passieve OSINT-verkenning van het eigen aanvalsoppervlak: subdomeinen, DNS, security headers en rapportage in Word | Security-analisten en blue teams bij publieke organisaties |

## Site Guardian

Scant een gemeentewebsite op vijf gebieden: beveiliging (security headers, cookie-instellingen,
HTTPS), toegankelijkheid (WCAG 2.2 AA: taal, koppen, alt-teksten, landmarks, formulierlabels),
privacy (trackers, cookie-consent, privacyverklaring), snelheid en overheidsstandaarden.

- Scan-engine is regelgebaseerd; geen AI in de bevindingen.
- Optionele bestuurderssamenvatting via AI, duidelijk als zodanig gemarkeerd.
- Toegang via magic-link op het eigen domein: alleen wie een e-mailadres op het gescande
  domein heeft, kan het volledige rapport opvragen.

## SoevereinScan

Opent een SaaS-dienst of website in een echte browser en legt alle onderliggende verzoeken
vast: hosting, third-party scripts, fonts, CDN's en cookies. Per IP-adres worden organisatie,
land en moederbedrijf bepaald; elke dienst krijgt een soevereiniteitsniveau van 0 (niet
soeverein) tot 5 (volledig soeverein).

- Indeling conform het DICTU-toetsingsinstrument Soevereiniteit Clouddiensten (januari 2026)
  en de Rijksvisie Digitale Soevereiniteit (december 2025).
- Het rapport onderscheidt wat de organisatie zélf kan beïnvloeden (eigen hosting, analytics,
  fonts) van afhankelijkheden dieper in de keten.

## Git Guardian

Controleert dagelijks alle publieke GitHub-repo's van aangemelde gebruikers op drie risico's:
uitgelekte secrets en tokens (regexpatronen plus entropie-analyse), kwetsbare dependencies
(lockfiles getoetst aan de OSV.dev-database) en Nederlandse persoonsgegevens — BSN gevalideerd
met de 11-proef, IBAN met de mod-97-controle, zodat echte nummers worden gevonden met weinig
valse meldingen.

- Alleen bij bevindingen volgt een e-mailrapport met severity-indeling; geen bevindingen,
  geen mail.
- Zelf aanmelden kan met een GitHub-gebruikersnaam en e-mailadres; afmelden via de link in
  elke mail.

## OSINT-Tools

Commandline-toolkit (Python) voor passieve verkenning van het eigen aanvalsoppervlak, zoals
een aanvaller dat ziet: subdomein-enumeratie via OWASP Amass en Certificate Transparency,
DNS-analyse inclusief zone-transfer-controle, reverse-IP-lookups en beoordeling van security
headers. Resultaten landen in een Word-rapport met severity-tabellen, optioneel aangevuld met
een gap-analyse tegen bestaande scanner-bevindingen.

- Volledig passief: er wordt niets aangevallen of belast, alleen openbare bronnen bevraagd.
- Broncode verschijnt op GitHub onder deze organisatie.

## Spelregels

- Scan alleen domeinen en repo's waarvoor je dat mag: je eigen organisatie of met expliciete
  toestemming.
- De tools doen uitspraken op basis van wat van buitenaf zichtbaar is; een bevinding is een
  startpunt voor onderzoek, geen oordeel.
- Licentie van alle tooling: EUPL-1.2. Hergebruik en bijdragen zijn welkom.
