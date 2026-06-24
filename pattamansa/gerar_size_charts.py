"""
Gerador de Size Charts para TikTok Shop — PattaMansa
Resolução: 1080x1350px | PNG alta qualidade
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# ── Caminhos ─────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUT_DIR  = os.path.join(BASE_DIR, 'assets', 'tiktok', 'size-charts')
LOGO_SRC = os.path.join(BASE_DIR, 'Logo_5.png')

os.makedirs(OUT_DIR, exist_ok=True)

# ── Paleta ────────────────────────────────────────────────────────────────────
BG_DARK   = (13, 20, 16)        # #0D1410
BG_CARD   = (19, 26, 21)        # #131A15
ORANGE    = (245, 163, 70)      # #F5A346
CREAM     = (242, 237, 228)     # #F2EDE4
SAGE_DIM  = (184, 188, 142)
FOOTER_BG = (10, 15, 12)
ROW_LINE  = (184, 188, 142, 20) # rgba para linha

# ── Fontes ────────────────────────────────────────────────────────────────────
def font(name, size):
    FONTS = {
        'bold':        'C:/Windows/Fonts/segoeuib.ttf',
        'regular':     'C:/Windows/Fonts/segoeui.ttf',
        'light':       'C:/Windows/Fonts/segoeuil.ttf',
        'semibold':    'C:/Windows/Fonts/seguisb.ttf',
    }
    return ImageFont.truetype(FONTS[name], size)

# ── Logo (extrai texto creme de Logo_5) ──────────────────────────────────────
def load_logo(target_w):
    img = Image.open(LOGO_SRC).convert('RGBA')
    arr = np.array(img)
    # Torna fundo escuro transparente
    dark_mask = (arr[:,:,0] < 90) & (arr[:,:,1] < 90) & (arr[:,:,2] < 90)
    arr[dark_mask, 3] = 0
    logo = Image.fromarray(arr)
    # Crop ao bounding box do logo
    bbox = logo.getbbox()
    if bbox:
        logo = logo.crop(bbox)
    # Escala proporcional
    ratio = target_w / logo.width
    new_h = int(logo.height * ratio)
    return logo.resize((target_w, new_h), Image.LANCZOS)

# ── Dados das Modelagens ──────────────────────────────────────────────────────
CHARTS = [
    {
        'filename': 'regular.png',
        'title':    'CAMISETA REGULAR',
        'subtitle': 'Masculina / Unissex',
        'tag':      'Modelagem Clássica · Algodão Premium',
        'cols':     ['TAMANHO', 'ALTURA', 'LARGURA'],
        'rows': [
            ['PP', '69 cm', '51 cm'],
            ['P',  '71 cm', '53 cm'],
            ['M',  '73 cm', '55 cm'],
            ['G',  '75 cm', '57 cm'],
            ['GG', '77 cm', '59 cm'],
            ['3G', '79 cm', '63 cm'],
            ['4G', '81 cm', '67 cm'],
        ],
    },
    {
        'filename': 'oversized.png',
        'title':    'CAMISETA OVERSIZED',
        'subtitle': 'Unissex',
        'tag':      'Modelagem Oversized · Caimento Amplo',
        'cols':     ['TAMANHO', 'ALTURA', 'LARGURA'],
        'rows': [
            ['P',  '72 cm', '58 cm'],
            ['M',  '74 cm', '60 cm'],
            ['G',  '76 cm', '62 cm'],
            ['GG', '78 cm', '64 cm'],
            ['3G', '80 cm', '68 cm'],
        ],
    },
    {
        'filename': 'babylook.png',
        'title':    'BABY LOOK',
        'subtitle': 'Feminina',
        'tag':      'Modelagem Premium · Algodão Peruano',
        'cols':     ['TAMANHO', 'ALTURA', 'LARGURA'],
        'rows': [
            ['P',  '70 cm', '51 cm'],
            ['M',  '72 cm', '53 cm'],
            ['G',  '74 cm', '55 cm'],
            ['GG', '76 cm', '58 cm'],
        ],
    },
    {
        'filename': 'cropped.png',
        'title':    'CROPPED',
        'subtitle': 'Feminino',
        'tag':      'Modelagem Cropped · Cintura Alta',
        'cols':     ['TAMANHO', 'ALTURA', 'LARGURA'],
        'rows': [
            ['P',  '42 cm', '47 cm'],
            ['M',  '44 cm', '49 cm'],
            ['G',  '46 cm', '51 cm'],
            ['GG', '48 cm', '53 cm'],
        ],
    },
    {
        'filename': 'moletom-cropped.png',
        'title':    'MOLETOM CROPPED',
        'subtitle': 'Feminino',
        'tag':      'Modelagem Cropped · Caimento Estruturado',
        'cols':     ['TAMANHO', 'ALTURA', 'LARGURA'],
        'rows': [
            ['PP', '43 cm', '54 cm'],
            ['P',  '45 cm', '56 cm'],
            ['M',  '47 cm', '58 cm'],
            ['G',  '49 cm', '60 cm'],
            ['GG', '51 cm', '62 cm'],
        ],
    },
]

W, H = 1080, 1350

def draw_chart(chart):
    img  = Image.new('RGB', (W, H), BG_DARK)
    draw = ImageDraw.Draw(img, 'RGBA')

    # ── Header (laranja) ──────────────────────────────────────────────────────
    HEADER_H = 220
    draw.rectangle([(0, 0), (W, HEADER_H)], fill=ORANGE)

    # Logo PattaMansa (creme s/ fundo)
    logo = load_logo(340)
    logo_y = 28
    logo_x = (W - logo.width) // 2
    img.paste(logo, (logo_x, logo_y), logo)

    # "Tabela Oficial de Medidas"
    f_title_lbl = font('bold', 28)
    lbl = 'TABELA OFICIAL DE MEDIDAS'
    bbox_lbl = draw.textbbox((0,0), lbl, font=f_title_lbl)
    lw = bbox_lbl[2] - bbox_lbl[0]
    draw.text(((W - lw)//2, logo_y + logo.height + 10), lbl,
              font=f_title_lbl, fill=BG_DARK)

    # ── Linha divisória ───────────────────────────────────────────────────────
    draw.rectangle([(0, HEADER_H), (W, HEADER_H + 3)], fill=ORANGE)

    # ── Corpo ─────────────────────────────────────────────────────────────────
    BODY_TOP  = HEADER_H + 3
    FOOTER_H  = 110
    BODY_H    = H - BODY_TOP - FOOTER_H

    draw.rectangle([(0, BODY_TOP), (W, BODY_TOP + BODY_H)], fill=BG_CARD)

    y = BODY_TOP + 52

    # Tag / categoria
    f_tag = font('semibold', 22)
    tag   = chart['tag'].upper()
    bbox_tag = draw.textbbox((0,0), tag, font=f_tag)
    tw = bbox_tag[2] - bbox_tag[0]
    draw.text(((W-tw)//2, y), tag, font=f_tag,
              fill=(int(ORANGE[0]*0.9), int(ORANGE[1]*0.9), int(ORANGE[2]*0.9)))
    y += 40

    # Título da modelagem
    f_main = font('bold', 72)
    title  = chart['title']
    bbox_m = draw.textbbox((0,0), title, font=f_main)
    mw = bbox_m[2] - bbox_m[0]
    draw.text(((W-mw)//2, y), title, font=f_main, fill=CREAM)
    y += (bbox_m[3] - bbox_m[1]) + 10

    # Subtítulo
    f_sub  = font('light', 32)
    sub    = chart['subtitle']
    bbox_s = draw.textbbox((0,0), sub, font=f_sub)
    sw = bbox_s[2] - bbox_s[0]
    draw.text(((W-sw)//2, y), sub, font=f_sub,
              fill=(*SAGE_DIM, 180))
    y += 52

    # Linha separadora
    draw.rectangle([(80, y), (W-80, y+1)],
                   fill=(*SAGE_DIM, 25))
    y += 28

    # ── Tabela ────────────────────────────────────────────────────────────────
    PAD_X = 60
    col_x   = [PAD_X, PAD_X + 340, PAD_X + 660]  # inicio de cada coluna
    col_w   = [260, 320, 300]
    f_th    = font('bold', 22)
    f_td    = font('semibold', 26)
    f_td_sz = font('bold', 28)

    # Cabeçalho da tabela
    TH_H = 60
    draw.rectangle([(PAD_X-10, y), (W-PAD_X+10, y+TH_H)],
                   fill=(245, 163, 70, 30))
    draw.rectangle([(PAD_X-10, y+TH_H), (W-PAD_X+10, y+TH_H+2)],
                   fill=(245, 163, 70, 80))

    for i, col_name in enumerate(chart['cols']):
        bbox_h = draw.textbbox((0,0), col_name, font=f_th)
        hw = bbox_h[2] - bbox_h[0]
        cx = col_x[i] + col_w[i]//2 - hw//2
        draw.text((cx, y + (TH_H - (bbox_h[3]-bbox_h[1]))//2),
                  col_name, font=f_th, fill=ORANGE)

    y += TH_H + 2

    # Linhas da tabela
    ROW_H = 68
    for ri, row in enumerate(chart['rows']):
        if ri % 2 == 1:
            draw.rectangle([(PAD_X-10, y), (W-PAD_X+10, y+ROW_H)],
                           fill=(184, 188, 142, 8))

        for ci, cell in enumerate(row):
            f_cell = f_td_sz if ci == 0 else f_td
            color  = ORANGE  if ci == 0 else CREAM
            bbox_c = draw.textbbox((0,0), cell, font=f_cell)
            cw = bbox_c[2] - bbox_c[0]
            cx = col_x[ci] + col_w[ci]//2 - cw//2
            draw.text((cx, y + (ROW_H - (bbox_c[3]-bbox_c[1]))//2),
                      cell, font=f_cell, fill=color)

        # Linha divisória
        if ri < len(chart['rows']) - 1:
            draw.rectangle([(PAD_X-10, y+ROW_H), (W-PAD_X+10, y+ROW_H+1)],
                           fill=(*SAGE_DIM, 18))
        y += ROW_H

    y += 36

    # Box "Como medir"
    BOX_H = 90
    draw.rectangle([(80, y), (W-80, y+BOX_H)],
                   fill=(184, 188, 142, 12),
                   outline=(184, 188, 142, 25))
    f_hint_lbl = font('bold', 18)
    f_hint     = font('regular', 20)
    draw.text((100, y+14), 'COMO MEDIR', font=f_hint_lbl,
              fill=(*SAGE_DIM, 140))
    draw.text((100, y+38), 'Altura = medida vertical da peça (ombro até barra)',
              font=f_hint, fill=(*SAGE_DIM, 130))
    draw.text((100, y+62), 'Largura = medida horizontal do tórax (de axila a axila × 2)',
              font=f_hint, fill=(*SAGE_DIM, 130))

    # ── Footer ────────────────────────────────────────────────────────────────
    FOOTER_Y = H - FOOTER_H
    draw.rectangle([(0, FOOTER_Y), (W, H)], fill=FOOTER_BG)
    draw.rectangle([(0, FOOTER_Y), (W, FOOTER_Y+1)],
                   fill=(*SAGE_DIM, 25))

    f_footer = font('regular', 19)
    footer_txt = 'As medidas podem variar em até 2 cm devido ao processo de fabricação.'
    bbox_ft = draw.textbbox((0,0), footer_txt, font=f_footer)
    fw = bbox_ft[2] - bbox_ft[0]
    fh = bbox_ft[3] - bbox_ft[1]
    draw.text(((W-fw)//2, FOOTER_Y + (FOOTER_H - fh)//2 - 10),
              footer_txt, font=f_footer, fill=(*SAGE_DIM, 160))

    f_brand = font('bold', 18)
    brand_txt = 'PATTAMANSA.COM.BR'
    bbox_br = draw.textbbox((0,0), brand_txt, font=f_brand)
    bw = bbox_br[2] - bbox_br[0]
    draw.text(((W-bw)//2, FOOTER_Y + (FOOTER_H - fh)//2 + 18),
              brand_txt, font=f_brand, fill=(*ORANGE, 160))

    return img


# ── Detecção de duplicatas ────────────────────────────────────────────────────
def rows_hash(rows):
    return str(rows)


def main():
    generated  = []
    reused     = []
    seen       = {}   # hash → filename

    for chart in CHARTS:
        h = rows_hash(chart['rows'])
        if h in seen:
            # Reutiliza imagem já gerada
            src_path = os.path.join(OUT_DIR, seen[h])
            dst_path = os.path.join(OUT_DIR, chart['filename'])
            Image.open(src_path).save(dst_path, 'PNG', optimize=True)
            reused.append((chart['filename'], seen[h]))
            print(f'  [REUTILIZADO] {chart["filename"]} <- {seen[h]}')
        else:
            img = draw_chart(chart)
            out = os.path.join(OUT_DIR, chart['filename'])
            img.save(out, 'PNG', optimize=True)
            seen[h] = chart['filename']
            generated.append(chart['filename'])
            print(f'  [GERADO]      {chart["filename"]}')

    print()
    print('=' * 52)
    print(f'Imagens geradas   : {len(generated)}')
    for f in generated:
        print(f'  ✓ {f}')
    if reused:
        print(f'Tabelas reutilizadas: {len(reused)}')
        for dst, src in reused:
            print(f'  = {dst} (mesmos dados de {src})')
    print()
    print('Aviso: modelagem INFANTIL não existe na LP.')
    print('Nenhuma tabela oficial encontrada para ela.')
    print()
    print(f'Salvo em: {OUT_DIR}')
    print('=' * 52)

if __name__ == '__main__':
    main()
