import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let accessToken = Deno.env.get('FACEBOOK_ACCESS_TOKEN');
    const appId = Deno.env.get('FACEBOOK_APP_ID');
    const appSecret = Deno.env.get('FACEBOOK_APP_SECRET');
    let adAccountId = Deno.env.get('FACEBOOK_AD_ACCOUNT_ID') || '';

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
