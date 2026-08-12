
-- 1. Add 'DISABLED' to whatsapp_assignment_status enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'whatsapp_assignment_status' AND e.enumlabel = 'DISABLED') THEN
    ALTER TYPE public.whatsapp_assignment_status ADD VALUE 'DISABLED';
  END IF;
END $$;

-- 2. Add is_default column to whatsapp_accounts
ALTER TABLE public.whatsapp_accounts ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- 3. Create a unique index for is_default per company
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_accounts_default_per_company 
ON public.whatsapp_accounts (company_id) 
WHERE (is_default IS TRUE AND company_id IS NOT NULL);

-- 4. Update existing assignments
UPDATE public.whatsapp_accounts wa
SET is_default = true
WHERE id IN (
  SELECT DISTINCT ON (company_id) id
  FROM public.whatsapp_accounts
  WHERE company_id IS NOT NULL
  ORDER BY company_id, created_at ASC
)
AND NOT EXISTS (
  SELECT 1 FROM public.whatsapp_accounts inner_wa 
  WHERE inner_wa.company_id = wa.company_id AND inner_wa.is_default = true
);
