import { bestEffortDelete, purgeTestCustomer } from "./fixtures/test-founder";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Purga o cliente sintético criado no global-setup. Falha em purgar não é
 * fatal (best-effort) — apenas logamos para inspeção manual, garantindo que a
 * suite não exploda por conta de limpeza.
 */
export default async function globalTeardown() {
  const filePath = resolve(__dirname, ".fixture-legacy-id");
  if (!existsSync(filePath)) return;
  const id = readFileSync(filePath, "utf8").trim();
  unlinkSync(filePath);
  if (!id) return;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    // eslint-disable-next-line no-console
    console.info(`[global-teardown] Purgando cliente sintético ${id}...`);
    await purgeTestCustomer(id);
    // eslint-disable-next-line no-console
    console.info(`[global-teardown] Purga concluída.`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`[global-teardown] Falha na purga via RPC (${(error as Error).message}) — tentando DELETE direto.`);
    await bestEffortDelete(id);
  }
}
