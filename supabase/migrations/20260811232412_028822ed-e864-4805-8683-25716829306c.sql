INSERT INTO public.wallets (company_id, channel, balance, credits, currency, status) 
VALUES ('00000000-0000-4000-8000-000000000001', 'whatsapp', 1500.00, 0, 'COP', 'active')
ON CONFLICT (company_id, channel) DO UPDATE SET balance = 1500.00;