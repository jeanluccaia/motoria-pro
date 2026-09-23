# DGN Diagnósticos — Drafts SQL adiados pra Entrega 2

**Status:** RASCUNHO. Estes arquivos ficam preparados aqui **mas NÃO entram na Entrega 1**. Só rodar depois da Entrega 1 estar homologada em prod e o Jean autorizar explicitamente a Entrega 2.

## O que fica aqui

- `20260929000000_diagnostic_versions.sql` — `crm_diagnostic_versions` com `full_payload`/`public_payload` JSONB e **triggers de imutabilidade** (BEFORE UPDATE/DELETE → RAISE). Nem o service_role edita. Correção = nova versão.
- `20260929000001_diagnostic_public.sql` — `crm_diagnostic_public_links` (slug opaco 22 chars, `enabled`, `expires_at`, `revoked_at`) + `crm_diagnostic_public_events` (append-only via trigger + `dedupe_key` unique).
- `20260929000002_diagnostic_publish_rpc.sql` — RPC `crm_publish_diagnostic`. Recebe o rascunho corrente, monta `full_payload` e `public_payload`, insere a versão imutável.

## Regras invioláveis (herdadas do checkpoint)

- **`internal_notes` nunca vaza em `public_payload`**. Filtro server-side dentro da RPC.
- **`public_notes` só aparece se `public_visible=true`** na mesma área.
- **`public_visible=false` remove a área inteira do `public_payload`**.
- **`final_price_cents` é RECALCULADO server-side** a partir de `base_price_cents` × `(100 - clamp(discount_percent, 0, 100))/100`.
- **Divergência `base_price_cents` vs `catalog_reference_price_cents` sem `override_reason` faz a RPC lançar exceção** — última linha de defesa depois do endpoint.
- **Optimistic locking preservado** — `p_expected_revision` obrigatório.

## Slug (regra do checkpoint: 22 caracteres fixos)

CHECK já alinhado no draft:

```sql
constraint crm_diag_public_links_slug_format
  check (slug ~ '^[a-z0-9]{22}$'),
```

## Ordem de aplicação (na Entrega 2)

1. `20260929000000_diagnostic_versions.sql`
2. `20260929000001_diagnostic_public.sql` (com CHECK ajustado para 22 chars fixos)
3. `20260929000002_diagnostic_publish_rpc.sql`

Cada arquivo tem `.down.sql`.

## Não incluído aqui

- Rota `/diagnostico/[slug]` (Next.js) — código do portal.
- Endpoint público de eventos + cookie de visitor + rate limit — código do portal, espelhando `lib/founder-tracking.ts`.
- Cron de reconciliação `crm_diagnostic_photos` × `storage.objects` — job separado da migration.
