import { Users, CheckCircle, XCircle, UserPlus, LucideIcon } from "lucide-react";
import { useTodayStats } from "@/hooks/useAppointments";
import { cn } from "@/lib/utils";

interface MedicalKPICardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle: string;
  iconColor: string;
  iconBg: string;
}

function MedicalKPICard({ icon: Icon, title, value, subtitle, iconColor, iconBg }: MedicalKPICardProps) {
  return (
    <div className="glass-card p-4 md:p-5 rounded-2xl min-w-[160px] flex-shrink-0 md:flex-shrink md:min-w-0">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2.5 rounded-xl", iconBg)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl md:text-3xl font-bold text-white">{value}</p>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{title}</p>
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
      iconColor: "text-cyan-400",
      iconBg: "bg-cyan-500/20",
    },
    {
      icon: CheckCircle,
      title: "Confirmados",
      value: isLoading ? "..." : stats?.confirmed || 0,
      subtitle: stats?.total ? `${Math.round((stats.confirmed / stats.total) * 100)}% do total` : "0%",
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/20",
    },
    {
      icon: XCircle,
      title: "Faltas",
      value: isLoading ? "..." : stats?.noShow || 0,
      subtitle: "não compareceram",
      iconColor: "text-rose-400",
      iconBg: "bg-rose-500/20",
    },
    {
      icon: UserPlus,
      title: "Novos Cadastros",
      value: isLoading ? "..." : stats?.newPatients || 0,
      subtitle: "esta semana",
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/20",
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
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi) => (
          <MedicalKPICard key={kpi.title} {...kpi} />
        ))}
      </div>
    </div>
  );
}
