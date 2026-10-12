-- Rollback: remove apenas a nova sobrecarga uuid, deixando a antiga (text)
-- intacta — ela nunca foi tocada por este migration. Executar somente se o
-- commercial-write.ts tiver sido revertido para passar p_customer_legacy_id.

drop function if exists public.crm_update_customer_commercial_fields(
  uuid, text, text, text, timestamptz, integer, timestamptz, text, text
);
