-- Nova Core Engine Tables
CREATE TYPE public.nova_status AS ENUM ('ACTIVO', 'PAUSADO');

CREATE TABLE public.nova_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    status public.nova_status NOT NULL DEFAULT 'PAUSADO',
    name TEXT NOT NULL DEFAULT 'CNM Nova',
    personality TEXT,
    instructions TEXT,
    language TEXT DEFAULT 'es',
    model_id TEXT DEFAULT 'gpt-4o',
    temperature FLOAT DEFAULT 0.7,
    initial_message TEXT,
    not_found_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id)
);

CREATE TABLE public.nova_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    company_name TEXT,
    description TEXT,
    products TEXT,
    services TEXT,
    business_hours TEXT,
    address TEXT,
    phone TEXT,
    faq JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id)
);

-- RLS & Permissions
ALTER TABLE public.nova_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nova_knowledge ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nova_settings TO authenticated;
GRANT ALL ON public.nova_settings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nova_knowledge TO authenticated;
GRANT ALL ON public.nova_knowledge TO service_role;

CREATE POLICY "Users can manage their company nova settings"
    ON public.nova_settings
    FOR ALL
    TO authenticated
    USING (company_id IN (SELECT get_my_companies()));

CREATE POLICY "Users can manage their company nova knowledge"
    ON public.nova_knowledge
    FOR ALL
    TO authenticated
    USING (company_id IN (SELECT get_my_companies()));

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_nova_settings_updated_at BEFORE UPDATE ON public.nova_settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_nova_knowledge_updated_at BEFORE UPDATE ON public.nova_knowledge FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
