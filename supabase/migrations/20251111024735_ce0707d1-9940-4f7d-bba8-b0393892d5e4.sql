-- Create API cache table with TTL
CREATE TABLE IF NOT EXISTS public.api_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cache_key TEXT NOT NULL,
  cache_data JSONB NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, cache_key)
);

-- Enable RLS
ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own cache"
ON public.api_cache FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cache"
ON public.api_cache FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cache"
ON public.api_cache FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cache"
ON public.api_cache FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_api_cache_user_key ON public.api_cache(user_id, cache_key);
CREATE INDEX idx_api_cache_expires ON public.api_cache(expires_at);

-- Create FCM configuration table
CREATE TABLE IF NOT EXISTS public.fcm_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  firebase_project_id TEXT,
  firebase_server_key TEXT,
  firebase_sender_id TEXT,
  firebase_vapid_key TEXT,
  firebase_service_account JSONB,
  notification_sound_url TEXT,
  enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fcm_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own FCM config"
ON public.fcm_config FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own FCM config"
ON public.fcm_config FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own FCM config"
ON public.fcm_config FOR UPDATE
USING (auth.uid() = user_id);

-- Create notification events table
CREATE TABLE IF NOT EXISTS public.notification_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
ON public.notification_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications"
ON public.notification_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notification_events FOR UPDATE
USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_notification_events_user ON public.notification_events(user_id, created_at DESC);

-- Add trigger for FCM config updates
CREATE TRIGGER update_fcm_config_updated_at
BEFORE UPDATE ON public.fcm_config
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Function to clean expired cache
CREATE OR REPLACE FUNCTION public.clean_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.api_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;