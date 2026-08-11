-- Sprint 11: SMS Scheduling Table
CREATE TYPE public.sms_schedule_status AS ENUM ('PROGRAMADO', 'PROCESANDO', 'ENVIANDO', 'COMPLETADO', 'FALLIDO', 'CANCELADO');

CREATE TABLE public.sms_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  recipients TEXT[] NOT NULL,
  body TEXT NOT NULL,
  is_flash BOOLEAN NOT NULL DEFAULT false,
  scheduled_at TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/Bogota',
  estimated_cost NUMERIC(14,4) NOT NULL DEFAULT 0,
  reference TEXT NOT NULL,
  status public.sms_schedule_status NOT NULL DEFAULT 'PROGRAMADO',
  error_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sms_schedules TO authenticated;
GRANT ALL ON public.sms_schedules TO service_role;

ALTER TABLE public.sms_schedules ENABLE ROW LEVEL SECURITY;

-- RLS: Tenant isolation
CREATE POLICY "schedules_tenant_access" ON public.sms_schedules FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()));

CREATE INDEX idx_sms_schedules_company ON public.sms_schedules(company_id);
CREATE INDEX idx_sms_schedules_status ON public.sms_schedules(status);
CREATE INDEX idx_sms_schedules_execution ON public.sms_schedules(scheduled_at) WHERE status = 'PROGRAMADO';

CREATE TRIGGER trg_sms_schedules_updated BEFORE UPDATE ON public.sms_schedules FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
