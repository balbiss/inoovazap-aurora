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
    bgClass: "bg-cyan-500/20 border-cyan-500/30 hover:bg-cyan-500/30",
    iconClass: "text-cyan-400",
  },
  confirmed: {
    icon: CheckCircle,
    bgClass: "bg-emerald-500/20 border-emerald-500/30 hover:bg-emerald-500/30",
    iconClass: "text-emerald-400",
  },
  completed: {
    icon: CheckCircle,
    bgClass: "bg-slate-500/20 border-slate-500/30 hover:bg-slate-500/30 opacity-60",
    iconClass: "text-slate-400",
  },
  cancelled: {
    icon: XCircle,
    bgClass: "bg-rose-500/20 border-rose-500/30 hover:bg-rose-500/30 opacity-60",
    iconClass: "text-rose-400",
  },
  no_show: {
    icon: AlertTriangle,
    bgClass: "bg-rose-500/20 border-rose-500/30 hover:bg-rose-500/30",
    iconClass: "text-rose-400",
  },
};

export function AppointmentCard({ appointment, compact }: AppointmentCardProps) {
  const status = statusConfig[appointment.status];
  const StatusIcon = status.icon;
  const doctorColor = appointment.doctor?.color || "#06b6d4";

  if (compact) {
    return (
      <div
        className={cn(
          "p-2 rounded-lg border cursor-pointer transition-colors",
          status.bgClass
        )}
        style={{ borderLeftWidth: 3, borderLeftColor: doctorColor }}
      >
        <div className="flex items-center gap-1">
          <StatusIcon className={cn("w-3 h-3", status.iconClass)} />
          <span className="text-xs font-medium text-foreground truncate">
            {appointment.patient?.name || "Paciente"}
          </span>
        </div>
        <div className="text-[10px] text-muted-foreground truncate">
          {appointment.doctor?.name}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-3 rounded-xl border cursor-pointer transition-colors",
        status.bgClass
      )}
      style={{ borderLeftWidth: 4, borderLeftColor: doctorColor }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground truncate">
              {appointment.patient?.name || "Paciente não identificado"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {format(new Date(appointment.start_time), "HH:mm")} - {format(new Date(appointment.end_time), "HH:mm")}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {appointment.doctor?.name} • {appointment.doctor?.specialty}
          </p>
        </div>
        <StatusIcon className={cn("w-4 h-4 flex-shrink-0", status.iconClass)} />
      </div>
    </div>
  );
}
