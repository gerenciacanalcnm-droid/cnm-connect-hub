-- 1. Create audit table for WhatsApp assignments
CREATE TABLE IF NOT EXISTS public.whatsapp_assignment_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid REFERENCES public.whatsapp_accounts(id) ON DELETE CASCADE NOT NULL,
    old_company_id uuid REFERENCES public.companies(id),
    new_company_id uuid REFERENCES public.companies(id),
    admin_id uuid REFERENCES auth.users(id),
    action text NOT NULL, -- ASSIGN_NUMBER, UNASSIGN_NUMBER, TRANSFER_NUMBER
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

GRANT SELECT, INSERT ON public.whatsapp_assignment_audit TO authenticated;
GRANT ALL ON public.whatsapp_assignment_audit TO service_role;

ALTER TABLE public.whatsapp_assignment_audit ENABLE ROW LEVEL SECURITY;

-- Admins can see all audits
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Admins can view all assignment audits') THEN
        CREATE POLICY "Admins can view all assignment audits" 
        ON public.whatsapp_assignment_audit 
        FOR SELECT 
        TO authenticated 
        USING (public.has_role(auth.uid(), 'super_admin'));
    END IF;
END
$$;

-- 2. Update RLS policies for whatsapp_accounts
ALTER TABLE public.whatsapp_accounts ENABLE ROW LEVEL SECURITY;

-- DROP existing broad policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their company accounts" ON public.whatsapp_accounts;
DROP POLICY IF EXISTS "Admins can view all accounts" ON public.whatsapp_accounts;
DROP POLICY IF EXISTS "Admins have full access to whatsapp_accounts" ON public.whatsapp_accounts;
DROP POLICY IF EXISTS "Users can select their assigned accounts" ON public.whatsapp_accounts;

-- NEW POLICIES
CREATE POLICY "Admins have full access to whatsapp_accounts"
ON public.whatsapp_accounts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can select their assigned accounts"
ON public.whatsapp_accounts
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM public.company_members 
    WHERE user_id = auth.uid()
  )
);

-- 3. Security Definer helper for assignment (Fixed roles)
CREATE OR REPLACE FUNCTION public.assign_whatsapp_account(
  _account_id uuid,
  _company_id uuid,
  _admin_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _old_company_id uuid;
BEGIN
  -- 1. Verify admin role
  IF NOT public.has_role(_admin_id, 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can assign numbers';
  END IF;

  -- 2. Get current state and lock row
  SELECT company_id INTO _old_company_id
  FROM public.whatsapp_accounts
  WHERE id = _account_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  -- 3. Update account
  UPDATE public.whatsapp_accounts
  SET 
    company_id = _company_id,
    nova_status = 'ASSIGNED',
    updated_at = now()
  WHERE id = _account_id;

  -- 4. Log audit
  INSERT INTO public.whatsapp_assignment_audit (
    account_id,
    old_company_id,
    new_company_id,
    admin_id,
    action
  ) VALUES (
    _account_id,
    _old_company_id,
    _company_id,
    _admin_id,
    CASE 
      WHEN _old_company_id IS NULL THEN 'ASSIGN_NUMBER'
      ELSE 'TRANSFER_NUMBER'
    END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.unassign_whatsapp_account(
  _account_id uuid,
  _admin_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _old_company_id uuid;
BEGIN
  -- 1. Verify admin role
  IF NOT public.has_role(_admin_id, 'super_admin') THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can unassign numbers';
  END IF;

  -- 2. Get current state and lock row
  SELECT company_id INTO _old_company_id
  FROM public.whatsapp_accounts
  WHERE id = _account_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  -- 3. Update account
  UPDATE public.whatsapp_accounts
  SET 
    company_id = NULL,
    nova_status = 'AVAILABLE',
    updated_at = now()
  WHERE id = _account_id;

  -- 4. Log audit
  INSERT INTO public.whatsapp_assignment_audit (
    account_id,
    old_company_id,
    new_company_id,
    admin_id,
    action
  ) VALUES (
    _account_id,
    _old_company_id,
    NULL,
    _admin_id,
    'UNASSIGN_NUMBER'
  );
END;
$$;