-- ════════════════════════════════════════════════════════════════════
-- MIGRATION: WHATSAPP SURVEYS CORE
-- ════════════════════════════════════════════════════════════════════

-- 1. Encuestas
CREATE TABLE public.whatsapp_surveys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    question TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'SINGLE_CHOICE', -- SINGLE_CHOICE, MULTIPLE_CHOICE, etc
    status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, ACTIVE, PAUSED, DELETED
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Opciones de encuesta
CREATE TABLE public.whatsapp_survey_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_id UUID NOT NULL REFERENCES public.whatsapp_surveys(id) ON DELETE CASCADE,
    option_key TEXT NOT NULL, -- option_1, option_2...
    label TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Respuestas de encuestas
CREATE TABLE public.whatsapp_survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    survey_id UUID NOT NULL REFERENCES public.whatsapp_surveys(id) ON DELETE CASCADE,
    option_id UUID NOT NULL REFERENCES public.whatsapp_survey_options(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE SET NULL,
    whatsapp_message_id UUID REFERENCES public.whatsapp_messages(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════════
-- SEGURIDAD & RLS
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE public.whatsapp_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_survey_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_survey_responses ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_surveys TO authenticated;
GRANT ALL ON public.whatsapp_surveys TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_survey_options TO authenticated;
GRANT ALL ON public.whatsapp_survey_options TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_survey_responses TO authenticated;
GRANT ALL ON public.whatsapp_survey_responses TO service_role;

-- Políticas
CREATE POLICY "Users can manage their company surveys" ON public.whatsapp_surveys
    FOR ALL TO authenticated USING (company_id IN (SELECT id FROM public.companies));

CREATE POLICY "Users can manage their company options" ON public.whatsapp_survey_options
    FOR ALL TO authenticated USING (survey_id IN (SELECT id FROM public.whatsapp_surveys));

CREATE POLICY "Users can manage their company responses" ON public.whatsapp_survey_responses
    FOR ALL TO authenticated USING (company_id IN (SELECT id FROM public.companies));

