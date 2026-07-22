/** Validação read-only do DGN Growth alternando db -> json -> db. */
import { createClient } from "@supabase/supabase-js";
import { resolve } from "node:path";
import { loadGrowthData } from "../../lib/growth/db/growth-reader.ts";
import { maskPlate, matchesDgnCustomerSearch } from "../../lib/growth/dgn-growth-data.ts";
import { supabaseSecretKeyFetch } from "../../lib/growth/db/secret-key-fetch.ts";

const root = resolve(import.meta.dirname, "../..");
try { process.loadEnvFile(resolve(root, ".env.local")); } catch { /* checked below */ }
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("credenciais server-side ausentes");
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: supabaseSecretKeyFetch } });
const timed = async <T>(run: () => Promise<T>) => {
  const started = performance.now();
  const value = await run();
  return { value, durationMs: Math.round((performance.now() - started) * 100) / 100 };
};
const assert: (condition: unknown, message: string) => asserts condition = (condition, message) => {
  if (!condition) throw new Error(`validação falhou: ${message}`);
};

const firstDb = await timed(() => loadGrowthData({ env: { DGN_GROWTH_DATA_SOURCE: "db" }, db, logger: console }));
const customers = firstDb.value.customers;
assert(firstDb.value.origin === "db", "origem não é db");
assert(customers.length === 1152, `total db=${customers.length}`);

const protectedQueries = ["Benedito Constantino", "José Moreira", "Rikardo Oliveira", "Iara"];
const dynamicComplete = customers.find((row) => !protectedQueries.some((name) => row.name.includes(name.split(" ")[0])) && !row.dataQualityNotes?.includes("revisao_manual") && row.phone && row.vehicle !== "A definir");
const dynamicIncomplete = customers.find((row) => row.dataQualityNotes?.includes("revisao_manual"));
assert(dynamicComplete && dynamicIncomplete, "amostras dinâmicas ausentes");
const searchStarted = performance.now();
const searchResults = [...protectedQueries, dynamicComplete.name, dynamicIncomplete.name].map((query) => customers.filter((row) => matchesDgnCustomerSearch(row, query)).length);
const phoneSearch = customers.filter((row) => matchesDgnCustomerSearch(row, dynamicComplete.phone)).length;
const plateSearch = customers.filter((row) => matchesDgnCustomerSearch(row, dynamicComplete.plate)).length;
const searchDurationMs = Math.round((performance.now() - searchStarted) * 100) / 100;
assert(searchResults.every((count) => count > 0), `busca nominal=${searchResults.join(",")}`);
assert(phoneSearch > 0 && plateSearch > 0, "busca telefone/placa");

const sorted = {
  score: [...customers].sort((a, b) => b.scoreDgn - a.scoreDgn),
  atendimentos: [...customers].sort((a, b) => b.washCount - a.washCount),
  valor: [...customers].sort((a, b) => b.historicalValue - a.historicalValue),
  ultimo: [...customers].sort((a, b) => b.lastAttendance.localeCompare(a.lastAttendance)),
};
assert(sorted.atendimentos[0].washCount >= sorted.atendimentos.at(-1)!.washCount, "ordenação atendimentos");
assert(sorted.valor[0].historicalValue >= sorted.valor.at(-1)!.historicalValue, "ordenação valor");
assert(sorted.ultimo[0].lastAttendance >= sorted.ultimo.at(-1)!.lastAttendance, "ordenação data");
const review = customers.filter((row) => row.dataQualityNotes?.includes("revisao_manual"));
const invalidPhone = customers.filter((row) => row.hasValidPhone === false);
const undefinedVehicle = customers.filter((row) => row.vehicle === "A definir");
assert(review.length === 250, `revisão=${review.length}`);
assert(invalidPhone.length > 0 && undefinedVehicle.length > 0, "sinais de qualidade");

const iara = customers.find((row) => row.id === "iara");
assert(iara, "Iara ausente");
assert(iara.commercial?.owner === "Rodrigo", "responsável da Iara");
assert(iara.commercial.priority === "alta", "prioridade da Iara");
assert(iara.commercial.commercialNotes === "Contato comercial validado", "observação da Iara");
assert(iara.commercial.nextAction === "Aguardar retorno da Iara", "próxima ação da Iara");
assert(["2026-08-04T18:00:00+00:00", "2026-08-04T18:00:00Z"].includes(iara.commercial.nextActionAt), "data da Iara");

const pageStarted = performance.now();
const firstPage = customers.slice(0, 50);
const secondPage = customers.slice(50, 100);
const pageDurationMs = Math.round((performance.now() - pageStarted) * 100) / 100;
assert(firstPage.length === 50 && secondPage.length === 50 && firstPage[0].id !== secondPage[0].id, "paginação");
const profileStarted = performance.now();
const profiles = [
  ...protectedQueries.map((name) => customers.find((row) => matchesDgnCustomerSearch(row, name))),
  dynamicComplete, dynamicIncomplete,
  customers.find((row) => row.hasValidPhone === false),
  customers.find((row) => row.vehicle === "A definir"),
];
assert(profiles.every(Boolean), "perfis obrigatórios");
assert(profiles.filter(Boolean).every((row) => maskPlate(row!.plate) !== row!.plate || !row!.plate), "máscara de placa");
const profileDurationMs = Math.round((performance.now() - profileStarted) * 100) / 100;

const json = await timed(() => loadGrowthData({ env: { DGN_GROWTH_DATA_SOURCE: "json" } }));
assert(json.value.origin === "json" && json.value.customers.length === 1152, "fallback JSON");
const secondDb = await timed(() => loadGrowthData({ env: { DGN_GROWTH_DATA_SOURCE: "db" }, db, logger: console }));
assert(secondDb.value.origin === "db" && secondDb.value.customers.length === 1152, "retorno ao db");
console.log(JSON.stringify({
  source: firstDb.value.origin, intelligenceTotal: customers.length, curationTotal: customers.length,
  reviewManual: review.length, invalidPhone: invalidPhone.length, vehicleUndefined: undefinedVehicle.length,
  pageSize: 50, searches: { names: searchResults, phone: phoneSearch, plate: plateSearch },
  sorting: { score: true, atendimentos: true, valor: true, ultimo: true, scoreSnapshotsPresent: customers.some((row) => row.scoreDgn !== 0) },
  iaraCommercialPreserved: true, profilesValidated: profiles.length, masking: true,
  performanceMs: { firstDbLoad: firstDb.durationMs, search: searchDurationMs, pagination: pageDurationMs, profile: profileDurationMs, jsonLoad: json.durationMs, secondDbLoad: secondDb.durationMs },
  fallbackSequence: [firstDb.value.origin, json.value.origin, secondDb.value.origin],
}, null, 2));
