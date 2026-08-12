ALTER TABLE public.whatsapp_templates ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Re-garantizar permisos tras alteración de esquema si fuera necesario
GRANT ALL ON public.whatsapp_templates TO authenticated;
GRANT ALL ON public.whatsapp_templates TO service_role;