// DGN Diagnósticos — Rascunho local + debounce
//
// Fase 0.5: rascunho vive só no `localStorage`. A interface `DraftPersister`
// já está desenhada pra que a Entrega 2 troque o adapter local por um
// adapter que fala com `PATCH /api/admin/growth/diagnostics/:id` sem que a
// UI perceba a diferença.
//
// Regras:
//   * O debounce dispara APÓS 3000ms de ociosidade (última chamada de
//     `scheduleSave`). Se o usuário parar de digitar antes disso, nada é
//     persistido.
//   * `flush()` força persistência imediata — usado em unmount e antes de
//     navegar pra outra seção.
//   * NÃO existe endpoint fake nesta fase. O adapter default só grava/lê
//     em `localStorage`. Chamadas server são placeholder e retornam sem
//     efeito colateral.

export interface DraftPersister<TState> {
  read(key: string): TState | null;
  write(key: string, state: TState): void;
  clear(key: string): void;
}

export interface DraftScheduler<TState> {
  /**
   * Marca o estado como "sujo" e agenda persistência após `debounceMs`.
   * Chamadas subsequentes reiniciam a contagem.
   */
  scheduleSave(state: TState): void;
  /** Persiste imediatamente qualquer rascunho pendente. */
  flush(): void;
  /** Cancela qualquer persistência pendente sem gravar. */
  cancel(): void;
  /** Retorna a última chamada agendada (útil pra teste). */
  getPendingState(): TState | null;
}

export interface CreateDraftSchedulerOptions {
  key: string;
  debounceMs?: number;
  now?: () => number;
  setTimer?: (fn: () => void, ms: number) => number;
  clearTimer?: (id: number) => void;
}

export function createDraftScheduler<TState>(
  persister: DraftPersister<TState>,
  options: CreateDraftSchedulerOptions,
): DraftScheduler<TState> {
  const debounceMs = options.debounceMs ?? 3000;
  const setTimer =
    options.setTimer ?? ((fn, ms) => setTimeout(fn, ms) as unknown as number);
  const clearTimer =
    options.clearTimer ?? ((id) => clearTimeout(id as unknown as NodeJS.Timeout));

  let timerId: number | null = null;
  let pending: TState | null = null;

  const clearPending = () => {
    if (timerId !== null) {
      clearTimer(timerId);
      timerId = null;
    }
  };

  return {
    scheduleSave(state: TState) {
      pending = state;
      clearPending();
      timerId = setTimer(() => {
        if (pending !== null) {
          persister.write(options.key, pending);
          pending = null;
        }
        timerId = null;
      }, debounceMs);
    },
    flush() {
      clearPending();
      if (pending !== null) {
        persister.write(options.key, pending);
        pending = null;
      }
    },
    cancel() {
      clearPending();
      pending = null;
    },
    getPendingState() {
      return pending;
    },
  };
}

// ---------------------------------------------------------------------------
// Adapter default para `localStorage`. Retorna um noop-persister em ambientes
// sem `window` (SSR/testes) — segurança pra não quebrar no server component.
// ---------------------------------------------------------------------------

export function createLocalStoragePersister<TState>(): DraftPersister<TState> {
  const hasWindow = typeof window !== "undefined" && !!window.localStorage;
  if (!hasWindow) {
    return {
      read: () => null,
      write: () => {},
      clear: () => {},
    };
  }
  return {
    read(key: string): TState | null {
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw) as TState;
      } catch {
        return null;
      }
    },
    write(key: string, state: TState): void {
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch {
        // quota / private mode — não quebra a UI
      }
    },
    clear(key: string): void {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    },
  };
}
