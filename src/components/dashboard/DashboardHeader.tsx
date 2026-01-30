import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  onNewAppointment?: () => void;
}

export function DashboardHeader({ onNewAppointment }: DashboardHeaderProps) {
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Try to get instance name first, then profile
        const { data: instance } = await supabase
          .from("instances")
          .select("company_name")
          .eq("user_id", user.id)
          .maybeSingle();

        if (instance?.company_name) {
          setCompanyName(instance.company_name);
        } else {
          const { data: profile } = await supabase
            .from("profiles")
            .select("company_name, full_name")
            .eq("user_id", user.id)
            .maybeSingle();

          setCompanyName(profile?.company_name || profile?.full_name || "Clínica");
        }
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const today = new Date();
  const formattedDate = format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
      <div className="space-y-0.5">
        <h1 className="text-xl md:text-2xl font-semibold text-slate-800">
          Olá, <span className="text-teal-600">{loading ? "..." : companyName}</span>
        </h1>
        <p className="text-slate-500 text-xs md:text-sm font-medium">{capitalizedDate}</p>
      </div>

      {onNewAppointment && (
        <Button
          onClick={onNewAppointment}
          className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Agendamento
        </Button>
      )}
    </div>
  );
}
