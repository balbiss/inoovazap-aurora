import { MessageCircle, Users, Zap, TrendingUp } from "lucide-react";
import { KPICard } from "./KPICard";

const kpiData = [
  {
    icon: MessageCircle,
    title: "Mensagens",
    value: "12.847",
    change: "+12%",
    trend: "up" as const,
    iconColor: "text-cyan-400",
    iconBg: "bg-cyan-500/20",
  },
  {
    icon: Users,
    title: "Leads Capturados",
    value: "2.350",
    change: "+8%",
    trend: "up" as const,
    iconColor: "text-indigo-400",
    iconBg: "bg-indigo-500/20",
  },
  {
    icon: Zap,
    title: "Automações Ativas",
    value: "18",
    change: "+3",
    trend: "up" as const,
    iconColor: "text-violet-400",
    iconBg: "bg-violet-500/20",
  },
  {
    icon: TrendingUp,
    title: "Taxa de Resposta",
    value: "94.2%",
    change: "-0.8%",
    trend: "down" as const,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/20",
  },
];

export function KPIGrid() {
  return (
    <div className="mb-6">
      {/* Mobile: Horizontal scroll */}
      <div className="flex gap-4 overflow-x-auto pb-4 md:hidden scrollbar-hide -mx-4 px-4">
        {kpiData.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>
      
      {/* Desktop: Grid */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>
    </div>
  );
}
