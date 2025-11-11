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
    // Use service role key for background job
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting cache refresh background job');

    // Clean expired cache
    await supabaseAdmin.rpc('clean_expired_cache');
    
    // Get all unique users who have API settings configured
    const { data: users, error: usersError } = await supabaseAdmin
      .from('api_settings')
      .select('user_id')
      .limit(100); // Process 100 users per run

    if (usersError) {
      throw usersError;
    }

    console.log(`Refreshing cache for ${users?.length || 0} users`);

    // Refresh cache for each user's common date ranges
    const dateRanges = [30, 7, 90];
    const refreshPromises: Promise<any>[] = [];

    for (const { user_id } of users || []) {
      for (const dateRange of dateRanges) {
        refreshPromises.push(
          refreshUserCache(supabaseAdmin, user_id, dateRange)
        );
      }
    }

    await Promise.allSettled(refreshPromises);

    console.log('Cache refresh completed');

    return new Response(
      JSON.stringify({ 
        success: true, 
        usersProcessed: users?.length || 0,
        message: 'Cache refreshed successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error refreshing cache:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function refreshUserCache(supabaseAdmin: any, userId: string, dateRange: number) {
  try {
    // Fetch data from all APIs in parallel
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const [shopifyRes, facebookRes, shiprocketRes] = await Promise.allSettled([
      fetch(`${supabaseUrl}/functions/v1/fetch-shopify-orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dateRange, userId })
      }),
      fetch(`${supabaseUrl}/functions/v1/fetch-facebook-ads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dateRange, userId })
      }),
      fetch(`${supabaseUrl}/functions/v1/fetch-shiprocket-shipments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dateRange, userId })
      })
    ]);

    const shopifyData = shopifyRes.status === 'fulfilled' ? await shopifyRes.value.json() : null;
    const facebookData = facebookRes.status === 'fulfilled' ? await facebookRes.value.json() : null;
    const shiprocketData = shiprocketRes.status === 'fulfilled' ? await shiprocketRes.value.json() : null;

    const cacheData = {
      shopify: shopifyData,
      facebook: facebookData,
      shiprocket: shiprocketData,
      fetchedAt: new Date().toISOString()
    };

    const cacheKey = `dashboard_${dateRange}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await supabaseAdmin
      .from('api_cache')
      .upsert({
        user_id: userId,
        cache_key: cacheKey,
        cache_data: cacheData,
        expires_at: expiresAt.toISOString(),
      }, {
        onConflict: 'user_id,cache_key'
      });

    console.log(`Cache refreshed for user ${userId}, dateRange ${dateRange}`);
  } catch (error) {
    console.error(`Error refreshing cache for user ${userId}:`, error);
  }
}
