import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useInstance() {
  return useQuery({
    queryKey: ["user-instance"],
    queryFn: async () => {
      // Use getSession() instead of getUser() — getSession() reads from localStorage
      // without making a network call, while getUser() hits Supabase servers every time
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data, error } = await supabase
        .from("instances")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) throw error;

      // Force subscription status to active to eliminate paywall
      return data ? {
        ...data,
        subscription_status: "active",
        current_period_end: new Date(new Date().getFullYear() + 10, 0, 1).toISOString() // 10 years from now
      } : null;
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
