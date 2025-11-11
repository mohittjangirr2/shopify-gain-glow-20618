import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { title, body, eventType, eventData, fcmToken } = await req.json();

    // Get FCM configuration
    const { data: fcmConfig, error: configError } = await supabaseClient
      .from('fcm_config')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (configError || !fcmConfig || !fcmConfig.enabled) {
      console.log('FCM not configured or disabled');
      return new Response(
        JSON.stringify({ message: 'FCM not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log notification event
    await supabaseClient
      .from('notification_events')
      .insert({
        user_id: user.id,
        event_type: eventType,
        event_data: eventData,
        notification_sent: false
      });

    // Send FCM notification
    const fcmResponse = await fetch(`https://fcm.googleapis.com/fcm/send`, {
      method: 'POST',
      headers: {
        'Authorization': `key=${fcmConfig.firebase_server_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: fcmToken,
        notification: {
          title,
          body,
          sound: fcmConfig.notification_sound_url || 'default',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
        },
        data: {
          eventType,
          ...eventData
        },
        priority: 'high',
      })
    });

    if (!fcmResponse.ok) {
      throw new Error(`FCM API error: ${fcmResponse.statusText}`);
    }

    const result = await fcmResponse.json();

    console.log('Notification sent successfully');

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending notification:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
