import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useDashboardData = (dateRange: number | 'today', forceRefresh: boolean = false) => {
  return useQuery({
    queryKey: ['unified-dashboard-data', dateRange, forceRefresh],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('unified-dashboard-data', {
        body: { dateRange, forceRefresh }
      });
      
      if (error) throw error;
      return data;
    },
    staleTime: forceRefresh ? 0 : 5 * 60 * 1000, // 5 minutes
    refetchInterval: false, // Don't auto-refetch
  });
};
