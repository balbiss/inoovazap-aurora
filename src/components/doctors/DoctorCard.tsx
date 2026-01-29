import { Pencil, Trash2, User } from "lucide-react";
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

export function DoctorCard({ doctor, onEdit }: DoctorCardProps) {
  const deleteDoctor = useDeleteDoctor();

  const handleDelete = async () => {
    try {
      await deleteDoctor.mutateAsync(doctor.id);
      toast.success("Profissional excluído com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao excluir profissional", {
        description: error.message,
      });
    }
  };

  return (
    <div className="glass-card p-5 rounded-2xl">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${doctor.color}20` }}
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
          <h3 className="font-semibold text-foreground truncate">
            {doctor.name}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            {doctor.specialty}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              className={cn(
                doctor.active
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-slate-500/20 text-slate-400 border-slate-500/30"
              )}
            >
              {doctor.active ? "Ativo" : "Inativo"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {doctor.default_duration} min/consulta
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="text-muted-foreground hover:text-foreground"
        >
          <Pencil className="w-4 h-4 mr-1" />
          Editar
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
