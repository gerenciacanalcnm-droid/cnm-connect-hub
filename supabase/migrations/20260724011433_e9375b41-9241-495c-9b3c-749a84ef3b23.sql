
-- =========================================================================
-- ENUMS
-- =========================================================================
CREATE TYPE public.app_role AS ENUM ('super_admin','company_admin','manager','agent','viewer');
CREATE TYPE public.company_status AS ENUM ('active','suspended','trial','cancelled');
CREATE TYPE public.message_status AS ENUM ('queued','sending','sent','delivered','failed','undelivered','read');
CREATE TYPE public.message_channel AS ENUM ('sms','whatsapp');
CREATE TYPE public.campaign_status AS ENUM ('draft','scheduled','running','paused','completed','cancelled','failed');
CREATE TYPE public.recharge_status AS ENUM ('pending','completed','failed','refunded');
CREATE TYPE public.transaction_type AS ENUM ('credit','debit','refund','adjustment');
CREATE TYPE public.invoice_status AS ENUM ('draft','issued','paid','overdue','cancelled');
CREATE TYPE public.notification_severity AS ENUM ('info','success','warning','error');
CREATE TYPE public.provider_kind AS ENUM ('sms','whatsapp');
CREATE TYPE public.template_kind AS ENUM ('sms','whatsapp','email');
CREATE TYPE public.nova_role AS ENUM ('user','assistant','system','tool');

-- =========================================================================
-- UTILITY: updated_at trigger
-- =========================================================================
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =========================================================================
-- COMPANIES (tenants)
-- =========================================================================
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tax_id TEXT,
  status public.company_status NOT NULL DEFAULT 'trial',
  plan_code TEXT,
  balance NUMERIC(14,4) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  logo_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================================
-- PROFILES (1:1 with auth.users)
-- =========================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  locale TEXT DEFAULT 'es',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- =========================================================================
-- USER ROLES (global RBAC) + COMPANY MEMBERSHIP (per-tenant RBAC)
-- =========================================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);

CREATE TABLE public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'agent',
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (company_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_members TO authenticated;
GRANT ALL ON public.company_members TO service_role;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_company_members_user ON public.company_members(user_id);
CREATE INDEX idx_company_members_company ON public.company_members(company_id);

-- =========================================================================
-- FINE-GRAINED PERMISSIONS
-- =========================================================================
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  module TEXT NOT NULL,
  description TEXT
);
GRANT SELECT ON public.permissions TO authenticated;
GRANT ALL ON public.permissions TO service_role;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  UNIQUE (role, permission_id)
);
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- SECURITY DEFINER FUNCTIONS (avoid recursive RLS)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin');
$$;

CREATE OR REPLACE FUNCTION public.is_company_member(_user_id UUID, _company_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = _user_id AND company_id = _company_id AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.has_company_role(_user_id UUID, _company_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = _user_id AND company_id = _company_id AND role = _role AND is_active = true
  );
$$;

-- =========================================================================
-- BASE POLICIES
-- =========================================================================
CREATE POLICY "profiles_self_read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_super_admin(auth.uid()));
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_super_admin_all" ON public.profiles FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "user_roles_self_read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE POLICY "companies_members_read" ON public.companies FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), id) OR public.is_super_admin(auth.uid()));
CREATE POLICY "companies_admin_write" ON public.companies FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "company_members_read" ON public.company_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()));
CREATE POLICY "company_members_admin_write" ON public.company_members FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR public.has_company_role(auth.uid(), company_id, 'company_admin'))
  WITH CHECK (public.is_super_admin(auth.uid()) OR public.has_company_role(auth.uid(), company_id, 'company_admin'));

CREATE POLICY "permissions_read_all" ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "role_permissions_read_all" ON public.role_permissions FOR SELECT TO authenticated USING (true);

-- =========================================================================
-- SETTINGS ENGINE (global or per-company)
-- =========================================================================
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  namespace TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, namespace, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT SELECT ON public.settings TO anon;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_settings_lookup ON public.settings(namespace, key);
CREATE INDEX idx_settings_company ON public.settings(company_id);
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE POLICY "settings_public_read" ON public.settings FOR SELECT TO anon USING (is_public = true AND company_id IS NULL);
CREATE POLICY "settings_auth_read" ON public.settings FOR SELECT TO authenticated
  USING (
    is_public = true
    OR public.is_super_admin(auth.uid())
    OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id))
  );
CREATE POLICY "settings_super_admin_write" ON public.settings FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "settings_company_admin_write" ON public.settings FOR ALL TO authenticated
  USING (company_id IS NOT NULL AND public.has_company_role(auth.uid(), company_id, 'company_admin'))
  WITH CHECK (company_id IS NOT NULL AND public.has_company_role(auth.uid(), company_id, 'company_admin'));

-- =========================================================================
-- FEATURE FLAGS
-- =========================================================================
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  description TEXT,
  enabled_globally BOOLEAN NOT NULL DEFAULT false,
  rollout_percentage SMALLINT NOT NULL DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
  target_companies UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.feature_flags TO authenticated;
GRANT ALL ON public.feature_flags TO service_role;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_ff_updated BEFORE UPDATE ON public.feature_flags FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "ff_read_all_auth" ON public.feature_flags FOR SELECT TO authenticated USING (true);
CREATE POLICY "ff_super_admin_write" ON public.feature_flags FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- =========================================================================
-- PROVIDERS
-- =========================================================================
CREATE TABLE public.sms_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority INT NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sms_providers TO authenticated;
GRANT ALL ON public.sms_providers TO service_role;
ALTER TABLE public.sms_providers ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_sms_providers_company ON public.sms_providers(company_id);
CREATE TRIGGER trg_smsp_updated BEFORE UPDATE ON public.sms_providers FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "smsp_super" ON public.sms_providers FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "smsp_company_read" ON public.sms_providers FOR SELECT TO authenticated
  USING (company_id IS NULL OR public.is_company_member(auth.uid(), company_id));

CREATE TABLE public.whatsapp_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority INT NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_providers TO authenticated;
GRANT ALL ON public.whatsapp_providers TO service_role;
ALTER TABLE public.whatsapp_providers ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_wa_providers_company ON public.whatsapp_providers(company_id);
CREATE TRIGGER trg_wap_updated BEFORE UPDATE ON public.whatsapp_providers FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "wap_super" ON public.whatsapp_providers FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "wap_company_read" ON public.whatsapp_providers FOR SELECT TO authenticated
  USING (company_id IS NULL OR public.is_company_member(auth.uid(), company_id));

-- =========================================================================
-- CONTACTS & GROUPS (CRM)
-- =========================================================================
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  country_code TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  opt_in BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, phone)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_contacts_company ON public.contacts(company_id);
CREATE INDEX idx_contacts_phone ON public.contacts(company_id, phone);
CREATE TRIGGER trg_contacts_updated BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "contacts_tenant" ON public.contacts FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()));

CREATE TABLE public.contact_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_groups TO authenticated;
GRANT ALL ON public.contact_groups TO service_role;
ALTER TABLE public.contact_groups ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_contact_groups_company ON public.contact_groups(company_id);
CREATE TRIGGER trg_cg_updated BEFORE UPDATE ON public.contact_groups FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "cg_tenant" ON public.contact_groups FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()));

CREATE TABLE public.contact_group_members (
  group_id UUID NOT NULL REFERENCES public.contact_groups(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, contact_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_group_members TO authenticated;
GRANT ALL ON public.contact_group_members TO service_role;
ALTER TABLE public.contact_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cgm_tenant" ON public.contact_group_members FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.contact_groups g WHERE g.id = group_id
    AND (public.is_company_member(auth.uid(), g.company_id) OR public.is_super_admin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.contact_groups g WHERE g.id = group_id
    AND (public.is_company_member(auth.uid(), g.company_id) OR public.is_super_admin(auth.uid()))));

-- =========================================================================
-- TEMPLATES
-- =========================================================================
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind public.template_kind NOT NULL DEFAULT 'sms',
  language TEXT DEFAULT 'es',
  content TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.templates TO authenticated;
GRANT ALL ON public.templates TO service_role;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_templates_company ON public.templates(company_id);
CREATE TRIGGER trg_tpl_updated BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "tpl_tenant" ON public.templates FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()));

-- =========================================================================
-- CAMPAIGNS
-- =========================================================================
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel public.message_channel NOT NULL DEFAULT 'sms',
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  message_body TEXT,
  status public.campaign_status NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  total_recipients INT NOT NULL DEFAULT 0,
  total_sent INT NOT NULL DEFAULT 0,
  total_delivered INT NOT NULL DEFAULT 0,
  total_failed INT NOT NULL DEFAULT 0,
  cost NUMERIC(14,4) NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_campaigns_company ON public.campaigns(company_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
CREATE TRIGGER trg_camp_updated BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "camp_tenant" ON public.campaigns FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()));

CREATE TABLE public.campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  status public.message_status NOT NULL DEFAULT 'queued',
  variables JSONB NOT NULL DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_code TEXT,
  cost NUMERIC(14,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_recipients TO authenticated;
GRANT ALL ON public.campaign_recipients TO service_role;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_camp_recipients_campaign ON public.campaign_recipients(campaign_id);
CREATE INDEX idx_camp_recipients_status ON public.campaign_recipients(campaign_id, status);
CREATE POLICY "campr_tenant" ON public.campaign_recipients FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id
    AND (public.is_company_member(auth.uid(), c.company_id) OR public.is_super_admin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id
    AND (public.is_company_member(auth.uid(), c.company_id) OR public.is_super_admin(auth.uid()))));

-- =========================================================================
-- SMS / WHATSAPP MESSAGES
-- =========================================================================
CREATE TABLE public.sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES public.sms_providers(id) ON DELETE SET NULL,
  to_phone TEXT NOT NULL,
  from_sender TEXT,
  body TEXT NOT NULL,
  encoding TEXT DEFAULT 'GSM7',
  segments INT NOT NULL DEFAULT 1,
  status public.message_status NOT NULL DEFAULT 'queued',
  external_id TEXT,
  cost NUMERIC(14,4) NOT NULL DEFAULT 0,
  error_code TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sms_messages TO authenticated;
GRANT ALL ON public.sms_messages TO service_role;
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_sms_company ON public.sms_messages(company_id);
CREATE INDEX idx_sms_status ON public.sms_messages(company_id, status);
CREATE INDEX idx_sms_created ON public.sms_messages(company_id, created_at DESC);
CREATE POLICY "sms_tenant" ON public.sms_messages FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()));

CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES public.whatsapp_providers(id) ON DELETE SET NULL,
  to_phone TEXT NOT NULL,
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  body TEXT,
  media_url TEXT,
  status public.message_status NOT NULL DEFAULT 'queued',
  external_id TEXT,
  cost NUMERIC(14,4) NOT NULL DEFAULT 0,
  error_code TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_wa_company ON public.whatsapp_messages(company_id);
CREATE INDEX idx_wa_status ON public.whatsapp_messages(company_id, status);
CREATE POLICY "wa_tenant" ON public.whatsapp_messages FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()));

-- =========================================================================
-- BILLING: RECHARGES, TRANSACTIONS, INVOICES
-- =========================================================================
CREATE TABLE public.recharges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  amount NUMERIC(14,4) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status public.recharge_status NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  payment_reference TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recharges TO authenticated;
GRANT ALL ON public.recharges TO service_role;
ALTER TABLE public.recharges ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_recharges_company ON public.recharges(company_id);
CREATE POLICY "recharges_tenant" ON public.recharges FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()));

CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type public.transaction_type NOT NULL,
  amount NUMERIC(14,4) NOT NULL,
  balance_after NUMERIC(14,4),
  currency TEXT NOT NULL DEFAULT 'USD',
  reference TEXT,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_txs_company ON public.transactions(company_id, created_at DESC);
CREATE POLICY "txs_tenant" ON public.transactions FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()));

CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  status public.invoice_status NOT NULL DEFAULT 'draft',
  subtotal NUMERIC(14,4) NOT NULL DEFAULT 0,
  tax NUMERIC(14,4) NOT NULL DEFAULT 0,
  total NUMERIC(14,4) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  issued_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  pdf_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_invoices_company ON public.invoices(company_id, created_at DESC);
CREATE TRIGGER trg_inv_updated BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "inv_tenant" ON public.invoices FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()));

-- =========================================================================
-- NOTIFICATIONS
-- =========================================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  severity public.notification_severity NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_notifs_user ON public.notifications(user_id, created_at DESC);
CREATE POLICY "notifs_user" ON public.notifications FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

-- =========================================================================
-- AUDIT + SYSTEM LOGS
-- =========================================================================
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  ip INET,
  user_agent TEXT,
  before JSONB,
  after JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_audit_company ON public.audit_logs(company_id, created_at DESC);
CREATE INDEX idx_audit_user ON public.audit_logs(user_id, created_at DESC);
CREATE POLICY "audit_read_tenant" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid())
    OR (company_id IS NOT NULL AND public.has_company_role(auth.uid(), company_id, 'company_admin')));
CREATE POLICY "audit_insert_any_auth" ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE TABLE public.system_logs (
  id BIGSERIAL PRIMARY KEY,
  level TEXT NOT NULL,
  source TEXT,
  message TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.system_logs TO authenticated;
GRANT ALL ON public.system_logs TO service_role;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_syslog_created ON public.system_logs(created_at DESC);
CREATE POLICY "syslog_super_read" ON public.system_logs FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- =========================================================================
-- API KEYS + WEBHOOKS
-- =========================================================================
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_apikeys_company ON public.api_keys(company_id);
CREATE POLICY "apikeys_tenant" ON public.api_keys FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()));

CREATE TABLE public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  secret TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  failure_count INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhooks TO authenticated;
GRANT ALL ON public.webhooks TO service_role;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_webhooks_company ON public.webhooks(company_id);
CREATE TRIGGER trg_wh_updated BEFORE UPDATE ON public.webhooks FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "wh_tenant" ON public.webhooks FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()));

-- =========================================================================
-- CNM NOVA (AI)
-- =========================================================================
CREATE TABLE public.nova_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  model TEXT,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nova_conversations TO authenticated;
GRANT ALL ON public.nova_conversations TO service_role;
ALTER TABLE public.nova_conversations ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_nova_conv_user ON public.nova_conversations(user_id, created_at DESC);
CREATE TRIGGER trg_novaconv_updated BEFORE UPDATE ON public.nova_conversations FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "novaconv_owner" ON public.nova_conversations FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

CREATE TABLE public.nova_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.nova_conversations(id) ON DELETE CASCADE,
  role public.nova_role NOT NULL,
  content TEXT NOT NULL,
  tokens_input INT,
  tokens_output INT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nova_messages TO authenticated;
GRANT ALL ON public.nova_messages TO service_role;
ALTER TABLE public.nova_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_nova_msg_conv ON public.nova_messages(conversation_id, created_at);
CREATE POLICY "novamsg_owner" ON public.nova_messages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nova_conversations c WHERE c.id = conversation_id
    AND (c.user_id = auth.uid() OR public.is_super_admin(auth.uid()))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.nova_conversations c WHERE c.id = conversation_id
    AND (c.user_id = auth.uid() OR public.is_super_admin(auth.uid()))));

-- =========================================================================
-- AUTO PROFILE ON SIGN-UP
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
