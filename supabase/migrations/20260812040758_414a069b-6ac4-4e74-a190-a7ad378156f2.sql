-- 1. Unification of Contacts Table
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS normalized_phone text,
ADD COLUMN IF NOT EXISTS name text GENERATED ALWAYS AS (
  CASE 
    WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN first_name || ' ' || last_name
    WHEN first_name IS NOT NULL THEN first_name
    WHEN last_name IS NOT NULL THEN last_name
    ELSE NULL
  END
) STORED;

-- Create unique indexes for the central identity
CREATE UNIQUE INDEX IF NOT EXISTS contacts_company_phone_idx ON public.contacts (company_id, normalized_phone) WHERE (normalized_phone IS NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS contacts_company_email_idx ON public.contacts (company_id, email) WHERE (normalized_phone IS NULL AND email IS NOT NULL);

-- 2. Rename contact_groups to contact_lists (Listas Centrales)
-- Note: We use RENAME if it exists, otherwise it will fail gracefully or we check existence.
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contact_groups') THEN
    ALTER TABLE public.contact_groups RENAME TO contact_lists;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contact_group_members') THEN
    ALTER TABLE public.contact_group_members RENAME TO contact_list_members;
    ALTER TABLE public.contact_list_members RENAME COLUMN group_id TO list_id;
  END IF;
END $$;

-- Update Grants for renamed tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_lists TO authenticated;
GRANT ALL ON public.contact_lists TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_list_members TO authenticated;
GRANT ALL ON public.contact_list_members TO service_role;

-- 3. Contact Channel Preferences
CREATE TYPE public.contact_channel_status AS ENUM ('OPTED_IN', 'OPTED_OUT', 'PENDING', 'BOUNCED', 'SPAM_REPORT');
CREATE TYPE public.communication_channel_type AS ENUM ('SMS', 'WHATSAPP', 'EMAIL');

CREATE TABLE IF NOT EXISTS public.contact_channel_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  channel communication_channel_type NOT NULL,
  status contact_channel_status NOT NULL DEFAULT 'PENDING',
  metadata jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(contact_id, channel)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_channel_preferences TO authenticated;
GRANT ALL ON public.contact_channel_preferences TO service_role;

ALTER TABLE public.contact_channel_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ccp_tenant" ON public.contact_channel_preferences 
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.contacts c 
  WHERE c.id = contact_id 
  AND public.is_company_member(auth.uid(), c.company_id)
));

-- 4. Audit Table (whatsapp_assignment_status was previously defined, reusing standard audit pattern)
-- Ensure RLS is updated for contacts if needed, but existing crm_tenant policy should suffice.
