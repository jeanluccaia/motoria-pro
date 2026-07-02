# render-all.ps1 — Renderiza todas as variações de CTA (A/B test)
# Requer: npm install concluído + assets em public/

$variants = @(
  @{ id = "PattaMansaCarameloFC";    file = "v1_compre_agora"   },
  @{ id = "PattaMansaCarameloFC-V2"; file = "v2_garanta_a_sua"  },
  @{ id = "PattaMansaCarameloFC-V3"; file = "v3_conheca"        },
  @{ id = "PattaMansaCarameloFC-V4"; file = "v4_vista_caramelo" },
  @{ id = "PattaMansaCarameloFC-V5"; file = "v5_camisa_chegou"  }
)

foreach ($v in $variants) {
  $out = "out/pattamansa_caramelofc_$($v.file).mp4"
  Write-Host "Rendering $($v.id) → $out" -ForegroundColor Cyan
  npx remotion render $v.id $out --codec=h264 --crf=18 --pixel-format=yuv420p --enforce-audio-track
  if ($LASTEXITCODE -eq 0) {
    Write-Host "  DONE: $out" -ForegroundColor Green
  } else {
    Write-Host "  ERROR: render failed for $($v.id)" -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "=== Render completo. Arquivos em out/ ===" -ForegroundColor Cyan
