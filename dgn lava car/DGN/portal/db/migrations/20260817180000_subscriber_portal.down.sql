-- Rollback conservador da migration 20260817180000_subscriber_portal.
-- Remove somente o que foi criado nesta ETAPA 9. NUNCA remove clientes,
-- veículos, Founders, campanhas, histórico ou auditorias.

drop function if exists public.portal_get_current_subscriber();

drop table if exists public.crm_customer_auth;

alter table public.crm_subscriptions
  drop column if exists cycle_ends_at,
  drop column if exists cycle_started_at,
  drop column if exists payment_verification_status,
  drop column if exists payment_method_label,
  drop column if exists billing_status,
  drop column if exists billing_due_source,
  drop column if exists billing_due_at;

drop type if exists public.crm_payment_verification_status;
drop type if exists public.crm_billing_status;
