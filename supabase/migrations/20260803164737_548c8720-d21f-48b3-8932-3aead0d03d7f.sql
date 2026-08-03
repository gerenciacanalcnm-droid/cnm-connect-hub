CREATE EXTENSION IF NOT EXISTS vector;

-- ═══════════ DOCUMENTS ═══════════
CREATE TABLE public.nova_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'documentacion',
  source_type text NOT NULL DEFAULT 'file',
  mime_type text,
  storage_path text,
  source_url text,
  size_bytes bigint NOT NULL DEFAULT 0,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  error text,
  chunk_count integer NOT NULL DEFAULT 0,
  token_count integer NOT NULL DEFAULT 0,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nova_documents TO authenticated;
GRANT ALL ON public.nova_documents TO service_role;
ALTER TABLE public.nova_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nova_docs_read" ON public.nova_documents FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id)));
CREATE POLICY "nova_docs_write" ON public.nova_documents FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR (company_id IS NOT NULL AND public.has_company_role(auth.uid(), company_id, 'company_admin'::app_role)))
  WITH CHECK (public.is_super_admin(auth.uid()) OR (company_id IS NOT NULL AND public.has_company_role(auth.uid(), company_id, 'company_admin'::app_role)));
CREATE TRIGGER trg_nova_docs_updated BEFORE UPDATE ON public.nova_documents
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ═══════════ CHUNKS ═══════════
CREATE TABLE public.nova_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.nova_documents(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL DEFAULT 0,
  content text NOT NULL,
  token_count integer NOT NULL DEFAULT 0,
  embedding vector(1536),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nova_chunks TO authenticated;
GRANT ALL ON public.nova_chunks TO service_role;
ALTER TABLE public.nova_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nova_chunks_read" ON public.nova_chunks FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id)));
CREATE POLICY "nova_chunks_write" ON public.nova_chunks FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR (company_id IS NOT NULL AND public.has_company_role(auth.uid(), company_id, 'company_admin'::app_role)))
  WITH CHECK (public.is_super_admin(auth.uid()) OR (company_id IS NOT NULL AND public.has_company_role(auth.uid(), company_id, 'company_admin'::app_role)));
CREATE INDEX nova_chunks_doc_idx ON public.nova_chunks(document_id);
CREATE INDEX nova_chunks_embedding_idx ON public.nova_chunks USING hnsw (embedding vector_cosine_ops);

CREATE OR REPLACE FUNCTION public.match_nova_chunks(
  query_embedding vector(1536),
  match_company_id uuid,
  match_count integer DEFAULT 6
)
RETURNS TABLE (id uuid, document_id uuid, content text, similarity double precision)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT c.id, c.document_id, c.content, 1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.nova_chunks c
  JOIN public.nova_documents d ON d.id = c.document_id
  WHERE c.embedding IS NOT NULL
    AND d.status = 'ready'
    AND (c.company_id = match_company_id OR c.company_id IS NULL)
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;
REVOKE ALL ON FUNCTION public.match_nova_chunks(vector, uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.match_nova_chunks(vector, uuid, integer) TO authenticated, service_role;

-- ═══════════ PROMPTS ═══════════
CREATE TABLE public.nova_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  key text NOT NULL,
  name text NOT NULL,
  description text,
  content text NOT NULL DEFAULT '',
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX nova_prompts_scope_key ON public.nova_prompts (COALESCE(company_id, '00000000-0000-0000-0000-000000000000'::uuid), key);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nova_prompts TO authenticated;
GRANT ALL ON public.nova_prompts TO service_role;
ALTER TABLE public.nova_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nova_prompts_read" ON public.nova_prompts FOR SELECT TO authenticated
  USING (company_id IS NULL OR public.is_super_admin(auth.uid()) OR public.is_company_member(auth.uid(), company_id));
CREATE POLICY "nova_prompts_write" ON public.nova_prompts FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR (company_id IS NOT NULL AND public.has_company_role(auth.uid(), company_id, 'company_admin'::app_role)))
  WITH CHECK (public.is_super_admin(auth.uid()) OR (company_id IS NOT NULL AND public.has_company_role(auth.uid(), company_id, 'company_admin'::app_role)));
CREATE TRIGGER trg_nova_prompts_updated BEFORE UPDATE ON public.nova_prompts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE public.nova_prompt_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id uuid NOT NULL REFERENCES public.nova_prompts(id) ON DELETE CASCADE,
  version integer NOT NULL,
  content text NOT NULL,
  note text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.nova_prompt_versions TO authenticated;
GRANT ALL ON public.nova_prompt_versions TO service_role;
ALTER TABLE public.nova_prompt_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nova_prompt_versions_read" ON public.nova_prompt_versions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.nova_prompts p WHERE p.id = prompt_id
    AND (p.company_id IS NULL OR public.is_super_admin(auth.uid()) OR public.is_company_member(auth.uid(), p.company_id))));
CREATE POLICY "nova_prompt_versions_write" ON public.nova_prompt_versions FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()) OR EXISTS (SELECT 1 FROM public.nova_prompts p WHERE p.id = prompt_id
    AND p.company_id IS NOT NULL AND public.has_company_role(auth.uid(), p.company_id, 'company_admin'::app_role)));
CREATE INDEX nova_prompt_versions_prompt_idx ON public.nova_prompt_versions(prompt_id, version DESC);

-- ═══════════ TOOLS ═══════════
CREATE TABLE public.nova_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'consulta',
  required_permission text,
  min_role app_role NOT NULL DEFAULT 'viewer',
  is_enabled boolean NOT NULL DEFAULT true,
  is_ready boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.nova_tools TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.nova_tools TO authenticated;
GRANT ALL ON public.nova_tools TO service_role;
ALTER TABLE public.nova_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nova_tools_read" ON public.nova_tools FOR SELECT TO authenticated USING (true);
CREATE POLICY "nova_tools_write" ON public.nova_tools FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER trg_nova_tools_updated BEFORE UPDATE ON public.nova_tools
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ═══════════ AI LOGS ═══════════
CREATE TABLE public.nova_ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES public.nova_conversations(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'lovable',
  model text NOT NULL,
  prompt text NOT NULL DEFAULT '',
  response text NOT NULL DEFAULT '',
  tokens_input integer NOT NULL DEFAULT 0,
  tokens_output integer NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  latency_ms integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'success',
  error text,
  tool_calls jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.nova_ai_logs TO authenticated;
GRANT ALL ON public.nova_ai_logs TO service_role;
ALTER TABLE public.nova_ai_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nova_logs_read" ON public.nova_ai_logs FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR user_id = auth.uid() OR (company_id IS NOT NULL AND public.has_company_role(auth.uid(), company_id, 'company_admin'::app_role)));
CREATE POLICY "nova_logs_insert" ON public.nova_ai_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE INDEX nova_ai_logs_created_idx ON public.nova_ai_logs(created_at DESC);

-- ═══════════ MEMORY ═══════════
CREATE TABLE public.nova_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL DEFAULT 'user',
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX nova_memory_unique ON public.nova_memory (
  scope,
  COALESCE(company_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid),
  key
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.nova_memory TO authenticated;
GRANT ALL ON public.nova_memory TO service_role;
ALTER TABLE public.nova_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nova_memory_read" ON public.nova_memory FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()) OR user_id = auth.uid() OR (company_id IS NOT NULL AND public.is_company_member(auth.uid(), company_id)));
CREATE POLICY "nova_memory_write" ON public.nova_memory FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()) OR user_id = auth.uid() OR (company_id IS NOT NULL AND public.has_company_role(auth.uid(), company_id, 'company_admin'::app_role)))
  WITH CHECK (public.is_super_admin(auth.uid()) OR user_id = auth.uid() OR (company_id IS NOT NULL AND public.has_company_role(auth.uid(), company_id, 'company_admin'::app_role)));
CREATE TRIGGER trg_nova_memory_updated BEFORE UPDATE ON public.nova_memory
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ═══════════ CONVERSATIONS: favoritos ═══════════
ALTER TABLE public.nova_conversations ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;
ALTER TABLE public.nova_conversations ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- ═══════════ SEED: configuración IA ═══════════
INSERT INTO public.settings (company_id, namespace, key, value, is_public)
VALUES
  (NULL, 'nova', 'engine', jsonb_build_object(
    'provider', 'lovable',
    'model', 'google/gemini-3.6-flash',
    'embeddingModel', 'openai/text-embedding-3-small',
    'temperature', 0.4,
    'maxTokens', 1500,
    'timeout', 45,
    'retries', 2,
    'ragEnabled', true,
    'ragTopK', 6,
    'toolsEnabled', true
  ), false),
  (NULL, 'nova', 'limits', jsonb_build_object(
    'dailyRequests', 500,
    'monthlyRequests', 10000,
    'dailyCost', 20,
    'monthlyCost', 400,
    'currency', 'USD'
  ), false),
  (NULL, 'nova', 'permissions', jsonb_build_object(
    'useAi', ARRAY['super_admin','company_admin','manager','agent'],
    'knowledgeBase', ARRAY['super_admin','company_admin'],
    'tools', ARRAY['super_admin','company_admin','manager'],
    'upload', ARRAY['super_admin','company_admin'],
    'administration', ARRAY['super_admin']
  ), false)
ON CONFLICT (company_id, namespace, key) DO NOTHING;

-- ═══════════ SEED: prompts ═══════════
INSERT INTO public.nova_prompts (company_id, key, name, description, content) VALUES
  (NULL, 'system', 'Prompt Sistema', 'Identidad y reglas base de CNM Nova.', 'Eres CNM Nova, el copiloto de inteligencia artificial de la plataforma SMS CNM. Respondes en español, de forma breve, profesional y accionable. Usas las herramientas disponibles para consultar datos reales antes de responder cifras. Nunca inventas datos ni credenciales.'),
  (NULL, 'company', 'Prompt Empresa', 'Contexto de la empresa activa.', 'Estás asistiendo a un equipo que gestiona campañas de SMS y WhatsApp en Colombia. Considera la moneda COP, el huso horario America/Bogota y la normativa local de mensajería.'),
  (NULL, 'user', 'Prompt Usuario', 'Ajustes de tono para el usuario final.', 'Adapta el nivel de detalle al perfil del usuario. Si pide un resumen, entrega máximo 5 puntos.'),
  (NULL, 'commercial', 'Prompt Comercial', 'Asesoría comercial y de planes.', 'Cuando el usuario pregunte por precios, planes o recargas, consulta las tarifas reales de la plataforma y explica el ahorro por volumen sin prometer descuentos no publicados.'),
  (NULL, 'crm', 'Prompt CRM', 'Asistencia sobre contactos y oportunidades.', 'Al hablar de CRM, prioriza segmentación, higiene de la base de contactos y siguientes pasos concretos para cada oportunidad.'),
  (NULL, 'sms', 'Prompt SMS', 'Redacción y optimización de SMS.', 'Al redactar SMS respeta 160 caracteres GSM-7, incluye un llamado a la acción claro y la opción de baja cuando sea obligatoria.'),
  (NULL, 'whatsapp', 'Prompt WhatsApp', 'Redacción de plantillas WhatsApp.', 'Al redactar mensajes de WhatsApp usa un tono conversacional, variables entre llaves y respeta las políticas de plantillas de Meta.'),
  (NULL, 'landing', 'Prompt Landing', 'Generación de copy para la landing.', 'Al generar copy de marketing usa un tono enterprise, claro y sin superlativos vacíos. Máximo dos frases por bloque.')
ON CONFLICT DO NOTHING;

INSERT INTO public.nova_prompt_versions (prompt_id, version, content, note)
SELECT id, 1, content, 'Versión inicial' FROM public.nova_prompts;

-- ═══════════ SEED: herramientas ═══════════
INSERT INTO public.nova_tools (code, name, description, category, required_permission, min_role, is_enabled, is_ready) VALUES
  ('get_sms_balance', 'Consultar saldo SMS', 'Devuelve el saldo disponible y la moneda de la empresa activa.', 'consulta', 'billing.read', 'viewer', true, true),
  ('get_campaigns', 'Consultar campañas', 'Lista las campañas recientes con su estado y métricas.', 'consulta', 'campaigns.read', 'viewer', true, true),
  ('get_contacts', 'Consultar contactos', 'Busca contactos por nombre, teléfono o etiqueta.', 'consulta', 'contacts.read', 'viewer', true, true),
  ('get_crm', 'Consultar CRM', 'Resume oportunidades y grupos de contactos.', 'consulta', 'crm.read', 'viewer', true, true),
  ('get_dashboard', 'Consultar Dashboard', 'Devuelve los KPIs globales de la plataforma.', 'consulta', 'dashboard.read', 'viewer', true, true),
  ('create_contact', 'Crear contacto', 'Crea un contacto nuevo en la base de la empresa.', 'accion', 'contacts.write', 'agent', true, true),
  ('create_campaign', 'Crear campaña', 'Crea una campaña en estado borrador.', 'accion', 'campaigns.write', 'manager', true, true),
  ('generate_report', 'Generar reporte', 'Genera un resumen analítico del periodo indicado.', 'analitica', 'analytics.read', 'viewer', true, true),
  ('search_conversation', 'Buscar conversación', 'Busca en el historial de conversaciones de Nova.', 'consulta', 'nova.read', 'viewer', true, true),
  ('search_invoice', 'Buscar factura', 'Busca facturas por número o estado.', 'consulta', 'billing.read', 'viewer', true, true),
  ('search_recharge', 'Buscar recarga', 'Busca recargas por estado o referencia.', 'consulta', 'billing.read', 'viewer', true, true),
  ('send_sms', 'Enviar SMS', 'Envía un SMS. Pendiente de la integración con el proveedor.', 'accion', 'sms.send', 'manager', false, false),
  ('send_whatsapp', 'Enviar WhatsApp', 'Envía un WhatsApp. Pendiente de la integración con el proveedor.', 'accion', 'whatsapp.send', 'manager', false, false)
ON CONFLICT (code) DO NOTHING;