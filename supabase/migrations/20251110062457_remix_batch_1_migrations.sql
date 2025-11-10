
-- Migration: 20251110055220

-- Migration: 20251110035633

-- Migration: 20251110032136
-- Create API settings table
CREATE TABLE IF NOT EXISTS public.api_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Facebook settings
  facebook_access_token TEXT,
  facebook_ad_account_id TEXT,
  facebook_app_id TEXT,
  facebook_app_secret TEXT,
  
  -- Shiprocket settings
  shiprocket_email TEXT,
  shiprocket_password TEXT,
  
  -- Shopify settings
  shopify_store_url TEXT,
  shopify_access_token TEXT,
  
  -- Fee settings
  payment_gateway_enabled BOOLEAN DEFAULT true,
  payment_gateway_fee NUMERIC(5,2) DEFAULT 2.00,
  cod_remittance_fee NUMERIC(10,2) DEFAULT 0.49,
  
  -- Marketer settings
  marketer_enabled BOOLEAN DEFAULT false,
  marketer_type TEXT CHECK (marketer_type IN ('percentage', 'fixed')),
  marketer_value NUMERIC(10,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.api_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own settings
CREATE POLICY "Users can view own settings"
  ON public.api_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert own settings"
  ON public.api_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update own settings"
  ON public.api_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER api_settings_updated_at
  BEFORE UPDATE ON public.api_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Migration: 20251110032145
-- Fix the function with proper search_path
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER api_settings_updated_at
  BEFORE UPDATE ON public.api_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Migration: 20251110032920
-- Add footer text fields to api_settings
ALTER TABLE public.api_settings
ADD COLUMN IF NOT EXISTS footer_text TEXT DEFAULT 'Built with 💪 by',
ADD COLUMN IF NOT EXISTS footer_names TEXT DEFAULT 'Mohit Jangir & Jainendra Bhati';


-- Migration: 20251110043638
-- Trigger types regeneration by adding a comment
COMMENT ON TABLE public.api_settings IS 'Stores API configuration and credentials for each user';

