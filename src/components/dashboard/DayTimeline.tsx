import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, Stethoscope, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppointments, Appointment } from "@/hooks/useAppointments";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const statusConfig = {
  scheduled: {
    label: "Agendado",
    className: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  },
  confirmed: {
    label: "Confirmado",
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  completed: {
    label: "Concluído",
    className: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  },
  no_show: {
    label: "Falta",
    className: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  },
};

interface TimelineItemProps {
  appointment: Appointment;
}

function TimelineItem({ appointment }: TimelineItemProps) {
  const status = statusConfig[appointment.status];
  const startTime = format(new Date(appointment.start_time), "HH:mm");

  return (
    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
      {/* Time */}
      <div className="flex items-center gap-2 min-w-[70px]">
        <Clock className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-medium text-white">{startTime}</span>
      </div>

      {/* Patient */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
        <span className="text-sm text-slate-300 truncate">
          {appointment.patient?.name || "Paciente não identificado"}
        </span>
      </div>

      {/* Doctor */}
      <div className="hidden md:flex items-center gap-2 flex-1 min-w-0">
        <Stethoscope 
          className="w-4 h-4 flex-shrink-0" 
          style={{ color: appointment.doctor?.color || "#06b6d4" }}
        />
        <span className="text-sm text-slate-400 truncate">
          {appointment.doctor?.name}
        </span>
      </div>

      {/* Status */}
      <Badge className={cn("text-xs", status.className)}>
        {status.label}
      </Badge>
    </div>
  );
}

export function DayTimeline() {
  const navigate = useNavigate();
  const today = new Date();
  const { data: appointments, isLoading } = useAppointments(today);

  // Filter upcoming appointments (not completed or cancelled)
  const upcomingAppointments = appointments?.filter(
    (a) => a.status !== "completed" && a.status !== "cancelled"
  ) || [];

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Timeline de Hoje</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/schedule")}
          className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
        >
          Ver Agenda
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="space-y-1">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-slate-400">Carregando...</p>
          </div>
        ) : upcomingAppointments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400">Nenhum agendamento para hoje</p>
          </div>
        ) : (
          upcomingAppointments.slice(0, 6).map((appointment) => (
            <TimelineItem key={appointment.id} appointment={appointment} />
          ))
        )}
      </div>

      {upcomingAppointments.length > 6 && (
        <p className="text-xs text-slate-500 text-center mt-4">
          +{upcomingAppointments.length - 6} mais agendamentos
        </p>
      )}
    </div>
  );
}
