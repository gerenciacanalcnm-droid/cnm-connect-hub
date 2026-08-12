-- Initial seed for SPRINT 4.2 TEST_CAMPAIGN_5
INSERT INTO public.wallets (company_id, channel, balance, credits, currency, status) 
VALUES ('00000000-0000-4000-8000-000000000001', 'whatsapp', 1500.00, 0, 'COP', 'active')
ON CONFLICT (company_id, channel) DO UPDATE SET balance = 1500.00, status = 'active';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
GRANT ALL ON public.wallets TO anon;
GRANT ALL ON public.wallets TO sandbox_exec;
