
INSERT INTO public.companies (id, name, slug, status, balance, currency)
VALUES ('00000000-0000-4000-8000-000000000001', 'CNM Digital Media', 'cnm-digital-media', 'active', 500000, 'COP')
ON CONFLICT (id) DO NOTHING;

DELETE FROM public.settings WHERE company_id IS NULL AND namespace = 'admin';

INSERT INTO public.settings (company_id, namespace, key, value) VALUES
(NULL, 'admin', 'general', '{"companyName":"CNM Digital Media","email":"contacto@canalcnm.com","whatsapp":"+57 300 000 0000","phone":"+57 601 000 0000","address":"Bogotá, Colombia","timezone":"America/Bogota","language":"es","currency":"COP","iva":19,"minPurchase":50000,"logoUrl":"https://canalcnm.com/wp-content/uploads/2026/07/logo-cnm.png","faviconUrl":"https://canalcnm.com/wp-content/uploads/2026/07/logo-cnm.png","social":{"facebook":"https://facebook.com/canalcnm","instagram":"https://instagram.com/canalcnm","twitter":"","linkedin":"","youtube":""}}'::jsonb),
(NULL, 'admin', 'sms', '{"provider":"Infobip","username":"sms_cnm_prod","apiKey":"","password":"","sender":"CNM","timeout":30,"retries":3,"flashSms":true,"scheduleStart":"08:00","scheduleEnd":"20:00","dailyLimit":500000}'::jsonb),
(NULL, 'admin', 'whatsapp', '{"provider":"Meta Business","phoneNumber":"","phoneNumberId":"","businessAccountId":"","token":"","webhookUrl":"","status":"not_configured"}'::jsonb),
(NULL, 'admin', 'nova', '{"model":"gemini-2.5-flash","systemPrompt":"Eres CNM Nova, copiloto experto en SMS marketing y CRM para pymes hispanohablantes.","temperature":0.7,"maxTokens":1024,"allowedActions":["create_campaign","segment_contacts","draft_message","analyze_metrics"],"welcome":"Hola, soy CNM Nova. ¿En qué campaña te ayudo hoy?"}'::jsonb),
(NULL, 'admin', 'api', '{"rateLimit":120,"burst":240,"tokenTtlDays":90,"ipWhitelist":[]}'::jsonb),
(NULL, 'admin', 'security', '{"jwtExpiryMinutes":60,"refreshExpiryDays":30,"passwordMinLength":10,"requireUppercase":true,"requireNumber":true,"requireSymbol":true,"twoFactor":true,"captcha":true,"googleOAuth":true,"maxSessions":5}'::jsonb),
(NULL, 'admin', 'notifications', '{"email":true,"push":true,"inApp":true,"sms":false,"whatsapp":false}'::jsonb),
(NULL, 'admin', 'tariffs', '[{"id":"t1","from":1,"to":1000,"price":65,"active":true,"order":1},{"id":"t2","from":1001,"to":5000,"price":58,"active":true,"order":2},{"id":"t3","from":5001,"to":20000,"price":49,"active":true,"order":3},{"id":"t4","from":20001,"to":100000,"price":42,"active":true,"order":4},{"id":"t5","from":100001,"to":1000000,"price":35,"active":true,"order":5}]'::jsonb),
(NULL, 'admin', 'plans', '[{"id":"p1","name":"Starter","sms":1000,"price":65000,"description":"Ideal para arrancar","color":"#3b82f6","order":1,"visible":true,"featured":false},{"id":"p2","name":"Business","sms":10000,"price":490000,"description":"Para equipos en crecimiento","color":"#8b5cf6","label":"Más popular","order":2,"visible":true,"featured":true},{"id":"p3","name":"Scale","sms":50000,"price":2100000,"description":"Operación 24/7","color":"#ec4899","order":3,"visible":true,"featured":false},{"id":"p4","name":"Enterprise","sms":250000,"price":8750000,"description":"Volumen dedicado","color":"#f59e0b","label":"Custom","order":4,"visible":true,"featured":false}]'::jsonb),
(NULL, 'admin', 'promotions', '[{"id":"pr1","name":"Bienvenida","code":"WELCOME10","discount":10,"startsAt":"2026-01-01","endsAt":"2026-12-31","active":true,"auto":false},{"id":"pr2","name":"Black Friday","code":"BLACK25","discount":25,"startsAt":"2026-11-25","endsAt":"2026-11-30","active":false,"auto":true},{"id":"pr3","name":"Verano","code":"SUMMER15","discount":15,"startsAt":"2026-06-01","endsAt":"2026-08-31","active":true,"auto":false}]'::jsonb),
(NULL, 'admin', 'payment_methods', '[{"id":"pm1","name":"PayPal","provider":"paypal","enabled":true,"test":false},{"id":"pm2","name":"Stripe","provider":"stripe","enabled":true,"test":false},{"id":"pm3","name":"Transferencia bancaria","provider":"transferencia","enabled":true,"test":false},{"id":"pm4","name":"PSE","provider":"pse","enabled":false,"test":true}]'::jsonb),
(NULL, 'admin', 'integrations', '[{"id":"in1","name":"Infobip","category":"sms","enabled":true,"status":"connected"},{"id":"in2","name":"Twilio","category":"sms","enabled":false,"status":"disconnected"},{"id":"in3","name":"Meta WhatsApp","category":"whatsapp","enabled":false,"status":"disconnected"},{"id":"in4","name":"Resend","category":"email","enabled":true,"status":"connected"},{"id":"in5","name":"HubSpot","category":"crm","enabled":false,"status":"disconnected"},{"id":"in6","name":"Google Analytics 4","category":"analytics","enabled":true,"status":"connected"}]'::jsonb);

INSERT INTO public.settings (company_id, namespace, key, value)
SELECT NULL, 'landing', 'content', '{"_bootstrap":true}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.settings WHERE company_id IS NULL AND namespace='landing' AND key='content');

DROP POLICY IF EXISTS "authenticated can upload contact imports" ON storage.objects;
CREATE POLICY "authenticated can upload contact imports" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'contact-imports');
DROP POLICY IF EXISTS "authenticated can read contact imports" ON storage.objects;
CREATE POLICY "authenticated can read contact imports" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'contact-imports');

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

DROP POLICY IF EXISTS "members write contacts" ON public.contacts;
CREATE POLICY "members write contacts" ON public.contacts FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id)) WITH CHECK (public.is_company_member(auth.uid(), company_id));

DROP POLICY IF EXISTS "members write contact_groups" ON public.contact_groups;
CREATE POLICY "members write contact_groups" ON public.contact_groups FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id)) WITH CHECK (public.is_company_member(auth.uid(), company_id));

DROP POLICY IF EXISTS "members write contact_group_members" ON public.contact_group_members;
CREATE POLICY "members write contact_group_members" ON public.contact_group_members FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.contact_groups g WHERE g.id = group_id AND public.is_company_member(auth.uid(), g.company_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.contact_groups g WHERE g.id = group_id AND public.is_company_member(auth.uid(), g.company_id)));

DROP POLICY IF EXISTS "members write campaigns" ON public.campaigns;
CREATE POLICY "members write campaigns" ON public.campaigns FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id)) WITH CHECK (public.is_company_member(auth.uid(), company_id));

DROP POLICY IF EXISTS "members write campaign_recipients" ON public.campaign_recipients;
CREATE POLICY "members write campaign_recipients" ON public.campaign_recipients FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND public.is_company_member(auth.uid(), c.company_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND public.is_company_member(auth.uid(), c.company_id)));

DROP POLICY IF EXISTS "members write templates" ON public.templates;
CREATE POLICY "members write templates" ON public.templates FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id)) WITH CHECK (public.is_company_member(auth.uid(), company_id));

DROP POLICY IF EXISTS "user updates own notifications" ON public.notifications;
CREATE POLICY "user updates own notifications" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_company_member(auth.uid(), company_id))
  WITH CHECK (user_id = auth.uid() OR public.is_company_member(auth.uid(), company_id));

DROP POLICY IF EXISTS "user deletes own notifications" ON public.notifications;
CREATE POLICY "user deletes own notifications" ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_company_member(auth.uid(), company_id));

DROP POLICY IF EXISTS "super_admin writes api_keys" ON public.api_keys;
CREATE POLICY "super_admin writes api_keys" ON public.api_keys FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.is_company_member(auth.uid(), company_id));

DROP POLICY IF EXISTS "super_admin writes webhooks" ON public.webhooks;
CREATE POLICY "super_admin writes webhooks" ON public.webhooks FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.is_company_member(auth.uid(), company_id))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.is_company_member(auth.uid(), company_id));

DROP POLICY IF EXISTS "super_admin writes feature_flags" ON public.feature_flags;
CREATE POLICY "super_admin writes feature_flags" ON public.feature_flags FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "super_admin writes settings" ON public.settings;
CREATE POLICY "super_admin writes settings" ON public.settings FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id)))
  WITH CHECK (public.is_super_admin(auth.uid()) OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id)));

DROP POLICY IF EXISTS "super_admin reads audit_logs" ON public.audit_logs;
CREATE POLICY "super_admin reads audit_logs" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id)));

DROP POLICY IF EXISTS "super_admin reads system_logs" ON public.system_logs;
CREATE POLICY "super_admin reads system_logs" ON public.system_logs FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));
