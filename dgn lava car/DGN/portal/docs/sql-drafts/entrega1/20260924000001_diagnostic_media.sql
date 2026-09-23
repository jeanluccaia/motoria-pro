-- ---------------------------------------------------------------------------
-- DGN Diagnósticos — Entrega 1, Migration 03 (RASCUNHO — NÃO APLICAR).
--
-- Bucket privado 'diagnostic-media' no Supabase Storage. Isolado do
-- 'vehicle-photos' porque:
--   * fotos de diagnóstico têm ciclo de vida diferente (versionamento),
--   * incluem categorias internal_only e reference que NUNCA devem ser
--     confundidas com a foto principal do veículo (que aparece no card
--     do assinante),
--   * política de expiração e signed URL pode divergir.
--
-- Mesma trilha de segurança usada em 'vehicle-photos':
--   * privado (public=false);
--   * MIME whitelist: image/jpeg, image/png, image/webp;
--   * limite de 10 MB por arquivo;
--   * upload/download somente via service_role no server-side (nenhuma
--     policy pra anon/authenticated);
--   * path canônico '<customer_id>/<diagnostic_id>/<uuid>.<ext>' fixado
--     no código (RPC crm_attach_diagnostic_photo — arquivo 04).
-- ---------------------------------------------------------------------------

-- Supabase Storage buckets vivem em storage.buckets. INSERT idempotente.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'diagnostic-media',
  'diagnostic-media',
  false,
  10 * 1024 * 1024,
  array['image/jpeg','image/png','image/webp']
) on conflict (id) do update set
  public              = excluded.public,
  file_size_limit     = excluded.file_size_limit,
  allowed_mime_types  = excluded.allowed_mime_types;

-- Sem policies em storage.objects pra este bucket → anon/authenticated não
-- veem nada. Todo acesso passa por service_role no server-side, com signed
-- URL de curta duração.
--
-- Se algum dia precisarmos policy pra Portal do cliente ler direto (fora
-- do server), voltamos aqui e criamos uma policy ESPECÍFICA que exige
-- (a) storage.foldername(name)[1] == customer_id do usuário autenticado E
-- (b) join com crm_diagnostic_versions verificando public_payload.
