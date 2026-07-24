
-- ============================================================
-- 1. GRANTs on all public tables (previously missing = 401s)
-- ============================================================
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

-- Public read access ONLY where policies allow anon (landing + public feature flags)
GRANT SELECT ON public.settings TO anon;
GRANT SELECT ON public.feature_flags TO anon;
GRANT SELECT ON public.companies TO anon; -- for public plans/pricing referencing

-- ============================================================
-- 2. handle_new_user trigger (function exists, trigger missing)
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. Bootstrap super_admin by email
--    When gerenciacanalcnm@gmail.com signs up (or already exists),
--    grant super_admin automatically.
-- ============================================================
CREATE OR REPLACE FUNCTION public.grant_super_admin_by_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email = 'gerenciacanalcnm@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'super_admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_grant_super_admin ON auth.users;
CREATE TRIGGER on_auth_user_grant_super_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_super_admin_by_email();

-- If the user already exists, grant role now.
DO $$
DECLARE uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'gerenciacanalcnm@gmail.com' LIMIT 1;
  IF uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (uid, 'super_admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    INSERT INTO public.profiles (id, email, full_name)
    VALUES (uid, 'gerenciacanalcnm@gmail.com', 'Super Admin')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- ============================================================
-- 4. RLS policies (add missing common ones — idempotent)
-- ============================================================

-- profiles: user sees own; super_admin sees all
DROP POLICY IF EXISTS "profiles_read_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_read_self_or_admin" ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_super_admin(auth.uid()))
  WITH CHECK (id = auth.uid() OR public.is_super_admin(auth.uid()));

-- companies: member of company OR super_admin can read; only super_admin can write
DROP POLICY IF EXISTS "companies_read_member_or_admin" ON public.companies;
CREATE POLICY "companies_read_member_or_admin" ON public.companies FOR SELECT
  TO authenticated
  USING (public.is_company_member(auth.uid(), id) OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "companies_write_admin" ON public.companies;
CREATE POLICY "companies_write_admin" ON public.companies FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Public read of active companies for landing (safe: no PII)
DROP POLICY IF EXISTS "companies_public_active" ON public.companies;
CREATE POLICY "companies_public_active" ON public.companies FOR SELECT
  TO anon
  USING (status = 'active');

-- company_members: user sees own memberships, super_admin sees all
DROP POLICY IF EXISTS "company_members_read" ON public.company_members;
CREATE POLICY "company_members_read" ON public.company_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "company_members_write_admin" ON public.company_members;
CREATE POLICY "company_members_write_admin" ON public.company_members FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- user_roles: super_admin manages
DROP POLICY IF EXISTS "user_roles_admin_write" ON public.user_roles;
CREATE POLICY "user_roles_admin_write" ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- settings: public read for is_public=true (landing), authenticated read for own company,
-- super_admin manages global settings
DROP POLICY IF EXISTS "settings_public_read" ON public.settings;
CREATE POLICY "settings_public_read" ON public.settings FOR SELECT
  TO anon, authenticated
  USING (is_public = true OR company_id IS NULL);

DROP POLICY IF EXISTS "settings_company_read" ON public.settings;
CREATE POLICY "settings_company_read" ON public.settings FOR SELECT
  TO authenticated
  USING (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id));

DROP POLICY IF EXISTS "settings_admin_write" ON public.settings;
CREATE POLICY "settings_admin_write" ON public.settings FOR ALL
  TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR (company_id IS NOT NULL AND public.has_company_role(auth.uid(), company_id, 'company_admin'::app_role))
  )
  WITH CHECK (
    public.is_super_admin(auth.uid())
    OR (company_id IS NOT NULL AND public.has_company_role(auth.uid(), company_id, 'company_admin'::app_role))
  );

-- feature_flags: public read, super_admin write
DROP POLICY IF EXISTS "feature_flags_read_all" ON public.feature_flags;
CREATE POLICY "feature_flags_read_all" ON public.feature_flags FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "feature_flags_admin_write" ON public.feature_flags;
CREATE POLICY "feature_flags_admin_write" ON public.feature_flags FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- permissions & role_permissions: read by any authenticated, super_admin write
DROP POLICY IF EXISTS "permissions_read" ON public.permissions;
CREATE POLICY "permissions_read" ON public.permissions FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "permissions_admin_write" ON public.permissions;
CREATE POLICY "permissions_admin_write" ON public.permissions FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "role_permissions_read" ON public.role_permissions;
CREATE POLICY "role_permissions_read" ON public.role_permissions FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "role_permissions_admin_write" ON public.role_permissions;
CREATE POLICY "role_permissions_admin_write" ON public.role_permissions FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- Generic company-scoped tables: member read, member write, super_admin all
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'contacts','contact_groups','campaigns','campaign_recipients',
    'templates','api_keys','webhooks','notifications','audit_logs',
    'sms_messages','whatsapp_messages','invoices','transactions','recharges',
    'nova_conversations','nova_messages','sms_providers','whatsapp_providers'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s_company_access" ON public.%I', t, t);
    -- Skip tables without company_id column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='company_id') THEN
      EXECUTE format($f$
        CREATE POLICY "%s_company_access" ON public.%I FOR ALL
        TO authenticated
        USING (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()))
        WITH CHECK (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()))
      $f$, t, t);
    END IF;
  END LOOP;
END $$;

-- system_logs: super_admin only
DROP POLICY IF EXISTS "system_logs_admin_only" ON public.system_logs;
CREATE POLICY "system_logs_admin_only" ON public.system_logs FOR ALL
  TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));
