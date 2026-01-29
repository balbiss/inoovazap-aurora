import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, Stethoscope, ArrowRight, Calendar } from "lucide-react";
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
    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-all duration-200 border-b border-slate-100 last:border-b-0 group">
      {/* Time */}
      <div className="flex flex-col items-center min-w-[60px] bg-slate-100 rounded-lg p-2 group-hover:bg-teal-50 transition-colors">
        <span className="text-lg font-bold text-slate-800 group-hover:text-teal-700">{startTime}</span>
      </div>

      {/* Color bar */}
      <div 
        className="w-1 h-10 rounded-full flex-shrink-0"
        style={{ backgroundColor: appointment.doctor?.color || "#06b6d4" }}
      />

      {/* Patient */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="text-sm text-slate-800 truncate font-semibold">
            {appointment.patient?.name || "Paciente não identificado"}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Stethoscope className="w-3 h-3 text-slate-400 flex-shrink-0" />
          <span className="text-xs text-slate-500 truncate">
            {appointment.doctor?.name} • {appointment.doctor?.specialty}
          </span>
        </div>
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
    <div className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 overflow-hidden transition-all duration-300 hover:shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-100">
            <Calendar className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">Timeline de Hoje</h3>
            <p className="text-xs text-slate-500">
              {format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/schedule")}
          className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 font-semibold"
        >
          Ver Agenda
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-3">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Carregando agendamentos...</p>
          </div>
        ) : upcomingAppointments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium">Nenhum agendamento para hoje</p>
            <p className="text-slate-400 text-sm mt-1">Aproveite o dia livre!</p>
          </div>
        ) : (
          upcomingAppointments.slice(0, 6).map((appointment) => (
            <TimelineItem key={appointment.id} appointment={appointment} />
          ))
        )}
      </div>

      {/* Footer */}
      {upcomingAppointments.length > 6 && (
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
          <p className="text-xs text-slate-500 text-center font-medium">
            +{upcomingAppointments.length - 6} mais agendamentos hoje
          </p>
        </div>
      )}
    </div>
  );
}
