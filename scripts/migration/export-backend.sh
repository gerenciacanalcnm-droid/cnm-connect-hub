#!/usr/bin/env bash
# Exporta el backend actual a archivos SQL locales.
# Uso:
#   export SOURCE_DB_URL="postgresql://postgres:<pass>@<host>:5432/postgres"
#   bash scripts/migration/export-backend.sh ./backup
#
# Requiere pg_dump >= 15 (idealmente la misma major que el servidor).
# Este script NO modifica nada en el origen: solo lee.
set -euo pipefail

OUT="${1:-./backup}"
: "${SOURCE_DB_URL:?Define SOURCE_DB_URL con la cadena de conexión del proyecto origen}"
mkdir -p "$OUT"

echo "==> 1/5 Esquema public (tablas, enums, FKs, índices, funciones, triggers, RLS)"
pg_dump "$SOURCE_DB_URL" \
  --schema=public \
  --schema-only --no-owner --no-privileges \
  -f "$OUT/01_schema_public.sql"

echo "==> 2/5 Datos de public"
pg_dump "$SOURCE_DB_URL" \
  --schema=public \
  --data-only --no-owner --disable-triggers \
  -f "$OUT/02_data_public.sql"

echo "==> 3/5 Usuarios de Auth (hashes incluidos: las contraseñas siguen funcionando)"
pg_dump "$SOURCE_DB_URL" \
  --data-only --no-owner \
  -t auth.users -t auth.identities -t auth.mfa_factors -t auth.mfa_challenges \
  -t auth.mfa_amr_claims -t auth.sessions -t auth.refresh_tokens \
  -f "$OUT/03_auth.sql"

echo "==> 4/5 Metadatos de Storage (buckets y objetos)"
pg_dump "$SOURCE_DB_URL" \
  --data-only --no-owner \
  -t storage.buckets -t storage.objects \
  -f "$OUT/04_storage_meta.sql"

echo "==> 5/5 GRANTs de la Data API (PostgREST)"
psql "$SOURCE_DB_URL" -At -f scripts/migration/gen_grants.sql > "$OUT/05_grants.sql"

echo
echo "Backup completo en $OUT:"
ls -lh "$OUT"
echo
echo "Los ARCHIVOS de Storage no van en el dump: descárgalos aparte con"
echo "  supabase storage cp -r ss://<bucket> ./backup/storage/<bucket> --experimental"
