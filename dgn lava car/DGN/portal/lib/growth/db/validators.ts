/**
 * Validadores server-side dos payloads que chegam nas route handlers.
 * Implementação sem dependência: `zod` ainda não está no package.json.
 * Quando `zod` for adicionado, cada função pode ser substituída pelo schema
 * correspondente sem quebrar chamadores.
 */

export interface ValidationError {
  field: string;
  message: string;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ValidationError[] };

// ---------------------------------------------------------------------------
// Curadoria
// ---------------------------------------------------------------------------

export interface UpdateCurationInput {
  customerId: string;
  ownerActor: string;
  reason?: string;
  patch: {
    curationProfile?: string;
    originGroup?: string;
    commercialProfile?: string;
    idealSchedule?: string;
    internalNotes?: string;
  };
}

export function validateUpdateCuration(raw: unknown): ValidationResult<UpdateCurationInput> {
  const errors: ValidationError[] = [];
  const obj = (raw ?? {}) as Record<string, unknown>;

  const customerId = typeof obj.customerId === "string" ? obj.customerId : "";
  if (!customerId || !/^[0-9a-f-]{8,}$/i.test(customerId)) {
    errors.push({ field: "customerId", message: "customerId inválido (esperado UUID)" });
  }

  const ownerActor = typeof obj.ownerActor === "string" ? obj.ownerActor.trim() : "";
  if (!ownerActor) errors.push({ field: "ownerActor", message: "ownerActor obrigatório para audit log" });

  const patchRaw = (obj.patch ?? {}) as Record<string, unknown>;
  const patch: UpdateCurationInput["patch"] = {};
  for (const key of ["curationProfile", "originGroup", "commercialProfile", "idealSchedule", "internalNotes"] as const) {
    const v = patchRaw[key];
    if (v !== undefined) {
      if (typeof v !== "string") {
        errors.push({ field: `patch.${key}`, message: "string esperada" });
        continue;
      }
      patch[key] = v.slice(0, 1000);
    }
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { customerId, ownerActor, reason: typeof obj.reason === "string" ? obj.reason : undefined, patch } };
}

// ---------------------------------------------------------------------------
// Transições de pipeline
// ---------------------------------------------------------------------------

export const COMMERCIAL_STAGES = [
  "aguardando_analise", "pronto_para_contato", "contato_preparado", "contatado",
  "visualizou", "respondeu", "conversando", "pagamento_enviado", "convertido", "descartado",
] as const;

export type CommercialStage = (typeof COMMERCIAL_STAGES)[number];

// Grafo de transições permitidas. Cada estágio só aceita ir para os próximos válidos.
const STAGE_TRANSITIONS: Record<CommercialStage, CommercialStage[]> = {
  aguardando_analise:  ["pronto_para_contato", "descartado"],
  pronto_para_contato: ["contato_preparado", "descartado"],
  contato_preparado:   ["contatado", "descartado"],
  contatado:           ["visualizou", "respondeu", "conversando", "descartado"],
  visualizou:          ["respondeu", "conversando", "descartado"],
  respondeu:           ["conversando", "descartado"],
  conversando:         ["pagamento_enviado", "descartado"],
  pagamento_enviado:   ["convertido", "descartado"],
  convertido:          [],
  descartado:          ["aguardando_analise"],
};

export function isValidStageTransition(from: CommercialStage, to: CommercialStage): boolean {
  return STAGE_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface UpdateStageInput {
  campaignMemberId: string;
  ownerActor: string;
  from: CommercialStage;
  to: CommercialStage;
  reason?: string;
}

export function validateStageTransition(raw: unknown): ValidationResult<UpdateStageInput> {
  const errors: ValidationError[] = [];
  const obj = (raw ?? {}) as Record<string, unknown>;

  const id = typeof obj.campaignMemberId === "string" ? obj.campaignMemberId : "";
  if (!id) errors.push({ field: "campaignMemberId", message: "obrigatório" });

  const actor = typeof obj.ownerActor === "string" ? obj.ownerActor.trim() : "";
  if (!actor) errors.push({ field: "ownerActor", message: "obrigatório para audit log" });

  const from = obj.from as CommercialStage;
  const to = obj.to as CommercialStage;
  if (!COMMERCIAL_STAGES.includes(from)) errors.push({ field: "from", message: "estágio inválido" });
  if (!COMMERCIAL_STAGES.includes(to)) errors.push({ field: "to", message: "estágio inválido" });
  if (errors.length === 0 && !isValidStageTransition(from, to)) {
    errors.push({ field: "to", message: `transição ${from} → ${to} não permitida` });
  }

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: { campaignMemberId: id, ownerActor: actor, from, to, reason: typeof obj.reason === "string" ? obj.reason : undefined },
  };
}

// ---------------------------------------------------------------------------
// Validação de assinatura
// ---------------------------------------------------------------------------

export type SubscriptionStatus =
  | "detectado" | "pendente_validacao" | "ativo" | "inadimplente" | "cancelado" | "encerrado";

export interface ValidateSubscriptionInput {
  subscriptionId: string;
  ownerActor: string;
  newStatus: SubscriptionStatus;
  reason: string; // sempre obrigatório na validação humana
}

export function validateSubscriptionValidation(raw: unknown): ValidationResult<ValidateSubscriptionInput> {
  const errors: ValidationError[] = [];
  const obj = (raw ?? {}) as Record<string, unknown>;

  const id = typeof obj.subscriptionId === "string" ? obj.subscriptionId : "";
  if (!id) errors.push({ field: "subscriptionId", message: "obrigatório" });

  const actor = typeof obj.ownerActor === "string" ? obj.ownerActor.trim() : "";
  if (!actor) errors.push({ field: "ownerActor", message: "obrigatório" });

  const reason = typeof obj.reason === "string" ? obj.reason.trim() : "";
  if (!reason || reason.length < 8) {
    errors.push({ field: "reason", message: "motivo (>= 8 caracteres) obrigatório para validar assinatura" });
  }

  const newStatus = obj.newStatus as SubscriptionStatus;
  const allowed: SubscriptionStatus[] = ["detectado", "pendente_validacao", "ativo", "inadimplente", "cancelado", "encerrado"];
  if (!allowed.includes(newStatus)) errors.push({ field: "newStatus", message: "status inválido" });

  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { subscriptionId: id, ownerActor: actor, newStatus, reason } };
}
