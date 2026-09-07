"""De backlogpagina: gegenereerd uit de open issues en de gaten uit de data, met een handblok erboven.

Draait node site/build.mjs met twee fixtures in plaats van de API, zodat de test niet van het
netwerk afhangt en niet meebeweegt met wat er toevallig open staat. De derde test bouwt zonder
fixture en zonder netwerk: dan moet de site gewoon doorbouwen en de pagina zeggen dat de lijst
ontbreekt, want een API-storing mag de voorpagina niet van de lucht halen.
"""
import os
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
FIXTURES = ROOT / "site" / "fixtures"


def bouw(**omgeving) -> str:
    env = {**os.environ, **omgeving}
    subprocess.run(["node", "site/build.mjs"], cwd=ROOT, check=True, capture_output=True, env=env)
    return (ROOT / "dist" / "backlog" / "index.html").read_text(encoding="utf-8")


def test_de_groepen_volgen_de_labels():
    """plan, schrijfopdracht, idee en pull request komen elk in hun eigen lijst; zonder label apart."""
    html = bouw(BACKLOG_ISSUES_FILE=str(FIXTURES / "backlog-issues.json"),
                BACKLOG_GEVRAAGD_FILE=str(FIXTURES / "backlog-gevraagd.json"))
    def groep(kop: str) -> str:
        m = re.search(rf'<h2 id="{kop}">.*?(?=<h2 |<h2>|$)', html, re.S)
        assert m, f"groep {kop} ontbreekt"
        return m.group(0)
    plannen = groep("open-plannen")
    assert "applicatiecheck#3" in plannen and "aanvalspaden#40" in plannen
    assert '<span class="telling">2</span>' in plannen
    assert "kennisbank#25" in groep("schrijfopdrachten")
    assert ".github#1" in groep("ideeen")
    assert "normen#9" in groep("zonder-label")
    assert "anonimizer-proxy#21" in groep("onderhoud")
    # Een pull request hoort nooit bij de plannen, ook niet met een label.
    assert "anonimizer-proxy#21" not in plannen


def test_gaten_uit_de_data_en_het_handblok():
    html = bouw(BACKLOG_ISSUES_FILE=str(FIXTURES / "backlog-issues.json"),
                BACKLOG_GEVRAAGD_FILE=str(FIXTURES / "backlog-gevraagd.json"))
    gaten = html[html.index('id="gaten-uit-de-data"'):]
    assert "<code>browser</code>" in gaten and "<code>soc</code>" in gaten
    assert '<span class="telling">2</span>' in gaten
    # Het handblok staat boven de gegenereerde lijsten, want de keuze gaat voor de telling.
    assert html.index("Nu aan de beurt") < html.index('id="open-plannen"')
    # Titels uit issues zijn tekst van buiten: geen script op onze pagina.
    assert "<script>alert(1)</script>" not in html
    assert "&lt;script&gt;" in html


def test_zonder_api_bouwt_de_site_door():
    """Een lege bestandsnaam betekent ophalen; een onbereikbare API mag de build niet breken."""
    env = {k: v for k, v in os.environ.items() if not k.startswith("BACKLOG_")}
    env["HTTPS_PROXY"] = "http://127.0.0.1:9"  # niets luistert daar; fetch faalt snel
    env["HTTP_PROXY"] = env["HTTPS_PROXY"]
    env["BACKLOG_ISSUES_FILE"] = str(FIXTURES / "bestaat-niet.json")
    uit = subprocess.run(["node", "site/build.mjs"], cwd=ROOT, capture_output=True, text=True, env=env)
    assert uit.returncode == 0, uit.stderr
    html = (ROOT / "dist" / "backlog" / "index.html").read_text(encoding="utf-8")
    assert "konden bij deze build niet worden opgehaald" in html
    assert "Nu aan de beurt" in html
    # De voorpagina is er gewoon.
    assert (ROOT / "dist" / "index.html").exists()


def test_de_pagina_staat_in_de_sitemap_en_op_de_voorpagina():
    bouw(BACKLOG_ISSUES_FILE=str(FIXTURES / "backlog-issues.json"),
         BACKLOG_GEVRAAGD_FILE=str(FIXTURES / "backlog-gevraagd.json"))
    assert "https://security-commons-nl.github.io/backlog/" in (ROOT / "sitemap.xml").read_text(encoding="utf-8")
    assert 'href="/backlog/"' in (ROOT / "dist" / "index.html").read_text(encoding="utf-8")


if __name__ == "__main__":
    for naam, f in list(globals().items()):
        if naam.startswith("test_"):
            f()
            print("ok", naam)
