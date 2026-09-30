-- ---------------------------------------------------------------------------
-- DGN Diagnósticos — Entrega 1, Migration 03 (hardening de grants).
--
-- Contexto: em ambientes com ALTER DEFAULT PRIVILEGES do role `postgres`
-- concedendo EXECUTE ON FUNCTIONS para anon, authenticated e service_role
-- no schema public (caso do projeto DGN Club de Production,
-- wzjjdlzgxkvfynmpsczf), as 4 RPCs SECURITY DEFINER da Entrega 1 nascem
-- com EXECUTE para anon e authenticated — vazando a rota de escrita para
-- PostgREST direto (/rest/v1/rpc/...). Homolog (yiwonuffxtyjqerbgfui) não
-- tem esse default privilege, então o problema é invisível lá.
--
-- Esta migration blinda EXPLICITAMENTE as 4 funções para o modelo pretendido:
--   postgres     : EXECUTE (owner)
--   service_role : EXECUTE (endpoints admin server-side)
--   anon         : SEM EXECUTE
--   authenticated: SEM EXECUTE
--   PUBLIC       : SEM EXECUTE
--
-- Idempotente: em homolog (já correto) o REVOKE é no-op; em prod corrige.
-- Não altera default privileges globais — escopo por função, propositalmente.
-- ---------------------------------------------------------------------------

revoke execute on function public.crm_create_diagnostic_draft(uuid, uuid, text, text, text, text) from public, anon, authenticated;
grant  execute on function public.crm_create_diagnostic_draft(uuid, uuid, text, text, text, text) to service_role;

revoke execute on function public.crm_patch_diagnostic_draft(uuid, integer, jsonb, text) from public, anon, authenticated;
grant  execute on function public.crm_patch_diagnostic_draft(uuid, integer, jsonb, text) to service_role;

revoke execute on function public.crm_attach_diagnostic_photo(uuid, integer, public.crm_diagnostic_photo_kind, text, text, text, integer, text, integer, boolean, text, text) from public, anon, authenticated;
grant  execute on function public.crm_attach_diagnostic_photo(uuid, integer, public.crm_diagnostic_photo_kind, text, text, text, integer, text, integer, boolean, text, text) to service_role;

revoke execute on function public.crm_detach_diagnostic_photo(uuid, integer, uuid, text) from public, anon, authenticated;
grant  execute on function public.crm_detach_diagnostic_photo(uuid, integer, uuid, text) to service_role;
