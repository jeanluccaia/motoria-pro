// ── Paleta de marca ──────────────────────────────────────────────────────────
export const COLORS = {
  preto:       "#0A0A0A",
  offwhite:    "#F5F1E8",
  verde:       "#1FA84C",
  amarelo:     "#FFD400",
  verdeEscuro: "#0E6B30",
} as const;

// ── Timeline (frames @30fps, composição 810f = 27s) ───────────────────────────
export const T = {
  gancho:    { from: 0,   dur: 90  },   // 0:00–0:03
  conteudo1: { from: 90,  dur: 180 },   // 0:03–0:09
  conteudo2: { from: 270, dur: 180 },   // 0:09–0:15
  payoff:    { from: 450, dur: 120 },   // 0:15–0:19
  comercial: { from: 570, dur: 210 },   // 0:19–0:26
  cta:       { from: 780, dur: 30  },   // 0:26–0:27
} as const;

// ── Cortes do vídeo base (frames na fonte @30fps) ────────────────────────────
export const CUTS = {
  gancho:    { startFrom: 0,    endAt: 90   },
  conteudo1: { startFrom: 150,  endAt: 330  },
  c2a:       { startFrom: 480,  endAt: 600  },
  c2b:       { startFrom: 840,  endAt: 900  },
  payoff:    { startFrom: 1740, endAt: 1860 },
} as const;

// ── Comercial (sub-blocos dentro de E, frames locais) ─────────────────────────
export const COM = {
  camisaReveal: { from: 0,   dur: 60  },
  estampaClose: { from: 60,  dur: 60  },
  caramelo:     { from: 120, dur: 60  },
  escudo:       { from: 180, dur: 30  },
} as const;

// ── Texto da ponte (payoff) ───────────────────────────────────────────────────
export const BRIDGE = [
  { text: "TODO CACHORRO",          startFrame: 0   },
  { text: "MERECE UM BOM PASSEIO.", startFrame: 30  },
  { text: "E TODO BRASILEIRO",      startFrame: 65  },
  { text: "MERECE A CAMISA DO POVO.", startFrame: 95 },
] as const;

// ── Variações de CTA (A/B test) ───────────────────────────────────────────────
export const CTA_VARIANTS = [
  { id: "PattaMansaCarameloFC",    text: "COMPRE AGORA NA PATTAMANSA" },
  { id: "PattaMansaCarameloFC-V2", text: "GARANTA A SUA"              },
  { id: "PattaMansaCarameloFC-V3", text: "CONHEÇA A COLEÇÃO"          },
  { id: "PattaMansaCarameloFC-V4", text: "VISTA A CARAMELO FC"        },
  { id: "PattaMansaCarameloFC-V5", text: "A CAMISA DO POVO CHEGOU"    },
] as const;

// ── Safe area (px) ────────────────────────────────────────────────────────────
export const SAFE = 120; // px from each edge
