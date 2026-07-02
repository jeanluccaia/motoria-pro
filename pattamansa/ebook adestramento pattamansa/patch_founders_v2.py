"""
Patch: troca foto dos fundadores na pg.04 e atualiza texto.
Nova foto: foto leo, emerson e caramelo ebook.jpg
"""
import io, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from pathlib import Path
import fitz
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

ROOT       = Path(__file__).resolve().parent
PDF_PATH   = ROOT / "E-book--Adestramento--de--Obediencia--Basica--revisado.pdf"
NEW_PHOTO  = ROOT / "foto leo, emerson e caramelo ebook.jpg"
CARD_DIR   = ROOT / "__photo_cards"
PREVIEW_DIR= ROOT / "__revised_pages"

LIGHT_BG      = (253, 254, 250)
BRAND_GREEN   = (112, 184, 94)
SIDEBAR_GREEN = (120, 184, 92)
TEXT_COLOR    = (61,  74,  56)


# ── Funções utilitárias (cópia do script principal) ────────────────────────

def cover_crop(img, size, focal=(0.5, 0.5)):
    tw, th = size
    scale = max(tw / img.width, th / img.height)
    resized = img.resize(
        (round(img.width * scale), round(img.height * scale)),
        Image.Resampling.LANCZOS,
    )
    left = max(0, min(round((resized.width  - tw) * focal[0]), resized.width  - tw))
    top  = max(0, min(round((resized.height - th) * focal[1]), resized.height - th))
    return resized.crop((left, top, left + tw, top + th))


def rounded_mask(size, radius):
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, size[0] - 1, size[1] - 1), radius=radius, fill=255
    )
    return mask


def make_card(
    src, out_path, size, *,
    page_bg=LIGHT_BG, radius=18, border=3, border_color=BRAND_GREEN,
    fg_scale=0.90, fg_anchor=(0.5, 0.5),
    bg_focal=(0.5, 0.5), bg_blur=26, bg_brightness=0.70, bg_saturation=0.86,
):
    img = Image.open(src).convert("RGB")
    w, h = size

    bg = cover_crop(img, size, bg_focal)
    bg = bg.filter(ImageFilter.GaussianBlur(bg_blur))
    bg = ImageEnhance.Brightness(bg).enhance(bg_brightness)
    bg = ImageEnhance.Color(bg).enhance(bg_saturation)

    inner_margin = max(8, round(min(w, h) * 0.07))
    max_w = max(1, round((w - inner_margin * 2) * fg_scale))
    max_h = max(1, round((h - inner_margin * 2) * fg_scale))
    scale = min(max_w / img.width, max_h / img.height)
    fg = img.resize(
        (max(1, round(img.width * scale)), max(1, round(img.height * scale))),
        Image.Resampling.LANCZOS,
    )
    x = max(inner_margin // 2, min(round((w - fg.width)  * fg_anchor[0]), w - fg.width  - inner_margin // 2))
    y = max(inner_margin // 2, min(round((h - fg.height) * fg_anchor[1]), h - fg.height - inner_margin // 2))
    bg.paste(fg, (x, y))

    card = Image.new("RGB", size, page_bg)
    card.paste(bg, (0, 0), rounded_mask(size, radius))

    draw = ImageDraw.Draw(card)
    for i in range(border):
        draw.rounded_rectangle(
            (i, i, w - 1 - i, h - 1 - i),
            radius=max(1, radius - i),
            outline=border_color,
        )
    if out_path:
        card.save(out_path, quality=96)
    return card


# ── Patch principal ────────────────────────────────────────────────────────

def patch():
    CARD_DIR.mkdir(exist_ok=True)

    # Tamanho do card em pixels (escala 4×)
    founders_rect = (27.5, 113, 332.5, 372)   # 305 × 259 pt
    card_px = (
        max(32, round((founders_rect[2] - founders_rect[0]) * 4)),  # 1220
        max(32, round((founders_rect[3] - founders_rect[1]) * 4)),  # 1036
    )

    card_path = CARD_DIR / "card_00_p04_founders_v2.png"
    print(f"Gerando card com nova foto... {card_px[0]}x{card_px[1]}px")
    make_card(
        NEW_PHOTO,
        card_path,
        card_px,
        page_bg=LIGHT_BG,
        radius=16,
        border=3,
        border_color=BRAND_GREEN,
        fg_scale=0.92,
        fg_anchor=(0.5, 0.52),     # levemente abaixo do centro: caramelo protagonista
        bg_focal=(0.22, 0.78),     # fundo desfocado foca no dourado do Caramelo
        bg_blur=32,
        bg_brightness=0.60,
        bg_saturation=0.92,
    )

    print("Abrindo PDF revisado...")
    doc = fitz.open(PDF_PATH)
    pg = doc[3]   # index 3 = pg.04 (Quem está por trás)

    BG_F    = tuple(c / 255 for c in LIGHT_BG)
    GREEN_F = tuple(c / 255 for c in SIDEBAR_GREEN)
    TEXT_F  = tuple(c / 255 for c in TEXT_COLOR)

    # 1. Inserir novo card (sobrepõe o antigo)
    print("Inserindo novo card...")
    pg.insert_image(fitz.Rect(*founders_rect), filename=str(card_path), overlay=True)

    # 2. Apagar texto antigo (corpo + bullets)
    pg.draw_rect(fitz.Rect(24, 382, 340, 563), color=None, fill=BG_F, overlay=True)

    # 3. Novo texto corpo
    body_lines = [
        "A PattaMansa foi criada por pessoas que vivem",
        "o universo canino todos os dias.",
        "",
        "Leonardo e Emerson atuam ha anos com comportamento",
        "canino, adestramento e convivencia entre caes e tutores.",
        "",
        "Mais do que vender produtos, a missao da PattaMansa",
        "e fortalecer a relacao entre pessoas e seus melhores amigos.",
    ]
    y = 395
    for line in body_lines:
        if line:
            pg.insert_text(fitz.Point(27.5, y), line,
                           fontname="helv", fontsize=9.2,
                           color=TEXT_F, overlay=True)
        y += 12

    # 4. Quatro bullets
    bullets = [
        "Adestramento",
        "Comportamento Canino",
        "Hotel para Caes",
        "Mais de 10 anos no universo pet",
    ]
    y_b = 502
    for b in bullets:
        pg.insert_text(fitz.Point(27.5, y_b), "●",
                       fontname="helv", fontsize=9,
                       color=GREEN_F, overlay=True)
        pg.insert_text(fitz.Point(40, y_b), b,
                       fontname="helv", fontsize=9,
                       color=TEXT_F, overlay=True)
        y_b += 15

    # 5. Salvar
    out_tmp = PDF_PATH.with_suffix(".tmp.pdf")
    print("Salvando PDF...")
    doc.save(str(out_tmp), deflate=True, garbage=4)
    doc.close()
    out_tmp.replace(PDF_PATH)

    # 6. Preview da pg.04
    print("Gerando preview...")
    PREVIEW_DIR.mkdir(exist_ok=True)
    doc2 = fitz.open(PDF_PATH)
    pix = doc2[3].get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
    pix.save(PREVIEW_DIR / "page_04.png")
    doc2.close()

    print("Concluido.")


if __name__ == "__main__":
    patch()
