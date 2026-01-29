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
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-light text-white">
          Olá, <span className="font-medium">{loading ? "..." : companyName}</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base">{capitalizedDate}</p>
      </div>
      
      {onNewAppointment && (
        <Button
          onClick={onNewAppointment}
          className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-medium text-sm transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          Novo Agendamento
        </Button>
      )}
    </div>
  );
}
