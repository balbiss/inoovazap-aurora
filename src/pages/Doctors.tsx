import { useState } from "react";
import { Plus, Stethoscope, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DoctorCard } from "@/components/doctors/DoctorCard";
import { DoctorList } from "@/components/doctors/DoctorList";
import { DoctorDialog } from "@/components/doctors/DoctorDialog";
import { useDoctors, Doctor } from "@/hooks/useDoctors";
import { useInstance } from "@/hooks/useInstance";
import { PatientDialog } from "@/components/patients/PatientDialog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useCreateAppointment } from "@/hooks/useAppointments";

export default function Doctors() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const { data: doctors, isLoading } = useDoctors();
  const { data: instance } = useInstance();
  const createAppointment = useCreateAppointment();
  const navigate = useNavigate();


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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="space-y-0.5">
          <h1 className="text-xl md:text-2xl font-semibold text-slate-800">
            Profissionais
          </h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium">
            Gerencie os médicos e especialistas da clínica
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className={cn(
                "h-8 px-3 rounded-md transition-all",
                viewMode === "list"
                  ? "bg-slate-100 text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <List className="w-4 h-4 mr-2" />
              Lista
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={cn(
                "h-8 px-3 rounded-md transition-all",
                viewMode === "grid"
                  ? "bg-slate-100 text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Cards
            </Button>
          </div>

          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Médico
          </Button>
        </div>
      </div>

      {/* Doctors Content */}
      {isLoading ? (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm min-h-[300px] flex items-center justify-center">
          <p className="text-slate-500">Carregando...</p>
        </div>
      ) : doctors && doctors.length > 0 ? (
        viewMode === "grid" ? (
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
          <DoctorList
            doctors={doctors}
            onEdit={handleEdit}
          />
        )
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
