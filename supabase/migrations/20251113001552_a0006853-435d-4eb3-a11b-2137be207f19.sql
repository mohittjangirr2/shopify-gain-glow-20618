-- Create role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'company', 'vendor');

-- Create companies table
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Create vendors table
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  cost_per_order NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to get user's company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Create function to get user's vendor_id
CREATE OR REPLACE FUNCTION public.get_user_vendor_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT vendor_id
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Create modules/permissions table
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  route TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

-- Create company_modules table for permission control
CREATE TABLE public.company_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  can_read BOOLEAN DEFAULT true,
  can_write BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, module_id)
);

ALTER TABLE public.company_modules ENABLE ROW LEVEL SECURITY;

-- Create vendor_payments table
CREATE TABLE public.vendor_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  order_number TEXT,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, paid, cancelled
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vendor_payments ENABLE ROW LEVEL SECURITY;

-- Create rto_verifications table
CREATE TABLE public.rto_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  awb_code TEXT NOT NULL,
  shipment_id TEXT,
  verification_status TEXT DEFAULT 'pending', -- pending, received, not_received, received_broken, received_wrong_item
  vendor_notes TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rto_verifications ENABLE ROW LEVEL SECURITY;

-- Add company_id to existing api_settings table
ALTER TABLE public.api_settings ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Add company_id to existing api_cache table
ALTER TABLE public.api_cache ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Add company_id to existing fcm_config table
ALTER TABLE public.fcm_config ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Add company_id to existing notification_events table
ALTER TABLE public.notification_events ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- RLS Policies for companies
CREATE POLICY "Super admins can do everything on companies"
ON public.companies FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Companies can view their own data"
ON public.companies FOR SELECT
TO authenticated
USING (id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Companies can update their own data"
ON public.companies FOR UPDATE
TO authenticated
USING (id = public.get_user_company_id(auth.uid()))
WITH CHECK (id = public.get_user_company_id(auth.uid()));

-- RLS Policies for vendors
CREATE POLICY "Super admins can do everything on vendors"
ON public.vendors FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Companies can manage their vendors"
ON public.vendors FOR ALL
TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()))
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Vendors can view their own data"
ON public.vendors FOR SELECT
TO authenticated
USING (id = public.get_user_vendor_id(auth.uid()));

-- RLS Policies for user_roles
CREATE POLICY "Super admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for modules
CREATE POLICY "Super admins can manage modules"
ON public.modules FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "All authenticated users can view modules"
ON public.modules FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for company_modules
CREATE POLICY "Super admins can manage company modules"
ON public.company_modules FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Companies can view their modules"
ON public.company_modules FOR SELECT
TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));

-- RLS Policies for vendor_payments
CREATE POLICY "Super admins can manage all payments"
ON public.vendor_payments FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Companies can manage their vendor payments"
ON public.vendor_payments FOR ALL
TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()))
WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Vendors can view their payments"
ON public.vendor_payments FOR SELECT
TO authenticated
USING (vendor_id = public.get_user_vendor_id(auth.uid()));

-- RLS Policies for rto_verifications
CREATE POLICY "Super admins can manage all RTO verifications"
ON public.rto_verifications FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Companies can view their RTO verifications"
ON public.rto_verifications FOR SELECT
TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Vendors can manage their RTO verifications"
ON public.rto_verifications FOR ALL
TO authenticated
USING (vendor_id = public.get_user_vendor_id(auth.uid()))
WITH CHECK (vendor_id = public.get_user_vendor_id(auth.uid()));

-- Update existing api_settings RLS to support multi-tenancy
DROP POLICY IF EXISTS "Users can view own settings" ON public.api_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.api_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.api_settings;

CREATE POLICY "Super admins can manage all settings"
ON public.api_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Companies can manage their settings"
ON public.api_settings FOR ALL
TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()) OR (user_id = auth.uid() AND company_id IS NULL))
WITH CHECK (company_id = public.get_user_company_id(auth.uid()) OR (user_id = auth.uid() AND company_id IS NULL));

-- Insert default modules
INSERT INTO public.modules (name, description, icon, route) VALUES
('Dashboard', 'Main analytics dashboard', 'LayoutDashboard', '/'),
('New Orders', 'Manage new orders', 'ShoppingCart', '/orders/new'),
('Ready To Ship', 'Orders ready for shipment', 'Package', '/orders/ready-to-ship'),
('In Transit', 'Orders in transit', 'Truck', '/orders/in-transit'),
('Delivered', 'Delivered orders', 'CheckCircle', '/orders/delivered'),
('RTO', 'Return to origin orders', 'RotateCcw', '/rto'),
('NDR', 'Non-delivery reports', 'AlertTriangle', '/ndr'),
('Customers', 'Customer management', 'Users', '/customers'),
('Products', 'Product catalog', 'Package', '/products'),
('Vendor Payments', 'Vendor payment tracking', 'DollarSign', '/vendor-payments'),
('Settings', 'System settings', 'Settings', '/settings'),
('Notifications', 'Notification settings', 'Bell', '/notifications')
ON CONFLICT (name) DO NOTHING;

-- Create trigger for companies updated_at
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger for vendors updated_at
CREATE TRIGGER update_vendors_updated_at
BEFORE UPDATE ON public.vendors
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger for vendor_payments updated_at
CREATE TRIGGER update_vendor_payments_updated_at
BEFORE UPDATE ON public.vendor_payments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger for rto_verifications updated_at
CREATE TRIGGER update_rto_verifications_updated_at
BEFORE UPDATE ON public.rto_verifications
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();