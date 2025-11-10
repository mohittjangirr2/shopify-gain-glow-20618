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
      .select('shiprocket_email, shiprocket_password')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !settings) {
      throw new Error('Shiprocket API settings not configured. Please configure them in Settings.');
    }

    const email = settings.shiprocket_email;
    const password = settings.shiprocket_password;

    if (!email || !password) {
      throw new Error('Shiprocket credentials not configured');
    }

    const { dateRange } = await req.json();

    console.log('Authenticating with Shiprocket using email:', email);

    // Authenticate with Shiprocket
    const authResponse = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('Shiprocket auth error response:', errorText);
      throw new Error(`Shiprocket auth error (${authResponse.status}): ${errorText}`);
    }

    const authData = await authResponse.json();
    const token = authData.token;

    if (!token) {
      console.error('No token received from Shiprocket:', authData);
      throw new Error('Shiprocket authentication failed - no token received');
    }

    console.log('Successfully authenticated with Shiprocket, fetching shipments...');

    // Fetch COD remittance data
    let codRemittanceData: any = null;
    try {
      const remittanceResponse = await fetch('https://apiv2.shiprocket.in/v1/external/courier/serviceability/remittance', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (remittanceResponse.ok) {
        codRemittanceData = await remittanceResponse.json();
        console.log('COD remittance data fetched successfully');
      }
    } catch (e) {
      console.error('Error fetching COD remittance:', e);
    }

    // Fetch ALL shipments with pagination
    let allShipments: any[] = [];
    let currentPage = 1;
    let hasMoreShipments = true;

    while (hasMoreShipments) {
      const shipmentsResponse = await fetch(`https://apiv2.shiprocket.in/v1/external/shipments?per_page=100&page=${currentPage}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!shipmentsResponse.ok) {
        const errorText = await shipmentsResponse.text();
        console.error('Shiprocket shipments error response:', errorText);
        throw new Error(`Shiprocket shipments error (${shipmentsResponse.status}): ${errorText}`);
      }

      const shipmentsData = await shipmentsResponse.json();
      const shipments = shipmentsData.data || [];
      
      allShipments = allShipments.concat(shipments);
      
      // Check if there are more pages
      hasMoreShipments = shipments.length === 100;
      currentPage++;
      
      console.log(`Fetched page ${currentPage - 1}, total shipments so far: ${allShipments.length}`);
    }
    
    // Fetch ALL orders with pagination
    let allOrders: any[] = [];
    let currentOrderPage = 1;
    let hasMoreOrders = true;

    while (hasMoreOrders) {
      const ordersResponse = await fetch(`https://apiv2.shiprocket.in/v1/external/orders?per_page=100&page=${currentOrderPage}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        const orders = ordersData.data || [];
        
        allOrders = allOrders.concat(orders);
        
        hasMoreOrders = orders.length === 100;
        currentOrderPage++;
        
        console.log(`Fetched order page ${currentOrderPage - 1}, total orders so far: ${allOrders.length}`);
      } else {
        hasMoreOrders = false;
      }
    }
    
    const ordersMap = new Map(allOrders.map((order: any) => [order.id, order]));
    
    // Filter shipments by date range - using order data for more reliable dates
    let filteredShipments = allShipments;
    if (dateRange) {
      const now = new Date();
      let filterDate: Date;
      
      if (dateRange === 'today') {
        filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      } else {
        filterDate = new Date(now.getTime() - dateRange * 24 * 60 * 60 * 1000);
      }
      
      filteredShipments = allShipments.filter((shipment: any) => {
        // Get the matching order for better date info
        const matchingOrder: any = ordersMap.get(shipment.order_id);
        
        // Try multiple date sources
        let shipmentDateStr = matchingOrder?.created_at || shipment.created_at || shipment.pickup_scheduled_date || shipment.awb_assign_date;
        
        if (!shipmentDateStr || shipmentDateStr === '0000-00-00 00:00:00') {
          return true; // Include shipments with no valid date
        }
        
        // Parse the date - handle both ISO and formatted dates
        const shipmentDate = new Date(shipmentDateStr);
        
        // Check if date is valid
        if (isNaN(shipmentDate.getTime())) {
          return true; // Include shipments with unparseable dates
        }
        
        return shipmentDate >= filterDate;
      });
    }
    
    console.log('Sample order data:', JSON.stringify(allOrders[0], null, 2));
    console.log('Sample shipment data (first item):', JSON.stringify(filteredShipments[0], null, 2));
    console.log(`Total shipments fetched: ${allShipments.length}, filtered: ${filteredShipments.length}`);
    console.log(`Total orders fetched: ${allOrders.length}`);
    
    // Format shipments with all available fields
    const formattedShipments = filteredShipments.map((shipment: any) => {
      const orderItems = shipment.products || shipment.order_items || [];
      // Charges are directly in shipment.charges, not in awb_data
      const charges = shipment.charges || {};
      
      // Get matching order to find channel_order_id (Shopify order name)
      const matchingOrder: any = ordersMap.get(shipment.order_id);
      const shopifyOrderName = matchingOrder?.channel_order_id || null;
      
      return {
        id: shipment.id?.toString() || null,
        orderId: shipment.order_id?.toString() || null,
        orderNumber: shopifyOrderName || shipment.channel_order_id || shipment.order_id?.toString() || 'Unknown Order',
        awb: shipment.awb_code || shipment.awb || 'Pending AWB',
        courier: shipment.courier_name || shipment.courier_company_id || 'Courier Not Assigned',
        
        // Customer details - improved extraction
        customerName: shipment.customer_name || matchingOrder?.customer_name || 'Unknown Customer',
        customerEmail: shipment.customer_email || matchingOrder?.customer_email || 'No Email',
        customerPhone: shipment.customer_phone || matchingOrder?.customer_phone || matchingOrder?.customer_mobile || shipment.customer_alternate_phone || 'No Phone',
        customerAddress: shipment.customer_address || matchingOrder?.customer_address || shipment.pickup_location || 'No Address',
        customerCity: shipment.customer_city || matchingOrder?.customer_city || 'Unknown City',
        customerState: shipment.customer_state || matchingOrder?.customer_state || 'Unknown State',
        customerPincode: shipment.customer_pincode || matchingOrder?.customer_pincode || 'No Pincode',
        
        // Shipping details
        weight: shipment.weight || shipment.volumetric_weight || shipment.applied_weight || '0 kg',
        dimensions: shipment.dimensions || (shipment.length && shipment.breadth && shipment.height ? `${shipment.length}x${shipment.breadth}x${shipment.height}` : 'Not Measured'),
        
        // Costs and charges - directly from shipment.charges with better parsing
        shippingCharge: (() => {
          const freight = parseFloat(charges.freight_charges || charges.applied_weight_amount || '0');
          const cod = parseFloat(charges.cod_charges || '0');
          return (freight || 0) + (cod || 0);
        })(),
        codCharges: parseFloat(charges.cod_charges || '0') || 0,
        freightCharges: parseFloat(charges.freight_charges || charges.applied_weight_amount || '0') || 0,
        otherCharges: parseFloat(charges.other_charges || charges.others || '0') || 0,
        discount: parseFloat(shipment.discount || '0') || 0,
        
        // Raw charges for debugging
        _rawCharges: charges,
        
        // Status and dates
        status: shipment.status || shipment.shipment_status || 'pending',
        rtoStatus: shipment.rto_status || null,
        deliveryDate: shipment.delivered_date || shipment.delivery_date || null,
        rtoDeliveredDate: shipment.rto_delivered_date || null,
        rtoInitiatedDate: shipment.rto_initiated_date || null,
        pickupScheduledDate: shipment.pickup_scheduled_date || null,
        awbAssignDate: shipment.awb_assign_date || null,
        
        // Additional details
        paymentMethod: shipment.payment_method || 'Unknown',
        pickupLocation: shipment.pickup_location || 'Unknown Location',
        etd: shipment.etd || shipment.expected_delivery_date || 'Not Available',
        invoiceNo: shipment.invoice_number || 'No Invoice',
        brandName: shipment.company_name || 'Unknown Brand',
        rtoReason: shipment.rto_reason || 'Unknown Reason',
        
        // Delivery details
        pickupBoyName: shipment.pickup_generated_by || null,
        deliveryExecutiveName: shipment.delivery_boy || null,
        deliveryExecutiveNumber: shipment.delivery_boy_contact || null,
        delayReason: shipment.delay_remark || null,
        
        // Activities
        activities: shipment.activities || [],
        
        // Products
        products: orderItems,
      };
    });

    // Calculate RTO metrics - exclude NDR from RTO calculation
    const totalShipments = formattedShipments.length;
    
    // RTO shipments (exclude NDR)
    const rtoShipments = formattedShipments.filter((s: any) => {
      const status = s.status?.toLowerCase() || '';
      const rtoStatus = s.rtoStatus?.toLowerCase() || '';
      return (status.includes('rto') || rtoStatus.includes('rto')) && !status.includes('ndr');
    });
    const rtoCount = rtoShipments.length;
    
    // Delivered shipments (excluding RTO)
    const deliveredShipments = formattedShipments.filter((s: any) => 
      s.status?.toLowerCase() === 'delivered'
    );
    const deliveredCount = deliveredShipments.length;
    
    // NDR shipments (separate from RTO)
    const ndrShipments = formattedShipments.filter((s: any) => 
      s.status?.toLowerCase().includes('ndr') || s.status?.toLowerCase().includes('action')
    );
    const ndrCount = ndrShipments.length;
    
    // RTO percentage based on delivered orders only (excluding NDR)
    const rtoPercentage = deliveredCount > 0 ? (rtoCount / deliveredCount) * 100 : 0;
    const deliveredPercentage = totalShipments > 0 ? (deliveredCount / totalShipments) * 100 : 0;

    // Out for delivery count
    const outForDeliveryCount = formattedShipments.filter((s: any) => 
      s.status?.toLowerCase().includes('out for delivery') || 
      s.status?.toLowerCase().includes('out_for_delivery') ||
      s.status?.toLowerCase() === 'out for delivery'
    ).length;

    // Out for pickup count
    const outForPickupCount = formattedShipments.filter((s: any) => 
      s.status?.toLowerCase().includes('pickup') || s.status?.toLowerCase().includes('ready to ship')
    ).length;
    
    // Remaining orders (not delivered, RTO, or cancelled)
    const remainingCount = formattedShipments.filter((s: any) => {
      const status = s.status?.toLowerCase() || '';
      return !status.includes('delivered') && !status.includes('rto') && !status.includes('cancelled');
    }).length;

    const totalShippingCost = formattedShipments.reduce((sum: number, s: any) => sum + s.shippingCharge, 0);

    console.log(`Fetched ${formattedShipments.length} shipments from Shiprocket`);
    console.log('Sample formatted shipment:', JSON.stringify(formattedShipments[0], null, 2));

    return new Response(
      JSON.stringify({ 
        shipments: formattedShipments,
        metrics: {
          totalShipments,
          rtoCount,
          rtoPercentage,
          deliveredCount,
          deliveredPercentage,
          totalShippingCost,
          outForDeliveryCount,
          ndrCount,
          outForPickupCount,
          remainingCount,
        },
        codRemittance: codRemittanceData,
        total: formattedShipments.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching Shiprocket shipments:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});