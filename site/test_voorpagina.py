"""De voorpagina: drie uitgelichte kaarten uit de tabel, in de volgorde van de gebruiker.

Draait node site/build.mjs; dat herschrijft ook llms.txt en sitemap.xml (datum van vandaag). Dat is
verwacht: die twee horen in dezelfde commit.
"""
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent


def test_voorpagina():
    subprocess.run(["node", "site/build.mjs"], cwd=ROOT, check=True, capture_output=True)
    html = (ROOT / "dist" / "index.html").read_text(encoding="utf-8")
    kaarten = re.findall(r'<a class="kaart" href="([^"]+)"', html)
    assert len(kaarten) == 3, kaarten
    assert kaarten[0].rstrip("/").endswith("/kennisbank")
    assert kaarten[1].rstrip("/").endswith("/aanvalspaden")
    assert kaarten[2].rstrip("/").endswith("/weerbaarheid-game")
    # Uitgelicht staat vóór de kaartengrid, en de grid vóór "Waarom dit bestaat".
    assert html.index('class="uitgelicht"') < html.index('class="cards"') < html.index("Waarom dit bestaat")
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


def test_categorieen_en_status():
    """Controleert dat de kaarten netjes gecategoriseerd zijn en de status van 03-09 klopt."""
    subprocess.run(["node", "site/build.mjs"], cwd=ROOT, check=True, capture_output=True)
    html = (ROOT / "dist" / "index.html").read_text(encoding="utf-8")
    assert "Browser-instrumenten" in html
    assert "Kennis &" in html or "Kennis &amp;" in html
    assert "Normbronnen" in html
    assert "Lokale scripts" in html
    assert "csir-assessment-tool" in html
    assert "normen" in html
    # Gearchiveerde projecten mogen niet meer als actieve kaart gerenderd worden
    assert '<span class="card-title">grc-platform</span>' not in html
    assert '<span class="card-title">hosting-bouwblokken</span>' not in html
    assert '<span class="card-title">blast-radius</span>' not in html


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


if __name__ == "__main__":
    test_voorpagina()
    test_verwijzing_wijst_naar_github()
    test_logo_staat_op_de_pagina()
    test_categorieen_en_status()
    test_ai_hulp_pagina()
    test_geen_sleutel_in_de_uitleg()
    test_meting_staat_als_live_op_de_voorpagina()
    print("voorpagina ok")

