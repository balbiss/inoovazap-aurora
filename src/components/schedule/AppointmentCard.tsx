import { format } from "date-fns";
import { User, CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";
import { Appointment } from "@/hooks/useAppointments";
import { cn } from "@/lib/utils";

interface AppointmentCardProps {
  appointment: Appointment;
  compact?: boolean;
}

const statusConfig = {
  scheduled: {
    icon: Clock,
    bgClass: "bg-sky-50 border-sky-200 hover:bg-sky-100",
    iconClass: "text-sky-600",
    textClass: "text-sky-700",
  },
  confirmed: {
    icon: CheckCircle,
    bgClass: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
    iconClass: "text-emerald-600",
    textClass: "text-emerald-700",
  },
  completed: {
    icon: CheckCircle,
    bgClass: "bg-slate-50 border-slate-200 hover:bg-slate-100 opacity-70",
    iconClass: "text-slate-500",
    textClass: "text-slate-600",
  },
  cancelled: {
    icon: XCircle,
    bgClass: "bg-rose-50 border-rose-200 hover:bg-rose-100 opacity-70",
    iconClass: "text-rose-500",
    textClass: "text-rose-600 line-through",
  },
  no_show: {
    icon: AlertTriangle,
    bgClass: "bg-rose-50 border-rose-200 hover:bg-rose-100",
    iconClass: "text-rose-600",
    textClass: "text-rose-700",
  },
};

export function AppointmentCard({ appointment, compact }: AppointmentCardProps) {
  const status = statusConfig[appointment.status];
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
          <p className="text-xs text-slate-500">
            {format(new Date(appointment.start_time), "HH:mm")} - {format(new Date(appointment.end_time), "HH:mm")}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {appointment.doctor?.name} • {appointment.doctor?.specialty}
          </p>
        </div>
        <StatusIcon className={cn("w-4 h-4 flex-shrink-0", status.iconClass)} />
      </div>
    </div>
  );
}
