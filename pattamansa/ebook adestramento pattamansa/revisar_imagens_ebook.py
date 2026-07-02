"""
Gerador do ebook PattaMansa — Adestramento de Obediencia Basica.
Versao final: fotos reais, pagina dos fundadores, indice e CTA corrigidos.
PDF de saida limpo, sem camadas duplicadas.
"""
import io
import sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from pathlib import Path
import fitz
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parent

PDF_IN = next(ROOT.glob("E-book--Adestramento--de--Obedie*ncia--Ba*sica.pdf"), None)
if PDF_IN is None:
    matches = list(ROOT.glob("E-book--Adestramento--de--*.pdf"))
    if not matches:
        raise FileNotFoundError("PDF do ebook nao encontrado.")
    PDF_IN = matches[0]

PDF_OUT      = ROOT / "E-book--Adestramento--de--Obediencia--Basica--revisado.pdf"
CARD_DIR     = ROOT / "__photo_cards"
PREVIEW_DIR  = ROOT / "__revised_pages"
PHOTO_DIR    = ROOT / "fotos ebook"

# Foto dos fundadores com o Golden Retriever Caramelo
FOUNDERS_PHOTO = ROOT / "foto leo, emerson e caramelo ebook.jpg"

PHOTOS = {
    "sit":       PHOTO_DIR / "file_000000000c9c720e989cfab41a4fb176.png",
    "shepherd":  PHOTO_DIR / "file_00000000137c720ea78d4e227428996a (1).png",
    "hilo":      PHOTO_DIR / "foto hero.png",
    "wide_yard": PHOTO_DIR / "file_0000000084c4720eb7afb8174221d0d3.png",
    "redirect":  PHOTO_DIR / "file_000000008fe8720ea14df9ae7e9221ca.png",
    "equipment": PHOTO_DIR / "file_00000000c0c471f5b00099d52f48a1ab.png",
    "reward":    PHOTO_DIR / "file_00000000d3d4720ea622aa6e19613814.png",
    "social":    PHOTO_DIR / "file_00000000e9c8720eaf628ec7cef7c150.png",
}

LIGHT_BG      = (253, 254, 250)
DARK_BG       = (22, 29, 24)
BRAND_GREEN   = (112, 184, 94)
DEEP_GREEN    = (16, 65, 15)
SIDEBAR_GREEN = (120, 184, 92)
TEXT_COLOR    = (61, 74, 56)
CONCLUSAO_BG  = (26, 60, 15)   # fundo da pagina Conclusao (amostrado)


# ═══════════════════════════════════════════════════════════════════════════
#  Utilitarios de imagem
# ═══════════════════════════════════════════════════════════════════════════

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
    fg_scale=1.0, fg_anchor=(0.5, 0.5),
    bg_focal=(0.5, 0.5), bg_blur=26, bg_brightness=0.70, bg_saturation=0.86,
):
    img = Image.open(src).convert("RGB")
    w, h = size

    # Background desfocado — preenche cantos e areas de respiro do letterbox
    bg = cover_crop(img, size, bg_focal)
    bg = bg.filter(ImageFilter.GaussianBlur(bg_blur))
    bg = ImageEnhance.Brightness(bg).enhance(bg_brightness)
    bg = ImageEnhance.Color(bg).enhance(bg_saturation)

    # Foreground: fit/contain — preserva composicao sem cortar rostos ou cabecas
    # Margem de 2% para respiro; fg_anchor posiciona a foto no espaco disponivel
    pad = max(4, round(min(w, h) * 0.02))
    max_w = max(1, w - pad * 2)
    max_h = max(1, h - pad * 2)
    scale = min(max_w / img.width, max_h / img.height)
    fg = img.resize(
        (max(1, round(img.width * scale)), max(1, round(img.height * scale))),
        Image.Resampling.LANCZOS,
    )
    x = max(pad // 2, min(round((w - fg.width) * fg_anchor[0]), w - fg.width - pad // 2))
    y = max(pad // 2, min(round((h - fg.height) * fg_anchor[1]), h - fg.height - pad // 2))
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


def card_size(rect, scale=4):
    return (
        max(32, round((rect[2] - rect[0]) * scale)),
        max(32, round((rect[3] - rect[1]) * scale)),
    )


def f(rgb):
    """Converte tupla RGB 0-255 para tupla fitz 0.0-1.0."""
    return tuple(c / 255 for c in rgb)


# ═══════════════════════════════════════════════════════════════════════════
#  Photo cards (numeracao do PDF ORIGINAL de 16 paginas)
# ═══════════════════════════════════════════════════════════════════════════

def build_cards():
    CARD_DIR.mkdir(exist_ok=True)
    specs = [
        # Capa (pg.01) — hilo portrait 0.91 em container ~1.05: fit quase perfeito
        (1, (7, 0, 353, 330), "hilo",
         dict(page_bg=DEEP_GREEN, radius=0, border=0,
              fg_anchor=(0.50, 0.40),   # cachorro um pouco acima do centro
              bg_focal=(0.50, 0.35), bg_brightness=0.56)),
        # Introducao (pg.04) — reward landscape 1.50 em container ~1.24: fit pela altura
        (4, (7, 290, 353, 570), "reward",
         dict(fg_anchor=(0.50, 0.42),   # tutor+cao na parte superior do frame
              bg_focal=(0.52, 0.40), radius=10, border=1)),
        # Importancia (pg.05) — sit landscape 1.25 em container ~1.38: fit pela altura
        (5, (7, 328, 353, 578), "sit",
         dict(fg_anchor=(0.38, 0.45),   # mulher+cao, composicao levemente esquerda
              bg_focal=(0.38, 0.50), radius=10, border=1)),
        # Preparacao — equipamentos (pg.06, card esquerdo) — equipment 1.50 em container 2.55
        (6, (10, 258, 168, 320), "equipment",
         dict(fg_anchor=(0.50, 0.55),
              bg_focal=(0.50, 0.60), radius=10, border=1)),
        # Preparacao — ambiente (pg.06, card direito) — wide_yard 1.50 em container 2.55
        (6, (190, 206, 348, 268), "wide_yard",
         dict(fg_anchor=(0.55, 0.50),
              bg_focal=(0.58, 0.52), radius=10, border=1)),
        # Comandos Pt1 (pg.07) — sit 1.25 em container ~1.37: fit pela altura, topo da foto
        (7, (7, 372, 353, 625), "sit",
         dict(fg_anchor=(0.38, 0.35),   # cao+tutor centralizados, espaco no topo
              bg_focal=(0.38, 0.35), bg_brightness=0.72, radius=10, border=1)),
        # Comandos Pt2 (pg.08) — reward 1.50 em container ~2.53: fit pela altura
        (8, (7, 496, 353, 633), "reward",
         dict(fg_anchor=(0.50, 0.40),   # torso da tutora visivelcom cao
              bg_focal=(0.50, 0.38), bg_blur=20, bg_brightness=0.74, radius=10, border=1)),
        # Dicas de treino (pg.09) — reward 1.50 em container ~1.13: fit pela largura
        (9, (174, 196, 353, 355), "reward",
         dict(fg_anchor=(0.50, 0.45),
              bg_focal=(0.48, 0.45), radius=10, border=1)),
        # Seja Paciente (pg.10) — wide_yard 1.50 em container ~1.38: fit pela altura
        (10, (7, 300, 353, 550), "wide_yard",
         dict(fg_anchor=(0.52, 0.50),
              bg_focal=(0.54, 0.52), radius=10, border=1)),
        # Socializacao (pg.11) — social 1.25 em container ~1.18: fit pela largura
        (11, (7, 205, 353, 498), "social",
         dict(fg_anchor=(0.50, 0.48),   # caes em interacao, quadro completo
              bg_focal=(0.50, 0.48), radius=10, border=1)),
        # Resolvendo Problemas (pg.12) — sit 1.25 em container ~1.18: fit pela largura
        (12, (7, 244, 353, 538), "sit",
         dict(fg_anchor=(0.42, 0.48),
              bg_focal=(0.38, 0.50), radius=10, border=1)),
        # Comportamentos Indesejados (pg.13) — redirect 1.25 em container ~1.27: fit quase perfeito
        (13, (7, 276, 353, 548), "redirect",
         dict(fg_anchor=(0.50, 0.48),
              bg_focal=(0.46, 0.52), radius=10, border=1)),
        # Mantendo o Aprendizado (pg.14) — shepherd 1.25 em container ~1.24: fit quase perfeito
        (14, (7, 218, 353, 498), "shepherd",
         dict(fg_anchor=(0.52, 0.48),
              bg_focal=(0.56, 0.50), radius=10, border=1)),
        # Contracapa (pg.16) — hilo portrait 0.91 em container largo ~1.98: fit pela altura
        (16, (7, 145, 353, 320), "hilo",
         dict(page_bg=DARK_BG, radius=10, border=1, border_color=(98, 169, 78),
              fg_anchor=(0.50, 0.42),   # cachorro centrado, cabeca no frame
              bg_focal=(0.50, 0.38), bg_brightness=0.50)),
    ]
    cards = []
    for idx, (page, rect, photo_key, opts) in enumerate(specs, start=1):
        out = CARD_DIR / f"card_{idx:02d}_p{page:02d}.png"
        make_card(PHOTOS[photo_key], out, card_size(rect), **opts)
        cards.append((page, fitz.Rect(*rect), out))
    return cards


# Rects a apagar antes de inserir os cards (removem placeholders do template)
ERASE_RECTS = [
    # (pagina_original, rect_xywh, cor_de_fundo)
    (4,  (5,   288, 355, 572), LIGHT_BG),
    (5,  (5,   326, 355, 580), LIGHT_BG),
    (6,  (8,   256, 170, 322), LIGHT_BG),
    (6,  (188, 204, 350, 270), LIGHT_BG),
    (7,  (5,   370, 355, 628), LIGHT_BG),
    (8,  (5,   494, 355, 636), LIGHT_BG),
    (9,  (172, 194, 355, 357), LIGHT_BG),
    (10, (5,   298, 355, 552), LIGHT_BG),
    (11, (5,   203, 355, 500), LIGHT_BG),
    (12, (5,   242, 355, 540), LIGHT_BG),
    (13, (5,   274, 355, 550), LIGHT_BG),
    (14, (5,   216, 355, 500), LIGHT_BG),
    (16, (5,   143, 355, 322), DARK_BG),
]


# ═══════════════════════════════════════════════════════════════════════════
#  Correcao 1: sidebar pg.03 ("PattaMansa" cortado)
# ═══════════════════════════════════════════════════════════════════════════

def fix_sidebar_title(page):
    fill  = f(SIDEBAR_GREEN)
    white = (1.0, 1.0, 1.0)
    page.draw_rect(fitz.Rect(0, 46, 108, 132), color=None, fill=fill, overlay=True)
    page.insert_text(fitz.Point(7, 73),  "Sobre",      fontname="hebo", fontsize=16, color=white, overlay=True)
    page.insert_text(fitz.Point(7, 96),  "a",          fontname="hebo", fontsize=16, color=white, overlay=True)
    page.insert_text(fitz.Point(7, 121), "PattaMansa", fontname="hebo", fontsize=13, color=white, overlay=True)


# ═══════════════════════════════════════════════════════════════════════════
#  Correcao 2: pagina dos fundadores (inserida apos pg.03)
# ═══════════════════════════════════════════════════════════════════════════

def render_founders_page(doc):
    """Insere pg.04 'Quem esta por tras da PattaMansa' com foto Leo+Emerson+Caramelo."""
    CARD_DIR.mkdir(exist_ok=True)

    BG_F       = f(LIGHT_BG)
    GREEN_F    = f(SIDEBAR_GREEN)
    DEEP_F     = f(DEEP_GREEN)
    TEXT_F     = f(TEXT_COLOR)
    LTGRN_F    = (0.804, 0.902, 0.753)
    MIDGRN_F   = (0.686, 0.843, 0.612)

    page = doc.new_page(pno=3, width=360, height=641)
    page.draw_rect(page.rect, color=None, fill=BG_F, overlay=True)

    # Header "P A G I N A / 0 4"
    page.insert_text(fitz.Point(27.4, 22), "P A G I N A",
                     fontname="helv", fontsize=5.5, color=GREEN_F, overlay=True)
    page.insert_text(fitz.Point(27.4, 32), "0  4",
                     fontname="helv", fontsize=5.5, color=GREEN_F, overlay=True)
    page.draw_rect(fitz.Rect(27.4, 35, 52, 37), color=None, fill=GREEN_F, overlay=True)

    # Marca d'agua "04"
    page.insert_text(fitz.Point(248, 90), "04",
                     fontname="hebo", fontsize=82, color=LTGRN_F, overlay=True)

    # Titulo do capitulo
    # helv para linhas com acento agudo (hebo usa combining, helv tem glifo composto)
    for txt, y, fn, fs in [
        ("Quem está por", 58, "helv", 19),
        ("trás da",       79, "helv", 19),
        ("PattaMansa",   100, "hebo", 18),
    ]:
        page.insert_text(fitz.Point(27.4, y), txt,
                         fontname=fn, fontsize=fs, color=DEEP_F, overlay=True)

    # Linha separadora
    page.draw_rect(fitz.Rect(27.4, 108, 332.5, 109.5),
                   color=None, fill=MIDGRN_F, overlay=True)

    # Card foto: Leo, Emerson e Caramelo — ocupa ~64% da area util da pagina
    founders_rect = (7, 113, 353, 455)   # 346 x 342 pt
    founders_card = CARD_DIR / "card_00_p04_founders.png"
    make_card(
        FOUNDERS_PHOTO,
        founders_card,
        card_size(founders_rect),
        page_bg=LIGHT_BG,
        radius=10,
        border=1,
        border_color=BRAND_GREEN,
        # Foto portrait 3:4 (3060x4080) em container quase quadrado (346x342pt).
        # Fit pela largura: Leo, Emerson e Caramelo aparecem inteiros.
        # fg_anchor=(0.5, 0.30) posiciona a foto no topo do espaco vertical,
        # garantindo que cabecas estejam no frame e Caramelo permanceca visivel.
        fg_anchor=(0.50, 0.30),
        bg_focal=(0.50, 0.45),
        bg_blur=28,
        bg_brightness=0.62,
        bg_saturation=0.88,
    )
    page.insert_image(fitz.Rect(*founders_rect), filename=str(founders_card), overlay=True)

    # Corpo de texto (3 paragrafos)
    body_lines = [
        "A PattaMansa foi criada por pessoas que vivem",
        "o universo canino todos os dias.",
        "",
        "Leonardo e Emerson atuam há anos com comportamento",
        "canino, adestramento e convivência entre cães e tutores.",
        "",
        "Mais do que vender produtos, a missão da PattaMansa",
        "é fortalecer a relação entre pessoas e seus melhores amigos.",
    ]
    y = 463
    for line in body_lines:
        if line:
            page.insert_text(fitz.Point(27.5, y), line,
                             fontname="helv", fontsize=9.2,
                             color=TEXT_F, overlay=True)
        y += 10

    # 4 bullets
    bullets = [
        "Adestramento",
        "Comportamento Canino",
        "Hotel para Cães",
        "Mais de 10 anos no universo pet",
    ]
    y_b = 551
    for b in bullets:
        page.insert_text(fitz.Point(27.5, y_b), "●",
                         fontname="helv", fontsize=9, color=GREEN_F, overlay=True)
        page.insert_text(fitz.Point(40, y_b), b,
                         fontname="helv", fontsize=9, color=TEXT_F, overlay=True)
        y_b += 13

    # Rodape
    page.draw_rect(fitz.Rect(130, 598, 230, 599.5),
                   color=None, fill=MIDGRN_F, overlay=True)
    page.insert_text(fitz.Point(148, 612), "PattaMansa",
                     fontname="helv", fontsize=6.5,
                     color=(0.68, 0.68, 0.63), overlay=True)


# ═══════════════════════════════════════════════════════════════════════════
#  Correcao 3: cabecalhos de pagina deslocados (+1 apos insercao)
# ═══════════════════════════════════════════════════════════════════════════

def fix_page_headers(doc):
    """
    Apos insercao da pg.04, a Introducao (original pg.04, agora pg.05)
    ainda tem 'PAGINA 04' e '04' grande. Corrige para '05'.
    A Conclusao (original pg.15, agora pg.16) ainda tem 'PAGINA 15'. Corrige para '16'.
    """
    LTGRN_F = (0.804, 0.902, 0.753)
    GREEN_F = f(SIDEBAR_GREEN)
    BG_F    = f(LIGHT_BG)
    CBG_F   = f(CONCLUSAO_BG)

    # --- pg.05 (index 4 no doc de 17 pags) — Introducao ---
    p5 = doc[4]
    # Apagar "P A G I N A  0 4" pequeno (y=17-25)
    p5.draw_rect(fitz.Rect(24, 13, 92, 27), color=None, fill=BG_F, overlay=True)
    p5.insert_text(fitz.Point(27.4, 25), "P A G I N A  0 5",
                   fontname="helv", fontsize=6.5, color=GREEN_F, overlay=True)
    # Apagar "04" grande (marca d'agua)
    p5.draw_rect(fitz.Rect(258, 10, 360, 93), color=None, fill=BG_F, overlay=True)
    p5.insert_text(fitz.Point(262, 88), "05",
                   fontname="hebo", fontsize=78, color=LTGRN_F, overlay=True)

    # --- pg.16 (index 15 no doc de 17 pags) — Conclusao ---
    p16 = doc[15]
    p16.draw_rect(fitz.Rect(130, 55, 240, 75), color=None, fill=CBG_F, overlay=True)
    p16.insert_text(fitz.Point(149.5, 69), "P A G I N A  1 6",
                    fontname="helv", fontsize=6.5, color=GREEN_F, overlay=True)


# ═══════════════════════════════════════════════════════════════════════════
#  Correcao 4: indice (pg.02) — numeros de pagina +1
# ═══════════════════════════════════════════════════════════════════════════

def update_index(page):
    GREEN_F = f(SIDEBAR_GREEN)
    WHITE   = (1.0, 1.0, 1.0)
    updates = [
        ("04", "05", 63.0),
        ("05", "06", 99.0),
        ("06", "07", 137.1),
        ("07", "08", 175.3),
        ("08", "09", 213.4),
        ("09", "10", 251.6),
        ("12", "13", 289.8),
        ("14", "15", 325.0),
        ("15", "16", 358.2),
    ]
    x_num = 274.1
    for _, new_num, y in updates:
        page.draw_rect(fitz.Rect(x_num - 2, y - 10, x_num + 18, y + 2),
                       color=None, fill=WHITE, overlay=True)
        page.insert_text(fitz.Point(x_num, y), new_num,
                         fontname="hebo", fontsize=8.3,
                         color=GREEN_F, overlay=True)


# ═══════════════════════════════════════════════════════════════════════════
#  Correcao 5: CTA aprimorado na contracapa (pg.16 original / pg.17 final)
# ═══════════════════════════════════════════════════════════════════════════

def update_cta_page(page):
    DARK_F    = f(DARK_BG)
    GREEN_F   = f(SIDEBAR_GREEN)
    WHITE_F   = (1.0, 1.0, 1.0)
    LTGRN_F   = (0.588, 0.663, 0.565)

    # Cobrir tudo abaixo da linha do header original (y=130 a y=641)
    # O header "VOCE AGORA FAZ PARTE DA / Matilha / PattaMansa" fica em y=70-128
    # e e preservado do template original — nao inserimos duplicata.
    page.draw_rect(fitz.Rect(0, 142, 360, 641), color=None, fill=DARK_F, overlay=True)

    # Re-inserir card do mascote por cima do rect escuro
    hilo_card = CARD_DIR / "card_14_p16.png"
    if hilo_card.exists():
        page.insert_image(fitz.Rect(7, 145, 353, 320),
                          filename=str(hilo_card), overlay=True)

    # CTA heading
    page.insert_text(fitz.Point(27.5, 332), "Quer ajuda com seu cão?",
                     fontname="hebo", fontsize=13, color=GREEN_F, overlay=True)

    # Descricao de servicos
    for txt, y in [
        ("Conheça nossos serviços de adestramento,",       349),
        ("consultoria comportamental e hotel para cães.",  361),
    ]:
        page.insert_text(fitz.Point(27.5, y), txt,
                         fontname="helv", fontsize=8.5,
                         color=WHITE_F, overlay=True)

    # Linha divisoria
    page.draw_rect(fitz.Rect(27.5, 371, 332.5, 372.5),
                   color=None, fill=(0.25, 0.35, 0.25), overlay=True)

    # Links de contato
    contacts = [
        (">> Fale com a PattaMansa no WhatsApp", GREEN_F,  389),
        (">> @pattamansa",                        LTGRN_F, 406),
        (">> www.pattamansa.com.br",              LTGRN_F, 421),
    ]
    for txt, color, y in contacts:
        page.insert_text(fitz.Point(27.5, y), txt,
                         fontname="hebo", fontsize=9,
                         color=color, overlay=True)

    # Assinatura
    page.draw_rect(fitz.Rect(130, 445, 230, 446.5),
                   color=None, fill=(0.35, 0.50, 0.35), overlay=True)
    page.insert_text(fitz.Point(148, 460), "PattaMansa",
                     fontname="helv", fontsize=7,
                     color=(0.65, 0.75, 0.60), overlay=True)


# ═══════════════════════════════════════════════════════════════════════════
#  Fluxo principal
# ═══════════════════════════════════════════════════════════════════════════

def main():
    print("Construindo photo-cards...")
    cards = build_cards()

    print(f"Abrindo PDF original: {PDF_IN.name}")
    doc = fitz.open(PDF_IN)

    # Passo 1: apagar placeholders e inserir fotos (indices do PDF original)
    print("Aplicando erase-rects...")
    for page_num, rect, fill in ERASE_RECTS:
        doc[page_num - 1].draw_rect(
            fitz.Rect(*rect), color=None,
            fill=f(fill), overlay=True,
        )

    print("Inserindo photo-cards...")
    for page_num, rect, img_path in cards:
        doc[page_num - 1].insert_image(
            rect, filename=str(img_path), keep_proportion=False, overlay=True,
        )

    # Passo 2: corrigir sidebar da pg.03
    print("Corrigindo sidebar pg.03...")
    fix_sidebar_title(doc[2])

    # Passo 3: atualizar CTA da contracapa (pg.16 original = index 15)
    print("Atualizando CTA da contracapa...")
    update_cta_page(doc[15])

    # Passo 4: inserir pagina dos fundadores em index 3
    print("Inserindo pagina dos fundadores (pg.04)...")
    render_founders_page(doc)

    # Passo 5: atualizar indice (pg.02 = index 1, nao se move)
    print("Atualizando indice...")
    update_index(doc[1])

    # Passo 6: corrigir cabecalhos deslocados (aplicado UMA unica vez)
    print("Corrigindo cabecalhos de pagina...")
    fix_page_headers(doc)

    # Salvar
    if PDF_OUT.exists():
        PDF_OUT.unlink()
    print(f"Salvando: {PDF_OUT.name}")
    doc.save(PDF_OUT, deflate=True, garbage=4)
    doc.close()

    # Previews
    print("Gerando previews...")
    PREVIEW_DIR.mkdir(exist_ok=True)
    revised = fitz.open(PDF_OUT)
    total = len(revised)
    for i, pg in enumerate(revised, start=1):
        pix = pg.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        pix.save(PREVIEW_DIR / f"page_{i:02d}.png")
    revised.close()

    print(f"\nPDF final: {PDF_OUT.name}")
    print(f"Paginas:   {total}")
    print(f"Previews:  {PREVIEW_DIR.name}/")


if __name__ == "__main__":
    main()
