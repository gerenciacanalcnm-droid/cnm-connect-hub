CREATE POLICY "nova knowledge read own company" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'nova-knowledge'
    AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    AND (
      public.is_company_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
      OR public.is_super_admin(auth.uid())
    )
  );

CREATE POLICY "nova knowledge insert own company" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'nova-knowledge'
    AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    AND (
      public.has_company_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'company_admin'::app_role)
      OR public.is_super_admin(auth.uid())
    )
  );

CREATE POLICY "nova knowledge update own company" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'nova-knowledge'
    AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    AND (
      public.has_company_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'company_admin'::app_role)
      OR public.is_super_admin(auth.uid())
    )
  )
  WITH CHECK (
    bucket_id = 'nova-knowledge'
    AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    AND (
      public.has_company_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'company_admin'::app_role)
      OR public.is_super_admin(auth.uid())
    )
  );

CREATE POLICY "nova knowledge delete own company" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'nova-knowledge'
    AND (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    AND (
      public.has_company_role(auth.uid(), ((storage.foldername(name))[1])::uuid, 'company_admin'::app_role)
      OR public.is_super_admin(auth.uid())
    )
  );