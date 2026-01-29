import { useState } from "react";
import { Plus, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
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
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-800">
            Profissionais
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gerencie os médicos e especialistas da clínica
          </p>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Médico
        </Button>
      </div>

      {/* Doctors Grid */}
      {isLoading ? (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm min-h-[300px] flex items-center justify-center">
          <p className="text-slate-500">Carregando...</p>
        </div>
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
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm min-h-[300px] flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <Stethoscope className="w-8 h-8 text-slate-400" />
          </div>
          <div className="text-center">
            <p className="text-slate-500 mb-2">Nenhum profissional cadastrado</p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Médico
            </Button>
          </div>
        </div>
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
