import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function DashboardHeader() {
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("company_name, full_name")
          .eq("user_id", user.id)
          .single();
        
        setCompanyName(profile?.company_name || profile?.full_name || "Usuário");
      }
      setLoading(false);
    };

    fetchProfile();
  }, []);

  const today = new Date();
  const formattedDate = format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });
  // Capitalize first letter
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-light text-white">
          Olá, <span className="font-medium">{loading ? "..." : companyName}</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base">{capitalizedDate}</p>
      </div>
      
      <button className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02]">
        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
        Novo Agendamento
      </button>
    </div>
  );
}
