import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'super_admin' | 'company' | 'vendor' | null;

export interface UserRoleData {
  role: UserRole;
  companyId: string | null;
  vendorId: string | null;
  isLoading: boolean;
}

export const useUserRole = (): UserRoleData => {
  const { data, isLoading } = useQuery({
    queryKey: ['user-role'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role, company_id, vendor_id')
        .eq('user_id', user.id)
        .single();

      return roleData;
    },
  });

  return {
    role: data?.role || null,
    companyId: data?.company_id || null,
    vendorId: data?.vendor_id || null,
    isLoading,
  };
};