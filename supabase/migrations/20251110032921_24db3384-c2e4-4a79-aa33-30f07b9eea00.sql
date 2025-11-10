-- Add footer text fields to api_settings
ALTER TABLE public.api_settings
ADD COLUMN IF NOT EXISTS footer_text TEXT DEFAULT 'Built with 💪 by',
ADD COLUMN IF NOT EXISTS footer_names TEXT DEFAULT 'Mohit Jangir & Jainendra Bhati';