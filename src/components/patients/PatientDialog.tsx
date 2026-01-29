import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreatePatient, useUpdatePatient, Patient, PatientInput } from "@/hooks/usePatients";

// CPF mask helper
function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
}

interface PatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: Patient | null;
  onSuccess?: (patient: Patient) => void;
}

export function PatientDialog({ open, onOpenChange, patient, onSuccess }: PatientDialogProps) {
  const isEditing = !!patient;
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();
  const [cpfValue, setCpfValue] = useState(patient?.cpf ? formatCPF(patient.cpf) : "");

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PatientInput>({
    defaultValues: patient ? {
      name: patient.name || "",
      phone: patient.phone || "",
      email: patient.email || "",
      birth_date: patient.birth_date || "",
      cpf: patient.cpf || "",
      health_insurance: patient.health_insurance || "",
      notes: patient.notes || "",
    } : {
      name: "",
      phone: "",
      email: "",
      birth_date: "",
      cpf: "",
      health_insurance: "",
      notes: "",
    },
  });

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpfValue(formatted);
    setValue("cpf", formatted.replace(/\D/g, ""));
  };

  const onSubmit = async (data: PatientInput) => {
    try {
      let result: Patient;
      
      if (isEditing && patient) {
        result = await updatePatient.mutateAsync({ id: patient.id, ...data });
        toast.success("Paciente atualizado com sucesso!");
      } else {
        result = await createPatient.mutateAsync(data);
        toast.success("Paciente criado com sucesso!");
      }

      reset();
      setCpfValue("");
      onOpenChange(false);
      onSuccess?.(result);
    } catch (error: any) {
      toast.error(isEditing ? "Erro ao atualizar paciente" : "Erro ao criar paciente", {
        description: error.message,
      });
    }
  };

  const isPending = createPatient.isPending || updatePatient.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Paciente" : "Novo Paciente"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              placeholder="Nome do paciente"
              {...register("name", { required: true })}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone *</Label>
            <Input
              id="phone"
              placeholder="(11) 99999-0000"
              {...register("phone", { required: true })}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemplo.com"
              {...register("email")}
            />
          </div>

          {/* Birth Date */}
          <div className="space-y-2">
            <Label htmlFor="birth_date">Data de Nascimento</Label>
            <Input
              id="birth_date"
              type="date"
              {...register("birth_date")}
            />
          </div>

          {/* CPF */}
          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              placeholder="000.000.000-00"
              value={cpfValue}
              onChange={handleCPFChange}
              inputMode="numeric"
            />
          </div>

          {/* Health Insurance */}
          <div className="space-y-2">
            <Label htmlFor="health_insurance">Convênio</Label>
            <Input
              id="health_insurance"
              placeholder="Nome do convênio"
              {...register("health_insurance")}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Observações sobre o paciente..."
              {...register("notes")}
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
