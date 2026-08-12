-- Migration: Contact Tags System
-- Created: 2026-08-12

-- 1. Create contact_tags table
CREATE TABLE IF NOT EXISTS public.contact_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL, -- Isolated by company
    name TEXT NOT NULL,
    description TEXT,
    color TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, name)
);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_tags TO authenticated;
GRANT ALL ON public.contact_tags TO service_role;

-- Enable RLS
ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;

-- Policies for contact_tags
CREATE POLICY "Users can view their own company tags"
ON public.contact_tags FOR SELECT
TO authenticated
USING (company_id = (auth.jwt() ->> 'company_id')::uuid OR company_id = '00000000-0000-4000-8000-000000000001');

CREATE POLICY "Users can insert their own company tags"
ON public.contact_tags FOR INSERT
TO authenticated
WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid OR company_id = '00000000-0000-4000-8000-000000000001');

CREATE POLICY "Users can update their own company tags"
ON public.contact_tags FOR UPDATE
TO authenticated
USING (company_id = (auth.jwt() ->> 'company_id')::uuid OR company_id = '00000000-0000-4000-8000-000000000001');

CREATE POLICY "Users can delete their own company tags"
ON public.contact_tags FOR DELETE
TO authenticated
USING (company_id = (auth.jwt() ->> 'company_id')::uuid OR company_id = '00000000-0000-4000-8000-000000000001');


-- 2. Create contact_tag_members table
CREATE TABLE IF NOT EXISTS public.contact_tag_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.contact_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(contact_id, tag_id)
);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_tag_members TO authenticated;
GRANT ALL ON public.contact_tag_members TO service_role;

-- Enable RLS
ALTER TABLE public.contact_tag_members ENABLE ROW LEVEL SECURITY;

-- Policies for contact_tag_members
CREATE POLICY "Users can view their own company tag members"
ON public.contact_tag_members FOR SELECT
TO authenticated
USING (company_id = (auth.jwt() ->> 'company_id')::uuid OR company_id = '00000000-0000-4000-8000-000000000001');

CREATE POLICY "Users can insert their own company tag members"
ON public.contact_tag_members FOR INSERT
TO authenticated
WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid OR company_id = '00000000-0000-4000-8000-000000000001');

CREATE POLICY "Users can delete their own company tag members"
ON public.contact_tag_members FOR DELETE
TO authenticated
USING (company_id = (auth.jwt() ->> 'company_id')::uuid OR company_id = '00000000-0000-4000-8000-000000000001');


-- 3. Data Migration from contacts.tags (text[]) to new tables
DO $$
DECLARE
    contact_record RECORD;
    tag_name TEXT;
    new_tag_id UUID;
BEGIN
    FOR contact_record IN SELECT id, company_id, tags FROM public.contacts WHERE tags IS NOT NULL AND array_length(tags, 1) > 0 LOOP
        FOREACH tag_name IN ARRAY contact_record.tags LOOP
            -- Create tag if it doesn't exist for the company
            INSERT INTO public.contact_tags (company_id, name)
            VALUES (contact_record.company_id, tag_name)
            ON CONFLICT (company_id, name) DO NOTHING;
            
            -- Get the tag_id
            SELECT id INTO new_tag_id FROM public.contact_tags WHERE company_id = contact_record.company_id AND name = tag_name;
            
            -- Create association
            INSERT INTO public.contact_tag_members (company_id, contact_id, tag_id)
            VALUES (contact_record.company_id, contact_record.id, new_tag_id)
            ON CONFLICT (contact_id, tag_id) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- 4. Mark legacy column
COMMENT ON COLUMN public.contacts.tags IS 'LEGACY: Use contact_tag_members table instead';
