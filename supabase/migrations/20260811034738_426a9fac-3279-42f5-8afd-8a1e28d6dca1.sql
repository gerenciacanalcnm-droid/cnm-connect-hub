-- Adición de columnas para seguimiento de ejecución en sms_schedules
ALTER TABLE public.sms_schedules 
ADD COLUMN IF NOT EXISTS executed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS actual_cost NUMERIC(14,4) DEFAULT 0,
ADD COLUMN IF NOT EXISTS recipients_sent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS recipients_failed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS error_log TEXT;

-- Garantizar permisos para service_role (usado por el scheduler)
GRANT ALL ON public.sms_schedules TO service_role;
GRANT ALL ON public.sms_schedules TO authenticated;
