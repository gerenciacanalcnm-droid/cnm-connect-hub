-- Fix foreign key for whatsapp_messages.template_id
-- It was incorrectly pointing to 'templates' table instead of 'whatsapp_templates'
ALTER TABLE public.whatsapp_messages DROP CONSTRAINT IF EXISTS whatsapp_messages_template_id_fkey;

ALTER TABLE public.whatsapp_messages 
  ADD CONSTRAINT whatsapp_messages_template_id_fkey 
  FOREIGN KEY (template_id) REFERENCES public.whatsapp_templates(id) 
  ON DELETE SET NULL;

-- Ensure template_id is NOT unique in whatsapp_messages
ALTER TABLE public.whatsapp_messages DROP CONSTRAINT IF EXISTS whatsapp_messages_template_id_key;

-- Grant permissions (standard procedure)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;