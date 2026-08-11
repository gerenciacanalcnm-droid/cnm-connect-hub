-- Migration: Sync WhatsApp Templates Idempotency
-- Adds unique index for (account_id, external_id, language) to prevent duplicates during Meta sync.

CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_templates_sync_v2 ON public.whatsapp_templates (account_id, external_id, language);

-- Ensure grants are correct for existing table
GRANT ALL ON public.whatsapp_templates TO authenticated, service_role;
GRANT SELECT ON public.whatsapp_templates TO anon;
