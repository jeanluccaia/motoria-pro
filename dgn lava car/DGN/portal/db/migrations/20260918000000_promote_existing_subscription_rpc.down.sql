drop function if exists public.crm_promote_existing_subscription(
  uuid, uuid, text, text,
  public.crm_payment_status, public.crm_payment_evidence_source, timestamptz, text
);
