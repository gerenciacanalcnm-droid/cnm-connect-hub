-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.whatsapp_account_status AS ENUM ('disconnected','pending','connected','error','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.conversation_status AS ENUM ('open','pending','closed','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.wa_department AS ENUM ('ventas','soporte','cobranza','marketing','general');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.preferred_channel AS ENUM ('sms','whatsapp','email');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ whatsapp_accounts ============
CREATE TABLE IF NOT EXISTS public.whatsapp_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  alias text NOT NULL,
  department wa_department NOT NULL DEFAULT 'general',
  display_phone text,
  status whatsapp_account_status NOT NULL DEFAULT 'disconnected',
  is_primary boolean NOT NULL DEFAULT false,
  provider text NOT NULL DEFAULT 'meta_cloud',
  -- Meta Embedded Signup (rellenado automáticamente en el futuro)
  business_account_id text,
  phone_number_id text,
  waba_name text,
  quality_rating text,
  verified_name text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  webhook_url text,
  webhook_verify_token text,
  webhook_secret text,
  last_synced_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wa_accounts_company ON public.whatsapp_accounts(company_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_accounts TO authenticated;
GRANT ALL ON public.whatsapp_accounts TO service_role;
ALTER TABLE public.whatsapp_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wa_accounts_select" ON public.whatsapp_accounts FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()));
CREATE POLICY "wa_accounts_write" ON public.whatsapp_accounts FOR ALL TO authenticated
  USING (public.has_company_role(auth.uid(), company_id, 'company_admin') OR public.has_company_role(auth.uid(), company_id, 'manager') OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.has_company_role(auth.uid(), company_id, 'company_admin') OR public.has_company_role(auth.uid(), company_id, 'manager') OR public.is_super_admin(auth.uid()));

-- proteger tokens: no exponer columnas sensibles vía Data API
REVOKE SELECT (access_token, refresh_token, webhook_secret, webhook_verify_token) ON public.whatsapp_accounts FROM authenticated;

CREATE TRIGGER trg_wa_accounts_updated BEFORE UPDATE ON public.whatsapp_accounts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ whatsapp_templates ============
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.whatsapp_accounts(id) ON DELETE SET NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'marketing',
  language text NOT NULL DEFAULT 'es',
  header text,
  body text NOT NULL,
  footer text,
  buttons jsonb NOT NULL DEFAULT '[]'::jsonb,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'draft',
  external_id text,
  rejected_reason text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wa_templates_company ON public.whatsapp_templates(company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_templates TO authenticated;
GRANT ALL ON public.whatsapp_templates TO service_role;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wa_templates_select" ON public.whatsapp_templates FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()));
CREATE POLICY "wa_templates_write" ON public.whatsapp_templates FOR ALL TO authenticated
  USING (public.has_company_role(auth.uid(), company_id, 'company_admin') OR public.has_company_role(auth.uid(), company_id, 'manager') OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.has_company_role(auth.uid(), company_id, 'company_admin') OR public.has_company_role(auth.uid(), company_id, 'manager') OR public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_wa_templates_updated BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ whatsapp_campaigns ============
CREATE TABLE IF NOT EXISTS public.whatsapp_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.whatsapp_accounts(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.whatsapp_templates(id) ON DELETE SET NULL,
  name text NOT NULL,
  status campaign_status NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  total_recipients integer NOT NULL DEFAULT 0,
  total_sent integer NOT NULL DEFAULT 0,
  total_delivered integer NOT NULL DEFAULT 0,
  total_read integer NOT NULL DEFAULT 0,
  total_failed integer NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wa_campaigns_company ON public.whatsapp_campaigns(company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_campaigns TO authenticated;
GRANT ALL ON public.whatsapp_campaigns TO service_role;
ALTER TABLE public.whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wa_campaigns_select" ON public.whatsapp_campaigns FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()));
CREATE POLICY "wa_campaigns_write" ON public.whatsapp_campaigns FOR ALL TO authenticated
  USING (public.has_company_role(auth.uid(), company_id, 'company_admin') OR public.has_company_role(auth.uid(), company_id, 'manager') OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.has_company_role(auth.uid(), company_id, 'company_admin') OR public.has_company_role(auth.uid(), company_id, 'manager') OR public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_wa_campaigns_updated BEFORE UPDATE ON public.whatsapp_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ whatsapp_conversations ============
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.whatsapp_accounts(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  channel message_channel NOT NULL DEFAULT 'whatsapp',
  contact_phone text NOT NULL,
  contact_name text,
  status conversation_status NOT NULL DEFAULT 'open',
  assigned_to uuid REFERENCES auth.users(id),
  tags text[] NOT NULL DEFAULT '{}',
  unread_count integer NOT NULL DEFAULT 0,
  last_message_at timestamptz,
  last_message_preview text,
  external_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wa_conv_company ON public.whatsapp_conversations(company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_conversations TO authenticated;
GRANT ALL ON public.whatsapp_conversations TO service_role;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wa_conv_select" ON public.whatsapp_conversations FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()));
CREATE POLICY "wa_conv_write" ON public.whatsapp_conversations FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_wa_conv_updated BEFORE UPDATE ON public.whatsapp_conversations
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- enlazar mensajes existentes a conversaciones
ALTER TABLE public.whatsapp_messages ADD COLUMN IF NOT EXISTS conversation_id uuid REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE;
ALTER TABLE public.whatsapp_messages ADD COLUMN IF NOT EXISTS direction text NOT NULL DEFAULT 'outbound';
ALTER TABLE public.whatsapp_messages ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.whatsapp_accounts(id) ON DELETE SET NULL;

-- ============ whatsapp_media ============
CREATE TABLE IF NOT EXISTS public.whatsapp_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.whatsapp_messages(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'image',
  mime_type text,
  storage_path text,
  external_url text,
  size_bytes bigint NOT NULL DEFAULT 0,
  caption text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wa_media_company ON public.whatsapp_media(company_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_media TO authenticated;
GRANT ALL ON public.whatsapp_media TO service_role;
ALTER TABLE public.whatsapp_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wa_media_select" ON public.whatsapp_media FOR SELECT TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()));
CREATE POLICY "wa_media_write" ON public.whatsapp_media FOR ALL TO authenticated
  USING (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_company_member(auth.uid(), company_id) OR public.is_super_admin(auth.uid()));

-- ============ whatsapp_webhooks ============
CREATE TABLE IF NOT EXISTS public.whatsapp_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.whatsapp_accounts(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  signature_valid boolean,
  processed_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wa_hooks_company ON public.whatsapp_webhooks(company_id);
GRANT SELECT ON public.whatsapp_webhooks TO authenticated;
GRANT ALL ON public.whatsapp_webhooks TO service_role;
ALTER TABLE public.whatsapp_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wa_hooks_super_admin" ON public.whatsapp_webhooks FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- ============ contactos: campos omnicanal ============
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS preferred_channel preferred_channel NOT NULL DEFAULT 'sms';
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS whatsapp_phone text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS last_conversation_at timestamptz;