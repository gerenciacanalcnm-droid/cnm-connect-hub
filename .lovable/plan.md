# Auditoría de migración: backend actual → Supabase propio → Remix

Solo auditoría. No se ejecuta ninguna migración, ni cambios en la base actual.

## 1. Qué hay hoy en el backend (inventario real)

| Elemento | Cantidad / detalle |
|---|---|
| Tablas en `public` | 59, todas con RLS activada |
| Políticas RLS | 145 |
| Índices | 146 |
| Foreign Keys | 105 |
| Triggers propios | 38 (33 en `public`, 2 en `auth.users`, resto internos de dominio) |
| Funciones propias | 13 (`has_role`, `is_super_admin`, `is_company_member`, `has_company_role`, `handle_new_user`, `grant_super_admin_by_email`, `tg_set_updated_at`, `assign_whatsapp_account`, `unassign_whatsapp_account`, `check_whatsapp_limits`, `match_nova_chunks`, más helpers) |
| Tipos ENUM | 21 (`app_role`, `campaign_status`, `whatsapp_account_status`, etc.) |
| Extensiones | `plpgsql`, `pgcrypto`, `uuid-ossp`, `pg_stat_statements`, `supabase_vault`, `vector` (pgvector 0.8.2, usada por `nova_chunks`) |
| Realtime | Publicación `supabase_realtime` con 1 tabla: `public.notifications` |
| Usuarios Auth | 2 |
| Buckets Storage | 3 privados: `contact-imports`, `nova-knowledge`, `payment-receipts` (0 objetos actualmente) |
| Edge Functions Supabase | **Ninguna**. La lógica vive en server functions de TanStack (`src/lib/*.functions.ts`) y rutas `src/routes/api/public/*` |
| Migraciones versionadas | 42 archivos en `supabase/migrations/` |
| Secrets | `CRON_SECRET`, `LOVABLE_API_KEY`, `META_APP_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_PHONE_NUMBER_ID`, más los gestionados por la plataforma (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`). Valores no mostrados |

Datos con contenido hoy: `contacts` (21), `whatsapp_templates` (17), `plan_features` (45), `whatsapp_accounts` (1); el resto está vacío o casi vacío.

## 2. Cómo exportar cada pieza

### 2.1 Esquema completo (tablas, FKs, índices, funciones, triggers, RLS, enums)
Un solo dump lógico desde el proyecto destino/local con la cadena de conexión directa del proyecto actual:

```bash
pg_dump "$SOURCE_DB_URL" \
  --schema=public --schema=storage \
  --no-owner --no-privileges --schema-only \
  -f 01_schema.sql
```
Esto ya incluye: `CREATE TYPE` (21 enums), tablas, PK/FK (105), índices (146), funciones, triggers y `CREATE POLICY` + `ENABLE ROW LEVEL SECURITY` (145 políticas). No hay que exportarlos por separado.

Los `GRANT` se pierden con `--no-privileges`: hay que añadir manualmente en destino el bloque estándar por tabla (`GRANT ... TO authenticated / service_role / anon`).

### 2.2 Datos
```bash
pg_dump "$SOURCE_DB_URL" --schema=public --data-only \
  --disable-triggers --no-owner -f 02_data.sql
```
Alternativa por tabla si prefieres control fino: `COPY (SELECT * FROM tabla) TO STDOUT CSV HEADER`.

### 2.3 Usuarios de Auth
No se recrean con signup. Se copian las tablas del esquema `auth` (contienen los hashes bcrypt, por lo que las contraseñas siguen funcionando):
```bash
pg_dump "$SOURCE_DB_URL" --data-only \
  -t auth.users -t auth.identities -t auth.mfa_factors -t auth.sessions \
  --no-owner -f 03_auth.sql
```
Orden de restauración: `auth` antes que `public`, porque `profiles`/`user_roles` referencian `auth.users`. Con solo 2 usuarios también es viable recrearlos con la Admin API.

### 2.4 Storage
1. Crear los 3 buckets en destino con la misma privacidad (todos privados).
2. Copiar objetos con la CLI (`supabase storage cp -r ss://bucket ./local` y luego subir al destino) o un script con `storage.from(b).list()` + `download`/`upload`. Hoy hay 0 objetos, así que basta con recrear buckets y sus políticas de `storage.objects`.

### 2.5 Realtime
En destino, tras crear las tablas:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

### 2.6 Extensiones
En destino, antes del esquema:
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS vector;  -- requerida por nova_chunks / match_nova_chunks
```

### 2.7 "Edge Functions"
No existen funciones Deno que exportar. Lo que hay que portar a Remix es código de aplicación:
- `src/lib/*.functions.ts` (server functions) → `*.server.ts` / actions y loaders de Remix.
- `src/routes/api/public/whatsapp-webhook.ts`, `webhooks/wompi.ts`, `sms-scheduler.ts` → resource routes de Remix. Las URLs cambian: hay que reconfigurar el webhook en Meta, el de Wompi y el cron del scheduler.

### 2.8 Secrets
Se recrean a mano en el proyecto propio (no son exportables). Lista de nombres arriba; `LOVABLE_API_KEY` deja de servir fuera de Lovable — habrá que sustituir el AI Gateway por un proveedor propio (OpenAI/Gemini) si se usa Nova.

## 3. Qué NO se puede exportar automáticamente
- Valores de secrets (incluida la service role key y la contraseña de BD del proyecto actual).
- Configuración de Auth: proveedores OAuth (Google), plantillas de email, URLs de redirect, políticas de contraseña, SMTP.
- Configuración de la plataforma Lovable Cloud (dominio, publicación, cron interno).
- Los `GRANT` de PostgREST (se regeneran manualmente).
- Contenido de `vault` (secretos cifrados a nivel de BD, si los hubiera).
- Webhooks registrados en servicios externos (Meta, Wompi) que apuntan a las URLs actuales.

## 4. Orden de ejecución propuesto (para el sprint siguiente, no ahora)
```text
1. Crear proyecto Supabase propio + extensiones
2. Restaurar 01_schema.sql
3. Aplicar bloque de GRANTs
4. Restaurar 03_auth.sql (usuarios)
5. Restaurar 02_data.sql (public)
6. Recrear buckets + políticas de storage y copiar objetos
7. ALTER PUBLICATION supabase_realtime
8. Recrear secrets y configurar Google OAuth / SMTP
9. Verificación: conteos por tabla, login real de un usuario, prueba de RLS con usuario no admin
10. Apuntar Remix al nuevo proyecto y reconfigurar webhooks externos
```

## 5. Nota operativa importante
Desde este entorno no puedo ejecutar `pg_dump` ni volcados completos: el acceso a base de datos aquí es de solo lectura/insert y los dumps completos están deshabilitados. El export debes lanzarlo tú desde tu máquina, o bien usar **Cloud → Advanced settings → Export data** en Lovable para bajar el volcado completo. Con ese archivo yo puedo asistirte en la restauración y en el ajuste de GRANTs, RLS y código para Remix.
