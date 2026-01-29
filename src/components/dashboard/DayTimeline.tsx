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
    className: "bg-sky-50 text-sky-700 border-sky-200",
  },
  confirmed: {
    label: "Confirmado",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  completed: {
    label: "Concluído",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
  no_show: {
    label: "Falta",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

interface TimelineItemProps {
  appointment: Appointment;
}

function TimelineItem({ appointment }: TimelineItemProps) {
  const status = statusConfig[appointment.status];
  const startTime = format(new Date(appointment.start_time), "HH:mm");

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0">
      {/* Time */}
      <div className="flex items-center gap-2 min-w-[70px]">
        <Clock className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-semibold text-slate-700">{startTime}</span>
      </div>

      {/* Patient */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <span className="text-sm text-slate-700 truncate font-medium">
          {appointment.patient?.name || "Paciente não identificado"}
        </span>
      </div>

      {/* Doctor */}
      <div className="hidden md:flex items-center gap-2 flex-1 min-w-0">
        <Stethoscope 
          className="w-4 h-4 flex-shrink-0 text-slate-400" 
        />
        <span className="text-sm text-slate-600 truncate">
          {appointment.doctor?.name}
        </span>
      </div>

      {/* Status */}
      <Badge variant="outline" className={cn("text-xs font-medium", status.className)}>
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
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <h3 className="text-base font-semibold text-slate-800">Timeline de Hoje</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/schedule")}
          className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
        >
          Ver Agenda
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="p-2">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-slate-500">Carregando...</p>
          </div>
        ) : upcomingAppointments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">Nenhum agendamento para hoje</p>
          </div>
        ) : (
          upcomingAppointments.slice(0, 6).map((appointment) => (
            <TimelineItem key={appointment.id} appointment={appointment} />
          ))
        )}
      </div>

      {upcomingAppointments.length > 6 && (
        <div className="px-5 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500 text-center">
            +{upcomingAppointments.length - 6} mais agendamentos
          </p>
        </div>
      )}
    </div>
  );
}
