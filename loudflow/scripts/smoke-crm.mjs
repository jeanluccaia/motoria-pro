// Smoke test manual do /crm/franquias com seed real.
// Verifica: login quick-picker funciona, página carrega 10 leads, seção
// "Quem chamar agora" aparece com pelo menos 1 lead, botão "Agir agora"
// abre o painel de detalhes com a Recomendação do sistema.

import { chromium } from "@playwright/test";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

const check = (cond, label) => {
  if (!cond) throw new Error(`SMOKE FAIL: ${label}`);
  console.log(`[ok] ${label}`);
};

try {
  await page.goto(`${BASE}/entrar`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /admin crm/i }).click();
  await page.waitForURL((u) => new URL(u).pathname === "/", { timeout: 15_000 });
  check(true, "login via /entrar (quick picker)");

  await page.goto(`${BASE}/crm/franquias`, { waitUntil: "networkidle" });

  // Carregou KPI "Total de leads" com valor 10.
  const total = await page
    .locator("div", { hasText: /^total de leads$/i })
    .first()
    .locator("..")
    .locator("span")
    .last()
    .innerText()
    .catch(async () => {
      // Fallback: pega o <span tabular-nums> dentro do card de total.
      return await page.locator("span.tabular-nums").first().innerText();
    });
  check(total.trim() === "10", `KPI 'Total de leads' = 10 (got ${total.trim()})`);

  // Seção "Quem chamar agora" existe e tem itens.
  const section = page.locator("section", { hasText: "Quem chamar agora" });
  check((await section.count()) >= 1, "section 'Quem chamar agora' presente");
  const queueItems = section.locator("li");
  const n = await queueItems.count();
  check(n >= 1 && n <= 5, `fila com 1..5 itens (got ${n})`);

  // Primeiro item: badge Crítico presente + botão "Agir agora".
  const first = queueItems.first();
  check(
    await first.getByText(/crítico/i).isVisible(),
    "primeiro item tem badge 'Crítico'",
  );
  const act = first.getByRole("button", { name: /agir agora/i });
  check(await act.isVisible(), "primeiro item tem botão 'Agir agora'");

  await act.click();
  await page.waitForSelector("text=Recomendação do sistema", { timeout: 10_000 });
  check(true, "clique abre detalhe com 'Recomendação do sistema'");

  // Confirma presença de reason text.
  const reasons = await page.locator("ul li", { hasText: /./ }).count();
  check(reasons > 0, "painel de recomendação lista pelo menos 1 motivo");

  console.log("\nSMOKE PASS");
} finally {
  await browser.close();
}
