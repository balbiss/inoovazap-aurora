import { Pencil, Trash2, User, Clock, Calendar, AlertCircle } from "lucide-react";
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
import { Doctor, useDeleteDoctor } from "@/hooks/useDoctors";
import { cn } from "@/lib/utils";

interface DoctorCardProps {
  doctor: Doctor;
  onEdit: () => void;
}

const WEEK_DAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function DoctorCard({ doctor, onEdit }: DoctorCardProps) {
  const deleteDoctor = useDeleteDoctor();

  const handleDelete = async () => {
    try {
      await deleteDoctor.mutateAsync(doctor.id);
      toast.success("Profissional excluído com sucesso!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao excluir profissional", { description: message });
    }
  };

  const workDaysLabel = doctor.schedule_config.work_days
    .map((d) => WEEK_DAYS_SHORT[d])
    .join(", ");

  const hoursLabel = `${doctor.schedule_config.hours.open} - ${doctor.schedule_config.hours.close}`;
  const blockedCount = doctor.schedule_config.blocked_dates.length;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Color bar */}
      <div className="h-1.5" style={{ backgroundColor: doctor.color }} />

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: `${doctor.color}15` }}
          >
            {doctor.avatar_url ? (
              <img
                src={doctor.avatar_url}
                alt={doctor.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-7 h-7" style={{ color: doctor.color }} />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-800 truncate">
              {doctor.name}
            </h3>
            <p className="text-sm text-slate-500 truncate">
              {doctor.specialty}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant="outline"
                className={cn(
                  doctor.active
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
                )}
              >
                {doctor.active ? "Ativo" : "Inativo"}
              </Badge>
              <span className="text-xs text-slate-500">
                {doctor.default_duration} min/consulta
              </span>
            </div>
          </div>
        </div>

        {/* Schedule Info */}
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{workDaysLabel || "Nenhum dia configurado"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="w-4 h-4 text-slate-400" />
            <div className="flex flex-col">
              <span>{hoursLabel}</span>
              {doctor.schedule_config.hours.lunch_start !== doctor.schedule_config.hours.lunch_end && (
                <span className="text-xs text-slate-400">
                  Intervalo: {doctor.schedule_config.hours.lunch_start} - {doctor.schedule_config.hours.lunch_end}
                </span>
              )}
            </div>
          </div>
          {blockedCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle className="w-4 h-4" />
              <span>{blockedCount} data(s) bloqueada(s)</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-slate-600 hover:text-slate-800"
          >
            <Pencil className="w-4 h-4 mr-1" />
            Editar
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
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
                  onClick={handleDelete}
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
}
