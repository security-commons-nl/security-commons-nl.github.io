"""Favicon voor Security Commons NL: een schild met een sleutelgat, in het blauw en oranje van de site.

Levert twee bestanden:
  favicon.svg  scherp op elk formaat, gebruikt door de gegenereerde pagina's
  favicon.ico  16 en 32 pixels, voor alles wat blind /favicon.ico opvraagt

De ICO wordt hier zelf gerasterd (geen Pillow nodig): dezelfde meetkunde als de SVG, met
supersampling zodat de randen niet rafelen.
"""
import pathlib
import struct

BLAUW = (0x15, 0x42, 0x73)
ORANJE = (0xE1, 0x70, 0x00)
WIT = (0xFF, 0xFF, 0xFF)

SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="Security Commons NL">
  <title>Security Commons NL</title>
  <path d="M16 2 4 6.5v10.2C4 24 9.2 28.6 16 30.5 22.8 28.6 28 24 28 16.7V6.5L16 2z" fill="#154273"/>
  <path d="M16 2 4 6.5v3.2L16 5.2l12 4.5V6.5L16 2z" fill="#e17000"/>
  <circle cx="16" cy="15" r="3.6" fill="#fff"/>
  <path d="M14.6 17.4h2.8l1.1 6.2h-5l1.1-6.2z" fill="#fff"/>
</svg>
"""


def bovenrand(x: float) -> float:
    """De schuine bovenkant van het schild: punt in het midden op y=2, hoeken op y=6.5."""
    return 2 + abs(x - 16) / 12 * 4.5


def binnen_schild(x: float, y: float) -> bool:
    """De schildvorm uit de SVG: schuine bovenkant, recht midden, punt onderaan."""
    if y < bovenrand(x) or y > 30.5 or x < 4 or x > 28:
        return False
    if y <= 16.7:
        return True
    # Onderkant: halve breedte loopt terug naar een punt.
    f = (y - 16.7) / (30.5 - 16.7)
    halve = 12 * (1 - f) ** 0.55
    return abs(x - 16) <= halve


def kleur_op(x: float, y: float):
    if not binnen_schild(x, y):
        return None
    if y <= bovenrand(x) + 3.2:  # de oranje band volgt de bovenrand
        return ORANJE
    if (x - 16) ** 2 + (y - 15) ** 2 <= 3.6 ** 2:
        return WIT
    if 17.4 <= y <= 23.6 and abs(x - 16) <= 1.4 + (23.6 - y) * 0.15:
        return WIT
    return BLAUW


def raster(n: int, ss: int = 4) -> bytes:
    """BGRA-pixels, van onder naar boven zoals een BMP ze verwacht."""
    uit = bytearray()
    for ry in range(n - 1, -1, -1):
        for rx in range(n):
            r = g = b = a = 0
            for sy in range(ss):
                for sx in range(ss):
                    x = (rx + (sx + 0.5) / ss) * 32 / n
                    y = (ry + (sy + 0.5) / ss) * 32 / n
                    k = kleur_op(x, y)
                    if k:
                        r += k[0]; g += k[1]; b += k[2]; a += 255
            m = ss * ss
            if a:
                dekking = a / m
                # Kleur is het gemiddelde over de bedekte deelpixels.
                bedekt = a / 255
                uit += bytes((int(b / bedekt), int(g / bedekt), int(r / bedekt), int(dekking)))
            else:
                uit += b"\x00\x00\x00\x00"
    return bytes(uit)


def ico(formaten=(16, 32)) -> bytes:
    beelden = []
    for n in formaten:
        pixels = raster(n)
        kop = struct.pack("<IiiHHIIiiII", 40, n, n * 2, 1, 32, 0, len(pixels), 0, 0, 0, 0)
        masker = b"\x00" * (n * n // 8)
        beelden.append(kop + pixels + masker)
    uit = struct.pack("<HHH", 0, 1, len(beelden))
    offset = 6 + 16 * len(beelden)
    for n, data in zip(formaten, beelden):
        uit += struct.pack("<BBBBHHII", n, n, 0, 0, 1, 32, len(data), offset)
        offset += len(data)
    return uit + b"".join(beelden)


if __name__ == "__main__":
    doel = pathlib.Path(__file__).resolve().parent.parent
    (doel / "favicon.svg").write_text(SVG, encoding="utf-8", newline="\n")
    (doel / "favicon.ico").write_bytes(ico())
    print("favicon.svg en favicon.ico geschreven,", (doel / "favicon.ico").stat().st_size, "bytes")
