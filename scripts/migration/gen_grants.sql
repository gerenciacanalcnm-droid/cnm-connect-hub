-- Genera los GRANT reales del esquema public para anon / authenticated / service_role.
-- Ejecutar contra el ORIGEN y guardar la salida; aplicar el resultado en el DESTINO
-- después de restaurar 01_schema_public.sql (pg_dump se lanza con --no-privileges).
SELECT format(
         'GRANT %s ON public.%I TO %I;',
         string_agg(ae.privilege_type, ', ' ORDER BY ae.privilege_type),
         c.relname,
         pg_get_userbyid(ae.grantee)
       )
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
CROSS JOIN LATERAL aclexplode(c.relacl) ae
WHERE c.relkind = 'r'
  AND pg_get_userbyid(ae.grantee) IN ('anon', 'authenticated', 'service_role')
GROUP BY c.relname, ae.grantee
ORDER BY c.relname, pg_get_userbyid(ae.grantee);
