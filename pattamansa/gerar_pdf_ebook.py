"""
Gera o PDF do ebook PattaMansa usando Chrome em modo headless.
Execute: python gerar_pdf_ebook.py
"""

import subprocess
import os
import re

BASE   = r"C:\Users\DELL\Desktop\jean IA\pattamansa"
SRC    = os.path.join(BASE, "ebook-pattamansa.html")
TMP    = os.path.join(BASE, "_print_tmp.html")
OUTPUT = os.path.join(BASE, "Ebook_PattaMansa_Final.pdf")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

# ── lê o HTML original ─────────────────────────────────────────
with open(SRC, "r", encoding="utf-8") as f:
    html = f.read()

# ── remove o JS de navegação (que oculta as páginas) ───────────
html = re.sub(r'<script>\s*const ebook[\s\S]*?</script>', '', html)
html = re.sub(r'<script>\s*function salvarPDF[\s\S]*?</script>', '', html)

# ── injeta CSS que torna todas as páginas visíveis ─────────────
override = """
<style>
/* Força impressão com cores exatas */
* {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
}

html, body {
  overflow: visible !important;
  height: auto !important;
  background: white !important;
}

.reader {
  position: static !important;
  width: 480px !important;
  max-width: 480px !important;
  height: auto !important;
  box-shadow: none !important;
  transform: none !important;
  left: 0 !important;
  overflow: visible !important;
  margin: 0 auto !important;
}

.page {
  position: static !important;
  opacity: 1 !important;
  transform: none !important;
  height: auto !important;
  min-height: 854px !important;
  overflow: visible !important;
  z-index: auto !important;
  pointer-events: auto !important;
  display: flex !important;
  page-break-after: always;
  break-after: page;
}

.reader-nav,
.pg-counter,
.btn-pdf { display: none !important; }

@page {
  size: 480px 854px;
  margin: 0;
}
</style>
"""

html = html.replace("</body>", override + "\n</body>")

# ── salva HTML temporário ──────────────────────────────────────
with open(TMP, "w", encoding="utf-8") as f:
    f.write(html)

file_url = "file:///" + TMP.replace("\\", "/").replace(" ", "%20")

# ── roda Chrome headless ───────────────────────────────────────
print("Gerando PDF... aguarde alguns segundos.")

cmd = [
    CHROME,
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-web-security",
    "--allow-file-access-from-files",
    "--run-all-compositor-stages-before-draw",
    "--virtual-time-budget=5000",
    f"--print-to-pdf={OUTPUT}",
    "--print-to-pdf-no-header",
    file_url
]

result = subprocess.run(cmd, capture_output=True, text=True, timeout=90)

# ── limpa arquivo temporário ───────────────────────────────────
try:
    os.remove(TMP)
except Exception:
    pass

# ── resultado ─────────────────────────────────────────────────
if os.path.exists(OUTPUT) and os.path.getsize(OUTPUT) > 1000:
    size_kb = os.path.getsize(OUTPUT) / 1024
    print(f"PDF gerado com sucesso!")
    print(f"   Arquivo : {OUTPUT}")
    print(f"   Tamanho : {size_kb:.0f} KB")
    print("Abrindo o arquivo...")
    os.startfile(OUTPUT)
else:
    print("Erro ao gerar PDF.")
    if result.stderr:
        print("Detalhes:", result.stderr[-600:])
    print("Tente abrir o ebook no Chrome e use Ctrl+P -> Salvar como PDF.")
