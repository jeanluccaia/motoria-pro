// Recovery storage — Entrega 1, Bloqueio 2.
//
// Regra do checkpoint:
//   * Se o buffer local tem uma revision incompatível com a que veio do
//     server (outra sessão salvou), o buffer NÃO pode ser aplicado
//     automaticamente. Também NÃO pode ser descartado silenciosamente.
//   * Movemos o buffer pra `recovery:<diagnostic_id>` e mostramos banner.
//   * Recovery só é limpo depois de o operador escolher explicitamente
//     "carregar servidor" (descarta) ou "ver alterações locais" (visualiza
//     e depois pode limpar).
//   * Zero merge automático nesta entrega.
//
// Helper puro pra testar sem window/localStorage — trabalha sobre uma
// interface `RecoveryStore` mínima. Adapter default é window.localStorage.

export interface RecoveryEnvelope<TSnapshot> {
  savedRev: number;              // revision que o buffer alegava ter
  snapshot: TSnapshot;
  quarantinedAt: string;         // ISO — momento em que foi movido pra recovery
  reason: "revision_mismatch";
}

export interface RecoveryStore {
  read(key: string): string | null;
  write(key: string, value: string): void;
  remove(key: string): void;
}

export interface RecoveryOutcome<TSnapshot> {
  hadBuffer: boolean;
  bufferApplied: boolean;        // true → seguro aplicar em memória sem chamar server
  recovery: RecoveryEnvelope<TSnapshot> | null;
}

export const BUFFER_KEY_PREFIX   = "dgn-diag-server-buffer:";
export const RECOVERY_KEY_PREFIX = "dgn-diag-recovery:";

/**
 * Ao carregar o form:
 *   1. Se não há buffer → estado limpo (server é source of truth).
 *   2. Se há buffer e savedRev == serverRev → buffer é válido (usuário
 *      fechou aba antes do server confirmar): pode aplicar em memória.
 *   3. Se há buffer e savedRev != serverRev → move pra recovery e reporta.
 */
export function ingestBufferOnLoad<TSnapshot>(
  store: RecoveryStore,
  diagnosticId: string,
  serverRevision: number,
  now: () => string = () => new Date().toISOString(),
): RecoveryOutcome<TSnapshot> {
  const bufferKey = BUFFER_KEY_PREFIX + diagnosticId;
  const recoveryKey = RECOVERY_KEY_PREFIX + diagnosticId;

  const raw = store.read(bufferKey);
  let existingRecovery: RecoveryEnvelope<TSnapshot> | null = null;
  const rawRecovery = store.read(recoveryKey);
  if (rawRecovery) {
    try { existingRecovery = JSON.parse(rawRecovery) as RecoveryEnvelope<TSnapshot>; }
    catch { existingRecovery = null; }
  }

  if (!raw) {
    return { hadBuffer: false, bufferApplied: false, recovery: existingRecovery };
  }

  let parsed: { rev: number; snapshot: TSnapshot } | null = null;
  try { parsed = JSON.parse(raw) as { rev: number; snapshot: TSnapshot }; }
  catch { parsed = null; }
  if (!parsed) {
    store.remove(bufferKey);
    return { hadBuffer: false, bufferApplied: false, recovery: existingRecovery };
  }

  if (parsed.rev === serverRevision) {
    // Buffer válido: seguro aplicar em memória.
    return { hadBuffer: true, bufferApplied: true, recovery: existingRecovery };
  }

  // Buffer com revision divergente: move pra recovery, NÃO aplica.
  const envelope: RecoveryEnvelope<TSnapshot> = {
    savedRev: parsed.rev,
    snapshot: parsed.snapshot,
    quarantinedAt: now(),
    reason: "revision_mismatch",
  };
  store.write(recoveryKey, JSON.stringify(envelope));
  store.remove(bufferKey);
  return { hadBuffer: true, bufferApplied: false, recovery: envelope };
}

/**
 * Chamado quando o operador confirma "carregar servidor" (descarta local)
 * OU depois de "ver alterações locais" quando ele fecha o modal.
 * A limpeza é EXPLÍCITA — nunca acontece automaticamente.
 */
export function clearRecovery(store: RecoveryStore, diagnosticId: string): void {
  store.remove(RECOVERY_KEY_PREFIX + diagnosticId);
}

/**
 * Adapter default para window.localStorage. Noop em SSR/testes.
 */
export function createLocalRecoveryStore(): RecoveryStore {
  const hasWindow = typeof window !== "undefined" && !!window.localStorage;
  if (!hasWindow) {
    return { read: () => null, write: () => {}, remove: () => {} };
  }
  return {
    read: (k) => { try { return window.localStorage.getItem(k); } catch { return null; } },
    write: (k, v) => { try { window.localStorage.setItem(k, v); } catch { /* quota */ } },
    remove: (k) => { try { window.localStorage.removeItem(k); } catch { /* ignore */ } },
  };
}
