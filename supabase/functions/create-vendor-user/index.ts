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

    // Create client with user's auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated and has proper role
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check if user is super_admin or company admin
    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role, company_id')
      .eq('user_id', user.id)
      .single();

    if (!userRole || (userRole.role !== 'super_admin' && userRole.role !== 'company')) {
      throw new Error('Unauthorized: Only admins can create vendor users');
    }

    const { vendorData, password } = await req.json();

    if (!vendorData.name || !vendorData.email || !password) {
      throw new Error('Missing required fields: name, email, and password');
    }

    // Use service role client to create auth user
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Creating auth user for vendor:', vendorData.email);

    // Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: vendorData.email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: vendorData.name,
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    console.log('Auth user created:', authUser.user.id);

    // Determine company_id
    const companyId = vendorData.company_id || userRole.company_id;
    if (!companyId) {
      throw new Error('Company ID is required');
    }

    // Create vendor record
    const { data: vendor, error: vendorError } = await supabaseClient
      .from('vendors')
      .insert([{
        name: vendorData.name,
        email: vendorData.email,
        phone: vendorData.phone || null,
        company_id: companyId,
        cost_per_order: vendorData.cost_per_order || 0,
        is_active: true,
      }])
      .select()
      .single();

    if (vendorError) {
      console.error('Vendor creation error:', vendorError);
      // Cleanup: delete auth user if vendor creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      throw new Error(`Failed to create vendor: ${vendorError.message}`);
    }

    console.log('Vendor record created:', vendor.id);

    // Create user role linking auth user to vendor
    const { error: roleError } = await supabaseClient
      .from('user_roles')
      .insert([{
        user_id: authUser.user.id,
        role: 'vendor',
        company_id: companyId,
        vendor_id: vendor.id,
      }]);

    if (roleError) {
      console.error('Role creation error:', roleError);
      // Cleanup: delete both vendor and auth user
      await supabaseClient.from('vendors').delete().eq('id', vendor.id);
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      throw new Error(`Failed to create user role: ${roleError.message}`);
    }

    console.log('Vendor user created successfully');

    return new Response(
      JSON.stringify({ 
        success: true,
        vendor,
        message: 'Vendor user created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-vendor-user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
