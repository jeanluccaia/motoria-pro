-- =========================================================================
-- Rollback de 0001_crm_schema
-- Usar somente para reverter a migração inicial em ambientes não-produção.
-- =========================================================================

drop table if exists crm_duplicate_candidates cascade;
drop table if exists crm_score_snapshots cascade;
drop table if exists crm_audit_logs cascade;
drop table if exists crm_interactions cascade;
drop table if exists crm_campaign_members cascade;
drop table if exists crm_subscriptions cascade;
drop table if exists crm_vehicles cascade;
drop table if exists crm_customers cascade;

drop function if exists crm_touch_updated_at();
drop function if exists crm_interactions_readonly();

drop type if exists crm_duplicate_review_status;
drop type if exists crm_interaction_type;
drop type if exists crm_data_quality_status;
drop type if exists crm_card_status;
drop type if exists crm_kit_status;
drop type if exists crm_commercial_stage;
drop type if exists crm_founder_status;
drop type if exists crm_subscription_source;
drop type if exists crm_subscription_status;
drop type if exists crm_subscription_cycle;
drop type if exists crm_subscription_plan;
