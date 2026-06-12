#!/usr/bin/env python3
# Task 1: reorder sections + remove obsolete sections
# Removes: .origem, .ponte, .familia-copa, .trust-strip, .proof
# New order: hero -> [faixa placeholder] -> colecao -> ebook -> algodao -> quem-somos -> comunidade -> ong -> cta -> footer

import re

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def find_marker(text):
    for i, line in enumerate(lines):
        if text in line:
            return i
    raise ValueError(f'Marker not found: {text!r}')

# Section start indices (0-based)
idx_hero       = find_marker('<!-- ══ HERO ══ -->')
idx_origem     = find_marker('<!-- ══ ORIGEM ══ -->')
idx_quem       = find_marker('<!-- ══ QUEM SOMOS ══ -->')
idx_ponte      = find_marker('<!-- ══ PONTE ══ -->')
idx_familia    = find_marker('══ FAMÍLIA COPA ══')   # ══ FAMÍLIA COPA ══
idx_trust      = find_marker('<!-- ══ TRUST STRIP ══ -->')
idx_colecao    = find_marker('<!-- ══ COLEÇÃO ══ -->')   # ══ COLEÇÃO ══
idx_algodao    = find_marker('<!-- ══ ALGODAO PERUANO ══ -->')
idx_comunidade = find_marker('<!-- ══ COMUNIDADE ══ -->')
idx_ebook      = find_marker('<!-- ══ AUTORIDADE / E-BOOK ══ -->')
idx_cta        = find_marker('<!-- ══ CTA URGÊNCIA ══ -->')   # ══ CTA URGÊNCIA ══
idx_ong        = find_marker('<!-- ══ ONG / IMPACTO ══ -->')
idx_proof      = find_marker('<!-- ══ SOCIAL PROOF ══ -->')
idx_footer     = find_marker('<!-- ── FOOTER ── -->')    # ── FOOTER ──

# Slices (each starts at its own comment, ends just before the next section)
preamble       = lines[:idx_hero]
hero_block     = lines[idx_hero:idx_origem]       # hero + copa ticker + social bar
sec_quem       = lines[idx_quem:idx_ponte]        # quem-somos (Task 2 will add ponte quote here)
sec_colecao    = lines[idx_colecao:idx_algodao]   # #selecao-canina
sec_algodao    = lines[idx_algodao:idx_comunidade]
sec_comunidade = lines[idx_comunidade:idx_ebook]
sec_ebook      = lines[idx_ebook:idx_cta]
sec_cta        = lines[idx_cta:idx_ong]
sec_ong        = lines[idx_ong:idx_proof]
# footer_on: skip proof, start from footer comment
sec_footer_on  = lines[idx_footer:]

# Faixa de confiança placeholder (will be filled in Task 3)
faixa = [
    '\n',
    '<!-- ══ FAIXA DE CONFIANÇA ══ -->\n',
    '<!-- TODO TAREFA 3: faixa de confiança -->\n',
    '\n',
]

sep = ['\n']

# Assemble
new_lines = (
    preamble +
    hero_block +
    faixa +
    sec_colecao +
    sep +
    sec_ebook +
    sep +
    sec_algodao +
    sep +
    sec_quem +
    sep +
    sec_comunidade +
    sep +
    sec_ong +
    sep +
    sec_cta +
    sep +
    sec_footer_on
)

# Also remove the dead .origem-line JS block from the script section
full = ''.join(new_lines)

# Remove the origem-line observer block (it's guarded but dead code after section removal)
full = re.sub(
    r'\s*/\* Anima \.origem-line conforme scroll \*/\n'
    r'  const origemLines = document\.querySelectorAll\(\'\.origem-line\'\);\n'
    r'  if \(origemLines\.length\) \{\n'
    r'    const lineObserver = new IntersectionObserver\(\n'
    r'      entries => entries\.forEach\(e => \{\n'
    r"        e\.target\.classList\.toggle\('ativo', e\.isIntersecting\);\n"
    r'      \}\),\n'
    r'      \{ threshold: 0\.5 \}\n'
    r'    \);\n'
    r'    origemLines\.forEach\(l => \{\n'
    r"      l\.classList\.remove\('ativo'\);\n"
    r'      lineObserver\.observe\(l\);\n'
    r'    \}\);\n'
    r'  \}',
    '',
    full
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(full)

print('Task 1 complete.')
print('Removed sections: .origem, .ponte, .familia-copa, .trust-strip, .proof')
print('Removed JS: origemLines observer')
print('New order: hero → faixa placeholder → colecao → ebook → algodao → quem-somos → comunidade → ong → cta → footer')
