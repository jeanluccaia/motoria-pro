# DGN Diagnósticos — Contratos de endpoints da Entrega 1

**Status:** rascunho pra revisão do Jean. Nenhum código Next.js foi escrito.

Escopo da Entrega 1 (aprovado no checkpoint): create draft · patch draft · attach photo · detach photo · list · get detail. **Sem publish. Sem rota pública. Sem tracking.**

## Convenções gerais

- **Gate admin:** todas as rotas passam pelo `validateAdminSessionToken` do proxy (`lib/growth/admin-session-core.ts`). Sem cookie válido → 401.
- **Autor:** o endpoint deriva `p_actor = "admin:<session-fingerprint>"` a partir do cookie e passa pra RPC. Cliente nunca informa autor.
- **`X-Expected-Revision` como header de revisão:** PATCH / attach / detach exigem `X-Expected-Revision: <int>` (inteiro sem aspas). Ausência → **412 Precondition Required**. Formato inválido (não numérico, negativo, com aspas) → **412 PRECONDITION_INVALID**. Divergência (RPC devolve `CONFLICT_REVISION_STALE`) → **409 Conflict** com body `{code:"CONFLICT_REVISION_STALE", current_revision:N}`. **Não usamos `If-Match` nem `ETag`:** Vercel intercepta `If-Match` quoted como validação de ETag e devolve 412 platform antes do handler, mesmo depois do server já ter aplicado o efeito. Ver `docs/handoff/vercel-ifmatch-blocker.md` se existir; regra atual está travada nesse contrato.
- **`X-Current-Revision` na resposta:** todo GET/PATCH/POST photos/DELETE photos devolve `X-Current-Revision: <int>` (inteiro sem aspas). UI grava e reenvia como `X-Expected-Revision` na próxima escrita. `revision` também vem no body JSON — usar o body é canônico.
- **`Cache-Control: no-store`** em todas as respostas admin (mutação ou leitura).
- **Idempotency-Key** obrigatório em `POST /diagnostics` e `POST /photos`. Header `Idempotency-Key: <token 32 chars>`. Escopo por autor. Replay devolve o recurso já criado + `X-Replayed: true`.
- **Content-Type:** `application/json` exceto no upload (`multipart/form-data`).
- **PII:** endpoints admin retornam a mesma PII que o `SubscriptionsManager` já expõe — nada novo passa a atravessar o bundle.

## Códigos de erro padronizados

```json
{ "error": { "code": "…", "message": "…", "details": { … } } }
```

- `SESSION_INVALID` (401)
- `PRECONDITION_REQUIRED` (412) — falta `X-Expected-Revision`
- `PRECONDITION_INVALID` (412) — `X-Expected-Revision` fora do formato inteiro sem aspas
- `CONFLICT_REVISION_STALE` (409) — `X-Expected-Revision` divergente da revision atual
- `STATUS_NOT_EDITABLE` (409) — rascunho arquivado
- `IDEMPOTENCY_REQUIRED` (400) — POST sem `Idempotency-Key`
- `VALIDATION_FAILED` (422) — shape/valor inválido (detalhes por campo)
- `NOT_FOUND` (404)
- `PHOTO_NOT_FOUND` (404)
- `UPLOAD_FAILED` (502) — bucket recusou; endpoint retornou já com rollback
- `OVERRIDE_REASON_REQUIRED` (422) — `base_price_cents` diverge do catálogo sem `override_reason`

---

## 1. POST `/api/admin/growth/customers/[id]/diagnostics`

Cria rascunho vazio.

**Headers**
- `Idempotency-Key: <token>` (obrigatório).

**Request**
```json
{
  "vehicle_id": "uuid",
  "catalog_version": "diag-v1-2026-09",
  "performed_by": "Gianluca (curador DGN)"
}
```

**Response 201**
```json
{
  "diagnostic_id": "uuid",
  "revision": 0,
  "status": "draft"
}
```
Header: `X-Current-Revision: 0` + `Cache-Control: no-store`. Se replay: também `X-Replayed: true`.

**Erros**
- `400` — vehicle não pertence ao customer.
- `400` `IDEMPOTENCY_REQUIRED`.
- `404` — customer não existe.
- `401` — sessão admin inválida.

## 2. GET `/api/admin/growth/customers/[id]/diagnostics`

Lista diagnósticos do cliente. Paginado. Só draft/review_ready nesta entrega (published entra na Entrega 2).

**Query**
- `?vehicle_id=<uuid>`.
- `?status=draft|review_ready|all` — default `draft,review_ready`.
- `?limit=20&cursor=...`.

**Response 200**
```json
{
  "items": [
    {
      "id": "uuid",
      "vehicle_id": "uuid",
      "vehicle_label": "Hyundai HB20 · ABC1D23",
      "status": "draft",
      "revision": 12,
      "catalog_version": "diag-v1-2026-09",
      "performed_by": "Gianluca",
      "performed_at": "2026-09-23",
      "updated_at": "2026-09-23T18:44:12Z",
      "photo_count": 3
    }
  ],
  "next_cursor": null
}
```

## 3. GET `/api/admin/growth/diagnostics/[diagnosticId]`

Detalhe completo pra reabrir no form (retomada).

**Response 200**
```json
{
  "id": "uuid",
  "customer": { "id": "uuid", "name": "…", "phone_masked": "…" },
  "vehicle":  { "id": "uuid", "brand": "…", "model": "…", "plate": "…" },
  "status": "draft",
  "revision": 12,
  "catalog_version": "diag-v1-2026-09",
  "performed_by": "…",
  "performed_at": "2026-09-23",
  "inspection_areas": [
    {
      "area_key": "pintura",
      "condition": "attention",
      "internal_notes": "referência técnica interna",
      "public_notes": "micro-riscos no capô",
      "public_visible": true
    }
  ],
  "scores": [
    { "criterion_key": "conservacao_pintura", "score": 6.5 }
  ],
  "recommendations": [
    { "service_key": "polimento_tecnico", "catalog_version": "diag-v1-2026-09", "priority": "recomendado", "reason": "…" }
  ],
  "investment_items": [
    {
      "service_key": "polimento_tecnico",
      "catalog_version": "diag-v1-2026-09",
      "catalog_reference_price_cents": 45000,
      "base_price_cents": 45000,
      "discount_percent": 20,
      "installments": 3,
      "pix_eligible": true,
      "note": "…",
      "override_reason": null
    }
  ],
  "summary": "…",
  "public_visibility_defaults": { "show_areas": true, "show_scores": true, "show_investment": true },
  "photos": [
    {
      "id": "uuid", "kind": "inspection", "area_key": "pintura",
      "caption": "…", "ordering": 1, "internal_only": false,
      "signed_url": "https://…", "signed_url_expires_at": "…"
    }
  ]
}
```
Header: `X-Current-Revision: 12` + `Cache-Control: no-store`.

Signed URLs são geradas na hora (TTL 15 min). Cliente re-solicita via `/signed-url` quando expira.

## 4. PATCH `/api/admin/growth/diagnostics/[diagnosticId]/draft`

Autosave. Só chaves presentes viajam.

**Headers**
- `X-Expected-Revision: <int>` (obrigatório, inteiro sem aspas).

**Validação server-side (antes da RPC)**

- `scores[*].score`: `null` OU `number` em `[0, 10]` em steps de `0.5`. **Nunca sobrescrever com `0` se veio `null`.**
- `inspection_areas[*]`:
  - `area_key`: enum válido (9 áreas do catálogo).
  - `condition`: enum válido.
  - `public_visible`: boolean.
  - `internal_notes` e `public_notes`: strings (podem ser vazias).
- `investment_items[*]`:
  - `service_key` + `catalog_version` obrigatórios.
  - Endpoint recalcula `catalog_reference_price_cents` a partir do catálogo TS (`lib/growth/diagnostics/catalog.ts`) e valida contra o que veio.
  - `base_price_cents`: inteiro ≥ 0.
  - `discount_percent`: inteiro em `[0, 100]`.
  - Se `base_price_cents <> catalog_reference_price_cents` **E** `btrim(override_reason)` vazio → **422 `OVERRIDE_REASON_REQUIRED`**.
  - **`final_price_cents` do client é ignorado**. Nunca persistido no draft; só recalculado na publicação (Entrega 2).
- `recommendations[*].priority`: enum válido.

**Response 200**
```json
{ "revision": 13, "status": "draft" }
```
Header: `X-Current-Revision: 13` + `Cache-Control: no-store`.

**Erros**
- `409` `CONFLICT_REVISION_STALE` — outra sessão salvou.
- `412` `PRECONDITION_REQUIRED` — falta `X-Expected-Revision`.
- `412` `PRECONDITION_INVALID` — `X-Expected-Revision` mal formatado.
- `422` `VALIDATION_FAILED` — detalhes por campo.
- `422` `OVERRIDE_REASON_REQUIRED` — override sem justificativa.
- `409` `STATUS_NOT_EDITABLE`.

## 5. POST `/api/admin/growth/diagnostics/[diagnosticId]/photos`

Upload de foto. `multipart/form-data`.

**Headers**
- `X-Expected-Revision: <int>` (obrigatório, inteiro sem aspas).
- `Idempotency-Key: <token>` (obrigatório).

**Campos**
- `file`: binário JPEG/PNG/WEBP, ≤ 10 MB.
- `kind`: `inspection` | `hero` | `reference`.
- `area_key`: obrigatório se `kind=inspection`.
- `caption`: opcional.
- `ordering`: opcional (default: max+1).
- `internal_only`: opcional (default: false).

**Response 201**
```json
{
  "photo_id": "uuid",
  "storage_path": "<customer>/<diagnostic>/<uuid>.jpg",
  "signed_url": "https://…",
  "signed_url_expires_at": "…",
  "revision": 14
}
```
Se replay: `X-Replayed: true` + mesmo `photo_id`.

**Fluxo server**
1. Valida sessão admin.
2. Valida MIME + tamanho + payload.
3. Sobe pro bucket `diagnostic-media` no path canônico.
4. Chama `crm_attach_diagnostic_photo(...)` com o path retornado + `Idempotency-Key`.
5. Se RPC falhar (`CONFLICT_REVISION_STALE` etc.) → **remove o objeto do bucket** e devolve o erro. Se remoção falhar, log warn (cron periódico de reconciliação limpa depois — job vem na Entrega 2 ou paralelo).

## 6. DELETE `/api/admin/growth/diagnostics/[diagnosticId]/photos/[photoId]`

**Headers**
- `X-Expected-Revision: <int>` (obrigatório, inteiro sem aspas).

**Fluxo server**
1. Chama `crm_detach_diagnostic_photo(...)` — devolve `storage_path`.
2. Remove objeto do bucket.
3. Retorna `{ revision: N }`.

**Erros**
- `409` `CONFLICT_REVISION_STALE`.
- `404` `PHOTO_NOT_FOUND` (idempotente pra retries).

## 7. GET `/api/admin/growth/diagnostics/[diagnosticId]/photos/[photoId]/signed-url`

Regera signed URL quando o form ficou aberto.

**Response 200**
```json
{ "signed_url": "…", "signed_url_expires_at": "…" }
```

Não altera revisão.

## 8. Observabilidade

- Log estruturado por request: `route`, `status`, `duration_ms`, `actor_fingerprint`, `diagnostic_id`, `revision_before/after`, `result_code_from_rpc`, `idempotency_key`, `replay: bool`.
- Sem PII no log (nome/telefone/placa). `actor_fingerprint` é hash SHA-256 do cookie, nunca o cookie.
- `crm_audit_logs` cobre a trilha before/after via trigger.

## 9. Fora da Entrega 1 (placeholder pra desenho)

- `POST /publish` + rota `/diagnostico/[slug]` + eventos + slug 22-chars fixo — **Entrega 2**.
- `crm_publish_diagnostic`, `crm_diagnostic_versions`, `crm_diagnostic_public_links`, `crm_diagnostic_public_events` — **Entrega 2**.
