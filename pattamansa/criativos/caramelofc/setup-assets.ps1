# setup-assets.ps1
# Copia os assets da pasta pattamansa para public/ do projeto Remotion.
# Execute uma vez antes de `npm start` ou `npm run render`.

$root   = Split-Path -Parent $PSScriptRoot  # pattamansa/criativos
$assets = Join-Path $root "..\"             # pattamansa/
$public = Join-Path $PSScriptRoot "public"

Write-Host "=== PattaMansa · Remotion Setup Assets ===" -ForegroundColor Cyan
Write-Host "Assets source: $assets"
Write-Host "Public dir:    $public"
Write-Host ""

function Copy-Asset {
  param([string]$src, [string]$dest)
  $srcFull  = Join-Path $assets $src
  $destFull = Join-Path $public $dest
  if (Test-Path $srcFull) {
    Copy-Item -Path $srcFull -Destination $destFull -Force
    Write-Host "  OK  $dest" -ForegroundColor Green
  } else {
    Write-Host "  MISSING  $src  →  $dest" -ForegroundColor Red
    Write-Host "           Forneça este arquivo antes de renderizar." -ForegroundColor Yellow
  }
}

# ── Vídeo base ────────────────────────────────────────────────────────────────
Copy-Asset "video 1 criativo editar remotion.mp4" "base.mp4"

# ── Logo PattaMansa ───────────────────────────────────────────────────────────
# Usando logo-nav.webp como padrão; substituir por Logo_1.png se preferir alta-res PNG
Copy-Asset "logo-nav.webp" "logo-pattamansa.webp"

# ── Imagens do produto Caramelo FC Baby Look ──────────────────────────────────
Copy-Asset "coleção caramelo fc feminino\verde escuro.webp" "camisa-frente.webp"
Copy-Asset "coleção caramelo fc feminino\preta.webp"        "camisa-detalhe.webp"

# ── Imagem do cão caramelo ────────────────────────────────────────────────────
# Usando ebook-dog-photo.webp; substituir por foto de cão caramelo real se houver
Copy-Asset "ebook-dog-photo.webp" "caramelo.webp"

# ── Trilha musical (opcional) ─────────────────────────────────────────────────
$trilha = Join-Path $assets "trilha.mp3"
if (Test-Path $trilha) {
  Copy-Asset "trilha.mp3" "trilha.mp3"
} else {
  Write-Host "  SKIP  trilha.mp3 — sem trilha, comercial ficará sem música de fundo." -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "=== Assets prontos. Execute: npm start ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Assets que precisam de atenção manual:" -ForegroundColor Yellow
Write-Host "  - logo-pattamansa.webp  → confirmar se é o logo correto (ou trocar por Logo_1.png)"
Write-Host "  - camisa-frente.webp    → foto da camisa verde escuro (substituir por PNG de fundo limpo se houver)"
Write-Host "  - camisa-detalhe.webp   → substituir por close da estampa se existir foto dedicada"
Write-Host "  - caramelo.webp         → substituir por foto do cão caramelo real"
Write-Host "  - trilha.mp3            → adicionar trilha livre de direitos para o bloco comercial"
