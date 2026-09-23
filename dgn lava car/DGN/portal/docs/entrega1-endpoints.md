# DGN Diagnósticos — Contratos de endpoints da Entrega 1

**Status:** rascunho pra revisão do Jean. Nenhum código Next.js foi escrito ainda. Rota pública `/diagnostico/[slug]` NÃO faz parte da Entrega 1.

## Convenções gerais

- **Gate admin:** todas as rotas abaixo passam pelo mesmo `validateAdminSessionToken` do proxy (`lib/growth/admin-session-core.ts`). Sem cookie válido → 401. Zero novo mecanismo.
- **Autor:** o endpoint deriva `p_actor = "admin:<session-fingerprint>"` a partir do cookie e passa pra RPC — o cliente nunca informa autor.
- **`If-Match` como header de revisão:** PATCH/attach/detach/publish exigem `If-Match: <revision>`. Ausência → **412 Precondition Required**. Divergência (RPC devolve `CONFLICT_REVISION_STALE`) → **409 Conflict** com body `{code:"CONFLICT_REVISION_STALE", current_revision:N}`.
- **`ETag` na resposta:** todo GET/PATCH devolve `ETag: "<revision>"`. A UI grava e reenvia como `If-Match` no próximo PATCH.
- **Idempotência:** POST de criação aceita header `Idempotency-Key` opcional (retry seguro).
- **Content-Type:** `application/json` exceto no upload de foto (`multipart/form-data`).
- **PII:** endpoints admin retornam a mesma PII que o `SubscriptionsManager` já expõe — nenhum dado novo passa a atravessar o bundle.

## 1. POST `/api/admin/growth/customers/[id]/diagnostics`

Cria rascunho vazio.

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
Header: `ETag: "0"`.

**Erros**
- `400` — vehicle não pertence ao customer.
- `404` — customer não existe.
- `403` — sessão admin inválida.

## 2. GET `/api/admin/growth/customers/[id]/diagnostics`

Lista diagnósticos do cliente (draft/published/archived). Paginado.

**Query**
- `?vehicle_id=<uuid>` — filtra por veículo (opcional).
- `?status=draft|published|archived|all` — default `draft,published`.
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
      "photo_count": 3,
      "has_public_link": false
    }
  ],
  "next_cursor": null
}
```

## 3. GET `/api/admin/growth/diagnostics/[diagnosticId]`

Detalhe completo pra reabrir no form.

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
  "inspection_areas": [{ "area_key": "pintura", "condition": "attention", "observation": "…", "public_visible": true }],
  "scores":           [{ "criterion_key": "conservacao_pintura", "score": 6.5 }],
  "recommendations":  [{ "service_key": "polimento_tecnico", "priority": "recomendado", "reason": "…" }],
  "investment_items": [{ "service_key": "polimento_tecnico", "base_price_cents": 45000, "discount_percent": 20, "final_price_cents": 36000, "installments": 3, "pix_eligible": true, "note": "…" }],
  "summary": "…",
  "public_visibility_defaults": { "show_areas": true, "show_scores": true, "show_investment": true },
  "photos": [
    {
      "id": "uuid", "kind": "inspection", "area_key": "pintura",
      "caption": "…", "ordering": 1, "internal_only": false,
      "signed_url": "https://…", "signed_url_expires_at": "…"
    }
  ],
  "published_versions": [
    { "id": "uuid", "version_number": 2, "published_at": "…", "public_slug": null }
  ]
}
```
Header: `ETag: "12"`.

**Cuidado:** signed URLs são geradas na hora (TTL 15 min). Cliente nunca guarda em cache além disso.

## 4. PATCH `/api/admin/growth/diagnostics/[diagnosticId]/draft`

Autosave. Só chaves presentes viajam.

**Headers**
- `If-Match: "<revision>"` (obrigatório).

**Request** (exemplo — todos os campos são opcionais)
```json
{
  "inspection_areas": [ … ],
  "scores":           [ … ],
  "recommendations":  [ … ],
  "investment_items": [ … ],
  "summary": "…",
  "performed_by": "…",
  "performed_at": "2026-09-23",
  "public_visibility_defaults": { "show_areas": true, "show_scores": true, "show_investment": true }
}
```

**Validação server-side (antes da RPC)**
- `scores[*].score`: `null` OU `number` em `[0, 10]` em steps de `0.5`. Nunca sobrescrever com `0` se veio `null`.
- `inspection_areas[*].condition`: enum válido; `public_visible` boolean; `observation` string.
- `investment_items[*].base_price_cents`: inteiro ≥ 0. `discount_percent`: inteiro em `[0, 100]`. `final_price_cents` **é ignorado** — recalculado no publish.
- `recommendations[*].priority`: enum válido.

**Response 200**
```json
{ "revision": 13, "status": "draft" }
```
Header: `ETag: "13"`.

**Erros**
- `409` `{code:"CONFLICT_REVISION_STALE", current_revision:14}` — outra sessão salvou.
- `412` — header `If-Match` ausente.
- `422` — validação falhou (detalhes por campo).
- `409` `{code:"STATUS_NOT_EDITABLE"}` — diagnostic já foi arquivado.

## 5. POST `/api/admin/growth/diagnostics/[diagnosticId]/photos`

Upload de foto. `multipart/form-data`.

**Headers**
- `If-Match: "<revision>"`.

**Campos**
- `file`: binário JPEG/PNG/WEBP, ≤ 10 MB.
- `kind`: `inspection` | `hero` | `reference`.
- `area_key`: obrigatório se `kind=inspection`.
- `caption`: string opcional.
- `ordering`: int opcional (default: max+1).
- `internal_only`: boolean opcional (default: false).

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

**Fluxo server**
1. Valida sessão admin.
2. Valida mime + size + payload.
3. Sobe pro bucket `diagnostic-media` no path canônico.
4. Chama `crm_attach_diagnostic_photo(...)` com o path retornado.
5. Se a RPC falhar (revision stale, etc.) → **remove o objeto do bucket** e devolve o erro.

## 6. DELETE `/api/admin/growth/diagnostics/[diagnosticId]/photos/[photoId]`

**Headers**
- `If-Match: "<revision>"`.

**Fluxo server**
1. Chama `crm_detach_diagnostic_photo(...)` — devolve `storage_path`.
2. Remove objeto do bucket.
3. Retorna `{ revision: N }`.

**Erros**
- `409` `CONFLICT_REVISION_STALE`.
- `404` `PHOTO_NOT_FOUND` (foto já removida ou não pertence ao diagnostic).

## 7. GET `/api/admin/growth/diagnostics/[diagnosticId]/photos/[photoId]/signed-url`

Regera signed URL. Usado quando o form fica aberto por muito tempo.

**Response 200**
```json
{ "signed_url": "…", "signed_url_expires_at": "…" }
```

Não altera revisão.

## 8. (Fora da Entrega 1 — placeholder pra desenho)

- `POST /api/admin/growth/diagnostics/[diagnosticId]/publish` — Entrega 2. Chama `crm_publish_diagnostic` e (opcionalmente) cria `crm_diagnostic_public_links` com slug nanoid.
- `GET /diagnostico/[slug]` (rota pública) — Entrega 2. Server component que lê `crm_diagnostic_versions.public_payload` filtrado + injeta pixel de eventos.
- `POST /api/public/diagnostics/[slug]/events` — Entrega 2. Dedupe + rate limit iguais aos do Founder.

## 9. Erros padronizados

Todos os erros seguem o shape:

```json
{
  "error": {
    "code": "CONFLICT_REVISION_STALE" | "NOT_FOUND" | "STATUS_NOT_EDITABLE"
          | "VALIDATION_FAILED" | "PHOTO_NOT_FOUND" | "SESSION_INVALID"
          | "UPLOAD_FAILED" | "SERVICE_UNAVAILABLE",
    "message": "…",
    "details": { "…contexto opcional…" }
  }
}
```

## 10. Observabilidade

- Log estruturado por request: `route`, `status`, `duration_ms`, `actor_fingerprint`, `diagnostic_id`, `revision_before/after`, `result_code_from_rpc`.
- Sem PII no log (nome/telefone/placa). `actor_fingerprint` é hash SHA-256 do cookie, nunca o cookie.
- `crm_audit_logs` já cobre a trilha before/after via trigger.
