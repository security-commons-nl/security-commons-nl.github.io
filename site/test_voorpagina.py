"""De voorpagina: drie uitgelichte kaarten uit de tabel, in de volgorde van de gebruiker.

Draait node site/build.mjs; dat herschrijft ook llms.txt en sitemap.xml (datum van vandaag). Dat is
verwacht: die twee horen in dezelfde commit.
"""
import json
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent


def test_voorpagina():
    """De drie kaarten volgen de tabel, niet een lijst in de code.

    Statuut B9: de eerste drie rijen met een live link zijn de uitgelichte kaarten. build.mjs had die
    drie bij naam in de code staan, waardoor de redactionele volgorde van PROJECTEN.md de voorpagina
    niet kon sturen (gevonden 03-09-2026, toen de weerbaarheidsgame prominent bleef staan terwijl de
    tabel iets anders zei).
    """
    subprocess.run(["node", "site/build.mjs"], cwd=ROOT, check=True, capture_output=True)
    html = (ROOT / "dist" / "index.html").read_text(encoding="utf-8")
    kaarten = re.findall(r'<a class="kaart" href="([^"]+)"', html)
    assert len(kaarten) == 3, kaarten
    assert kaarten[0].rstrip("/").endswith("/aanvalspaden")
    assert kaarten[1].rstrip("/").endswith("/kennisbank")
    # De derde kaart opent de normwijzer, niet de dataset: de gebruiker wil weten wat hij moet doen.
    assert kaarten[2].endswith("/normen/normwijzer.html"), kaarten[2]
    # De kaarttekst breekt af op de eerste punt of dubbele punt: een versienummer als "2.0" knipt de zin.
    wat = re.findall(r'<span class="kaart-wat">([^<]+)</span>', html)
    assert len(wat) == 3 and all(not w.rstrip()[-1].isdigit() for w in wat), wat
    # De vraag boven de naam komt uit content.md, want het is redactionele tekst.
    vragen = re.findall(r'<span class="kaart-vraag">([^<]+)</span>', html)
    assert vragen == ["Waar sta ik?", "Hoe pak ik het aan?", "Wat toon ik aan?"], vragen
    # Uitgelicht staat vóór "Waarom dit bestaat"; de kaartengrid staat sinds 29-10-2026 in de werkplaats.
    assert html.index('class="uitgelicht"') < html.index("Waarom dit bestaat")
    assert 'class="cards"' in (ROOT / "dist" / "werkplaats" / "index.html").read_text(encoding="utf-8")
    assert chr(8212) not in html, "em-dash op de voorpagina"


def test_verwijzing_wijst_naar_github():
    """Het blok bovenaan is in het profiel geschreven vanuit GitHub; hier hoort het andersom.

    Zonder de wissel wees de voorpagina naar zichzelf en stond er "hier op GitHub" op een pagina die
    niet op GitHub staat.
    """
    subprocess.run(["node", "site/build.mjs"], cwd=ROOT, check=True, capture_output=True)
    html = (ROOT / "dist" / "index.html").read_text(encoding="utf-8")
    kop = html[: html.index("Direct aan de slag")]
    assert 'href="https://github.com/security-commons-nl/"' in kop
    assert "Hier op GitHub" not in html
    assert "Je bent op de voorkant" in kop


def test_logo_staat_op_de_pagina():
    """Hetzelfde beeldmerk als op de organisatiepagina, anders zijn het twee verschillende plekken."""
    subprocess.run(["node", "site/build.mjs"], cwd=ROOT, check=True, capture_output=True)
    html = (ROOT / "dist" / "index.html").read_text(encoding="utf-8")
    assert 'src="/logo.png"' in html
    assert (ROOT / "dist" / "logo.png").exists(), "logo niet meegekopieerd naar dist"


def test_groepen_volgen_de_vraag():
    """De projecten staan in de werkplaats onder de vraag waarmee iemand binnenkomt, niet onder hun vorm.

    Sinds 29-10-2026 (plan "de site is het product", statuut C3) staat de projectenlijst niet meer op de
    voorpagina maar op /werkplaats/. De vorm staat als label op de kaart.
    """
    subprocess.run(["node", "site/build.mjs"], cwd=ROOT, check=True, capture_output=True)
    html = (ROOT / "dist" / "werkplaats" / "index.html").read_text(encoding="utf-8")
    assert 'href="https://security-commons-nl.github.io/werkplaats/"' in html, "canonical ontbreekt"
    projecten = html[html.index('id="alle-projecten"'):]
    koppen = re.findall(r"<h3>([^<]+)</h3>", projecten)
    assert koppen == ["Vaststellen hoe je ervoor staat", "Aanpakken en inrichten",
                      "Aantonen en overtuigen", "Veilig delen en publiceren"], koppen
    assert "Overige projecten" not in koppen, "een project zonder kolom Waarvoor in PROJECTEN.md"
    assert "Browser-instrumenten" not in html
    for label in ("in je browser", "leeswerk", "dataset", "lokaal script"):
        assert f'badge-vorm">{label}<' in html, label
    assert "csir-assessment-tool" in html
    assert "normen" in html
    # Gearchiveerde projecten mogen niet meer als actieve kaart gerenderd worden
    assert '<span class="card-title">grc-platform</span>' not in html
    assert '<span class="card-title">hosting-bouwblokken</span>' not in html
    assert '<span class="card-title">blast-radius</span>' not in html
    assert "Onderliggende infrastructuur" in html
    assert "anonimizer-proxy" in html
    assert chr(8212) not in html, "em-dash op de werkplaatspagina"
    assert "https://security-commons-nl.github.io/werkplaats/" in (ROOT / "sitemap.xml").read_text(
        encoding="utf-8")
    assert "/werkplaats/" in (ROOT / "llms.txt").read_text(encoding="utf-8")


def test_voorpagina_is_het_product():
    """Statuut C1 en C3: op de voorpagina geen projectkaarten en geen repo-namen in de leesroute.

    De leesroute loopt van "Begin bij je rol" tot "Waarom dit bestaat". Daarbinnen geen link naar github.com en
    geen kaart met een repo-naam als titel; dat hoort in de werkplaats. Erboven (de voorkant-regel) en eronder
    (de principes, Meedoen, Over dit platform) mag het wel: daar wil de lezer meelezen of meebouwen.
    """
    html = (ROOT / "dist" / "index.html").read_text(encoding="utf-8")
    assert 'class="card"' not in html, "projectkaart op de voorpagina"
    assert 'id="alle-projecten"' not in html
    assert "Onderliggende infrastructuur" not in html
    leesroute = html[html.index('id="begin-bij-je-rol"'):html.index('id="waarom-dit-bestaat"')]
    assert "github.com" not in leesroute, "link naar de werkplaats midden in de leesroute"
    assert 'href="/werkplaats/"' in html
    assert html.count('href="/werkplaats/"') >= 2, "voorpagina wijst minder dan twee keer naar de werkplaats"
    # De topbalk wijst naar de routes en naar de werkplaats, niet meer naar een projectenlijst op de voorpagina.
    topbalk = html[html.index('class="topbalk"'):html.index("</header>")]
    assert 'href="/#begin-bij-je-rol">Routes<' in topbalk
    assert 'href="/werkplaats/">Werkplaats<' in topbalk
    assert "/#alle-projecten" not in html
    # De drie uitgelichte kaarten heten naar wat ze doen, niet naar hun repository (C3).
    namen = re.findall(r'<span class="kaart-naam">([^<]+)</span>', html)
    assert namen == ["De zelfcheck", "De kennisbank", "De normwijzer"], namen


def test_ai_hulp_pagina():
    """De uitleg over de AI-hulp is een eigen pagina, en de voorpagina wijst er twee keer naar.

    De pagina moet de drie gebruiksvormen noemen (lokaal, eigen sleutel, gedeelde proxy), want het
    risico verschilt per vorm en dat is het hele punt van de uitleg. En de belofte van de tools moet
    er letterlijk staan: het instrument zelf praat met niemand.
    """
    subprocess.run(["node", "site/build.mjs"], cwd=ROOT, check=True, capture_output=True)
    html = (ROOT / "dist" / "ai-hulp" / "index.html").read_text(encoding="utf-8")
    assert "AI-hulp met je eigen sleutel" in html
    assert 'href="https://security-commons-nl.github.io/ai-hulp/"' in html, "canonical ontbreekt"
    for vorm in ("Lokaal model", "Eigen sleutel bij een leverancier", "Gedeelde proxy"):
        assert vorm in html, vorm
    # De markdown-backticks worden <code> met ge-escapete quotes; daarom op default-src toetsen.
    for belofte in ("sessionStorage", "default-src", "DPA-template", "citaat"):
        assert belofte in html, belofte
    assert chr(8212) not in html, "em-dash op de uitlegpagina"

    voor = (ROOT / "dist" / "index.html").read_text(encoding="utf-8")
    assert voor.count('href="/ai-hulp/"') == 2, "voorpagina wijst niet twee keer naar de uitleg"
    assert "https://security-commons-nl.github.io/ai-hulp/" in (ROOT / "sitemap.xml").read_text(
        encoding="utf-8")
    assert "/ai-hulp/" in (ROOT / "llms.txt").read_text(encoding="utf-8")


def test_geen_sleutel_in_de_uitleg():
    """Een uitleg over sleutels is de plek waar per ongeluk een echte sleutel belandt."""
    tekst = (ROOT / "site" / "ai-hulp.md").read_text(encoding="utf-8")
    # Een sleutel is lang en mengt letters met cijfers; een lang Nederlands woord doet dat niet.
    lang = re.findall(r"\b[A-Za-z0-9]{24,}\b", tekst)
    verdacht = [w for w in lang
                if any(c.isdigit() for c in w) and any(c.isalpha() for c in w)]
    assert not verdacht, f"lijkt op een sleutel: {verdacht}"


def test_meting_staat_als_live_op_de_voorpagina():
    """Vraag 4 van de keten wees naar security-posture-tool; die is sinds 03-09 gearchiveerd."""
    html = (ROOT / "dist" / "index.html").read_text(encoding="utf-8")
    assert "aanvalspaden/meting/" in html
    assert "in ontwikkeling in" not in html
    # Gearchiveerd, dus geen actieve kaart meer. De kaarten komen uit PROJECTEN.md in de .github-repo;
    # staat de lokale checkout in org-profile/ achter, dan valt deze regel om.
    assert '<span class="card-title">security-posture-tool</span>' not in html
    assert '<span class="card-title">iamscan</span>' not in html


def test_zoekvak_bovenaan():
    """Wie binnenkomt heeft een vraag, geen projectnaam: het zoekvak staat boven de kaarten.

    Het script haalt de index op bij de normen-repo; staat die URL niet in de pagina, dan zoekt het vak niets.
    """
    html = (ROOT / "dist" / "index.html").read_text(encoding="utf-8")
    assert html.count('id="commons-zoek"') == 1
    assert html.index('id="commons-zoekvak"') < html.index('id="direct-aan-de-slag"')
    assert "/normen/zoekindex.json" in html
    assert "maakZoeker" in html
    # Het script moet heel blijven: marked mag er geen alinea's van maken.
    script = html[html.index("<script>", html.index('id="commons-zoekvak"')):]
    script = script[:script.index("</script>")]
    assert "<p>" not in script and "<em>" not in script


def test_voordeur_per_rol():
    """Vijf routes, onder het zoekvak en boven de keten; elke stap met een waarom.

    De keuze staat in site/routes.json en is redactioneel; deze test bewaakt de vorm op de pagina. De adressen
    zelf worden door site/test_routes.mjs opgehaald. Alleen adressen van de commons zelf: een voordeur die naar
    buiten wijst, is geen voordeur.
    """
    data = json.loads((ROOT / "site" / "routes.json").read_text(encoding="utf-8"))
    rollen = [r["rol"] for r in data["routes"]]
    assert rollen == ["CISO", "ISO", "Privacy officer", "Bestuurder", "Eerste honderd dagen"], rollen
    assert not (ROOT / "site" / "rollen.json").exists(), "rollen.json is opgegaan in routes.json"
    html = (ROOT / "dist" / "index.html").read_text(encoding="utf-8")
    blok = html[html.index('class="rollen routes"'):]
    blok = blok[:blok.index("</section>")]
    assert blok.count('<div class="rol route"') == 5
    stappen = sum(len(r["stappen"]) for r in data["routes"])
    assert blok.count("<li>") == stappen
    assert blok.count('class="stap-waarom"') == stappen
    for r in data["routes"]:
        assert f'id="route-{r["id"]}"' in blok, r["id"]
        for s in r["stappen"]:
            assert f'href="{s["url"]}"' in blok, s["url"]
            assert s["url"].startswith("https://security-commons-nl.github.io/"), s["url"]
    assert html.index('id="commons-zoekvak"') < html.index('class="rollen routes"') < html.index('id="direct-aan-de-slag"')
    # De privacy officer staat ook in de doelgroepregel.
    assert "privacy officers" in html[html.index('id="direct-aan-de-slag"'):][:600]


def test_vraag_3_wijst_naar_de_normwijzer():
    """Vraag 3 van de keten ("Wat toon ik hiermee aan?") opent de normwijzer."""
    html = (ROOT / "dist" / "index.html").read_text(encoding="utf-8")
    vraag = html[html.index("Wat toon ik hiermee aan?"):]
    vraag = vraag[:vraag.index("</li>")]
    assert 'href="https://security-commons-nl.github.io/normen/normwijzer.html"' in vraag
    assert "normverankering" not in vraag


if __name__ == "__main__":
    test_voorpagina()
    test_zoekvak_bovenaan()
    test_voordeur_per_rol()
    test_vraag_3_wijst_naar_de_normwijzer()
    test_verwijzing_wijst_naar_github()
    test_logo_staat_op_de_pagina()
    test_groepen_volgen_de_vraag()
    test_voorpagina_is_het_product()
    test_ai_hulp_pagina()
    test_geen_sleutel_in_de_uitleg()
    test_meting_staat_als_live_op_de_voorpagina()
    print("voorpagina ok")

