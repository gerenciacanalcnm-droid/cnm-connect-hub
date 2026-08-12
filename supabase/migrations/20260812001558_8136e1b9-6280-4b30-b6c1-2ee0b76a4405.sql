
-- 1. Limpiar duplicados por account_id + external_id (mantener el más reciente)
WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY account_id, external_id 
               ORDER BY updated_at DESC, id DESC
           ) as row_num
    FROM public.whatsapp_templates
    WHERE external_id IS NOT NULL
)
DELETE FROM public.whatsapp_templates
WHERE id IN (
    SELECT id FROM duplicates WHERE row_num > 1
);

-- 2. Eliminar el índice idx_whatsapp_templates_sync_v2 si es necesario 
-- (aunque este es (account_id, external_id, language), no es exacto para lo solicitado pero no estorba)

-- 3. Crear restricción UNIQUE REAL sobre account_id + external_id
-- Eliminamos primero el índice actual si existe para recrearlo como UNIQUE real en la tabla
DROP INDEX IF EXISTS whatsapp_templates_account_external_idx;

ALTER TABLE public.whatsapp_templates 
ADD CONSTRAINT whatsapp_templates_account_external_unique 
UNIQUE (account_id, external_id);

-- 4. Asegurar GRANTs (según política de public-schema-grants)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_templates TO authenticated;
GRANT ALL ON public.whatsapp_templates TO service_role;
