"""Genera public/og-portal.jpg (vista previa del enlace en WhatsApp y Teams).

Uso, desde la raíz del repo:  python scripts/generar-og.py
Requiere: pip install pillow

Todo el contenido va dentro del cuadrado central de 630 x 630 px, porque
WhatsApp recorta la imagen a ese cuadrado en la miniatura. El logo es el
archivo oficial del Kit de Marca (negativo, PNG de 1024 px), sin redibujar ni
recolorear. La tipografía es la oficial de la marca, Century Gothic Bold, que
viene con Windows/Office; si no está instalada se usa Arial Bold (respaldo que
fija el kit).
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

RAIZ = Path(__file__).resolve().parent.parent
FONDO, CYAN, NIEBLA = "#00263F", "#149EC9", "#F2F7FA"  # Navy profundo, Cyan y Niebla del kit
W, H, S = 1200, 630, 2  # S: supermuestreo para bordes limpios
LINEAS = ("Portal RRHH", "Aviazion Group")
LADO = H - 80  # ancho útil dentro del cuadrado central, con margen


def fuente(px: int) -> ImageFont.FreeTypeFont:
    for ruta in ("C:/Windows/Fonts/GOTHICB.TTF", "C:/Windows/Fonts/arialbd.ttf"):
        if Path(ruta).exists():
            return ImageFont.truetype(ruta, px)
    raise SystemExit("No se encontró Century Gothic Bold ni Arial Bold")


im = Image.new("RGB", (W * S, H * S), FONDO)
dr = ImageDraw.Draw(im)

logo = Image.open(RAIZ / "scripts/logo-aviazion-negativo-1024.png").convert("RGBA")
logo = logo.crop(logo.getbbox())  # quita el margen transparente; no cambia la proporción
lw = 400
lh = round(lw * logo.height / logo.width)
y = 78
logo = logo.resize((lw * S, lh * S), Image.LANCZOS)
im.paste(logo, (((W - lw) // 2) * S, y * S), logo)

titulo = fuente(68 * S)
y += lh + 44
for linea in LINEAS:
    ancho = dr.textlength(linea, font=titulo)
    assert ancho <= LADO * S, "el título se sale del cuadrado central"
    dr.text(((W * S - ancho) / 2, y * S), linea, font=titulo, fill=NIEBLA)
    y += 86
y += 20
dr.rounded_rectangle(((W // 2 - 90) * S, y * S, (W // 2 + 90) * S, (y + 6) * S), radius=3 * S, fill=CYAN)
assert y + 6 <= H - 40, "el contenido se sale por abajo"

im.resize((W, H), Image.LANCZOS).save(RAIZ / "public/og-portal.jpg", quality=90, optimize=True, progressive=True)
print("public/og-portal.jpg generado")
