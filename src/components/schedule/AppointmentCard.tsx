import { format } from "date-fns";
import { User, CheckCircle, Clock, XCircle, AlertTriangle, History } from "lucide-react";
import { Appointment } from "@/hooks/useAppointments";
import { cn } from "@/lib/utils";

interface AppointmentCardProps {
  appointment: Appointment;
  compact?: boolean;
}

const statusConfig = {
  scheduled: {
    icon: Clock,
    bgClass: "bg-blue-600 border-transparent hover:bg-blue-700 text-white",
    iconClass: "text-white/90",
    textClass: "text-white",
  },
  confirmed: {
    icon: CheckCircle,
    bgClass: "bg-emerald-600 border-transparent hover:bg-emerald-700 text-white",
    iconClass: "text-white/90",
    textClass: "text-white",
  },
  completed: {
    icon: CheckCircle,
    bgClass: "bg-slate-50 border-slate-200 hover:bg-slate-100 opacity-70",
    iconClass: "text-slate-500",
    textClass: "text-slate-600",
  },
  cancelled: {
    icon: XCircle,
    bgClass: "bg-rose-600 border-transparent hover:bg-rose-700 text-white opacity-90",
    iconClass: "text-white/90",
    textClass: "text-white",
  },
  no_show: {
    icon: AlertTriangle,
    bgClass: "bg-amber-600 border-transparent hover:bg-amber-700 text-white",
    iconClass: "text-white/90",
    textClass: "text-white",
  },
};

export function AppointmentCard({ appointment, compact }: AppointmentCardProps) {
  const status = statusConfig[appointment.status as keyof typeof statusConfig] || statusConfig.scheduled;
  const StatusIcon = status.icon;
  const doctorColor = appointment.doctor?.color || "#0d9488";

  if (compact) {
    return (
      <div
        className={cn(
          "p-2 rounded-md border cursor-pointer transition-colors",
          status.bgClass
        )}
        style={{ borderLeftWidth: 3, borderLeftColor: doctorColor }}
      >
        <div className="flex items-center gap-1">
          <StatusIcon className={cn("w-3 h-3", status.iconClass)} />
          <span className={cn("text-xs font-medium truncate", status.textClass)}>
            {appointment.patient?.name || "Paciente"}
          </span>
        </div>
        <div className="text-[10px] text-slate-500 truncate">
          {appointment.doctor?.name}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-colors",
        status.bgClass
      )}
      style={{ borderLeftWidth: 4, borderLeftColor: doctorColor }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-slate-400" />
            <span className={cn("text-sm font-medium truncate", status.textClass)}>
              {appointment.patient?.name || "Paciente não identificado"}
            </span>
          </div>
          <p className="text-xs font-semibold text-teal-700">
            {format(new Date(appointment.start_time), "HH:mm")}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {appointment.doctor?.name} • {appointment.doctor?.specialty}
          </p>
          {appointment.rescheduled_from && (
            <div className="mt-2 flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 border border-amber-100 rounded text-[10px] text-amber-600 font-medium w-fit">
              <History className="w-3 h-3" />
              <span>Reagendado (era: {format(new Date(appointment.rescheduled_from), "dd/MM HH:mm")})</span>
            </div>
          )}
        </div>
        <StatusIcon className={cn("w-4 h-4 flex-shrink-0", status.iconClass)} />
      </div>
    </div>
  );
}
