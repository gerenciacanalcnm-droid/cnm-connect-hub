
-- 1. Eliminar duplicados inequívocos (mismo account_id y external_id)
-- Mantenemos el más reciente
WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER(PARTITION BY account_id, external_id ORDER BY updated_at DESC) as rn
  FROM public.whatsapp_templates
  WHERE external_id IS NOT NULL
)
DELETE FROM public.whatsapp_templates
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- 2. Crear índice único para asegurar idempotencia futura
-- Esto permite que el ON CONFLICT (account_id, external_id) funcione
CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_templates_account_external_idx 
ON public.whatsapp_templates (account_id, external_id) 
WHERE (external_id IS NOT NULL);

-- 3. Grants necesarios
GRANT ALL ON public.whatsapp_templates TO authenticated;
GRANT ALL ON public.whatsapp_templates TO service_role;
