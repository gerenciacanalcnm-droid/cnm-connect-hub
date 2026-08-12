-- Adicionar estados extras para a campanha se não existirem
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_campaign_status') THEN
    CREATE TYPE public.whatsapp_campaign_status AS ENUM ('DRAFT', 'VALIDATING', 'READY', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
  ELSE
    -- Tentar adicionar novos estados caso o enum já exista mas falte algum
    BEGIN
      ALTER TYPE public.whatsapp_campaign_status ADD VALUE IF NOT EXISTS 'VALIDATING';
      ALTER TYPE public.whatsapp_campaign_status ADD VALUE IF NOT EXISTS 'READY';
    EXCEPTION WHEN OTHERS THEN 
      NULL;
    END;
  END IF;
END $$;

-- Garantir que whatsapp_campaign_results tenha campos de auditoria Meta
ALTER TABLE public.whatsapp_campaign_results 
ADD COLUMN IF NOT EXISTS wamid text,
ADD COLUMN IF NOT EXISTS attempt_count int DEFAULT 0,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS error_message text;

-- Restrição de idempotência: campaign_id + normalized_phone (usando o campo phone existente)
-- Primeiro limpamos duplicados se existirem (em ambiente de teste/dev)
DELETE FROM public.whatsapp_campaign_results a
WHERE a.id < (
    SELECT MAX(b.id) FROM public.whatsapp_campaign_results b
    WHERE a.campaign_id = b.campaign_id AND a.phone = b.phone
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'whatsapp_campaign_results_unique_recipient') THEN
        ALTER TABLE public.whatsapp_campaign_results 
        ADD CONSTRAINT whatsapp_campaign_results_unique_recipient UNIQUE (campaign_id, phone);
    END IF;
END $$;

-- Grant
GRANT ALL ON public.whatsapp_campaign_results TO authenticated;
GRANT ALL ON public.whatsapp_campaign_results TO service_role;
