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

    const { dateRange = 30, forceRefresh = false, companyId } = await req.json();
    
    console.log('Unified dashboard request:', { userId: user.id, dateRange, forceRefresh, companyId });

    // Check cache first
    if (!forceRefresh) {
      let cacheQuery = supabaseClient
        .from('api_cache')
        .select('*')
        .eq('user_id', user.id)
        .eq('cache_key', `unified_dashboard_${dateRange}`)
        .gt('expires_at', new Date().toISOString());
      
      if (companyId) {
        cacheQuery = cacheQuery.eq('company_id', companyId);
      }

      const { data: cachedData } = await cacheQuery.single();

      if (cachedData) {
        console.log('Returning cached data');
        return new Response(
          JSON.stringify(cachedData.cache_data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Fetching fresh data with parallel execution...');

    // Parallel API execution using Promise.allSettled
    const apiCalls = [
      supabaseClient.functions.invoke('fetch-shopify-orders', {
        body: { dateRange, companyId }
      }),
      supabaseClient.functions.invoke('fetch-facebook-ads-v2', {
        body: { dateRange, companyId }
      }),
      supabaseClient.functions.invoke('fetch-shiprocket-shipments', {
        body: { dateRange, companyId }
      })
    ];

    const results = await Promise.allSettled(apiCalls);

    const shopifyResult = results[0].status === 'fulfilled' ? results[0].value : null;
    const facebookResult = results[1].status === 'fulfilled' ? results[1].value : null;
    const shiprocketResult = results[2].status === 'fulfilled' ? results[2].value : null;

    // Process results
    const shopifyData = shopifyResult?.data || { orders: [], totalOrders: 0, totalRevenue: 0 };
    const facebookData = facebookResult?.data || { campaigns: [], totalSpend: 0, campaignCount: 0 };
    const shiprocketData = shiprocketResult?.data || { shipments: [], walletBalance: 0, totalShipments: 0 };

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const apiNames = ['Shopify', 'Facebook', 'Shiprocket'];
        console.error(`${apiNames[index]} API failed:`, result.reason);
      }
    });

    const aggregatedData = {
      shopify: shopifyData,
      facebook: facebookData,
      shiprocket: shiprocketData,
      fetchedAt: new Date().toISOString(),
      dateRange
    };

    // Cache the result for 10 minutes
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await supabaseClient
      .from('api_cache')
      .upsert({
        user_id: user.id,
        company_id: companyId || null,
        cache_key: `unified_dashboard_${dateRange}`,
        cache_data: aggregatedData,
        expires_at: expiresAt.toISOString()
      });

    console.log('Data fetched and cached successfully');

    return new Response(
      JSON.stringify(aggregatedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in unified dashboard:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});