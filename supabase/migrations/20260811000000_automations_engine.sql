-- Create app_automation_status enum
CREATE TYPE public.app_automation_status AS ENUM ('ACTIVA', 'PAUSADA', 'BORRADOR');

-- Create automations table
CREATE TABLE public.automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status public.app_automation_status NOT NULL DEFAULT 'BORRADOR',
    channel TEXT,
    trigger_config JSONB NOT NULL DEFAULT '{}',
    conditions_config JSONB NOT NULL DEFAULT '[]',
    actions_config JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_executed_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id)
);

-- Create automation_logs table for execution history
CREATE TABLE public.automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    trigger_type TEXT NOT NULL,
    trigger_data JSONB,
    result TEXT, -- 'success' or 'error'
    error_message TEXT,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    execution_data JSONB -- Details of what happened
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automations TO authenticated;
GRANT ALL ON public.automations TO service_role;

GRANT SELECT, INSERT ON public.automation_logs TO authenticated;
GRANT ALL ON public.automation_logs TO service_role;

-- RLS
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company automations"
    ON public.automations
    FOR ALL
    TO authenticated
    USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view their company automation logs"
    ON public.automation_logs
    FOR SELECT
    TO authenticated
    USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

-- Index for performance
CREATE INDEX idx_automations_company ON public.automations(company_id);
CREATE INDEX idx_automation_logs_automation ON public.automation_logs(automation_id);
CREATE INDEX idx_automation_logs_company ON public.automation_logs(company_id);
