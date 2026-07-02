# render-all.ps1 — Renderiza variações A/B de hook e CTA
$hooks = @("A CAMISA DO POVO","A SELECAO CANINA CHEGOU","TODO BRASILEIRO VAI QUERER ESSA","EDICAO COPA 2026")
$ctas  = @("GARANTA A SUA","COMPRE AGORA","VISTA A CARAMELO FC","QUERO A MINHA")

foreach ($h in $hooks) {
  foreach ($c in $ctas) {
    $slug = ($h -replace ' ','-').ToLower() + "__" + ($c -replace ' ','-').ToLower()
    $out  = "out/copa_$slug.mp4"
    $props = "{`"hookText`":`"$h`",`"ctaText`":`"$c`"}"
    Write-Host "Rendering: $slug" -ForegroundColor Cyan
    npx remotion render PattaMansa_CopaConversao $out --codec=h264 --crf=18 --pixel-format=yuv420p --enforce-audio-track --props=$props
  }
}
Write-Host "Concluido. Arquivos em out/" -ForegroundColor Green
