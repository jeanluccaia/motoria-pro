import unicodedata, pathlib, re

p = pathlib.Path('revisar_imagens_ebook.py')
content = p.read_text(encoding='utf-8')

# 1. Normalizar NFD -> NFC em todo o arquivo (converte a+U+0301 -> U+00E1)
normalized = unicodedata.normalize('NFC', content)

# 2. Substituir o bloco do titulo para usar helv nas linhas com acento agudo
old_pat = (
    '# Titulo do capitulo\n'
    '    for txt, y in [("Quem está por", 58), ("trás da", 79), ("PattaMansa", 100)]:\n'
    '        page.insert_text(fitz.Point(27.4, y), txt,\n'
    '                         fontname="hebo", fontsize=18, color=DEEP_F, overlay=True)'
)

new_blk = (
    '# Titulo do capitulo\n'
    '    # helv para linhas com acento agudo (hebo usa combining, helv tem glifo composto)\n'
    '    for txt, y, fn, fs in [\n'
    '        ("Quem está por", 58, "helv", 19),\n'
    '        ("trás da",       79, "helv", 19),\n'
    '        ("PattaMansa",   100, "hebo", 18),\n'
    '    ]:\n'
    '        page.insert_text(fitz.Point(27.4, y), txt,\n'
    '                         fontname=fn, fontsize=fs, color=DEEP_F, overlay=True)'
)

if old_pat in normalized:
    fixed = normalized.replace(old_pat, new_blk, 1)
    p.write_text(fixed, encoding='utf-8')
    print('OK — titulo corrigido e arquivo normalizado NFC.')
else:
    print('BLOCO NAO ENCONTRADO. Verificando conteudo:')
    idx = normalized.find('Titulo do capitulo')
    print(repr(normalized[idx:idx+350]))
