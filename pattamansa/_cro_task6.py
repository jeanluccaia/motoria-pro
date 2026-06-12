#!/usr/bin/env python3
# Task 6: price anchor + badges on cards

import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add price-de placeholder before each .vcard-price span
# Pattern: the <span class="vcard-price-stack"> followed by <span class="vcard-price">
content = re.sub(
    r'(<span class="vcard-price-stack">\s*)(<span class="vcard-price">)',
    r'\1<!-- ANCORA_PRECO: de R$ [PRECO_CHEIO] (apagar este comentario e descomentar a linha abaixo quando definir o preco cheio) -->\n                <!-- <span class="vcard-price-de">de R$ [PRECO_CHEIO]</span> -->\n                \2',
    content
)

# 2. Add "Mais vendida" badge to:
#    a) Caramelo FC Baby Look Feminina: id="cfc2Img" card
#    b) Seleção Canina Baby Look (feminina): id="scImg" card
#    c) Caramelo FC Unissex: id="cfcImg" card  (Regular · Unissex)
# Actually re-reading: "Caramelo FC unissex" and "Selecao Canina baby look"

BADGE = '            <div class="vcard-badge-wrap"><span class="vcard-badge-best">Mais vendida</span></div>\n'

# Badge on Seleção Canina Baby Look feminina (scImg card)
content = content.replace(
    '          <div class="vcard-img-wrap">\n            <img id="scImg"',
    '          <div class="vcard-img-wrap">\n' + BADGE + '            <img id="scImg"',
    1
)

# Badge on Caramelo FC Unissex (cfcImg card)
content = content.replace(
    '          <div class="vcard-img-wrap">\n            <img id="cfcImg"',
    '          <div class="vcard-img-wrap">\n' + BADGE + '            <img id="cfcImg"',
    1
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Task 6 price-de and badges applied.')
