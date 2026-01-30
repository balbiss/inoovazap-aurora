import { Pencil, Trash2, User, Clock, Calendar, AlertCircle, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Doctor, useDeleteDoctor } from "@/hooks/useDoctors";
import { cn } from "@/lib/utils";

interface DoctorListProps {
  doctors: Doctor[];
  onEdit: (doctor: Doctor) => void;
}

const WEEK_DAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function DoctorList({ doctors, onEdit }: DoctorListProps) {
  const deleteDoctor = useDeleteDoctor();

  const handleDelete = async (doctor: Doctor) => {
    try {
      await deleteDoctor.mutateAsync(doctor.id);
      toast.success("Profissional excluído com sucesso!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao excluir profissional", { description: message });
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Profissional</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Especialidade</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Agenda</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Duração</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {doctors.map((doctor) => {
              const workDaysLabel = doctor.schedule_config.work_days
                .map((d) => WEEK_DAYS_SHORT[d])
                .join(", ");
              const hoursLabel = `${doctor.schedule_config.hours.open} - ${doctor.schedule_config.hours.close}`;
              const blockedCount = doctor.schedule_config.blocked_dates.length;

              return (
                <tr key={doctor.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${doctor.color}15` }}
                      >
                        {doctor.avatar_url ? (
                          <img
                            src={doctor.avatar_url}
                            alt={doctor.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5" style={{ color: doctor.color }} />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{doctor.name}</div>
                        <div className="text-xs" style={{ color: doctor.color }}>● Identificador</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-slate-600">{doctor.specialty}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-medium",
                        doctor.active
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      )}
                    >
                      {doctor.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{workDaysLabel || "Não configurado"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{hoursLabel}</span>
                        {doctor.schedule_config.hours.lunch_start !== doctor.schedule_config.hours.lunch_end && (
                          <span className="text-slate-400 ml-1">
                            (Almoço: {doctor.schedule_config.hours.lunch_start}-{doctor.schedule_config.hours.lunch_end})
                          </span>
                        )}
                      </div>
                      {blockedCount > 0 && (
                        <div className="flex items-center gap-1 text-amber-600">
                          <AlertCircle className="w-3 h-3" />
                          <span>{blockedCount} bloqueio(s)</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {doctor.default_duration} min
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-slate-600"
                        onClick={() => onEdit(doctor)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir profissional?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. O profissional "{doctor.name}" será removido permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(doctor)}
                              className="bg-rose-600 text-white hover:bg-rose-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
