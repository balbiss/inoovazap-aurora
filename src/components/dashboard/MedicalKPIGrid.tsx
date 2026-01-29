import { Users, CheckCircle, XCircle, UserPlus, LucideIcon } from "lucide-react";
import { useTodayStats } from "@/hooks/useAppointments";
import { cn } from "@/lib/utils";

interface MedicalKPICardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle: string;
  iconBgColor: string;
  iconColor: string;
  borderColor: string;
}

function MedicalKPICard({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  iconBgColor, 
  iconColor,
  borderColor 
}: MedicalKPICardProps) {
  return (
    <div 
      className={cn(
        "bg-white rounded-2xl border border-slate-100 p-5 min-w-[200px] flex-shrink-0 md:flex-shrink md:min-w-0",
        "shadow-lg shadow-slate-200/50",
        "border-l-4",
        borderColor,
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60",
        "cursor-pointer group"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div 
          className={cn(
            "p-4 rounded-full transition-transform duration-300 group-hover:scale-110",
            iconBgColor
          )}
        >
          <Icon className={cn("w-6 h-6", iconColor)} />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-4xl font-bold text-slate-800">{value}</p>
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

export function MedicalKPIGrid() {
  const { data: stats, isLoading } = useTodayStats();

  const kpiData = [
    {
      icon: Users,
      title: "Pacientes Hoje",
      value: isLoading ? "..." : stats?.total || 0,
      subtitle: "agendamentos do dia",
      iconBgColor: "bg-sky-100",
      iconColor: "text-sky-600",
      borderColor: "border-l-sky-500",
    },
    {
      icon: CheckCircle,
      title: "Confirmados",
      value: isLoading ? "..." : stats?.confirmed || 0,
      subtitle: stats?.total ? `${Math.round((stats.confirmed / stats.total) * 100)}% do total` : "0%",
      iconBgColor: "bg-emerald-100",
      iconColor: "text-emerald-600",
      borderColor: "border-l-emerald-500",
    },
    {
      icon: XCircle,
      title: "Faltas",
      value: isLoading ? "..." : stats?.noShow || 0,
      subtitle: "não compareceram",
      iconBgColor: "bg-rose-100",
      iconColor: "text-rose-600",
      borderColor: "border-l-rose-500",
    },
    {
      icon: UserPlus,
      title: "Novos Cadastros",
      value: isLoading ? "..." : stats?.newPatients || 0,
      subtitle: "esta semana",
      iconBgColor: "bg-amber-100",
      iconColor: "text-amber-600",
      borderColor: "border-l-amber-500",
    },
  ];

  return (
    <div className="mb-6">
      {/* Mobile: Horizontal scroll */}
      <div className="flex gap-4 overflow-x-auto pb-4 md:hidden scrollbar-hide -mx-4 px-4">
        {kpiData.map((kpi) => (
          <MedicalKPICard key={kpi.title} {...kpi} />
        ))}
      </div>
      
      {/* Desktop: Grid */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiData.map((kpi) => (
          <MedicalKPICard key={kpi.title} {...kpi} />
        ))}
      </div>
    </div>
  );
}
