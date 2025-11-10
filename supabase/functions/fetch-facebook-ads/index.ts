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

    // Fetch API settings from database
    const { data: settings, error: settingsError } = await supabaseClient
      .from('api_settings')
      .select('facebook_access_token, facebook_ad_account_id, facebook_app_id, facebook_app_secret')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !settings) {
      throw new Error('Facebook API settings not configured. Please configure them in Settings.');
    }

    let accessToken = settings.facebook_access_token;
    const appId = settings.facebook_app_id;
    const appSecret = settings.facebook_app_secret;
    let adAccountId = settings.facebook_ad_account_id || '';

    if (!accessToken || !adAccountId) {
      throw new Error('Facebook credentials not configured');
    }

    const { dateRange } = await req.json();
    
    // Try to exchange for long-lived token if app credentials are available
    if (appId && appSecret) {
      try {
        const tokenExchangeUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${accessToken}`;
        const tokenResponse = await fetch(tokenExchangeUrl);
        
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          if (tokenData.access_token) {
            accessToken = tokenData.access_token;
            console.log('Successfully exchanged for long-lived token');
          }
        }
      } catch (error) {
        console.log('Token exchange failed, using existing token:', error);
      }
    }
    
    // Clean up ad account ID - remove any prefixes like 'ct_' or 'act_'
    adAccountId = adAccountId.replace(/^(ct_|act_)/, '');
    
    // Determine date preset based on dateRange
    let datePreset = 'last_30d';
    if (dateRange === 'today') {
      datePreset = 'today';
    } else if (dateRange === 7) {
      datePreset = 'last_7d';
    } else if (dateRange === 90) {
      datePreset = 'last_90d';
    }

    const url = `https://graph.facebook.com/v19.0/act_${adAccountId}/insights?fields=campaign_name,spend,impressions,clicks,ctr,cpc,purchase_roas,actions&date_preset=${datePreset}&access_token=${accessToken}`;

    console.log('Fetching Facebook Ads data from:', url.replace(accessToken || '', 'REDACTED'));
    console.log('Using ad account ID:', adAccountId);

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Facebook API error status:', response.status);
      console.error('Facebook API error response:', errorText);
      
      // Try to parse JSON error for more details
      try {
        const errorJson = JSON.parse(errorText);
        console.error('Parsed error:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.error('Could not parse error as JSON');
      }
      
      throw new Error(`Facebook API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    // Format campaigns
    const formattedCampaigns = (data.data || []).map((campaign: any) => {
      const purchases = campaign.actions?.find((a: any) => a.action_type === 'purchase')?.value || '0';
      
      return {
        campaignName: campaign.campaign_name || 'N/A',
        spend: parseFloat(campaign.spend || '0'),
        impressions: parseInt(campaign.impressions || '0'),
        clicks: parseInt(campaign.clicks || '0'),
        ctr: parseFloat(campaign.ctr || '0'),
        cpc: parseFloat(campaign.cpc || '0'),
        purchases: parseInt(purchases),
        roas: parseFloat(campaign.purchase_roas?.[0]?.value || '0'),
      };
    });

    const totalSpend = formattedCampaigns.reduce((sum: number, c: any) => sum + c.spend, 0);

    console.log(`Fetched ${formattedCampaigns.length} campaigns from Facebook Ads`);

    return new Response(
      JSON.stringify({ 
        campaigns: formattedCampaigns, 
        totalSpend,
        total: formattedCampaigns.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching Facebook Ads:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});