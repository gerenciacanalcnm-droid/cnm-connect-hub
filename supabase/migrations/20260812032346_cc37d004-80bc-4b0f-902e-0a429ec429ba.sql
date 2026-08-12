-- Create WhatsApp consumption type enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_consumption_type') THEN
        CREATE TYPE public.whatsapp_consumption_type AS ENUM ('individual', 'bulk', 'campaign', 'automation');
    END IF;
END $$;

-- Add consumption_type to whatsapp_messages
ALTER TABLE public.whatsapp_messages 
ADD COLUMN IF NOT EXISTS consumption_type public.whatsapp_consumption_type DEFAULT 'individual';

-- Create WhatsApp limits table
CREATE TABLE IF NOT EXISTS public.whatsapp_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    monthly_limit INTEGER,
    daily_limit INTEGER,
    hourly_limit INTEGER,
    campaign_limit INTEGER,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id)
);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_limits TO authenticated;
GRANT ALL ON public.whatsapp_limits TO service_role;

-- Enable RLS
ALTER TABLE public.whatsapp_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Super admins can manage all limits"
ON public.whatsapp_limits
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Companies can read their own limits"
ON public.whatsapp_limits
FOR SELECT
TO authenticated
USING (company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1));

-- Function to check limits
CREATE OR REPLACE FUNCTION public.check_whatsapp_limits(_company_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_limits RECORD;
    v_monthly_count INTEGER;
    v_daily_count INTEGER;
    v_hourly_count INTEGER;
    v_res JSONB;
BEGIN
    -- 1. Get limits
    SELECT * INTO v_limits FROM public.whatsapp_limits WHERE company_id = _company_id AND is_active = true;
    
    -- If no limits or inactive, return allowed
    IF NOT FOUND THEN
        RETURN jsonb_build_object('allowed', true);
    END IF;

    -- 2. Check Monthly
    IF v_limits.monthly_limit IS NOT NULL THEN
        SELECT COUNT(*) INTO v_monthly_count 
        FROM public.whatsapp_messages 
        WHERE company_id = _company_id 
          AND created_at >= date_trunc('month', now());
          
        IF v_monthly_count >= v_limits.monthly_limit THEN
            RETURN jsonb_build_object('allowed', false, 'reason', 'monthly_limit', 'limit', v_limits.monthly_limit, 'current', v_monthly_count);
        END IF;
    END IF;

    -- 3. Check Daily
    IF v_limits.daily_limit IS NOT NULL THEN
        SELECT COUNT(*) INTO v_daily_count 
        FROM public.whatsapp_messages 
        WHERE company_id = _company_id 
          AND created_at >= date_trunc('day', now());
          
        IF v_daily_count >= v_limits.daily_limit THEN
            RETURN jsonb_build_object('allowed', false, 'reason', 'daily_limit', 'limit', v_limits.daily_limit, 'current', v_daily_count);
        END IF;
    END IF;

    -- 4. Check Hourly
    IF v_limits.hourly_limit IS NOT NULL THEN
        SELECT COUNT(*) INTO v_hourly_count 
        FROM public.whatsapp_messages 
        WHERE company_id = _company_id 
          AND created_at >= now() - interval '1 hour';
          
        IF v_hourly_count >= v_limits.hourly_limit THEN
            RETURN jsonb_build_object('allowed', false, 'reason', 'hourly_limit', 'limit', v_limits.hourly_limit, 'current', v_hourly_count);
        END IF;
    END IF;

    RETURN jsonb_build_object('allowed', true);
END;
$$;
