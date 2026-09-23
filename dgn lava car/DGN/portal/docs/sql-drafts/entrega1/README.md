# DGN Diagnósticos — Drafts SQL da Entrega 1

**Status:** RASCUNHO. Nada aqui foi aplicado. Só rodar depois de autorização explícita do Jean.

## Escopo APROVADO desta entrega

Só o que é necessário para **cadastrar rascunho, editar com autosave, anexar/remover fotos e retomar** — nada de publicação, versão imutável, link público ou tracking. Isso fica na Entrega 2 (`../entrega2/`).

Entram nesta migração:

- `crm_diagnostics` (tabela raiz com JSONB rico)
- `crm_diagnostic_photos` (tabela)
- bucket privado `diagnostic-media`
- 4 RPCs: `crm_create_diagnostic_draft`, `crm_patch_diagnostic_draft`, `crm_attach_diagnostic_photo`, `crm_detach_diagnostic_photo`
- Optimistic locking via `revision INT`
- Idempotência via `idempotency_key` (unique parcial por autor)
- Audit trigger em `crm_audit_logs`
- RLS forçada, sem policy pra anon/authenticated

## Ordem de aplicação (quando autorizado)

1. `20260924000000_diagnostics_core.sql` — enums + `crm_diagnostics` + `crm_diagnostic_photos` + triggers `updated_at` + trigger de audit + RLS forçada + grants service_role.
2. `20260924000001_diagnostic_media.sql` — bucket privado `diagnostic-media` (10 MB, jpeg/png/webp), sem policies pra anon/authenticated.
3. `20260924000002_diagnostics_rpcs.sql` — 4 RPCs (create/patch/attach/detach). Optimistic locking + idempotência.

Cada arquivo tem `.down.sql` correspondente com `DROP` reversível.

## Decisões estruturais congeladas

### Consolidação: 5 tabelas + JSONB

- Inspeção, notas DGN, recomendações e itens de investimento vivem como JSONB em `crm_diagnostics`. Sempre lidos/escritos juntos. Auditoria preservada via `crm_audit_logs` (before/after via trigger).
- `crm_diagnostic_photos` continua tabela — precisa de storage_path, ordering e `internal_only` por foto individual.

### Optimistic locking

`crm_diagnostics.revision INT NOT NULL DEFAULT 0`. Toda RPC de escrita exige `p_expected_revision`. Se a versão diverge, RPC devolve `CONFLICT_REVISION_STALE` sem gravar. UI mostra "outra sessão salvou; recarregue".

### Idempotência

- `crm_diagnostics.idempotency_key TEXT NOT NULL` + `UNIQUE (created_by, idempotency_key)`.
- `crm_diagnostic_photos.idempotency_key TEXT NOT NULL` + `UNIQUE (diagnostic_id, uploaded_by, idempotency_key)`.
- Replay do mesmo POST (mesmo actor + mesma chave) devolve o mesmo `diagnostic_id`/`photo_id` sem duplicar.

### Autoridade de preço (adiada pra Entrega 2, mas modelada no draft)

O draft armazena `investment_items` com o shape completo — `service_key`, `catalog_version`, `catalog_reference_price_cents`, `base_price_cents`, `discount_percent`, `override_reason`, `installments`, `pix_eligible`, `note`. O endpoint (fora do SQL) valida:

- `catalog_reference_price_cents` vem do server (fonte: `lib/growth/diagnostics/catalog.ts`).
- Se `base_price_cents == catalog_reference_price_cents`, `override_reason` pode ser null.
- Se `base_price_cents <> catalog_reference_price_cents`, `override_reason` precisa vir preenchido — e é auditado no trigger.
- **`final_price_cents` do client é IGNORADO**. Vira campo derivado que só a RPC `crm_publish_diagnostic` calcula (Entrega 2).

O draft **NÃO** persiste `final_price_cents` no banco — só o hint no client é usado pra UI. Isso mata qualquer possibilidade de "publicar com preço enviado pelo client".

### Áreas de inspeção: 3 campos separados

Cada item de `inspection_areas` tem o shape:

```json
{
  "area_key": "pintura",
  "condition": "attention",
  "internal_notes": "referência interna",
  "public_notes": "micro-riscos no capô",
  "public_visible": true
}
```

- `internal_notes` **NUNCA** entra em payload público (filtro server-side na Entrega 2).
- `public_notes` só entra na versão pública se `public_visible=true`.
- `public_visible=false` retira a área inteira do `public_payload` (Entrega 2).
- Draft armazena os 3 campos como vieram — validação/filtro é da RPC `crm_publish_diagnostic`.

### Bucket separado `diagnostic-media`

- Privado, 10 MB, jpeg/png/webp.
- Sem policies pra anon/authenticated.
- Signed URL sempre via server (TTL 15 min).
- Path canônico `<customer_id>/<diagnostic_id>/<uuid>.<ext>` (fixado no endpoint).
- Endpoint faz "sobe → chama RPC → se RPC falhar, remove objeto do bucket" pra evitar órfãos.

## Rollback

Ordem inversa:
1. `20260924000002_diagnostics_rpcs.down.sql` — dropa 4 funções.
2. `20260924000001_diagnostic_media.down.sql` — remove bucket (só depois de esvaziar; senão FK falha).
3. `20260924000000_diagnostics_core.down.sql` — dropa triggers, funções auxiliares, tabelas e enums.

## Contratos de endpoints

Documentação em `../../entrega1-endpoints.md`. Rotas cobertas na Entrega 1: POST create, GET list, GET detail, PATCH draft, POST photo, DELETE photo, GET signed-url regen. `publish` e rota pública ficam para Entrega 2.

## Testes planejados (antes de aplicar)

- Suite pgTAP local ou Node contra Supabase branch:
  - `crm_create_diagnostic_draft`: replay devolve mesmo id.
  - `crm_patch_diagnostic_draft`: `CONFLICT_REVISION_STALE` bloqueia sobrescrita silenciosa.
  - `crm_patch_diagnostic_draft`: `scores: null` no patch preserva score existente; `scores: []` zera.
  - `crm_attach_diagnostic_photo`: replay não duplica.
  - `crm_detach_diagnostic_photo`: `PHOTO_NOT_FOUND` idempotente para retries.
  - Trigger de audit registra `previous_value`/`new_value` com actor.
  - RLS forçada: `authenticated` role não consegue SELECT direto.
