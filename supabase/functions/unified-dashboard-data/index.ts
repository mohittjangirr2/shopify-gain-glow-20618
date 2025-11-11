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

    const { dateRange, forceRefresh } = await req.json();
    
    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cacheKey = `dashboard_${dateRange}`;
      const { data: cachedData, error: cacheError } = await supabaseClient
        .from('api_cache')
        .select('*')
        .eq('user_id', user.id)
        .eq('cache_key', cacheKey)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (cachedData && !cacheError) {
        console.log('Returning cached data');
        return new Response(
          JSON.stringify({ 
            ...cachedData.cache_data,
            fromCache: true,
            cachedAt: cachedData.cached_at
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Fetching fresh data from all APIs in parallel');

    // Fetch all APIs in parallel
    const [shopifyResult, facebookResult, shiprocketResult] = await Promise.allSettled([
      supabaseClient.functions.invoke('fetch-shopify-orders', {
        body: { dateRange }
      }),
      supabaseClient.functions.invoke('fetch-facebook-ads', {
        body: { dateRange }
      }),
      supabaseClient.functions.invoke('fetch-shiprocket-shipments', {
        body: { dateRange }
      })
    ]);

    // Process results
    const shopifyData = shopifyResult.status === 'fulfilled' ? shopifyResult.value.data : null;
    const facebookData = facebookResult.status === 'fulfilled' ? facebookResult.value.data : null;
    const shiprocketData = shiprocketResult.status === 'fulfilled' ? shiprocketResult.value.data : null;

    const responseData = {
      shopify: shopifyData,
      facebook: facebookData,
      shiprocket: shiprocketData,
      errors: {
        shopify: shopifyResult.status === 'rejected' ? shopifyResult.reason?.message : null,
        facebook: facebookResult.status === 'rejected' ? facebookResult.reason?.message : null,
        shiprocket: shiprocketResult.status === 'rejected' ? shiprocketResult.reason?.message : null,
      },
      fromCache: false,
      fetchedAt: new Date().toISOString()
    };

    // Cache the response for 10 minutes
    const cacheKey = `dashboard_${dateRange}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes TTL

    await supabaseClient
      .from('api_cache')
      .upsert({
        user_id: user.id,
        cache_key: cacheKey,
        cache_data: responseData,
        expires_at: expiresAt.toISOString(),
      }, {
        onConflict: 'user_id,cache_key'
      });

    console.log('Data fetched and cached successfully');

    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in unified dashboard data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
