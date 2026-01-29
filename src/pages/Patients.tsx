import { useState } from "react";
import { Plus, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NeonText } from "@/components/ui/NeonText";
import { GlassCard } from "@/components/ui/GlassCard";
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
          <NeonText as="h1" className="text-3xl md:text-4xl" glow={false}>
            Pacientes
          </NeonText>
          <p className="text-muted-foreground text-lg">
            Gerencie a base de pacientes da clínica
          </p>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Paciente
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, telefone ou email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Patients Table */}
      {isLoading ? (
        <GlassCard className="min-h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Carregando...</p>
        </GlassCard>
      ) : patients && patients.length > 0 ? (
        <PatientTable 
          patients={patients}
          onEdit={handleEdit}
        />
      ) : (
        <GlassCard className="min-h-[300px] flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-muted-foreground mb-2">
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
        </GlassCard>
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
