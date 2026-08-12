-- Ejecutar en el DESTINO al final de la restauración.

-- 1. Realtime: en el origen solo una tabla está publicada.
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 2. Triggers sobre auth.users (pg_dump de public NO los incluye).
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_grant_super_admin ON auth.users;
CREATE TRIGGER on_auth_user_grant_super_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.grant_super_admin_by_email();

-- 3. Verificación de conteos (comparar con el origen).
SELECT 'tablas'    AS item, count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r'          -- esperado: 59
UNION ALL SELECT 'politicas', count(*) FROM pg_policies WHERE schemaname='public'   -- esperado: 145
UNION ALL SELECT 'indices',   count(*) FROM pg_indexes  WHERE schemaname='public'   -- esperado: 146
UNION ALL SELECT 'fks',       count(*) FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace
  WHERE n.nspname='public' AND c.contype='f'          -- esperado: 105
UNION ALL SELECT 'triggers',  count(*) FROM pg_trigger WHERE NOT tgisinternal        -- esperado: 38
UNION ALL SELECT 'enums',     count(DISTINCT t.typname) FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
  WHERE n.nspname='public' AND t.typtype='e'          -- esperado: 21
UNION ALL SELECT 'auth_users', count(*) FROM auth.users                              -- esperado: 2
UNION ALL SELECT 'contacts',   count(*) FROM public.contacts                         -- esperado: 21
UNION ALL SELECT 'wa_templates', count(*) FROM public.whatsapp_templates             -- esperado: 17
UNION ALL SELECT 'plan_features', count(*) FROM public.plan_features;                -- esperado: 45

-- 4. Tablas sin RLS (debe devolver 0 filas).
SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity;
