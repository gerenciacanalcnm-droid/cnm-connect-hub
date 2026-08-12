-- Delete duplicates, keeping the most recent one for each (account_id, external_id)
-- Only for records where external_id is NOT NULL (Meta synced templates)
DELETE FROM public.whatsapp_templates a
USING public.whatsapp_templates b
WHERE a.id < b.id
  AND a.account_id = b.account_id
  AND a.external_id = b.external_id
  AND a.external_id IS NOT NULL;

-- Ensure we don't have duplicates before adding constraint (double check)
WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY account_id, external_id ORDER BY updated_at DESC) as rn
    FROM public.whatsapp_templates
    WHERE external_id IS NOT NULL
)
DELETE FROM public.whatsapp_templates
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Add unique constraint
ALTER TABLE public.whatsapp_templates 
ADD CONSTRAINT whatsapp_templates_account_external_unique UNIQUE (account_id, external_id);

-- Ensure metadata exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='whatsapp_templates' AND column_name='metadata') THEN
        ALTER TABLE public.whatsapp_templates ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_templates TO authenticated;
GRANT ALL ON public.whatsapp_templates TO service_role;
