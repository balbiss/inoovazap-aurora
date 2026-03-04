import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useInstance() {
  return useQuery({
    queryKey: ["user-instance"],
    queryFn: async () => {
      console.log("[useInstance] Step 1: Requesting user from Supabase...");
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error("[useInstance] Auth error:", authError);
        throw authError;
      }

      console.log("[useInstance] Step 2: User found:", user?.id);
      if (!user) return null;

      console.log("[useInstance] Step 3: Querying instances table...");
      const { data, error } = await supabase
        .from("instances")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("[useInstance] Database error querying instances:", error);
        throw error;
      }

      console.log("[useInstance] Step 4: Instance found:", data ? data.id : "None");

      // Force subscription status to active to eliminate paywall
      const result = data ? {
        ...data,
        subscription_status: "active",
        current_period_end: new Date(new Date().getFullYear() + 10, 0, 1).toISOString()
      } : null;

      console.log("[useInstance] Step 5: Finalizing result", result);
      return result;
    },
    // Prevent infinite retry loops while debugging
    retry: 1,
  });
}
