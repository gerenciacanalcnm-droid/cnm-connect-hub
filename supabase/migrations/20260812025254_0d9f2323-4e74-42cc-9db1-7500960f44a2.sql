-- Migration: Update whatsapp_accounts for inventory and assignment
-- Sprint 1: Inventory and Assignment of WhatsApp Numbers

-- 1. Create enum for Nova assignment status if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_assignment_status') THEN
        CREATE TYPE public.whatsapp_assignment_status AS ENUM ('AVAILABLE', 'ASSIGNED', 'DISCONNECTED', 'ERROR');
    END IF;
END
$$;

-- 2. Modify whatsapp_accounts table
-- company_id should be nullable to support AVAILABLE state
ALTER TABLE public.whatsapp_accounts ALTER COLUMN company_id DROP NOT NULL;

-- 3. Add phone_number column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_accounts' AND column_name = 'phone_number') THEN
        ALTER TABLE public.whatsapp_accounts ADD COLUMN phone_number TEXT;
    END IF;
END
$$;

-- 4. Add waba_id column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_accounts' AND column_name = 'waba_id') THEN
        ALTER TABLE public.whatsapp_accounts ADD COLUMN waba_id TEXT;
    END IF;
END
$$;

-- 5. Add nova_status column for the assignment state
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_accounts' AND column_name = 'nova_status') THEN
        ALTER TABLE public.whatsapp_accounts ADD COLUMN nova_status public.whatsapp_assignment_status DEFAULT 'AVAILABLE';
    END IF;
END
$$;

-- 6. Ensure GRANTs
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_accounts TO authenticated;
GRANT ALL ON public.whatsapp_accounts TO service_role;

-- 7. Add index for company_id for multi-tenant performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_accounts_company_id ON public.whatsapp_accounts(company_id);