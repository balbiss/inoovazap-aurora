import { Sparkles, TrendingUp, Users, Zap } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonText } from "@/components/ui/NeonText";
import { NeonButton } from "@/components/ui/NeonButton";

const stats = [
  { icon: Users, label: "Contatos", value: "2,847", trend: "+12%" },
  { icon: Zap, label: "Automações", value: "24", trend: "+3" },
  { icon: TrendingUp, label: "Mensagens", value: "12.4k", trend: "+28%" },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <NeonText as="h1" className="text-3xl md:text-4xl" glow={false}>
          Visão Geral
        </NeonText>
        <p className="text-muted-foreground text-lg">
          Bem-vindo ao seu painel de controle
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <GlassCard key={stat.label} hover className="group">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <p className="text-muted-foreground text-sm font-medium uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-primary text-sm font-medium">
                    {stat.trend}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                  <Icon className="w-6 h-6 text-primary glow-hover" />
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Welcome Card */}
      <GlassCard className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-neon-blue/20 to-neon-cyan/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-cyan shadow-neon animate-float">
            <Sparkles className="w-8 h-8 text-background" />
          </div>
          
          <div className="flex-1 space-y-2">
            <h2 className="text-xl font-bold text-foreground">
              Comece a automatizar agora
            </h2>
            <p className="text-muted-foreground">
              Crie sua primeira automação de WhatsApp em minutos e transforme seu atendimento.
            </p>
          </div>

          <NeonButton>
            Criar Automação
          </NeonButton>
        </div>
      </GlassCard>

      {/* Empty Glass Cards for Validation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="min-h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground">Últimas Conversas</p>
        </GlassCard>
        
        <GlassCard className="min-h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground">Atividade Recente</p>
        </GlassCard>
      </div>
    </div>
  );
}
