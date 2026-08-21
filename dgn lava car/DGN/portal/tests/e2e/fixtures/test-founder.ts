import { randomBytes } from "node:crypto";

// Cliente sintético controlado — o legacy_id `teste-founder-<hex>` é validado
// pela função Postgres `crm_purge_test_founder` para permitir purga segura.
// Nenhum outro cliente pode ser afetado.
export const TEST_LEGACY_ID = `teste-founder-${randomBytes(8).toString("hex")}`;
export const TEST_NAME = "Cliente Teste Founder";

interface SupabaseEnv {
  url: string;
  serviceRoleKey: string;
}

function readSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Fixture requer NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY. " +
        "Rode com essas envs presentes no processo Playwright.",
    );
  }
  return { url: url.replace(/\/$/, ""), serviceRoleKey };
}

async function post(path: string, body: unknown): Promise<Response> {
  const { url, serviceRoleKey } = readSupabaseEnv();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    return await fetch(`${url}${path}`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        "content-type": "application/json",
        prefer: "return=representation",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function del(path: string): Promise<Response> {
  const { url, serviceRoleKey } = readSupabaseEnv();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    return await fetch(`${url}${path}`, {
      method: "DELETE",
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Cria um cliente sintético em crm_customers com legacy_id `teste-founder-<hex>`.
 * O nome é fixo "Cliente Teste Founder" — a validação do slug de teste no
 * `parseFounderPublicLink` exige exatamente isso.
 */
export async function seedTestCustomer(legacyId: string = TEST_LEGACY_ID): Promise<string> {
  const response = await post("/rest/v1/crm_customers", {
    legacy_id: legacyId,
    name: TEST_NAME,
    normalized_name: TEST_NAME.toLowerCase(),
    origin: "playwright-fixture",
    data_quality_status: "ok",
    service_count: 12,
    historical_value: 1200,
    average_ticket: 100,
    average_interval_days: 25,
    last_service_at: new Date().toISOString().slice(0, 10),
    first_service_at: "2025-01-15",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Falha ao criar fixture: ${response.status} ${detail.slice(0, 300)}`);
  }
  const rows = (await response.json()) as Array<{ id: string }>;
  if (!rows[0]?.id) throw new Error("Fixture criado mas sem id retornado.");
  return rows[0].id;
}

/** Chama `crm_purge_test_founder` para remover cliente sintético + tudo relacionado. */
export async function purgeTestCustomer(legacyId: string = TEST_LEGACY_ID): Promise<void> {
  const response = await post("/rest/v1/rpc/crm_purge_test_founder", { p_legacy_id: legacyId });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Falha ao purgar fixture: ${response.status} ${detail.slice(0, 300)}`);
  }
}

/**
 * Best-effort: tenta remover cliente teste diretamente (sem RPC) — usado
 * quando o `crm_purge_test_founder` não existe (env de teste divergente).
 */
export async function bestEffortDelete(legacyId: string): Promise<void> {
  await del(`/rest/v1/crm_customers?legacy_id=eq.${encodeURIComponent(legacyId)}`).catch(() => undefined);
}
