-- 1. Settings: remove the company_id IS NULL bypass
DROP POLICY IF EXISTS "settings_public_read" ON public.settings;
CREATE POLICY "settings_public_read" ON public.settings
  FOR SELECT TO anon, authenticated
  USING (is_public = true);

-- 2. Companies: remove anonymous full-row access
DROP POLICY IF EXISTS "companies_public_active" ON public.companies;
REVOKE SELECT ON public.companies FROM anon;

-- 3. Storage: scope contact-imports to the owning company (path prefix = company_id)
DROP POLICY IF EXISTS "authenticated can read contact imports" ON storage.objects;
DROP POLICY IF EXISTS "authenticated can upload contact imports" ON storage.objects;

CREATE POLICY "contact imports read own company" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'contact-imports'
    AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    AND (
      public.is_company_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
      OR public.is_super_admin(auth.uid())
    )
  );

CREATE POLICY "contact imports insert own company" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'contact-imports'
    AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    AND (
      public.is_company_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
      OR public.is_super_admin(auth.uid())
    )
  );

CREATE POLICY "contact imports update own company" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'contact-imports'
    AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    AND (
      public.is_company_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
      OR public.is_super_admin(auth.uid())
    )
  )
  WITH CHECK (
    bucket_id = 'contact-imports'
    AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    AND (
      public.is_company_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
      OR public.is_super_admin(auth.uid())
    )
  );

CREATE POLICY "contact imports delete own company" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'contact-imports'
    AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    AND (
      public.is_company_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
      OR public.is_super_admin(auth.uid())
    )
  );

-- 4. SECURITY DEFINER functions: least-privilege EXECUTE
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_super_admin_by_email() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_company_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_company_role(uuid, uuid, public.app_role) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_company_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_company_role(uuid, uuid, public.app_role) TO authenticated, service_role;