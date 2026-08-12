-- Ejecutar en el PROYECTO DESTINO antes de restaurar el esquema.
-- Extensiones detectadas en el origen (además de las que Supabase trae por defecto).
CREATE EXTENSION IF NOT EXISTS pgcrypto      WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"   WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;
-- pgvector 0.8.2: la usa nova_chunks.embedding y match_nova_chunks()
CREATE EXTENSION IF NOT EXISTS vector        WITH SCHEMA public;
