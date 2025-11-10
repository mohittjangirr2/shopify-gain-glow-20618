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
      .select('shopify_store_url, shopify_access_token')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !settings) {
      throw new Error('Shopify API settings not configured. Please configure them in Settings.');
    }

    const storeUrl = settings.shopify_store_url;
    const accessToken = settings.shopify_access_token;

    if (!storeUrl || !accessToken) {
      throw new Error('Shopify credentials not configured');
    }

    const { dateRange } = await req.json();
    
    let allOrders: any[] = [];
    let pageInfo: string | null = null;
    let hasNextPage = true;

    // Fetch all orders with pagination
    while (hasNextPage) {
      const url: string = pageInfo 
        ? `https://${storeUrl}/admin/api/2025-01/orders.json?limit=250&page_info=${pageInfo}`
        : `https://${storeUrl}/admin/api/2025-01/orders.json?limit=250&status=any`;

      const response: Response = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.statusText}`);
      }

      const data = await response.json();
      allOrders = allOrders.concat(data.orders || []);

      // Check for pagination
      const linkHeader: string | null = response.headers.get('Link');
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const nextMatch: RegExpMatchArray | null = linkHeader.match(/<[^>]*page_info=([^&>]+)[^>]*>;\s*rel="next"/);
        pageInfo = nextMatch ? nextMatch[1] : null;
        hasNextPage = !!pageInfo;
      } else {
        hasNextPage = false;
      }
    }

    // Filter by date range if provided
    if (dateRange) {
      const now = new Date();
      let filterDate: Date;
      
      if (dateRange === 'today') {
        // Set to start of today
        filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      } else {
        // Calculate days ago
        filterDate = new Date(now.getTime() - dateRange * 24 * 60 * 60 * 1000);
      }
      
      allOrders = allOrders.filter(order => 
        new Date(order.created_at) >= filterDate
      );
    }

    // Format orders with all required fields including cost price from Shopify
    const formattedOrders = allOrders.map(order => {
      const lineItems = order.line_items || [];
      const firstItem = lineItems[0] || {};
      
      // Get actual cost price from Shopify line items (if available in properties or variant data)
      const totalCost = lineItems.reduce((sum: number, item: any) => {
        // Try to get actual cost from item properties or variant
        let itemCost = 0;
        
        // Check if cost is in properties
        if (item.properties) {
          const costProp = item.properties.find((p: any) => p.name?.toLowerCase() === 'cost' || p.name?.toLowerCase() === 'cost_price');
          if (costProp) {
            itemCost = parseFloat(costProp.value || '0');
          }
        }
        
        // If no cost found, leave as 0 (don't calculate)
        return sum + (itemCost * (item.quantity || 1));
      }, 0);
      
      return {
        orderId: order.id.toString(),
        orderNumber: order.name,
        orderName: order.name,
        customerId: order.customer?.id?.toString() || null,
        date: order.created_at,
        customerName: order.customer?.first_name && order.customer?.last_name 
          ? `${order.customer.first_name} ${order.customer.last_name}` 
          : order.customer?.first_name || order.customer?.last_name || null,
        email: order.customer?.email || null,
        phone: order.customer?.phone || order.customer?.default_address?.phone || order.shipping_address?.phone || order.billing_address?.phone || null,
        orderValue: parseFloat(order.total_price || '0'),
        costPrice: totalCost,
        profit: parseFloat(order.total_price || '0') - totalCost,
        paymentMethod: order.gateway || null,
        orderStatus: order.financial_status || 'pending',
        fulfillmentStatus: order.fulfillment_status || null,
        city: order.shipping_address?.city || null,
        state: order.shipping_address?.province || null,
        province: order.shipping_address?.province || null,
        country: order.shipping_address?.country || null,
        shippingAddress: order.shipping_address ? 
          `${order.shipping_address.address1 || ''}, ${order.shipping_address.city || ''}, ${order.shipping_address.province || ''}`.trim() 
          : null,
        
        // Product details
        product: firstItem.name || null,
        quantity: lineItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0),
        price: firstItem.price || null,
        totalPrice: order.total_price || null,
        vendor: firstItem.vendor || null,
        
        // Additional fields
        createdAt: order.created_at,
        totalLineItemsPrice: order.total_line_items_price || null,
        subtotalPrice: order.subtotal_price || null,
        totalDiscounts: order.total_discounts || null,
        totalTax: order.total_tax || null,
        
        // All line items for detailed view
        lineItems: lineItems.map((item: any) => {
          // Try to get cost from properties
          let itemCost = null;
          if (item.properties) {
            const costProp = item.properties.find((p: any) => p.name?.toLowerCase() === 'cost' || p.name?.toLowerCase() === 'cost_price');
            if (costProp) {
              itemCost = parseFloat(costProp.value || '0');
            }
          }
          
          return {
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            cost: itemCost,
            vendor: item.vendor,
            sku: item.sku,
          };
        }),
      };
    });

    console.log(`Fetched ${formattedOrders.length} orders from Shopify`);

    return new Response(
      JSON.stringify({ orders: formattedOrders, total: formattedOrders.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching Shopify orders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});