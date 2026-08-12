-- Revoke execute from public and authenticated for security definer functions
-- Only super_admin should call these, and they are usually wrapped in server functions
REVOKE EXECUTE ON FUNCTION public.assign_whatsapp_account(uuid, uuid, uuid) FROM public, authenticated;
REVOKE EXECUTE ON FUNCTION public.unassign_whatsapp_account(uuid, uuid) FROM public, authenticated;

-- Grant to service_role so server functions can call them if needed via admin client
GRANT EXECUTE ON FUNCTION public.assign_whatsapp_account(uuid, uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.unassign_whatsapp_account(uuid, uuid) TO service_role;