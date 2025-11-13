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

    const { dateRange = 30, companyId } = await req.json();

    // Get API settings
    let query = supabaseClient
      .from('api_settings')
      .select('*')
      .eq('user_id', user.id);
    
    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data: settings, error: settingsError } = await query.single();

    if (settingsError || !settings) {
      console.log('No Facebook API settings found');
      return new Response(
        JSON.stringify({ campaigns: [], totalSpend: 0, campaignCount: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { facebook_access_token, facebook_ad_account_id, facebook_app_id, facebook_app_secret } = settings;

    if (!facebook_access_token || !facebook_ad_account_id) {
      return new Response(
        JSON.stringify({ campaigns: [], totalSpend: 0, campaignCount: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Exchange for long-lived token if app credentials are provided
    let accessToken = facebook_access_token;
    if (facebook_app_id && facebook_app_secret && !facebook_access_token.startsWith('EAAG')) {
      try {
        const tokenResponse = await fetch(
          `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${facebook_app_id}&client_secret=${facebook_app_secret}&fb_exchange_token=${facebook_access_token}`
        );
        const tokenData = await tokenResponse.json();
        if (tokenData.access_token) {
          accessToken = tokenData.access_token;
          
          // Update the long-lived token in database
          await supabaseClient
            .from('api_settings')
            .update({ facebook_access_token: accessToken })
            .eq('id', settings.id);
          
          console.log('Updated to long-lived token');
        }
      } catch (error) {
        console.error('Failed to exchange token:', error);
      }
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);

    const since = startDate.toISOString().split('T')[0];
    const until = endDate.toISOString().split('T')[0];

    const fields = 'campaign_name,spend,impressions,clicks,ctr,cpc,actions,action_values';
    const url = `https://graph.facebook.com/v18.0/${facebook_ad_account_id}/insights?fields=${fields}&time_range={"since":"${since}","until":"${until}"}&level=campaign&access_token=${accessToken}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'Facebook API error');
    }

    const campaigns = (data.data || []).map((campaign: any) => {
      const purchases = campaign.actions?.find((a: any) => a.action_type === 'purchase')?.value || '0';
      const purchaseValue = campaign.action_values?.find((a: any) => a.action_type === 'purchase')?.value || '0';
      
      return {
        campaign_name: campaign.campaign_name,
        spend: parseFloat(campaign.spend || '0'),
        impressions: parseInt(campaign.impressions || '0'),
        clicks: parseInt(campaign.clicks || '0'),
        ctr: parseFloat(campaign.ctr || '0'),
        cpc: parseFloat(campaign.cpc || '0'),
        purchases: parseInt(purchases),
        roas: parseFloat(campaign.spend) > 0 ? parseFloat(purchaseValue) / parseFloat(campaign.spend) : 0
      };
    });

    const totalSpend = campaigns.reduce((sum: number, c: any) => sum + c.spend, 0);

    return new Response(
      JSON.stringify({
        campaigns,
        totalSpend,
        campaignCount: campaigns.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage, campaigns: [], totalSpend: 0, campaignCount: 0 }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});