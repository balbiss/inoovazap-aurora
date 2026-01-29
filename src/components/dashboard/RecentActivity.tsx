import { MessageCircle, Bot, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";

const activities = [
  {
    id: 1,
    type: "message",
    title: "Nova mensagem recebida",
    description: "João Silva enviou uma mensagem",
    time: "2 min atrás",
    icon: MessageCircle,
    status: "new",
  },
  {
    id: 2,
    type: "automation",
    title: "Automação executada",
    description: "Follow-up enviado para 45 contatos",
    time: "15 min atrás",
    icon: Bot,
    status: "success",
  },
  {
    id: 3,
    type: "resolved",
    title: "Conversa resolvida",
    description: "Atendimento #4521 finalizado",
    time: "32 min atrás",
    icon: CheckCircle,
    status: "success",
  },
  {
    id: 4,
    type: "pending",
    title: "Aguardando resposta",
    description: "3 conversas pendentes há mais de 1h",
    time: "1h atrás",
    icon: Clock,
    status: "warning",
  },
  {
    id: 5,
    type: "error",
    title: "Falha na automação",
    description: "Erro ao enviar promoção semanal",
    time: "2h atrás",
    icon: AlertCircle,
    status: "error",
  },
];

const statusColors = {
  new: "bg-neon-blue/20 text-neon-blue",
  success: "bg-green-500/20 text-green-500",
  warning: "bg-yellow-500/20 text-yellow-500",
  error: "bg-red-500/20 text-red-500",
};

export function RecentActivity() {
  return (
    <GlassCard className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Atividade Recente</h3>
        <p className="text-sm text-muted-foreground">Últimas atualizações do sistema</p>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div 
              key={activity.id} 
              className="flex items-start gap-4 p-3 rounded-xl hover:bg-secondary/30 transition-colors duration-200"
            >
              <div className={cn(
                "p-2 rounded-xl",
                statusColors[activity.status as keyof typeof statusColors]
              )}>
                <Icon className="w-4 h-4" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {activity.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {activity.description}
                </p>
              </div>
              
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {activity.time}
              </span>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
