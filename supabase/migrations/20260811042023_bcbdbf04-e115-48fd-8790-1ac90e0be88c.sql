CREATE TABLE IF NOT EXISTS public.wa_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    account_id UUID REFERENCES public.whatsapp_accounts(id) ON DELETE CASCADE NOT NULL,
    recipients TEXT[] NOT NULL,
    message_body TEXT,
    template_id UUID REFERENCES public.whatsapp_templates(id),
    variables JSONB DEFAULT '{}'::JSONB,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone TEXT DEFAULT 'America/Bogota',
    status TEXT DEFAULT 'PROGRAMADO' CHECK (status IN ('PROGRAMADO', 'PROCESANDO', 'COMPLETADO', 'FALLIDO', 'CANCELADO')),
    estimated_cost NUMERIC DEFAULT 0,
    actual_cost NUMERIC DEFAULT 0,
    reference TEXT UNIQUE NOT NULL,
    error_log TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wa_schedules TO authenticated;
GRANT ALL ON public.wa_schedules TO service_role;

ALTER TABLE public.wa_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wa_schedules_tenant_access" ON public.wa_schedules 
FOR ALL TO authenticated 
USING (public.is_company_member(auth.uid(), company_id))
WITH CHECK (public.is_company_member(auth.uid(), company_id));

CREATE INDEX IF NOT EXISTS idx_wa_schedules_company ON public.wa_schedules(company_id);
CREATE INDEX IF NOT EXISTS idx_wa_schedules_status ON public.wa_schedules(status);
CREATE INDEX IF NOT EXISTS idx_wa_schedules_execution ON public.wa_schedules(scheduled_at) WHERE status = 'PROGRAMADO';

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_wa_schedules_updated') THEN
        CREATE TRIGGER trg_wa_schedules_updated 
        BEFORE UPDATE ON public.wa_schedules 
        FOR EACH ROW 
        EXECUTE FUNCTION public.tg_set_updated_at();
    END IF;
END $$;
