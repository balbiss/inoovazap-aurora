import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useInstance() {
  return useQuery({
    queryKey: ["user-instance"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("instances")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // Force subscription status to active to eliminate paywall
      return data ? {
        ...data,
        subscription_status: "active",
        current_period_end: new Date(new Date().getFullYear() + 10, 0, 1).toISOString() // 10 years from now
      } : null;
    },
  });
}
