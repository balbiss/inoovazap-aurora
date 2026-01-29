import { Users, Zap, TrendingUp, MessageCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";

const stats = [
  { 
    icon: Users, 
    label: "Contatos Ativos", 
    value: "2,847", 
    change: "+12.5%",
    trend: "up",
    description: "vs. mês anterior"
  },
  { 
    icon: MessageCircle, 
    label: "Mensagens Hoje", 
    value: "1,234", 
    change: "+28.4%",
    trend: "up",
    description: "vs. ontem"
  },
  { 
    icon: Zap, 
    label: "Automações Ativas", 
    value: "24", 
    change: "+3",
    trend: "up",
    description: "novas esta semana"
  },
  { 
    icon: TrendingUp, 
    label: "Taxa de Resposta", 
    value: "94.2%", 
    change: "-1.2%",
    trend: "down",
    description: "vs. meta de 95%"
  },
];

export function QuickStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trend === "up" ? ArrowUpRight : ArrowDownRight;
        
        return (
          <GlassCard key={stat.label} hover className="group">
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-2xl md:text-3xl font-bold text-foreground">
                  {stat.value}
                </p>
                <div className="flex items-center gap-1.5">
                  <div 
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-xs font-medium"
                    style={{
                      backgroundColor: stat.trend === "up" ? "hsl(142, 76%, 36%, 0.1)" : "hsl(0, 72%, 51%, 0.1)",
                      color: stat.trend === "up" ? "hsl(142, 76%, 36%)" : "hsl(0, 72%, 51%)"
                    }}
                  >
                    <TrendIcon className="w-3 h-3" />
                    {stat.change}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {stat.description}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                <Icon className="w-5 h-5 md:w-6 md:h-6 text-primary glow-hover" />
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
