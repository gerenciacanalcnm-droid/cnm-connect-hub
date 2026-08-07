-- ═══════════════ PLANES ═══════════════
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price_monthly numeric(14,2) NOT NULL DEFAULT 0,
  price_yearly numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'COP',
  color text NOT NULL DEFAULT '#8b5cf6',
  icon text NOT NULL DEFAULT 'Package',
  badge text,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plans TO authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_public_read" ON public.plans FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "plans_admin_write" ON public.plans FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_plans_updated BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ═══════════════ CATÁLOGO DE FUNCIONALIDADES ═══════════════
CREATE TABLE public.commercial_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  icon text NOT NULL DEFAULT 'Flag',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.commercial_features TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commercial_features TO authenticated;
GRANT ALL ON public.commercial_features TO service_role;
ALTER TABLE public.commercial_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "features_public_read" ON public.commercial_features FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "features_admin_write" ON public.commercial_features FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_features_updated BEFORE UPDATE ON public.commercial_features
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ═══════════════ FUNCIONALIDADES POR PLAN ═══════════════
CREATE TABLE public.plan_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  feature_key text NOT NULL REFERENCES public.commercial_features(key) ON DELETE CASCADE,
  included boolean NOT NULL DEFAULT false,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, feature_key)
);
GRANT SELECT ON public.plan_features TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_features TO authenticated;
GRANT ALL ON public.plan_features TO service_role;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_features_public_read" ON public.plan_features FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "plan_features_admin_write" ON public.plan_features FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_plan_features_updated BEFORE UPDATE ON public.plan_features
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ═══════════════ LÍMITES POR PLAN ═══════════════
CREATE TABLE public.plan_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  limit_key text NOT NULL,
  limit_value integer NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'unidad',
  is_unlimited boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, limit_key)
);
GRANT SELECT ON public.plan_limits TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_limits TO authenticated;
GRANT ALL ON public.plan_limits TO service_role;
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_limits_public_read" ON public.plan_limits FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "plan_limits_admin_write" ON public.plan_limits FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_plan_limits_updated BEFORE UPDATE ON public.plan_limits
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ═══════════════ TARIFAS POR CANAL ═══════════════
CREATE TABLE public.rate_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL,
  from_qty bigint NOT NULL DEFAULT 0,
  to_qty bigint NOT NULL DEFAULT 0,
  unit_price numeric(14,4) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'COP',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rate_tiers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rate_tiers TO authenticated;
GRANT ALL ON public.rate_tiers TO service_role;
ALTER TABLE public.rate_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rate_tiers_public_read" ON public.rate_tiers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "rate_tiers_admin_write" ON public.rate_tiers FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_rate_tiers_updated BEFORE UPDATE ON public.rate_tiers
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ═══════════════ PROMOCIONES COMERCIALES ═══════════════
CREATE TABLE public.commercial_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  kind text NOT NULL DEFAULT 'coupon',
  value_type text NOT NULL DEFAULT 'percent',
  value numeric(14,2) NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  channel text,
  max_redemptions integer NOT NULL DEFAULT 0,
  redemptions integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  status text NOT NULL DEFAULT 'draft',
  auto_apply boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commercial_promotions TO authenticated;
GRANT ALL ON public.commercial_promotions TO service_role;
ALTER TABLE public.commercial_promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promos_read_auth" ON public.commercial_promotions FOR SELECT TO authenticated USING (true);
CREATE POLICY "promos_admin_write" ON public.commercial_promotions FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_promos_updated BEFORE UPDATE ON public.commercial_promotions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ═══════════════ WALLETS ═══════════════
CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  channel text NOT NULL,
  balance numeric(14,2) NOT NULL DEFAULT 0,
  consumed numeric(14,2) NOT NULL DEFAULT 0,
  credits bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'COP',
  status text NOT NULL DEFAULT 'inactive',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, channel)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallets_member_read" ON public.wallets FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()));
CREATE POLICY "wallets_admin_write" ON public.wallets FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_wallets_updated BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type text NOT NULL,
  amount numeric(14,2) NOT NULL DEFAULT 0,
  units bigint NOT NULL DEFAULT 0,
  balance_after numeric(14,2),
  reference text,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet_tx_member_read" ON public.wallet_transactions FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()));
CREATE POLICY "wallet_tx_admin_write" ON public.wallet_transactions FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));
CREATE INDEX idx_wallet_tx_wallet ON public.wallet_transactions(wallet_id, created_at DESC);

-- ═══════════════ PASARELAS DE PAGO ═══════════════
CREATE TABLE public.payment_gateways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'CreditCard',
  is_enabled boolean NOT NULL DEFAULT false,
  mode text NOT NULL DEFAULT 'sandbox',
  status text NOT NULL DEFAULT 'not_configured',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  last_test_at timestamptz,
  last_test_ok boolean,
  last_test_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_gateways TO authenticated;
GRANT ALL ON public.payment_gateways TO service_role;
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gateways_admin_all" ON public.payment_gateways FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_gateways_updated BEFORE UPDATE ON public.payment_gateways
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ═══════════════ HISTORIAL COMERCIAL ═══════════════
CREATE TABLE public.commercial_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  entity_type text,
  entity_id text,
  amount numeric(14,2),
  currency text NOT NULL DEFAULT 'COP',
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.commercial_history TO authenticated;
GRANT ALL ON public.commercial_history TO service_role;
ALTER TABLE public.commercial_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commercial_history_read" ON public.commercial_history FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id)));
CREATE POLICY "commercial_history_admin_insert" ON public.commercial_history FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));
CREATE INDEX idx_commercial_history_company ON public.commercial_history(company_id, created_at DESC);

-- ═══════════════ RECARGAS: modo, comprobante y revisión ═══════════════
ALTER TABLE public.recharges
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'sms',
  ADD COLUMN IF NOT EXISTS gateway_code text,
  ADD COLUMN IF NOT EXISTS receipt_path text,
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS review_note text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- ═══════════════ SEED: catálogo de funcionalidades ═══════════════
INSERT INTO public.commercial_features (key, name, description, category, icon, sort_order) VALUES
  ('crm', 'CRM', 'Pipeline, oportunidades y seguimiento comercial.', 'core', 'Users', 1),
  ('landing', 'Landing', 'Sitio público, formularios y captación.', 'core', 'FileText', 2),
  ('contactos', 'Contactos', 'Gestión de contactos, grupos y segmentos.', 'core', 'Contact', 3),
  ('sms', 'SMS', 'Campañas y envíos SMS.', 'canales', 'MessageSquare', 4),
  ('email', 'Email', 'Email marketing y transaccional.', 'canales', 'Mail', 5),
  ('whatsapp', 'WhatsApp', 'WhatsApp Marketing y conversaciones.', 'canales', 'MessageCircle', 6),
  ('ia', 'IA', 'CNM Nova, copiloto e inteligencia artificial.', 'avanzado', 'Sparkles', 7),
  ('automatizaciones', 'Automatizaciones', 'Flujos, disparadores y secuencias.', 'avanzado', 'Zap', 8),
  ('api', 'API', 'Acceso programático a la plataforma.', 'avanzado', 'Code2', 9),
  ('webhooks', 'Webhooks', 'Notificaciones de eventos hacia sistemas externos.', 'avanzado', 'Webhook', 10),
  ('equipos', 'Equipos', 'Trabajo colaborativo por equipos.', 'organizacion', 'Users', 11),
  ('roles', 'Roles personalizados', 'Definición de roles y permisos a medida.', 'organizacion', 'Shield', 12),
  ('multiempresa', 'Multiempresa', 'Gestión de múltiples empresas.', 'organizacion', 'Building2', 13),
  ('white_label', 'White Label', 'Marca propia y dominios personalizados.', 'enterprise', 'Palette', 14),
  ('reseller', 'Reseller', 'Reventa y red de distribuidores.', 'enterprise', 'Store', 15)
ON CONFLICT (key) DO NOTHING;

-- ═══════════════ SEED: planes ═══════════════
INSERT INTO public.plans (code, name, description, price_monthly, price_yearly, currency, color, icon, badge, sort_order, is_visible, is_active) VALUES
  ('starter', 'Starter', 'Empieza gratis con CRM, contactos, landing y campañas de Email y SMS.', 0, 0, 'COP', '#10b981', 'Rocket', NULL, 1, true, true),
  ('profesional', 'Profesional', 'Suma WhatsApp Marketing, IA, automatizaciones y webhooks para equipos de hasta 5 usuarios.', 99900, 999000, 'COP', '#8b5cf6', 'Sparkles', 'Más vendido', 2, true, true),
  ('business', 'Business', 'Multiempresa, equipos, roles personalizados, dashboard ejecutivo y API completa.', 249900, 2499000, 'COP', '#f59e0b', 'Building2', NULL, 3, true, true)
ON CONFLICT (code) DO NOTHING;

-- ═══════════════ SEED: funcionalidades por plan ═══════════════
INSERT INTO public.plan_features (plan_id, feature_key, included)
SELECT p.id, f.key,
  CASE p.code
    WHEN 'starter' THEN f.key IN ('crm','landing','contactos','sms','email','api')
    WHEN 'profesional' THEN f.key IN ('crm','landing','contactos','sms','email','api','whatsapp','ia','automatizaciones','webhooks')
    ELSE f.key IN ('crm','landing','contactos','sms','email','api','whatsapp','ia','automatizaciones','webhooks','equipos','roles','multiempresa')
  END
FROM public.plans p CROSS JOIN public.commercial_features f
ON CONFLICT (plan_id, feature_key) DO NOTHING;

-- ═══════════════ SEED: límites por plan ═══════════════
INSERT INTO public.plan_limits (plan_id, limit_key, limit_value, unit) VALUES
  ((SELECT id FROM public.plans WHERE code='starter'), 'usuarios', 1, 'usuarios'),
  ((SELECT id FROM public.plans WHERE code='starter'), 'empresas', 1, 'empresas'),
  ((SELECT id FROM public.plans WHERE code='starter'), 'automatizaciones', 0, 'flujos'),
  ((SELECT id FROM public.plans WHERE code='starter'), 'storage', 1024, 'MB'),
  ((SELECT id FROM public.plans WHERE code='starter'), 'api', 1000, 'req/día'),
  ((SELECT id FROM public.plans WHERE code='starter'), 'dominios', 0, 'dominios'),
  ((SELECT id FROM public.plans WHERE code='profesional'), 'usuarios', 5, 'usuarios'),
  ((SELECT id FROM public.plans WHERE code='profesional'), 'empresas', 1, 'empresas'),
  ((SELECT id FROM public.plans WHERE code='profesional'), 'automatizaciones', 25, 'flujos'),
  ((SELECT id FROM public.plans WHERE code='profesional'), 'storage', 10240, 'MB'),
  ((SELECT id FROM public.plans WHERE code='profesional'), 'api', 25000, 'req/día'),
  ((SELECT id FROM public.plans WHERE code='profesional'), 'dominios', 1, 'dominios'),
  ((SELECT id FROM public.plans WHERE code='business'), 'usuarios', 20, 'usuarios'),
  ((SELECT id FROM public.plans WHERE code='business'), 'empresas', 10, 'empresas'),
  ((SELECT id FROM public.plans WHERE code='business'), 'automatizaciones', 200, 'flujos'),
  ((SELECT id FROM public.plans WHERE code='business'), 'storage', 102400, 'MB'),
  ((SELECT id FROM public.plans WHERE code='business'), 'api', 250000, 'req/día'),
  ((SELECT id FROM public.plans WHERE code='business'), 'dominios', 5, 'dominios')
ON CONFLICT (plan_id, limit_key) DO NOTHING;

-- ═══════════════ SEED: tarifas ═══════════════
INSERT INTO public.rate_tiers (channel, from_qty, to_qty, unit_price, currency, sort_order) VALUES
  ('sms', 10000, 10000, 30, 'COP', 1),
  ('sms', 10001, 50000, 25, 'COP', 2),
  ('sms', 50001, 100000, 20, 'COP', 3),
  ('sms', 100001, 200000, 18, 'COP', 4),
  ('sms', 200001, 300000, 15, 'COP', 5),
  ('sms', 300001, 500000, 12, 'COP', 6),
  ('sms', 500001, 1000000, 10, 'COP', 7),
  ('whatsapp', 10000, 1000000, 70, 'COP', 1),
  ('email', 10000, 1000000, 12, 'COP', 1);

-- ═══════════════ SEED: pasarelas ═══════════════
INSERT INTO public.payment_gateways (code, name, description, icon, sort_order) VALUES
  ('wompi', 'Wompi', 'Pasarela colombiana: PSE, tarjetas, Nequi y Bancolombia.', 'Wallet', 1),
  ('transferencia', 'Transferencia Bancaria', 'Pago manual con carga de comprobante.', 'Landmark', 2),
  ('paypal', 'PayPal', 'Pagos internacionales con cuenta PayPal.', 'Wallet', 3),
  ('stripe', 'Stripe', 'Tarjetas internacionales y suscripciones.', 'CreditCard', 4),
  ('mercadopago', 'Mercado Pago', 'Pagos y billetera de Mercado Libre.', 'Banknote', 5)
ON CONFLICT (code) DO NOTHING;

-- ═══════════════ SEED: feature flags globales alineados al catálogo ═══════════════
INSERT INTO public.feature_flags (key, description, enabled_globally)
SELECT f.key, f.description, true FROM public.commercial_features f
ON CONFLICT (key) DO NOTHING;

-- ═══════════════ STORAGE POLICIES: comprobantes ═══════════════
CREATE POLICY "receipts_admin_all" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'payment-receipts' AND public.is_super_admin(auth.uid()))
  WITH CHECK (bucket_id = 'payment-receipts' AND public.is_super_admin(auth.uid()));
CREATE POLICY "receipts_owner_rw" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "receipts_owner_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-receipts' AND (storage.foldername(name))[1] = auth.uid()::text);