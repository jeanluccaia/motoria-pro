# DGN Diagnósticos — Drafts SQL da Entrega 1

**Status:** RASCUNHO. Nenhum arquivo aqui foi aplicado. Não subir sem revisão do Jean.

**Objetivo:** persistir diagnósticos (draft + published), com autosave protegido por optimistic locking, versão publicada realmente imutável no banco, e mídia isolada em bucket próprio com filtragem server-side de fotos `internal_only`.

## Ordem de aplicação (quando autorizado)

1. `20260924000000_diagnostics_core.sql` — enums + `crm_diagnostics` (JSONB rich) + `crm_diagnostic_photos` + triggers `updated_at` + audit trigger.
2. `20260924000001_diagnostic_versions.sql` — `crm_diagnostic_versions` + trigger de imutabilidade (`BEFORE UPDATE/DELETE → RAISE`).
3. `20260924000002_diagnostic_public.sql` — `crm_diagnostic_public_links` + `crm_diagnostic_public_events` (só schema; rota pública viva chega na Entrega 2).
4. `20260924000003_diagnostic_media.sql` — bucket privado `diagnostic-media` + storage policies (service_role only).
5. `20260924000004_diagnostics_rpcs.sql` — RPCs `crm_create_diagnostic_draft`, `crm_patch_diagnostic_draft` (optimistic locking), `crm_attach_diagnostic_photo`, `crm_detach_diagnostic_photo`, `crm_publish_diagnostic` (snapshot server-side, filtra internal_only).

Cada arquivo tem `.down.sql` correspondente com `DROP` reversível.

## Decisões estruturais chave

### Consolidação: 10 → 5 estruturas + 1 bucket

Depois de rodar o form/preview, ficou evidente que **inspection_areas, scores, recommendations e investment_items são sempre lidos/escritos juntos com o diagnóstico** (nunca isoladamente por endpoint). Manter tabela separada pra cada um multiplicava JOINs sem ganho de auditabilidade — o `crm_audit_logs` já captura before/after em JSONB.

| Estrutura | Tipo | Por quê |
|---|---|---|
| `crm_diagnostics` | tabela | Root + `inspection_areas`/`scores`/`recommendations`/`investment_items` como JSONB. |
| `crm_diagnostic_photos` | tabela | 1-N, precisa de storage_path, ordering, internal_only, área associada — não cabe em JSONB por causa de FKs e signed URLs. |
| `crm_diagnostic_versions` | tabela imutável | Snapshot completo (JSONB) no ato da publicação. Trigger recusa UPDATE/DELETE. |
| `crm_diagnostic_public_links` | tabela | Slug opaco + expires_at + enabled + revoked. Espelha `crm_founder_public_links`. |
| `crm_diagnostic_public_events` | tabela append-only | Tracking com dedupe_key + visitor cookie + rate limit. Espelha `crm_founder_public_events`. |
| bucket `diagnostic-media` | Storage | Privado, service_role only. Signed URL via server. |

Total: 5 tabelas novas + 1 bucket (era 10). Auditabilidade preservada via `crm_audit_logs`.

### Optimistic locking

`crm_diagnostics.revision INT NOT NULL DEFAULT 0`. Toda RPC de escrita recebe `p_expected_revision`. Se `current.revision <> p_expected_revision`, RPC devolve `CONFLICT_REVISION_STALE` e a UI mostra "outra sessão salvou; recarregue". Sucesso incrementa `revision`.

### Imutabilidade real de versão

`crm_diagnostic_versions` tem trigger `BEFORE UPDATE OR DELETE` que faz `RAISE EXCEPTION 'crm_diagnostic_versions is immutable'`. Nenhum caminho normal consegue editar/apagar. Correção de versão publicada → nova versão (não rewrite).

### Investimento server-side

`crm_publish_diagnostic` **descarta** `final_price_cents` que veio no payload e recalcula:

```
final_price_cents = round(base_price_cents * (1 - clamp(discount_percent, 0, 100) / 100))
```

`base_price_cents` é aceito do curador (o Digo pode ajustar por caso), mas a política é registrada no snapshot com `catalog_version`, `override_reason` e o `base_reference_cents` do catálogo TS pra rastrear divergência. Quando o `crm_service_catalog` real vier, a política pode ficar mais estrita.

### Filtro server-side de `internal_only`

`crm_publish_diagnostic` monta o `public_snapshot` em SQL, filtrando fotos com `internal_only = true` **e** áreas com `public_visible = false`. Nunca depender do client. `crm_diagnostic_public_links.snapshot_version_id` aponta pra `crm_diagnostic_versions.id`, cuja coluna `public_payload` já vem filtrada — a página pública **só lê** `public_payload`, nunca a árvore original.

## Rollback

Cada arquivo tem `.down.sql`:
- Ordem inversa: `20260924000004` → `...000000`.
- `DROP TRIGGER`/`DROP FUNCTION`/`DROP TABLE ... CASCADE`/`DROP TYPE`.
- Storage bucket: `DROP` via API (não SQL) — script separado.

## Ainda não escritos aqui

- Rota `/diagnostico/[slug]` pública (Next.js) — Entrega 2.
- Adapter server do autosave (endpoint PATCH sobre a RPC) — Entrega 1, no código Next.
- Tela de listagem `/admin/growth/diagnosticos/lista` — Entrega 1, no código Next.
