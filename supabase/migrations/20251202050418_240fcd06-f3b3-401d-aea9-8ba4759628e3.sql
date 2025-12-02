-- Assign super_admin role to admin@kartq.in
-- This user must sign up first through the /auth page

DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Get the user ID for admin@kartq.in
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@kartq.in'
  LIMIT 1;

  -- Only proceed if the user exists
  IF admin_user_id IS NOT NULL THEN
    -- Insert or update the super_admin role for this user
    INSERT INTO public.user_roles (user_id, role, company_id, vendor_id)
    VALUES (admin_user_id, 'super_admin', NULL, NULL)
    ON CONFLICT (user_id, role) 
    DO NOTHING;
    
    RAISE NOTICE 'Super admin role assigned to admin@kartq.in';
  ELSE
    RAISE NOTICE 'User admin@kartq.in not found. Please sign up first at /auth';
  END IF;
END $$;