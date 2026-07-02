import os
from pathlib import Path
print('PWD:', os.getcwd())
print('--- TEXT FILE ---')
with open('00_COMECE_AQUI.txt','r',encoding='utf-8') as f:
    data=f.read()
print(data[:3000])
print('--- PDF TEXT ---')
try:
    from pypdf import PdfReader
    reader = PdfReader('Ebook_Adestramento_PattaMansa.pdf')
    print('PAGE COUNT', len(reader.pages))
    text=''
    for page in reader.pages:
        text += page.extract_text() or ''
    print(text[:8000])
except Exception as e:
    print('ERROR', repr(e))
