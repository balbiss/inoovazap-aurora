import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateDoctor, useUpdateDoctor, Doctor, DoctorInput } from "@/hooks/useDoctors";

interface DoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor?: Doctor | null;
}

const colorOptions = [
  { value: "#06b6d4", label: "Ciano" },
  { value: "#10b981", label: "Verde" },
  { value: "#8b5cf6", label: "Violeta" },
  { value: "#f43f5e", label: "Rosa" },
  { value: "#f59e0b", label: "Âmbar" },
  { value: "#3b82f6", label: "Azul" },
];

const durationOptions = [
  { value: "15", label: "15 minutos" },
  { value: "30", label: "30 minutos" },
  { value: "45", label: "45 minutos" },
  { value: "60", label: "1 hora" },
];

export function DoctorDialog({ open, onOpenChange, doctor }: DoctorDialogProps) {
  const isEditing = !!doctor;
  const createDoctor = useCreateDoctor();
  const updateDoctor = useUpdateDoctor();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<DoctorInput>({
    defaultValues: {
      name: "",
      specialty: "",
      color: "#06b6d4",
      default_duration: 30,
      active: true,
    },
  });

  useEffect(() => {
    if (doctor) {
      reset({
        name: doctor.name,
        specialty: doctor.specialty,
        color: doctor.color,
        default_duration: doctor.default_duration,
        active: doctor.active,
      });
    } else {
      reset({
        name: "",
        specialty: "",
        color: "#06b6d4",
        default_duration: 30,
        active: true,
      });
    }
  }, [doctor, reset]);

  const selectedColor = watch("color");
  const isActive = watch("active");

  const onSubmit = async (data: DoctorInput) => {
    try {
      if (isEditing && doctor) {
        await updateDoctor.mutateAsync({ id: doctor.id, ...data });
        toast.success("Profissional atualizado com sucesso!");
      } else {
        await createDoctor.mutateAsync(data);
        toast.success("Profissional criado com sucesso!");
      }

      reset();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(isEditing ? "Erro ao atualizar profissional" : "Erro ao criar profissional", {
        description: error.message,
      });
    }
  };

  const isPending = createDoctor.isPending || updateDoctor.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Profissional" : "Adicionar Profissional"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              placeholder="Dr. Nome Sobrenome"
              {...register("name", { required: true })}
            />
          </div>

          {/* Specialty */}
          <div className="space-y-2">
            <Label htmlFor="specialty">Especialidade *</Label>
            <Input
              id="specialty"
              placeholder="Cardiologia, Dermatologia, etc."
              {...register("specialty", { required: true })}
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Cor na Agenda</Label>
            <div className="flex items-center gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setValue("color", color.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color.value
                      ? "border-white scale-110"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Duração Padrão da Consulta</Label>
            <Select
              value={String(watch("default_duration"))}
              onValueChange={(v) => setValue("default_duration", parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active */}
          <div className="flex items-center justify-between">
            <Label htmlFor="active">Profissional Ativo</Label>
            <Switch
              id="active"
              checked={isActive}
              onCheckedChange={(checked) => setValue("active", checked)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white"
            >
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
