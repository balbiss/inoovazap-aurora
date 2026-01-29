import { useState } from "react";
import { Plus, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PatientTable } from "@/components/patients/PatientTable";
import { PatientDialog } from "@/components/patients/PatientDialog";
import { usePatients, Patient } from "@/hooks/usePatients";

export default function Patients() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: patients, isLoading } = usePatients(searchQuery);

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient);
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setEditingPatient(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-800">
            Pacientes
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gerencie a base de pacientes da clínica
          </p>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Paciente
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar por nome, telefone ou email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border-slate-200"
        />
      </div>

      {/* Patients Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm min-h-[300px] flex items-center justify-center">
          <p className="text-slate-500">Carregando...</p>
        </div>
      ) : patients && patients.length > 0 ? (
        <PatientTable 
          patients={patients}
          onEdit={handleEdit}
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm min-h-[300px] flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <div className="text-center">
            <p className="text-slate-500 mb-2">
              {searchQuery ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setIsDialogOpen(true)}
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Paciente
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Patient Dialog */}
      <PatientDialog 
        open={isDialogOpen}
        onOpenChange={handleClose}
        patient={editingPatient}
      />
    </div>
  );
}
