export const COLORS = {
  preto:       "#0A0A0A",
  offwhite:    "#F5F1E8",
  verde:       "#1FA84C",
  verdeEscuro: "#0E6B30",
  amarelo:     "#FFD400",
} as const;

// ── Timing da composição (30fps, 600f = 20s) ──────────────────────────────────
export const T = {
  hook:      { from: 0,   dur: 90  },  // 0:00–0:03
  conceito:  { from: 90,  dur: 90  },  // 0:03–0:06
  unboxing:  { from: 180, dur: 120 },  // 0:06–0:10
  hero:      { from: 300, dur: 180 },  // 0:10–0:16
  cta:       { from: 480, dur: 120 },  // 0:16–0:20
} as const;

// ── Cortes da fonte (frames na source @30fps) ─────────────────────────────────
export const CUTS = {
  flashCamisa: { startFrom: 585, endAt: 600 },   // 0,5s tease produto
  caoBola1:    { startFrom: 55,  endAt: 130 },   // cão+bola intro (Hook)
  caoBola2:    { startFrom: 130, endAt: 220 },   // cão+bola+branding (Conceito)
  rasgar:      { startFrom: 180, endAt: 270 },   // unboxing rasgar
  eco:         { startFrom: 440, endAt: 470 },   // embalagem eco
  heroCamisa:  { startFrom: 570, endAt: 750 },   // camisa na pessoa (6s)
} as const;

// ── Safe area ─────────────────────────────────────────────────────────────────
export const SAFE = 120;

// ── Props A/B ─────────────────────────────────────────────────────────────────
export const HOOK_VARIANTS = [
  "A CAMISA DO POVO",
  "A SELEÇÃO CANINA CHEGOU",
  "TODO BRASILEIRO VAI QUERER ESSA",
  "EDIÇÃO COPA 2026 🇧🇷",
] as const;

export const CTA_VARIANTS = [
  "GARANTA A SUA",
  "COMPRE AGORA",
  "VISTA A CARAMELO FC",
  "QUERO A MINHA",
] as const;
