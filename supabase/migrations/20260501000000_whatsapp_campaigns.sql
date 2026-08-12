-- Enums para Campañas
DO $$ BEGIN
    CREATE TYPE public.campaign_status AS ENUM ('DRAFT', 'SCHEDULED', 'QUEUED', 'PROCESSING', 'COMPLETED', 'PAUSED', 'CANCELLED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabla de Campañas
CREATE TABLE IF NOT EXISTS public.whatsapp_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.whatsapp_accounts(id) ON DELETE RESTRICT,
    template_id UUID REFERENCES public.whatsapp_templates(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    status public.campaign_status NOT NULL DEFAULT 'DRAFT',
    
    -- Configuración
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Métricas
    total_recipients INTEGER DEFAULT 0,
    total_sent INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    total_read INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,
    estimated_cost DECIMAL(12,2) DEFAULT 0,
    actual_cost DECIMAL(12,2) DEFAULT 0,
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Tabla de Resultados/Cola de la Campaña
CREATE TABLE IF NOT EXISTS public.whatsapp_campaign_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.whatsapp_campaigns(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
    status public.message_status NOT NULL DEFAULT 'queued',
    wamid TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_campaigns TO authenticated;
GRANT ALL ON public.whatsapp_campaigns TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_campaign_results TO authenticated;
GRANT ALL ON public.whatsapp_campaign_results TO service_role;

-- RLS
ALTER TABLE public.whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_campaign_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their company campaigns"
    ON public.whatsapp_campaigns
    FOR ALL
    TO authenticated
    USING (company_id IN (SELECT company_id FROM public.company_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can see campaign results"
    ON public.whatsapp_campaign_results
    FOR SELECT
    TO authenticated
    USING (campaign_id IN (SELECT id FROM public.whatsapp_campaigns));
