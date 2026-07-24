
-- ============================================================
-- Sprint 7 · Idempotent seed for CNM Nova platform
-- ============================================================

-- 1) Natural-key unique indexes (idempotency)
CREATE UNIQUE INDEX IF NOT EXISTS settings_global_uk
  ON public.settings (namespace, key) WHERE company_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS settings_company_uk
  ON public.settings (company_id, namespace, key) WHERE company_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS companies_slug_uk
  ON public.companies (slug);
CREATE UNIQUE INDEX IF NOT EXISTS permissions_code_uk
  ON public.permissions (code);
CREATE UNIQUE INDEX IF NOT EXISTS feature_flags_key_uk
  ON public.feature_flags (key);
CREATE UNIQUE INDEX IF NOT EXISTS role_permissions_role_perm_uk
  ON public.role_permissions (role, permission_id);
CREATE UNIQUE INDEX IF NOT EXISTS templates_company_name_uk
  ON public.templates (company_id, name);
CREATE UNIQUE INDEX IF NOT EXISTS contact_groups_company_name_uk
  ON public.contact_groups (company_id, name);

-- 2) Default company (CNM Digital Media SAS)
INSERT INTO public.companies (id, name, slug, tax_id, status, plan_code, balance, currency, timezone, logo_url, metadata)
VALUES (
  '00000000-0000-4000-8000-000000000001'::uuid,
  'CNM Digital Media SAS',
  'cnm-digital-media',
  '901000000-1',
  'active',
  'business',
  0,
  'COP',
  'America/Bogota',
  'https://canalcnm.com/wp-content/uploads/2026/07/logo-cnm.png',
  jsonb_build_object(
    'product', 'SMS CNM',
    'domain', 'sms.canalcnm.com',
    'website', 'https://canalcnm.com',
    'supportEmail', 'soporte@canalcnm.com',
    'whatsapp', '+573000000000'
  )
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  logo_url = EXCLUDED.logo_url,
  metadata = EXCLUDED.metadata,
  updated_at = now();

-- 3) Global settings (namespace = 'admin' / 'platform' / 'landing')
-- Helper: upsert global setting
CREATE OR REPLACE FUNCTION public._seed_global_setting(_namespace text, _key text, _value jsonb, _is_public boolean DEFAULT false)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.settings (company_id, namespace, key, value, is_public)
  VALUES (NULL, _namespace, _key, _value, _is_public)
  ON CONFLICT (namespace, key) WHERE company_id IS NULL
  DO UPDATE SET value = EXCLUDED.value, is_public = EXCLUDED.is_public, updated_at = now();
END;
$$;

-- admin/general
SELECT public._seed_global_setting('admin', 'general', jsonb_build_object(
  'companyName', 'CNM Digital Media',
  'email', 'contacto@canalcnm.com',
  'whatsapp', '+57 300 000 0000',
  'phone', '+57 601 000 0000',
  'address', 'Bogotá, Colombia',
  'timezone', 'America/Bogota',
  'language', 'es',
  'currency', 'COP',
  'iva', 19,
  'minPurchase', 150000,
  'logoUrl', 'https://canalcnm.com/wp-content/uploads/2026/07/logo-cnm.png',
  'faviconUrl', 'https://canalcnm.com/wp-content/uploads/2026/07/logo-cnm.png',
  'social', jsonb_build_object(
    'facebook', 'https://facebook.com/canalcnm',
    'instagram', 'https://instagram.com/canalcnm',
    'twitter', '',
    'linkedin', '',
    'youtube', ''
  )
));

-- admin/sms
SELECT public._seed_global_setting('admin', 'sms', jsonb_build_object(
  'provider', 'Infobip',
  'username', 'sms_cnm_prod',
  'apiKey', '',
  'password', '',
  'sender', 'CNM',
  'timeout', 30,
  'retries', 3,
  'flashSms', true,
  'scheduleStart', '08:00',
  'scheduleEnd', '20:00',
  'dailyLimit', 500000
));

-- admin/whatsapp
SELECT public._seed_global_setting('admin', 'whatsapp', jsonb_build_object(
  'provider', 'Meta Business',
  'phoneNumber', '',
  'phoneNumberId', '',
  'businessAccountId', '',
  'token', '',
  'webhookUrl', '',
  'status', 'not_configured'
));

-- admin/nova
SELECT public._seed_global_setting('admin', 'nova', jsonb_build_object(
  'model', 'google/gemini-2.5-flash',
  'systemPrompt', 'Eres CNM Nova, copiloto experto en SMS marketing y CRM para pymes hispanohablantes. Responde con claridad, orientado a acción, y sugiere próximos pasos.',
  'temperature', 0.7,
  'maxTokens', 1024,
  'allowedActions', jsonb_build_array('create_campaign','segment_contacts','draft_message','analyze_metrics'),
  'welcome', 'Hola, soy CNM Nova. ¿En qué campaña te ayudo hoy?'
));

-- admin/api
SELECT public._seed_global_setting('admin', 'api', jsonb_build_object(
  'rateLimit', 120,
  'burst', 240,
  'tokenTtlDays', 90,
  'ipWhitelist', jsonb_build_array()
));

-- admin/security
SELECT public._seed_global_setting('admin', 'security', jsonb_build_object(
  'jwtExpiryMinutes', 60,
  'refreshExpiryDays', 30,
  'passwordMinLength', 10,
  'requireUppercase', true,
  'requireNumber', true,
  'requireSymbol', true,
  'twoFactor', true,
  'captcha', true,
  'googleOAuth', true,
  'maxSessions', 5
));

-- admin/notifications
SELECT public._seed_global_setting('admin', 'notifications', jsonb_build_object(
  'email', true,
  'push', true,
  'inApp', true,
  'sms', false,
  'whatsapp', false
));

-- admin/tariffs (COP per SMS)
SELECT public._seed_global_setting('admin', 'tariffs', jsonb_build_array(
  jsonb_build_object('id','t1','from',1,'to',1000,'price',65,'active',true,'order',1),
  jsonb_build_object('id','t2','from',1001,'to',5000,'price',58,'active',true,'order',2),
  jsonb_build_object('id','t3','from',5001,'to',20000,'price',49,'active',true,'order',3),
  jsonb_build_object('id','t4','from',20001,'to',100000,'price',42,'active',true,'order',4),
  jsonb_build_object('id','t5','from',100001,'to',1000000,'price',35,'active',true,'order',5)
));

-- admin/plans
SELECT public._seed_global_setting('admin', 'plans', jsonb_build_array(
  jsonb_build_object('id','p1','name','Starter','sms',1000,'price',65000,'description','Ideal para arrancar','color','#3b82f6','order',1,'visible',true,'featured',false),
  jsonb_build_object('id','p2','name','Business','sms',10000,'price',490000,'description','Para equipos en crecimiento','color','#8b5cf6','label','Más popular','order',2,'visible',true,'featured',true),
  jsonb_build_object('id','p3','name','Scale','sms',50000,'price',2100000,'description','Operación 24/7','color','#ec4899','order',3,'visible',true,'featured',false),
  jsonb_build_object('id','p4','name','Enterprise','sms',250000,'price',8750000,'description','Volumen dedicado','color','#f59e0b','label','Custom','order',4,'visible',true,'featured',false)
));

-- admin/promotions
SELECT public._seed_global_setting('admin', 'promotions', jsonb_build_array(
  jsonb_build_object('id','pr1','name','Bienvenida','code','WELCOME10','discount',10,'startsAt','2026-01-01','endsAt','2026-12-31','active',true,'auto',false),
  jsonb_build_object('id','pr2','name','Black Friday','code','BLACK25','discount',25,'startsAt','2026-11-25','endsAt','2026-11-30','active',false,'auto',true),
  jsonb_build_object('id','pr3','name','Verano','code','SUMMER15','discount',15,'startsAt','2026-06-01','endsAt','2026-08-31','active',true,'auto',false)
));

-- admin/payment_methods
SELECT public._seed_global_setting('admin', 'payment_methods', jsonb_build_array(
  jsonb_build_object('id','pm1','name','PayPal','provider','paypal','enabled',true,'test',false),
  jsonb_build_object('id','pm2','name','Stripe','provider','stripe','enabled',true,'test',false),
  jsonb_build_object('id','pm3','name','Transferencia bancaria','provider','transferencia','enabled',true,'test',false),
  jsonb_build_object('id','pm4','name','PSE','provider','pse','enabled',false,'test',true)
));

-- admin/integrations
SELECT public._seed_global_setting('admin', 'integrations', jsonb_build_array(
  jsonb_build_object('id','in1','name','Infobip','category','sms','enabled',true,'status','connected'),
  jsonb_build_object('id','in2','name','Twilio','category','sms','enabled',false,'status','disconnected'),
  jsonb_build_object('id','in3','name','Meta WhatsApp','category','whatsapp','enabled',false,'status','disconnected'),
  jsonb_build_object('id','in4','name','Resend','category','email','enabled',true,'status','connected'),
  jsonb_build_object('id','in5','name','HubSpot','category','crm','enabled',false,'status','disconnected'),
  jsonb_build_object('id','in6','name','Google Analytics 4','category','analytics','enabled',true,'status','connected')
));

-- landing/content — marcador; el frontend usa fallback hasta que el CMS lo edite
SELECT public._seed_global_setting('landing', 'content', jsonb_build_object('_bootstrap', true), true);

-- 4) Permissions catalog
INSERT INTO public.permissions (code, module, description) VALUES
  ('landing:read',   'landing',   'Ver landing page y CMS'),
  ('landing:write',  'landing',   'Editar contenido de landing'),
  ('company:read',   'company',   'Ver información de la empresa'),
  ('company:write',  'company',   'Editar información de la empresa'),
  ('sms:send',       'sms',       'Enviar mensajes SMS'),
  ('sms:read',       'sms',       'Ver historial y bandeja SMS'),
  ('campaign:create','campaigns', 'Crear y editar campañas'),
  ('campaign:read',  'campaigns', 'Ver campañas'),
  ('analytics:read', 'analytics', 'Ver reportes y analítica'),
  ('billing:read',   'billing',   'Ver facturación y recargas'),
  ('billing:write',  'billing',   'Gestionar facturación y pagos'),
  ('users:read',     'users',     'Ver usuarios'),
  ('users:write',    'users',     'Gestionar usuarios y roles'),
  ('system:admin',   'system',    'Acceso completo Super Admin')
ON CONFLICT (code) DO UPDATE SET
  module = EXCLUDED.module,
  description = EXCLUDED.description;

-- 5) Role → Permissions matrix
-- super_admin: everything
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'super_admin'::app_role, id FROM public.permissions
ON CONFLICT (role, permission_id) DO NOTHING;

-- company_admin: everything except system:admin
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'company_admin'::app_role, id FROM public.permissions WHERE code <> 'system:admin'
ON CONFLICT (role, permission_id) DO NOTHING;

-- manager: read/write operativo, sin users:write ni billing:write
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'manager'::app_role, id FROM public.permissions
WHERE code IN ('landing:read','company:read','sms:send','sms:read','campaign:create','campaign:read','analytics:read','billing:read','users:read')
ON CONFLICT (role, permission_id) DO NOTHING;

-- agent: envíos y lectura básica
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'agent'::app_role, id FROM public.permissions
WHERE code IN ('sms:send','sms:read','campaign:read','company:read')
ON CONFLICT (role, permission_id) DO NOTHING;

-- viewer: solo lectura
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'viewer'::app_role, id FROM public.permissions
WHERE code LIKE '%:read'
ON CONFLICT (role, permission_id) DO NOTHING;

-- 6) Feature flags
INSERT INTO public.feature_flags (key, description, enabled_globally, rollout_percentage) VALUES
  ('landing',      'Sitio público / landing page',                 true,  100),
  ('crm',          'Módulo CRM (contactos, pipeline, segmentos)',  true,  100),
  ('sms',          'Envío de SMS',                                 true,  100),
  ('flashSms',     'Flash SMS (mensajes clase 0)',                 true,  100),
  ('campaigns',    'Campañas masivas',                             true,  100),
  ('analytics',    'Reportes y analítica',                         true,  100),
  ('api',          'API pública y webhooks',                       true,  100),
  ('cnmNova',      'Asistente IA CNM Nova',                        true,  100),
  ('automations',  'Automatizaciones y flujos',                    false, 0),
  ('affiliates',   'Programa de afiliados',                        false, 0),
  ('distributors', 'Red de distribuidores',                        false, 0),
  ('billing',      'Facturación y recargas',                       true,  100),
  ('support',      'Centro de soporte',                            true,  100)
ON CONFLICT (key) DO UPDATE SET
  description = EXCLUDED.description,
  enabled_globally = EXCLUDED.enabled_globally,
  rollout_percentage = EXCLUDED.rollout_percentage,
  updated_at = now();

-- 7) Contact groups iniciales (para CNM)
INSERT INTO public.contact_groups (company_id, name, description, color) VALUES
  ('00000000-0000-4000-8000-000000000001','Clientes',   'Base activa de clientes',        '#22c55e'),
  ('00000000-0000-4000-8000-000000000001','Prospectos', 'Interesados sin conversión',     '#3b82f6'),
  ('00000000-0000-4000-8000-000000000001','VIP',        'Cuentas prioritarias',           '#a855f7'),
  ('00000000-0000-4000-8000-000000000001','Inactivos',  'Sin actividad reciente',         '#94a3b8')
ON CONFLICT (company_id, name) DO NOTHING;

-- 8) Plantillas SMS base
INSERT INTO public.templates (company_id, name, kind, language, content, variables, is_approved) VALUES
  ('00000000-0000-4000-8000-000000000001','Bienvenida',    'sms','es','Hola {{nombre}}, gracias por unirte a {{empresa}}. Responde AYUDA para más info.', '["nombre","empresa"]'::jsonb, true),
  ('00000000-0000-4000-8000-000000000001','Confirmación',  'sms','es','Tu pedido {{codigo}} fue confirmado. Total: {{total}}. Gracias por tu compra.',      '["codigo","total"]'::jsonb, true),
  ('00000000-0000-4000-8000-000000000001','Recordatorio',  'sms','es','Recordatorio: tienes una cita el {{fecha}} a las {{hora}}. Responde OK para confirmar.', '["fecha","hora"]'::jsonb, true)
ON CONFLICT (company_id, name) DO NOTHING;

-- 9) Notificación de bienvenida (nivel plataforma)
INSERT INTO public.notifications (company_id, user_id, severity, title, body, metadata)
SELECT '00000000-0000-4000-8000-000000000001'::uuid, NULL, 'info'::notification_severity,
       'Bienvenido a CNM Nova', 'La plataforma quedó lista con la configuración inicial. Configura tus proveedores desde el Panel Super Admin.',
       jsonb_build_object('bootstrap', true)
WHERE NOT EXISTS (
  SELECT 1 FROM public.notifications WHERE metadata ->> 'bootstrap' = 'true'
);

-- 10) Cleanup helper
DROP FUNCTION IF EXISTS public._seed_global_setting(text, text, jsonb, boolean);
