#!/usr/bin/env node
/**
 * ETAPA 8 — primeiro lote controlado.
 *
 * Aplica somente as duas gravações mínimas aprovadas no dry-run
 * `6053f1c` para os 4 primeiros assinantes reais:
 *
 *   1) José Moreira (Founder Nº002): UPDATE do único crm_vehicles do
 *      customer, trocando placa GEM5D70 → EOA3940 (recadastro
 *      Mercosul). Preserva vehicle_id e histórico.
 *
 *   2) Wellington Felix: INSERT de um segundo crm_vehicles
 *      (DEF8553 — Golf) sem alterar o primário SWR0J66.
 *
 * Nenhuma outra tabela é tocada:
 *   - crm_customers (não atualiza nome, telefone etc.)
 *   - crm_subscriptions (vencimento vai ficar para migration futura)
 *   - crm_campaign_members / founder_status / founder_number
 *   - crm_founder_public_links / crm_founder_public_events
 *
 * Ambas as gravações são acompanhadas por um crm_audit_logs.
 *
 * Whitelist rígida por customer_id: qualquer instrução fora do lote é
 * abortada.
 *
 * Uso:
 *   node --env-file=.env.local db/scripts/subscriber-import/apply-batch1.mjs --dry-run
 *   node --env-file=.env.local db/scripts/subscriber-import/apply-batch1.mjs --apply
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(2);
}

const MODE = process.argv.includes("--apply")
  ? "apply"
  : process.argv.includes("--dry-run")
  ? "dry-run"
  : null;
if (!MODE) {
  console.error("usage: apply-batch1.mjs --dry-run | --apply");
  process.exit(2);
}

// -----------------------------------------------------------------------------
// Contrato do lote (só o que o dry-run 6053f1c aprovou)
// -----------------------------------------------------------------------------
const ACTOR = "etapa-8-batch1:claude-code";
const ORIGIN = "ASSINANTES_ATIVOS_4UCAR_2026-08-16.xlsx";
const REASON =
  "ETAPA 8 primeiro lote — dry-run 6053f1c aprovado; recadastro Mercosul (José) e 2º veículo (Wellington).";

const WHITELIST = new Set([
  "cb55686f-29dc-470d-8ce3-cf271ecbebac", // Rikardo Oliveira (Founder Nº003) — nenhuma escrita
  "c4debcc9-3a79-4d6b-820f-bbfcf0d41cdf", // Benedito Constantino (Founder Nº001) — nenhuma escrita
  "7c54d056-e1aa-487e-a579-382460c24aaf", // José Moreira (Founder Nº002) — UPDATE placa
  "2fc9edee-d3cd-4365-af5a-ac02c1ccb0bb", // Wellington Felix — INSERT veículo
]);

const JOSE_ID = "7c54d056-e1aa-487e-a579-382460c24aaf";
const JOSE_VEHICLE_EXPECTED = {
  plate: "GEM5D70",
  normalized_plate: "GEM5D70",
  model: "Honda Fit",
};
const JOSE_VEHICLE_TARGET = {
  plate: "EOA3940",
  normalized_plate: "EOA3940",
  masked_plate: "EOA***0",
};

const WELLINGTON_ID = "2fc9edee-d3cd-4365-af5a-ac02c1ccb0bb";
const WELLINGTON_KEEP_PLATE = "SWR0J66";
const WELLINGTON_NEW_VEHICLE = {
  plate: "DEF8553",
  normalized_plate: "DEF8553",
  masked_plate: "DEF***3",
  model: "Golf",
  brand: null,
  is_primary: false,
  source: `4uCar:${ORIGIN}`,
};

// -----------------------------------------------------------------------------
const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function fetchState(customer_id) {
  const { data: c, error: ce } = await supabase
    .from("crm_customers")
    .select("id,name,normalized_phone,updated_at")
    .eq("id", customer_id)
    .single();
  if (ce) throw new Error(`customer ${customer_id}: ${ce.message}`);
  const { data: v, error: ve } = await supabase
    .from("crm_vehicles")
    .select("id,customer_id,plate,masked_plate,normalized_plate,model,brand,is_primary,source,updated_at")
    .eq("customer_id", customer_id)
    .order("created_at", { ascending: true });
  if (ve) throw new Error(`vehicles ${customer_id}: ${ve.message}`);
  const { data: m, error: me } = await supabase
    .from("crm_campaign_members")
    .select("id,campaign_id,founder_status,founder_number,commercial_stage,updated_at")
    .eq("customer_id", customer_id);
  if (me) throw new Error(`members ${customer_id}: ${me.message}`);
  return { customer: c, vehicles: v ?? [], members: m ?? [] };
}

async function preflight() {
  const preflight = {};
  for (const id of WHITELIST) {
    preflight[id] = await fetchState(id);
  }

  // Guard: José tem exatamente 1 vehicle com plate esperada
  const jose = preflight[JOSE_ID];
  if (jose.vehicles.length !== 1) {
    throw new Error(`sanity: José deveria ter 1 veículo, tem ${jose.vehicles.length}`);
  }
  if (jose.vehicles[0].plate !== JOSE_VEHICLE_EXPECTED.plate) {
    throw new Error(
      `sanity: placa atual do José é ${jose.vehicles[0].plate}, esperada ${JOSE_VEHICLE_EXPECTED.plate}`,
    );
  }
  const joseFounder = jose.members.find((m) => m.campaign_id === "founders-2026");
  if (joseFounder?.founder_number !== "002" || joseFounder?.founder_status !== "confirmado") {
    throw new Error(`sanity: José não está mais como Founder Nº002 confirmado`);
  }

  // Guard: Wellington tem exatamente 1 veículo primário SWR0J66
  const wf = preflight[WELLINGTON_ID];
  if (wf.vehicles.length !== 1 || wf.vehicles[0].plate !== WELLINGTON_KEEP_PLATE) {
    throw new Error(
      `sanity: Wellington deveria ter só ${WELLINGTON_KEEP_PLATE}, tem [${wf.vehicles.map((v) => v.plate).join(",")}]`,
    );
  }
  // Guard: DEF8553 não pode existir para nenhum outro customer
  const { data: dup, error } = await supabase
    .from("crm_vehicles")
    .select("id,customer_id,plate,normalized_plate")
    .eq("normalized_plate", WELLINGTON_NEW_VEHICLE.normalized_plate);
  if (error) throw new Error(`dup check DEF8553: ${error.message}`);
  if ((dup ?? []).length > 0) {
    throw new Error(
      `sanity: DEF8553 já existe em outro(s) customer_id: ${JSON.stringify(dup)}`,
    );
  }

  // Guard: Rikardo e Benedito NÃO serão tocados; confirmar Founders 001/003
  const rikardo = preflight["cb55686f-29dc-470d-8ce3-cf271ecbebac"];
  const beneditoState = preflight["c4debcc9-3a79-4d6b-820f-bbfcf0d41cdf"];
  const rikFounder = rikardo.members.find((m) => m.campaign_id === "founders-2026");
  const benFounder = beneditoState.members.find((m) => m.campaign_id === "founders-2026");
  if (rikFounder?.founder_number !== "003" || rikFounder?.founder_status !== "confirmado")
    throw new Error("sanity: Rikardo Nº003 não confirmado");
  if (benFounder?.founder_number !== "001" || benFounder?.founder_status !== "confirmado")
    throw new Error("sanity: Benedito Nº001 não confirmado");

  return preflight;
}

async function applyJose(joseState) {
  const veh = joseState.vehicles[0];
  const before = {
    id: veh.id,
    plate: veh.plate,
    normalized_plate: veh.normalized_plate,
    masked_plate: veh.masked_plate,
  };
  const after = {
    id: veh.id,
    plate: JOSE_VEHICLE_TARGET.plate,
    normalized_plate: JOSE_VEHICLE_TARGET.normalized_plate,
    masked_plate: JOSE_VEHICLE_TARGET.masked_plate,
  };
  const payload = {
    table: "crm_vehicles",
    operation: "update",
    where: { id: veh.id, customer_id: JOSE_ID },
    before,
    after,
    reason: "recadastro Mercosul aprovado no dry-run 6053f1c",
  };
  if (MODE === "dry-run") return { intent: payload };

  const { error: uerr } = await supabase
    .from("crm_vehicles")
    .update({
      plate: after.plate,
      normalized_plate: after.normalized_plate,
      masked_plate: after.masked_plate,
    })
    .eq("id", veh.id)
    .eq("customer_id", JOSE_ID);
  if (uerr) throw new Error(`update José vehicle: ${uerr.message}`);

  const { error: aerr } = await supabase.from("crm_audit_logs").insert({
    entity_type: "crm_vehicles",
    entity_id: veh.id,
    action: "plate_update_recadastro",
    previous_value: before,
    new_value: after,
    actor: ACTOR,
    reason: REASON,
  });
  if (aerr) throw new Error(`audit José vehicle: ${aerr.message}`);

  return { applied: payload };
}

async function applyWellington() {
  const payload = {
    table: "crm_vehicles",
    operation: "insert",
    values: {
      customer_id: WELLINGTON_ID,
      ...WELLINGTON_NEW_VEHICLE,
    },
    reason: "2º veículo confirmado pela planilha 4uCar 2026-08-16",
  };
  if (MODE === "dry-run") return { intent: payload };

  const { data: inserted, error: ierr } = await supabase
    .from("crm_vehicles")
    .insert({
      customer_id: WELLINGTON_ID,
      ...WELLINGTON_NEW_VEHICLE,
    })
    .select("id")
    .single();
  if (ierr) throw new Error(`insert Wellington vehicle: ${ierr.message}`);

  const { error: aerr } = await supabase.from("crm_audit_logs").insert({
    entity_type: "crm_vehicles",
    entity_id: inserted.id,
    action: "vehicle_added_from_spreadsheet",
    previous_value: null,
    new_value: { customer_id: WELLINGTON_ID, ...WELLINGTON_NEW_VEHICLE, id: inserted.id },
    actor: ACTOR,
    reason: REASON,
  });
  if (aerr) throw new Error(`audit Wellington insert: ${aerr.message}`);

  return { applied: { ...payload, inserted_id: inserted.id } };
}

async function verifyAfter() {
  const jose = await fetchState(JOSE_ID);
  const wf = await fetchState(WELLINGTON_ID);
  const rikardo = await fetchState("cb55686f-29dc-470d-8ce3-cf271ecbebac");
  const beneditoState = await fetchState("c4debcc9-3a79-4d6b-820f-bbfcf0d41cdf");
  return {
    jose: {
      name: jose.customer.name,
      vehicles: jose.vehicles.map((v) => v.plate),
      founder: jose.members.find((m) => m.campaign_id === "founders-2026"),
    },
    wellington: {
      name: wf.customer.name,
      vehicles: wf.vehicles.map((v) => v.plate),
      founder: wf.members.find((m) => m.campaign_id === "founders-2026") ?? null,
    },
    rikardo: {
      name: rikardo.customer.name,
      vehicles: rikardo.vehicles.map((v) => v.plate),
      founder: rikardo.members.find((m) => m.campaign_id === "founders-2026"),
    },
    benedito: {
      name: beneditoState.customer.name,
      vehicles: beneditoState.vehicles.map((v) => v.plate),
      founder: beneditoState.members.find((m) => m.campaign_id === "founders-2026"),
    },
  };
}

// -----------------------------------------------------------------------------
process.stderr.write(`[apply-batch1] mode=${MODE}\n`);

const state = await preflight();
process.stderr.write(`[apply-batch1] pré-voo OK, todos os guards passaram\n`);

const jose = await applyJose(state[JOSE_ID]);
const wellington = await applyWellington();
const after = MODE === "apply" ? await verifyAfter() : null;

const summary = {
  mode: MODE,
  actor: ACTOR,
  origin: ORIGIN,
  jose,
  wellington,
  verification: after,
};
process.stdout.write(JSON.stringify(summary, null, 2));
process.stderr.write(`\n[apply-batch1] done\n`);
