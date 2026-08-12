-- 1. Ensure company_id is nullable on whatsapp_templates
ALTER TABLE public.whatsapp_templates ALTER COLUMN company_id DROP NOT NULL;

-- 2. Ensure company_id is nullable on whatsapp_messages
ALTER TABLE public.whatsapp_messages ALTER COLUMN company_id DROP NOT NULL;

-- 3. Ensure company_id is nullable on whatsapp_conversations
ALTER TABLE public.whatsapp_conversations ALTER COLUMN company_id DROP NOT NULL;