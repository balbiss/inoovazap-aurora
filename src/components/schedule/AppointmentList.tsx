import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, User, Stethoscope, MoreVertical, Check, X, AlertCircle, Trash2, MessageCircle, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Appointment, AppointmentStatus, useUpdateAppointment, useDeleteAppointment } from "@/hooks/useAppointments";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AppointmentListProps {
  appointments: Appointment[];
  isLoading: boolean;
}

const statusConfig = {
  scheduled: {
    label: "Agendado",
    className: "bg-blue-600 text-white border-transparent shadow-md",
  },
  confirmed: {
    label: "Confirmado",
    className: "bg-emerald-600 text-white border-transparent shadow-md",
  },
  completed: {
    label: "Realizado",
    className: "bg-slate-600 text-white border-transparent shadow-md",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-rose-600 text-white border-transparent shadow-md",
  },
  no_show: {
    label: "Não compareceu",
    className: "bg-amber-600 text-white border-transparent shadow-md",
  },
};

export function AppointmentList({ appointments, isLoading }: AppointmentListProps) {
  const updateAppointment = useUpdateAppointment();
  const deleteAppointment = useDeleteAppointment();

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    try {
      await updateAppointment.mutateAsync({ id, status });
      toast.success(`Status atualizado para ${statusConfig[status].label}`);

      // Automate WhatsApp message
      const appointment = appointments.find(a => a.id === id);
      if (appointment?.instance_id && appointment?.patient?.phone) {
        let message = "";
        const patientName = appointment.patient.name || "Paciente";
        const date = format(new Date(appointment.start_time), "dd/MM");
        const hour = format(new Date(appointment.start_time), "HH:mm");
        const doctorName = appointment.doctor?.name || "seu medico";

        if (status === "confirmed") {
          message = `Ola ${patientName}, seu agendamento para o dia ${date} as ${hour} foi confirmado com Dr(a) ${doctorName}. Ate logo!`;
        } else if (status === "cancelled") {
          message = `Ola ${patientName}, seu agendamento para o dia ${date} as ${hour} foi cancelado. Se desejar reagendar, entre em contato.`;
        } else if (status === "completed") {
          message = `Ola ${patientName}, agradecemos pela visita hoje. Seu atendimento com Dr(a) ${doctorName} foi concluido.`;
        } else if (status === "no_show") {
          message = `Ola ${patientName}, sentimos sua falta no agendamento de hoje as ${hour}. Para remarcar sua consulta, por favor entre em contato.`;
        }

        if (message) {
          supabase.functions.invoke("manage-instance", {
            body: {
              action: "send_text",
              instance_id: appointment.instance_id,
              phone: appointment.patient.phone,
              message: message
            },
          }).then(({ error }) => {
            if (error) console.error("Erro ao enviar mensagem automatica:", error);
            else toast.success("Notificacao enviada ao paciente");
          });
        }
      }
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAppointment.mutateAsync(id);
      toast.success("Agendamento excluído com sucesso");
    } catch {
      toast.error("Erro ao excluir agendamento");
    }
  };

  const handleSendWhatsApp = async (appointment: Appointment) => {
    if (!appointment.instance_id || !appointment.patient?.phone) {
      toast.error("Dados do paciente incompletos");
      return;
    }

    const promise = supabase.functions.invoke("manage-instance", {
      body: {
        action: "send_text",
        instance_id: appointment.instance_id,
        phone: appointment.patient.phone,
        message: `Olá *${appointment.patient.name}*!\n\nConfirmamos seu agendamento para o dia *${format(new Date(appointment.start_time), "dd/MM 'às' HH:mm")}* com o(a) Dr(a). *${appointment.doctor?.name}*.\n\nAté logo!`
      },
    });

    toast.promise(promise, {
      loading: 'Enviando mensagem...',
      success: 'Mensagem enviada com sucesso!',
      error: 'Erro ao enviar mensagem via WhatsApp'
    });
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
    // Force local date interpretation for the grouping key
    const date = new Date(apt.start_time);
    const dateKey = format(date, "yyyy-MM-dd");
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
              {(() => {
                const [y, m, d] = dateKey.split("-").map(Number);
                return format(new Date(y, m - 1, d), "EEEE, d 'de' MMMM", { locale: ptBR });
              })()}
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
                        <span className="text-sm font-bold text-teal-700">
                          {format(new Date(apt.start_time), "HH:mm")}
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
                        {(apt.appointment_type || apt.insurance) && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {apt.appointment_type && (
                              <Badge variant="outline" className="text-[10px] py-0 h-4 border-slate-200 text-slate-500">
                                {apt.appointment_type}
                              </Badge>
                            )}
                            {apt.insurance && (
                              <Badge variant="outline" className="text-[10px] py-0 h-4 border-teal-100 text-teal-600 bg-teal-50">
                                {apt.insurance}
                              </Badge>
                            )}
                          </div>
                        )}
                        {apt.rescheduled_from && (
                          <div className="flex items-center gap-1.5 mt-2 px-2 py-0.5 bg-amber-50 border border-amber-100 rounded text-[10px] text-amber-600 font-medium w-fit">
                            <History className="w-3 h-3" />
                            <span>Reagendado (era: {format(new Date(apt.rescheduled_from), "dd/MM HH:mm")})</span>
                          </div>
                        )}
                        {apt.notes && (
                          <p className="text-xs text-slate-400 mt-1 truncate">
                            📝 {apt.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Status & Actions */}
                    <div className="flex items-center gap-2">
                      {/* Mobile Status Trigger */}
                      <div className="md:hidden">
                        <Drawer>
                          <DrawerTrigger asChild>
                            <button className="text-left focus:outline-none focus:ring-2 focus:ring-teal-500 rounded-full">
                              <Badge className={cn("px-3 py-1 border-0 rounded-full font-bold whitespace-nowrap", status.className)}>
                                {status.label}
                              </Badge>
                            </button>
                          </DrawerTrigger>
                          <DrawerContent>
                            <DrawerHeader className="text-left">
                              <DrawerTitle>Atualizar Status</DrawerTitle>
                              <DrawerDescription>
                                Escolha o novo status para {apt.patient?.name}
                              </DrawerDescription>
                            </DrawerHeader>
                            <div className="p-4 grid grid-cols-1 gap-3">
                              <DrawerClose asChild>
                                <Button 
                                  variant="outline" 
                                  className="h-14 justify-start text-lg border-emerald-100 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                  onClick={() => handleStatusChange(apt.id, "confirmed")}
                                >
                                  <Check className="w-6 h-6 mr-3" />
                                  Confirmar Presença
                                </Button>
                              </DrawerClose>
                              <DrawerClose asChild>
                                <Button 
                                  variant="outline" 
                                  className="h-14 justify-start text-lg border-slate-100 text-slate-700 bg-slate-50 hover:bg-slate-100"
                                  onClick={() => handleStatusChange(apt.id, "completed")}
                                >
                                  <Check className="w-6 h-6 mr-3" />
                                  Concluir Atendimento
                                </Button>
                              </DrawerClose>
                              <DrawerClose asChild>
                                <Button 
                                  variant="outline" 
                                  className="h-14 justify-start text-lg border-rose-100 text-rose-700 bg-rose-50 hover:bg-rose-100"
                                  onClick={() => handleStatusChange(apt.id, "cancelled")}
                                >
                                  <X className="w-6 h-6 mr-3" />
                                  Cancelar Agendamento
                                </Button>
                              </DrawerClose>
                              <DrawerClose asChild>
                                <Button 
                                  variant="outline" 
                                  className="h-14 justify-start text-lg border-amber-100 text-amber-700 bg-amber-50 hover:bg-amber-100"
                                  onClick={() => handleStatusChange(apt.id, "no_show")}
                                >
                                  <AlertCircle className="w-6 h-6 mr-3" />
                                  Paciente não veio (Falta)
                                </Button>
                              </DrawerClose>
                              
                              <div className="pt-4 border-t border-slate-100">
                                <Button 
                                  variant="ghost" 
                                  className="w-full h-12 justify-center text-teal-600 font-semibold"
                                  onClick={() => handleSendWhatsApp(apt)}
                                >
                                  <MessageCircle className="w-5 h-5 mr-2" />
                                  Enviar WhatsApp Manual
                                </Button>
                              </div>
                            </div>
                            <DrawerFooter className="pt-2">
                              <DrawerClose asChild>
                                <Button variant="ghost">Fechar</Button>
                              </DrawerClose>
                            </DrawerFooter>
                          </DrawerContent>
                        </Drawer>
                      </div>

                      {/* Desktop Status Badge (Non-clickable statically, actions in dropdown) */}
                      <Badge className={cn("hidden md:block px-3 py-1 border-0 rounded-full font-bold", status.className)}>
                        {status.label}
                      </Badge>

                      <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleSendWhatsApp(apt)}>
                              <MessageCircle className="w-4 h-4 mr-2 text-teal-600" />
                              Enviar WhatsApp
                            </DropdownMenuItem>
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
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-rose-600 focus:text-rose-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir agendamento?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. O agendamento de {apt.patient?.name} será removido permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(apt.id)}
                              className="bg-rose-600 text-white hover:bg-rose-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
