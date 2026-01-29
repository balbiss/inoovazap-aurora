import { useState, useEffect } from "react";
import { Plus, Trash2, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useInstance } from "@/hooks/useInstance";

interface InsuranceType {
  id: string;
  name: string;
}

interface ClinicConfig {
  insurance_types?: InsuranceType[];
  [key: string]: unknown;
}

export function InsuranceSettings() {
  const { data: instance, refetch: refetchInstance } = useInstance();
  const [insuranceTypes, setInsuranceTypes] = useState<InsuranceType[]>([]);
  const [newInsurance, setNewInsurance] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (instance?.clinic_config) {
      const config = instance.clinic_config as ClinicConfig;
      setInsuranceTypes(config.insurance_types || []);
    }
  }, [instance]);

  const handleAddInsurance = async () => {
    if (!newInsurance.trim()) {
      toast.error("Digite o nome do convênio");
      return;
    }

    if (insuranceTypes.some((i) => i.name.toLowerCase() === newInsurance.trim().toLowerCase())) {
      toast.error("Este convênio já está cadastrado");
      return;
    }

    const updated = [
      ...insuranceTypes,
      { id: crypto.randomUUID(), name: newInsurance.trim() },
    ];

    await saveInsuranceTypes(updated);
    setNewInsurance("");
  };

  const handleRemoveInsurance = async (id: string) => {
    const updated = insuranceTypes.filter((i) => i.id !== id);
    await saveInsuranceTypes(updated);
  };

  const saveInsuranceTypes = async (types: InsuranceType[]) => {
    if (!instance) return;

    setIsSaving(true);
    try {
      const currentConfig = (instance.clinic_config as ClinicConfig) || {};
      const updatedConfig = {
        ...currentConfig,
        insurance_types: types,
      };

      const { error } = await supabase
        .from("instances")
        .update({ clinic_config: JSON.parse(JSON.stringify(updatedConfig)) })
        .eq("id", instance.id);

      if (error) throw error;

      setInsuranceTypes(types);
      await refetchInstance();
      toast.success("Convênios atualizados!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao salvar convênios", { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-50">
          <Shield className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-800">Convênios Aceitos</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure os planos de saúde aceitos pela clínica
          </p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Add new insurance */}
        <div className="flex gap-2">
          <Input
            value={newInsurance}
            onChange={(e) => setNewInsurance(e.target.value)}
            placeholder="Nome do convênio (ex: Unimed, Bradesco Saúde)"
            className="border-slate-200 flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddInsurance();
              }
            }}
          />
          <Button
            onClick={handleAddInsurance}
            disabled={isSaving || !newInsurance.trim()}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Insurance list */}
        {insuranceTypes.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Nenhum convênio cadastrado</p>
            <p className="text-xs text-slate-400 mt-1">
              Adicione os convênios aceitos pela clínica
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {insuranceTypes.map((insurance) => (
              <Badge
                key={insurance.id}
                variant="secondary"
                className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 group"
              >
                {insurance.name}
                <button
                  onClick={() => handleRemoveInsurance(insurance.id)}
                  className="ml-2 opacity-50 group-hover:opacity-100 transition-opacity"
                  disabled={isSaving}
                >
                  <Trash2 className="w-3 h-3 text-rose-500" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Count */}
        {insuranceTypes.length > 0 && (
          <p className="text-xs text-slate-400">
            {insuranceTypes.length} {insuranceTypes.length === 1 ? "convênio cadastrado" : "convênios cadastrados"}
          </p>
        )}

        {/* Particular note */}
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
          <p className="text-xs text-sky-700">
            <strong>Nota:</strong> O atendimento "Particular" está sempre disponível como opção padrão.
          </p>
        </div>
      </div>
    </div>
  );
}
