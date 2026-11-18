"""Genera la versión editable en Canva de la imagen para compartir (og-portal).

Uso, desde la raíz del repo:  python scripts/generar-og-editable.py
Requiere: pip install python-pptx pillow
Salida: scripts/og-portal-editable.pptx (no se publica; se importa en Canva,
carpeta Aviazion Group / Portal RRHH, con Subir archivos).

Mismas medidas que scripts/generar-og.py, por capas: fondo de color, logo
oficial como imagen (sin redibujar), títulos como texto en Century Gothic y la
línea Cyan como figura. Si cambias una medida aquí, cámbiala también allá.
"""
from pathlib import Path

from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.util import Emu, Pt

RAIZ = Path(__file__).resolve().parent.parent
PX = 9525  # EMU por px a 96 ppp
W, H = 1200, 630
FONDO, CYAN, NIEBLA = "00263F", "149EC9", "F2F7FA"

prs = Presentation()
prs.slide_width, prs.slide_height = Emu(W * PX), Emu(H * PX)
lam = prs.slides.add_slide(prs.slide_layouts[6])
lam.background.fill.solid()
lam.background.fill.fore_color.rgb = RGBColor.from_string(FONDO)

logo = Image.open(RAIZ / "scripts/logo-aviazion-negativo-1024.png").convert("RGBA")
logo = logo.crop(logo.getbbox())
tmp = RAIZ / "scripts/_logo-recortado.png"
logo.save(tmp)
lw, y = 400, 78
lh = round(lw * logo.height / logo.width)
lam.shapes.add_picture(str(tmp), Emu((W - lw) // 2 * PX), Emu(y * PX), Emu(lw * PX), Emu(lh * PX))
tmp.unlink()

y += lh + 44
caja = lam.shapes.add_textbox(Emu(0), Emu((y - 6) * PX), Emu(W * PX), Emu(172 * PX))
tf = caja.text_frame
tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
tf.vertical_anchor = MSO_ANCHOR.TOP
for i, linea in enumerate(("Portal RRHH", "Aviazion Group")):
    p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
    p.alignment = PP_ALIGN.CENTER
    p.line_spacing = Pt(86 * 0.75)
    r = p.add_run()
    r.text = linea
    r.font.name = "Century Gothic"
    r.font.bold = True
    r.font.size = Pt(68 * 0.75)
    r.font.color.rgb = RGBColor.from_string(NIEBLA)

y += 2 * 86 + 20
linea = lam.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Emu((W // 2 - 90) * PX), Emu(y * PX), Emu(180 * PX), Emu(6 * PX))
linea.fill.solid()
linea.fill.fore_color.rgb = RGBColor.from_string(CYAN)
linea.line.fill.background()

lam.notes_slide.notes_text_frame.text = (
    "Imagen para compartir el enlace del Portal RRHH (og:image, 1200x630). "
    "Todo el contenido debe quedar en el cuadrado central de 630 px: WhatsApp recorta ahí. "
    "La publicada se genera con scripts/generar-og.py en el repo aviazion-group-rrhh."
)
salida = RAIZ / "scripts/og-portal-editable.pptx"
prs.save(salida)
print(salida)
