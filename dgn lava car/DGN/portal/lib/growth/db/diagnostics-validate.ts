// Validação pura do payload PATCH de diagnóstico. Testado unitariamente —
// mantém o endpoint enxuto e a RPC blindada por defesa em profundidade.
//
// Regras enforçadas aqui:
//   * score: null OU number em [0, 10] em passos de 0.5. Nunca sobrescrever
//     com 0 quando o cliente mandou null.
//   * condition: enum ∈ {not_evaluated, good, attention, intervention_recommended}.
//   * priority: enum ∈ {opcional, recomendado, prioritario}.
//   * investment_items: se base_price_cents diverge de catalog_reference_price_cents,
//     override_reason precisa vir preenchido (regra do checkpoint).
//   * final_price_cents no client é IGNORADO — endpoint remove antes de mandar
//     pra RPC pra não deixar "hint" viajar acidentalmente.

export type ValidationIssue = { path: string; message: string; code?: string };
export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; issues: ValidationIssue[] };

export const INSPECTION_CONDITIONS = [
  "not_evaluated", "good", "attention", "intervention_recommended",
] as const;
export type InspectionCondition = typeof INSPECTION_CONDITIONS[number];

export const DGN_SCORE_KEYS = [
  "conservacao_pintura", "brilho_profundidade", "ausencia_riscos",
  "limpeza_descontaminacao", "protecao_existente",
] as const;
export type DgnScoreKey = typeof DGN_SCORE_KEYS[number];

export const RECOMMENDATION_PRIORITIES = ["opcional", "recomendado", "prioritario"] as const;
export type RecommendationPriority = typeof RECOMMENDATION_PRIORITIES[number];

// ---------------------------------------------------------------------------

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function isValidScoreValue(v: unknown): v is number | null {
  if (v === null) return true;
  if (typeof v !== "number" || !Number.isFinite(v)) return false;
  if (v < 0 || v > 10) return false;
  // step 0.5 → v * 2 deve ser inteiro
  return Number.isInteger(v * 2);
}

// ---------------------------------------------------------------------------

export function validatePatchPayload(input: unknown): ValidationResult<Record<string, unknown>> {
  const issues: ValidationIssue[] = [];
  if (!isPlainObject(input)) {
    return { ok: false, issues: [{ path: "$", message: "Payload deve ser objeto JSON." }] };
  }

  const out: Record<string, unknown> = {};

  // scores — só valida se a chave estiver presente e NÃO for null.
  if ("scores" in input && input.scores !== null) {
    const arr = input.scores;
    if (!Array.isArray(arr)) {
      issues.push({ path: "scores", message: "scores deve ser array." });
    } else {
      const cleaned: Array<{ criterion_key: string; score: number | null }> = [];
      arr.forEach((entry, i) => {
        if (!isPlainObject(entry)) {
          issues.push({ path: `scores[${i}]`, message: "item deve ser objeto." });
          return;
        }
        const criterionKey = entry.criterion_key ?? entry.criterionKey;
        if (typeof criterionKey !== "string") {
          issues.push({ path: `scores[${i}].criterion_key`, message: "obrigatório string." });
          return;
        }
        if (!(DGN_SCORE_KEYS as readonly string[]).includes(criterionKey)) {
          issues.push({ path: `scores[${i}].criterion_key`, message: `enum inválido: ${criterionKey}` });
          return;
        }
        const rawScore = "score" in entry ? entry.score : null;
        if (!isValidScoreValue(rawScore)) {
          issues.push({
            path: `scores[${i}].score`,
            message: "score deve ser null OU number em [0,10] com step 0.5.",
          });
          return;
        }
        cleaned.push({ criterion_key: criterionKey, score: rawScore as number | null });
      });
      out.scores = cleaned;
    }
  } else if ("scores" in input) {
    out.scores = null; // preserva atual (RPC trata)
  }

  // inspection_areas
  if ("inspection_areas" in input && input.inspection_areas !== null) {
    const arr = input.inspection_areas;
    if (!Array.isArray(arr)) {
      issues.push({ path: "inspection_areas", message: "inspection_areas deve ser array." });
    } else {
      const cleaned = arr.map((entry, i) => {
        if (!isPlainObject(entry)) {
          issues.push({ path: `inspection_areas[${i}]`, message: "item deve ser objeto." });
          return null;
        }
        const areaKey = entry.area_key;
        const condition = entry.condition;
        const publicVisible = entry.public_visible;
        if (typeof areaKey !== "string" || !areaKey) {
          issues.push({ path: `inspection_areas[${i}].area_key`, message: "obrigatório string." });
          return null;
        }
        if (typeof condition !== "string" || !(INSPECTION_CONDITIONS as readonly string[]).includes(condition)) {
          issues.push({
            path: `inspection_areas[${i}].condition`,
            message: `enum inválido: ${String(condition)}`,
          });
          return null;
        }
        if (typeof publicVisible !== "boolean") {
          issues.push({
            path: `inspection_areas[${i}].public_visible`,
            message: "obrigatório boolean.",
          });
          return null;
        }
        return {
          area_key: areaKey,
          condition,
          public_visible: publicVisible,
          internal_notes: typeof entry.internal_notes === "string" ? entry.internal_notes : "",
          public_notes: typeof entry.public_notes === "string" ? entry.public_notes : "",
        };
      }).filter((x) => x !== null);
      out.inspection_areas = cleaned;
    }
  } else if ("inspection_areas" in input) {
    out.inspection_areas = null;
  }

  // recommendations
  if ("recommendations" in input && input.recommendations !== null) {
    const arr = input.recommendations;
    if (!Array.isArray(arr)) {
      issues.push({ path: "recommendations", message: "recommendations deve ser array." });
    } else {
      const cleaned = arr.map((entry, i) => {
        if (!isPlainObject(entry)) {
          issues.push({ path: `recommendations[${i}]`, message: "item deve ser objeto." });
          return null;
        }
        const serviceKey = entry.service_key;
        const catalogVersion = entry.catalog_version;
        const priority = entry.priority;
        if (typeof serviceKey !== "string" || !serviceKey) {
          issues.push({ path: `recommendations[${i}].service_key`, message: "obrigatório." });
          return null;
        }
        if (typeof catalogVersion !== "string" || !catalogVersion) {
          issues.push({ path: `recommendations[${i}].catalog_version`, message: "obrigatório." });
          return null;
        }
        if (typeof priority !== "string" || !(RECOMMENDATION_PRIORITIES as readonly string[]).includes(priority)) {
          issues.push({
            path: `recommendations[${i}].priority`,
            message: `enum inválido: ${String(priority)}`,
          });
          return null;
        }
        return {
          service_key: serviceKey,
          catalog_version: catalogVersion,
          priority,
          reason: typeof entry.reason === "string" ? entry.reason : "",
        };
      }).filter((x) => x !== null);
      out.recommendations = cleaned;
    }
  } else if ("recommendations" in input) {
    out.recommendations = null;
  }

  // investment_items
  if ("investment_items" in input && input.investment_items !== null) {
    const arr = input.investment_items;
    if (!Array.isArray(arr)) {
      issues.push({ path: "investment_items", message: "investment_items deve ser array." });
    } else {
      const cleaned = arr.map((entry, i) => {
        if (!isPlainObject(entry)) {
          issues.push({ path: `investment_items[${i}]`, message: "item deve ser objeto." });
          return null;
        }
        const serviceKey = entry.service_key;
        const catalogVersion = entry.catalog_version;
        const catalogRef = entry.catalog_reference_price_cents;
        const basePrice = entry.base_price_cents;
        const discount = entry.discount_percent ?? 0;
        const overrideReason = entry.override_reason;

        if (typeof serviceKey !== "string" || !serviceKey) {
          issues.push({ path: `investment_items[${i}].service_key`, message: "obrigatório." });
          return null;
        }
        if (typeof catalogVersion !== "string" || !catalogVersion) {
          issues.push({ path: `investment_items[${i}].catalog_version`, message: "obrigatório." });
          return null;
        }
        if (typeof catalogRef !== "number" || catalogRef < 0 || !Number.isInteger(catalogRef)) {
          issues.push({
            path: `investment_items[${i}].catalog_reference_price_cents`,
            message: "inteiro >= 0.",
          });
          return null;
        }
        if (typeof basePrice !== "number" || basePrice < 0 || !Number.isInteger(basePrice)) {
          issues.push({
            path: `investment_items[${i}].base_price_cents`,
            message: "inteiro >= 0.",
          });
          return null;
        }
        if (typeof discount !== "number" || discount < 0 || discount > 100 || !Number.isInteger(discount)) {
          issues.push({
            path: `investment_items[${i}].discount_percent`,
            message: "inteiro em [0, 100].",
          });
          return null;
        }

        // Regra do checkpoint: override_reason obrigatório se base <> catalog.
        if (basePrice !== catalogRef) {
          if (typeof overrideReason !== "string" || overrideReason.trim() === "") {
            issues.push({
              path: `investment_items[${i}].override_reason`,
              code: "OVERRIDE_REASON_REQUIRED",
              message: "base_price_cents diverge do catálogo; override_reason obrigatório.",
            });
            return null;
          }
        }

        return {
          service_key: serviceKey,
          catalog_version: catalogVersion,
          catalog_reference_price_cents: catalogRef,
          base_price_cents: basePrice,
          discount_percent: discount,
          installments: typeof entry.installments === "number" ? entry.installments : null,
          pix_eligible: typeof entry.pix_eligible === "boolean" ? entry.pix_eligible : false,
          note: typeof entry.note === "string" ? entry.note : "",
          override_reason: typeof overrideReason === "string" ? overrideReason : null,
          // final_price_cents é ignorado de propósito — recalculado no publish (Entrega 2).
        };
      }).filter((x) => x !== null);
      out.investment_items = cleaned;
    }
  } else if ("investment_items" in input) {
    out.investment_items = null;
  }

  // Campos escalares
  if ("summary" in input && typeof input.summary === "string") out.summary = input.summary;
  if ("performed_by" in input && typeof input.performed_by === "string") out.performed_by = input.performed_by;
  if ("performed_at" in input && (typeof input.performed_at === "string" || input.performed_at === null)) {
    out.performed_at = input.performed_at;
  }
  if ("status" in input && typeof input.status === "string") {
    if (input.status === "draft" || input.status === "review_ready") {
      out.status = input.status;
    } else {
      issues.push({ path: "status", message: `Entrega 1 só aceita draft|review_ready. Recebido: ${input.status}` });
    }
  }
  if ("public_visibility_defaults" in input && isPlainObject(input.public_visibility_defaults)) {
    const p = input.public_visibility_defaults;
    out.public_visibility_defaults = {
      show_areas: typeof p.show_areas === "boolean" ? p.show_areas : true,
      show_scores: typeof p.show_scores === "boolean" ? p.show_scores : true,
      show_investment: typeof p.show_investment === "boolean" ? p.show_investment : true,
    };
  }

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, value: out };
}
