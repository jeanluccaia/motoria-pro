drop function if exists public.crm_create_manual_subscription(
  uuid, public.crm_subscription_plan, public.crm_subscription_cycle,
  public.crm_payment_status, public.crm_payment_evidence_source,
  text, uuid, timestamptz, text, text
);
