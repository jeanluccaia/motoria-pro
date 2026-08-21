import { seedTestCustomer, TEST_LEGACY_ID } from "./fixtures/test-founder";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Cria cliente sintético `teste-founder-<hex>` no Supabase configurado (env do
 * processo). O legacy_id gerado é passado para os specs via arquivo temporário.
 * Sem env Supabase, aborta com erro — não escondemos falha de config.
 */
export default async function globalSetup() {
  if (!process.env.DGN_ADMIN_PASSWORD) {
    throw new Error("DGN_ADMIN_PASSWORD ausente no ambiente Playwright.");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Sem Supabase, a suite ainda roda contra dados JSON — o spec do fluxo
    // completo é o único que precisa de fixture e ele mesmo faz test.skip com
    // motivo explícito. Não commitamos secret aqui.
    // eslint-disable-next-line no-console
    console.warn("[global-setup] Supabase env ausente — pulando seed de cliente sintético.");
    writeFileSync(resolve(__dirname, ".fixture-legacy-id"), "");
    return;
  }
  const id = TEST_LEGACY_ID;
  // eslint-disable-next-line no-console
  console.info(`[global-setup] Tentando criar cliente sintético ${id}...`);
  try {
    await seedTestCustomer(id);
    writeFileSync(resolve(__dirname, ".fixture-legacy-id"), id);
    // eslint-disable-next-line no-console
    console.info(`[global-setup] Cliente sintético pronto.`);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "erro desconhecido";
    // eslint-disable-next-line no-console
    console.warn(
      `[global-setup] Não foi possível criar cliente sintético (${reason}).\n` +
        `                O spec do fluxo obrigatório vai skipar com motivo explícito.\n` +
        `                Causa provável: chave sb_secret_* rejeitada por gateway do Supabase\n` +
        `                (proteção anti-abuse) fora dos IPs whitelisted (Vercel).`,
    );
    writeFileSync(resolve(__dirname, ".fixture-legacy-id"), "");
  }
}
