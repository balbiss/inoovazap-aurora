import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, User, Stethoscope, MoreVertical, Check, X, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Appointment, AppointmentStatus, useUpdateAppointment } from "@/hooks/useAppointments";
import { toast } from "sonner";

interface AppointmentListProps {
  appointments: Appointment[];
  isLoading: boolean;
}

const statusConfig: Record<AppointmentStatus, { label: string; className: string }> = {
  scheduled: { label: "Agendado", className: "status-scheduled" },
  confirmed: { label: "Confirmado", className: "status-confirmed" },
  completed: { label: "Realizado", className: "status-completed" },
  cancelled: { label: "Cancelado", className: "status-cancelled" },
  no_show: { label: "Não compareceu", className: "status-no-show" },
};

export function AppointmentList({ appointments, isLoading }: AppointmentListProps) {
  const updateAppointment = useUpdateAppointment();

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    try {
      await updateAppointment.mutateAsync({ id, status });
      toast.success(`Status atualizado para ${statusConfig[status].label}`);
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <p className="text-center text-slate-500">Carregando agendamentos...</p>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhum agendamento encontrado</p>
          <p className="text-sm text-slate-400 mt-1">Tente ajustar os filtros</p>
        </div>
      </div>
    );
  }

  // Group by date
  const groupedByDate = appointments.reduce((acc, apt) => {
    const dateKey = format(new Date(apt.start_time), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(apt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  return (
    <div className="space-y-4">
      {Object.entries(groupedByDate).map(([dateKey, dayAppointments]) => (
        <div key={dateKey} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {/* Date Header */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              {format(new Date(dateKey), "EEEE, d 'de' MMMM", { locale: ptBR })}
              <Badge variant="secondary" className="ml-2">
                {dayAppointments.length} {dayAppointments.length === 1 ? "consulta" : "consultas"}
              </Badge>
            </h3>
          </div>

          {/* Appointments */}
          <div className="divide-y divide-slate-100">
            {dayAppointments.map((apt) => {
              const status = statusConfig[apt.status as AppointmentStatus] || statusConfig.scheduled;
              
              return (
                <div key={apt.id} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Time & Patient */}
                    <div className="flex items-start gap-3 flex-1">
                      {/* Time */}
                      <div className="flex flex-col items-center min-w-[60px]">
                        <span className="text-sm font-semibold text-slate-800">
                          {format(new Date(apt.start_time), "HH:mm")}
                        </span>
                        <span className="text-xs text-slate-400">
                          {format(new Date(apt.end_time), "HH:mm")}
                        </span>
                      </div>

                      {/* Color bar */}
                      <div 
                        className="w-1 h-12 rounded-full flex-shrink-0"
                        style={{ backgroundColor: apt.doctor?.color || "#06b6d4" }}
                      />

                      {/* Patient Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="font-medium text-slate-800 truncate">
                            {apt.patient?.name || "Paciente não identificado"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Stethoscope className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="text-sm text-slate-500 truncate">
                            {apt.doctor?.name} • {apt.doctor?.specialty}
                          </span>
                        </div>
                        {apt.notes && (
                          <p className="text-xs text-slate-400 mt-1 truncate">
                            📝 {apt.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Status & Actions */}
                    <div className="flex items-center gap-2">
                      <Badge className={status.className}>
                        {status.label}
                      </Badge>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleStatusChange(apt.id, "confirmed")}>
                            <Check className="w-4 h-4 mr-2 text-emerald-600" />
                            Confirmar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(apt.id, "completed")}>
                            <Check className="w-4 h-4 mr-2 text-slate-600" />
                            Marcar Realizado
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(apt.id, "cancelled")}>
                            <X className="w-4 h-4 mr-2 text-rose-600" />
                            Cancelar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(apt.id, "no_show")}>
                            <AlertCircle className="w-4 h-4 mr-2 text-amber-600" />
                            Não Compareceu
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
