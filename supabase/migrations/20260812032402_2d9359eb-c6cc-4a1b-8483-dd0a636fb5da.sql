-- Restrict execution of check_whatsapp_limits
REVOKE ALL ON FUNCTION public.check_whatsapp_limits(uuid) FROM public;
REVOKE ALL ON FUNCTION public.check_whatsapp_limits(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.check_whatsapp_limits(uuid) FROM authenticated;

-- Only service_role (server functions) can execute it
GRANT EXECUTE ON FUNCTION public.check_whatsapp_limits(uuid) TO service_role;
