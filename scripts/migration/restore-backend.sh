#!/usr/bin/env bash
# Restaura el backup en el PROYECTO SUPABASE PROPIO.
# Uso:
#   export TARGET_DB_URL="postgresql://postgres:<pass>@<host>:5432/postgres"
#   bash scripts/migration/restore-backend.sh ./backup
set -euo pipefail

IN="${1:-./backup}"
: "${TARGET_DB_URL:?Define TARGET_DB_URL con la cadena de conexión del proyecto destino}"

run() { echo "==> $1"; psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f "$2"; }

run "Extensiones"            scripts/migration/00_prereqs.sql
run "Esquema public"         "$IN/01_schema_public.sql"
run "GRANTs de la Data API"  "$IN/05_grants.sql"
run "Usuarios de Auth"       "$IN/03_auth.sql"
run "Datos de public"        "$IN/02_data_public.sql"
run "Metadatos de Storage"   "$IN/04_storage_meta.sql"
run "Post-restauración"      scripts/migration/99_postrestore.sql

echo "Restauración terminada. Revisa la tabla de conteos impresa arriba."
