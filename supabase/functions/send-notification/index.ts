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

    // Get OAuth2 access token for FCM HTTP v1 API
    let accessToken = '';
    if (fcmConfig.firebase_service_account) {
      try {
        const serviceAccount = fcmConfig.firebase_service_account;
        const now = Math.floor(Date.now() / 1000);
        const jwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
        const jwtPayload = btoa(JSON.stringify({
          iss: serviceAccount.client_email,
          scope: 'https://www.googleapis.com/auth/firebase.messaging',
          aud: 'https://oauth2.googleapis.com/token',
          exp: now + 3600,
          iat: now
        }));
        
        const jwtSignature = await crypto.subtle.sign(
          'RSASSA-PKCS1-v1_5',
          await crypto.subtle.importKey(
            'pkcs8',
            new TextEncoder().encode(serviceAccount.private_key),
            { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
            false,
            ['sign']
          ),
          new TextEncoder().encode(`${jwtHeader}.${jwtPayload}`)
        );
        
        const jwt = `${jwtHeader}.${jwtPayload}.${btoa(String.fromCharCode(...new Uint8Array(jwtSignature)))}`;
        
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
        });
        
        const tokenData = await tokenResponse.json();
        accessToken = tokenData.access_token;
      } catch (error) {
        console.error('OAuth token generation failed:', error);
      }
    }

    // Send FCM notification using HTTP v1 API
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${fcmConfig.firebase_project_id}/messages:send`;
    const fcmResponse = await fetch(fcmUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token: fcmToken,
          notification: {
            title,
            body,
            image: '/icon-192.png',
          },
          android: {
            priority: 'high',
            notification: {
              sound: fcmConfig.notification_sound_url || '/notification.mp3',
              icon: '/icon-192.png',
              color: '#3B82F6',
            }
          },
          webpush: {
            notification: {
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              sound: fcmConfig.notification_sound_url || '/notification.mp3',
            },
            fcm_options: {
              link: Deno.env.get('SUPABASE_URL')?.replace('https://', 'https://app.') || '/'
            }
          },
          data: {
            eventType,
            ...eventData
          },
        }
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
