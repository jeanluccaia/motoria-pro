drop function if exists public.crm_edit_manual_subscription(
  uuid, uuid, text, text,
  public.crm_subscription_plan, public.crm_subscription_cycle,
  uuid, boolean,
  timestamptz, boolean,
  public.crm_payment_status, public.crm_payment_evidence_source,
  text, text
);

drop function if exists public.crm_cancel_manual_subscription(uuid, uuid, text, text);
