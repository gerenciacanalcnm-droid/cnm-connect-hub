ALTER TABLE public.whatsapp_messages ADD COLUMN IF NOT EXISTS metadata JSONB NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.whatsapp_messages.metadata IS 'Información técnica adicional del mensaje (batch_id, respuesta de Meta API, variables, etc.)';

-- Verify the column exists and grant access to the Data API (PostgREST)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;
