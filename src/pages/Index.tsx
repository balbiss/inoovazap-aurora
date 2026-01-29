import { Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonText } from "@/components/ui/NeonText";
import { NeonButton } from "@/components/ui/NeonButton";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { MessagesChart } from "@/components/charts/MessagesChart";
import { AutomationsChart } from "@/components/charts/AutomationsChart";
import { ConversationsChart } from "@/components/charts/ConversationsChart";
import { RevenueChart } from "@/components/charts/RevenueChart";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <NeonText as="h1" className="text-2xl md:text-3xl lg:text-4xl" glow={false}>
          Visão Geral
        </NeonText>
        <p className="text-muted-foreground text-sm md:text-base">
          Bem-vindo ao seu painel de controle
        </p>
      </div>

      {/* Quick Stats */}
      <QuickStats />

      {/* Welcome Card */}
      <GlassCard className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-neon-blue/20 to-neon-cyan/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
          <div className="p-3 md:p-4 rounded-2xl bg-gradient-to-br from-neon-blue to-neon-cyan shadow-neon animate-float">
            <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-background" />
          </div>
          
          <div className="flex-1 space-y-1">
            <h2 className="text-lg md:text-xl font-bold text-foreground">
              Comece a automatizar agora
            </h2>
            <p className="text-sm text-muted-foreground">
              Crie sua primeira automação de WhatsApp em minutos e transforme seu atendimento.
            </p>
          </div>

          <NeonButton size="sm" className="w-full md:w-auto">
            Criar Automação
          </NeonButton>
        </div>
      </GlassCard>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MessagesChart />
        <AutomationsChart />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ConversationsChart />
        <RevenueChart />
        <RecentActivity />
      </div>
    </div>
  );
}
