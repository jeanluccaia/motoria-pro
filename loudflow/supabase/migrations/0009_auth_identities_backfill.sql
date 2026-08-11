-- Backfill de auth.identities para usuários criados via admin.createUser
-- sem uma identity `email` associada. Sem essa row o GoTrue rejeita
-- signInWithPassword com "invalid credentials" mesmo com senha válida.
--
-- Idempotente: só insere onde não existe identity (user_id, provider).
-- Não toca senha, não altera email_confirmed_at, não afeta jean.lucca
-- (que já tem identity). Apenas usuários da organização "loud-fit"
-- que não foram criados via signup normal.
--
-- Também limpa `raw_user_meta_data.last_admin_probe` residual e
-- popula os campos padrão que o signup normal preenche (`sub`,
-- `email`, `email_verified`) — isso faz o /login funcionar como
-- se o usuário tivesse se cadastrado normalmente.

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  u.id,
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  u.id::text,
  NULL,
  now(),
  now()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM auth.identities i
  WHERE i.user_id = u.id AND i.provider = 'email'
)
AND u.email IS NOT NULL
AND u.deleted_at IS NULL;

-- Normaliza raw_user_meta_data: se contém apenas last_admin_probe
-- (marcador residual de tentativas administrativas), substitui pelo
-- shape padrão. Se já tem sub/email/email_verified, deixa como está.
UPDATE auth.users u
SET raw_user_meta_data = jsonb_build_object(
  'sub', u.id::text,
  'email', u.email,
  'email_verified', true,
  'phone_verified', false
)
WHERE u.email IS NOT NULL
  AND u.deleted_at IS NULL
  AND (u.raw_user_meta_data - 'last_admin_probe') = '{}'::jsonb;
