import { Users, CheckCircle, XCircle, UserPlus, LucideIcon } from "lucide-react";
import { useTodayStats } from "@/hooks/useAppointments";
import { cn } from "@/lib/utils";

interface MedicalKPICardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle: string;
}

function MedicalKPICard({ icon: Icon, title, value, subtitle }: MedicalKPICardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3.5 min-w-[160px] flex-shrink-0 md:flex-shrink md:min-w-0 hover:shadow-md transition-shadow duration-200">
      {/* Icon */}
      <div className="mb-3">
        <div className="p-2 rounded-lg bg-teal-50 inline-flex">
          <Icon className="w-4 h-4 text-teal-600" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-0.5">
        <p className="text-xl font-bold text-slate-900">{value}</p>
        <p className="text-[13px] font-semibold text-slate-700">{title}</p>
        <p className="text-[11px] text-slate-500 leading-tight">{subtitle}</p>
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
    },
    {
      icon: CheckCircle,
      title: "Confirmados",
      value: isLoading ? "..." : stats?.confirmed || 0,
      subtitle: stats?.total ? `${Math.round((stats.confirmed / stats.total) * 100)}% do total` : "0%",
    },
    {
      icon: XCircle,
      title: "Faltas",
      value: isLoading ? "..." : stats?.noShow || 0,
      subtitle: "não compareceram",
    },
    {
      icon: UserPlus,
      title: "Novos Cadastros",
      value: isLoading ? "..." : stats?.newPatients || 0,
      subtitle: "esta semana",
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
