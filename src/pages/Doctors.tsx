import { useState } from "react";
import { Plus, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NeonText } from "@/components/ui/NeonText";
import { GlassCard } from "@/components/ui/GlassCard";
import { DoctorCard } from "@/components/doctors/DoctorCard";
import { DoctorDialog } from "@/components/doctors/DoctorDialog";
import { useDoctors, Doctor } from "@/hooks/useDoctors";

export default function Doctors() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const { data: doctors, isLoading } = useDoctors();

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setEditingDoctor(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <NeonText as="h1" className="text-3xl md:text-4xl" glow={false}>
            Profissionais
          </NeonText>
          <p className="text-muted-foreground text-lg">
            Gerencie os médicos e especialistas da clínica
          </p>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Médico
        </Button>
      </div>

      {/* Doctors Grid */}
      {isLoading ? (
        <GlassCard className="min-h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </GlassCard>
      ) : doctors && doctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doctor) => (
            <DoctorCard 
              key={doctor.id} 
              doctor={doctor}
              onEdit={() => handleEdit(doctor)}
            />
          ))}
        </div>
      ) : (
        <GlassCard className="min-h-[300px] flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
            <Stethoscope className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-muted-foreground mb-2">Nenhum profissional cadastrado</p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Médico
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Doctor Dialog */}
      <DoctorDialog 
        open={isDialogOpen}
        onOpenChange={handleClose}
        doctor={editingDoctor}
      />
    </div>
  );
}
