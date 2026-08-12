# Migración: Lovable Cloud → Supabase propio → Remix

Runbook operativo. Nada de esto modifica el backend actual: todos los pasos del origen son de solo lectura.

## 0. Inventario del origen (auditado el 2026-08-12)

| Elemento | Detalle |
|---|---|
| Tablas `public` | 59, todas con RLS activada |
| Políticas RLS | 145 |
| Índices | 146 |
| Foreign Keys | 105 |
| Triggers no internos | 38 (33 en `public` + 2 en `auth.users`) |
| Funciones de negocio | `has_role`, `is_super_admin`, `is_company_member`, `has_company_role`, `handle_new_user`, `grant_super_admin_by_email`, `tg_set_updated_at`, `assign_whatsapp_account`, `unassign_whatsapp_account`, `check_whatsapp_limits`, `match_nova_chunks` |
| ENUMs | 21 |
| Extensiones | `plpgsql`, `pgcrypto`, `uuid-ossp`, `pg_stat_statements`, `supabase_vault`, `vector` 0.8.2 |
| Realtime | Solo `public.notifications` |
| Usuarios Auth | 2 |
| Buckets | `contact-imports`, `nova-knowledge`, `payment-receipts` (privados, 0 objetos) |
| Edge Functions | Ninguna (la lógica vive en TanStack server functions) |
| Migraciones | 42 archivos en `supabase/migrations/` |
| Datos con contenido | `contacts` 21 · `whatsapp_templates` 17 · `plan_features` 45 · `whatsapp_accounts` 1 |

## 1. Obtener la conexión del origen

En Lovable: **Cloud → Advanced settings → Export data**. De ahí sale el volcado completo.
Si dispones de la cadena de conexión directa, puedes usar los scripts de este repo.

> Desde el entorno del agente no es posible ejecutar `pg_dump` ni volcados completos; este paso lo lanzas tú.

## 2. Exportar

```bash
export SOURCE_DB_URL="postgresql://postgres:<pass>@<host>:5432/postgres"
bash scripts/migration/export-backend.sh ./backup
```

Genera:

| Archivo | Contenido |
|---|---|
| `01_schema_public.sql` | tablas, enums, FKs, índices, funciones, triggers, `ENABLE ROW LEVEL SECURITY` y las 145 políticas |
| `02_data_public.sql` | todos los datos de `public` |
| `03_auth.sql` | `auth.users`, `identities`, `mfa_*`, `sessions` (hashes bcrypt incluidos) |
| `04_storage_meta.sql` | `storage.buckets` y `storage.objects` |
| `05_grants.sql` | GRANTs reales de `anon` / `authenticated` / `service_role` |

Archivos binarios de Storage (hoy 0 objetos):

```bash
supabase storage cp -r ss://nova-knowledge   ./backup/storage/nova-knowledge   --experimental
supabase storage cp -r ss://contact-imports  ./backup/storage/contact-imports  --experimental
supabase storage cp -r ss://payment-receipts ./backup/storage/payment-receipts --experimental
```

## 3. Restaurar en el proyecto propio

```bash
export TARGET_DB_URL="postgresql://postgres:<pass>@<host>:5432/postgres"
bash scripts/migration/restore-backend.sh ./backup
```

Orden que aplica el script (importante: `auth` antes que `public`, porque `profiles` y `user_roles` referencian `auth.users`):

```text
extensiones → esquema public → GRANTs → usuarios auth → datos public → storage meta → post-restore
```

`99_postrestore.sql` reañade la publicación de Realtime, recrea los dos triggers de `auth.users` y imprime una tabla de conteos para comparar con el inventario del punto 0.

## 4. Configuración manual en el destino (no exportable)

1. **Secrets** — recrear por nombre: `CRON_SECRET`, `META_APP_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_PHONE_NUMBER_ID`. `LOVABLE_API_KEY` deja de funcionar fuera de Lovable: si se usa Nova, sustituir el AI Gateway por un proveedor propio.
2. **Auth** — proveedor Google (client id/secret), Site URL, redirect URLs, plantillas de email, SMTP, políticas de contraseña.
3. **Storage** — crear los 3 buckets como privados antes de restaurar `04_storage_meta.sql`, y aplicar sus políticas sobre `storage.objects`.
4. **Webhooks externos** — reapuntar Meta WhatsApp, Wompi y el cron del SMS scheduler a los nuevos dominios de la app Remix.

## 5. Portar el código a Remix

| Origen | Destino en Remix |
|---|---|
| `src/lib/*.functions.ts` (server functions) | módulos `*.server.ts` invocados desde `loader` / `action` |
| `src/integrations/supabase/auth-middleware.ts` | helper de sesión con `@supabase/ssr` en `loader`/`action` |
| `src/routes/api/public/whatsapp-webhook.ts` | resource route `app/routes/api.public.whatsapp-webhook.ts` |
| `src/routes/api/public/webhooks/wompi.ts` | resource route equivalente |
| `src/routes/api/public/sms-scheduler.ts` | resource route + cron externo con `CRON_SECRET` |
| `src/integrations/supabase/types.ts` | regenerar con `supabase gen types typescript --project-id <nuevo>` |

Variables de entorno de la app Remix: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (públicas) y `SUPABASE_SERVICE_ROLE_KEY` (solo servidor).

## 6. No exportable automáticamente

- Valores de secrets, service role key y contraseña de BD del proyecto actual.
- Configuración de Auth (OAuth, plantillas de email, SMTP, redirects).
- Configuración de plataforma Lovable (dominio, publicación, cron interno).
- Privilegios PostgREST si se usa `--no-privileges` → los cubre `05_grants.sql`.
- Contenido de `vault`.
- Registros de webhooks en Meta y Wompi.

## 7. Verificación final

1. `99_postrestore.sql` devuelve los conteos esperados (59/145/146/105/38/21/2).
2. La consulta de RLS al final devuelve 0 filas.
3. Login real con uno de los 2 usuarios migrados (misma contraseña).
4. Lectura con un usuario no super_admin: solo ve datos de su `company_id`.
5. `select count(*) from public.contacts` = 21 y `whatsapp_templates` = 17.
