/**
 * Sanity check das envs exigidas pela suite. Cada spec que precisa de fixture
 * (mobile-fluxo-obrigatorio) cria o próprio cliente sintético em beforeEach —
 * isso evita colisão entre viewports rodando em paralelo.
 */
export default async function globalSetup() {
  if (!process.env.DGN_ADMIN_PASSWORD) {
    throw new Error("DGN_ADMIN_PASSWORD ausente no ambiente Playwright.");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      "[global-setup] Supabase env ausente — specs que dependem de seed vão falhar com mensagem explícita.",
    );
  }
}
