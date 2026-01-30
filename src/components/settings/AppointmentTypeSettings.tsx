import { useState, useEffect } from "react";
import { Plus, Trash2, ClipboardList, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useInstance } from "@/hooks/useInstance";

interface AppointmentType {
    id: string;
    name: string;
}

interface ClinicConfig {
    appointment_types?: AppointmentType[];
    insurance_types?: { id: string; name: string }[];
    [key: string]: unknown;
}

export function AppointmentTypeSettings() {
    const { data: instance, refetch: refetchInstance } = useInstance();
    const [appointmentTypes, setAppointmentTypes] = useState<AppointmentType[]>([]);
    const [newType, setNewType] = useState("");
    const [returnDays, setReturnDays] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (instance?.clinic_config) {
            const config = instance.clinic_config as ClinicConfig;
            setAppointmentTypes(config.appointment_types || []);
            setReturnDays(config.return_period_days?.toString() || "");
        }
    }, [instance]);

    const handleAddType = async () => {
        if (!newType.trim()) {
            toast.error("Digite o nome do tipo de consulta");
            return;
        }

        if (appointmentTypes.some((t) => t.name.toLowerCase() === newType.trim().toLowerCase())) {
            toast.error("Este tipo de consulta já está cadastrado");
            return;
        }

        const updated = [
            ...appointmentTypes,
            { id: crypto.randomUUID(), name: newType.trim() },
        ];

        await saveAppointmentTypes(updated);
        setNewType("");
    };

    const handleRemoveType = async (id: string) => {
        const updated = appointmentTypes.filter((t) => t.id !== id);
        await saveAppointmentTypes(updated);
    };

    const saveAppointmentTypes = async (types: AppointmentType[]) => {
        if (!instance) return;

        setIsSaving(true);
        try {
            const currentConfig = (instance.clinic_config as ClinicConfig) || {};
            const updatedConfig = {
                ...currentConfig,
                appointment_types: types,
            };

            const { error } = await supabase
                .from("instances")
                .update({ clinic_config: JSON.parse(JSON.stringify(updatedConfig)) })
                .eq("id", instance.id);

            if (error) throw error;

            setAppointmentTypes(types);
            await refetchInstance();
            toast.success("Tipos de consulta atualizados!");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Erro desconhecido";
            toast.error("Erro ao salvar tipos de consulta", { description: message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveReturnDays = async () => {
        if (!instance) return;

        setIsSaving(true);
        try {
            const currentConfig = (instance.clinic_config as ClinicConfig) || {};
            const updatedConfig = {
                ...currentConfig,
                return_period_days: parseInt(returnDays) || 0,
            };

            const { error } = await supabase
                .from("instances")
                .update({ clinic_config: JSON.parse(JSON.stringify(updatedConfig)) })
                .eq("id", instance.id);

            if (error) throw error;

            await refetchInstance();
            toast.success("Regra de retorno salva!");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Erro desconhecido";
            toast.error("Erro ao salvar regra", { description: message });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-50">
                    <ClipboardList className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-slate-800">Tipos de Consulta</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Configure as opções de atendimento (ex: Primeira Consulta, Retorno, Exame)
                    </p>
                </div>
            </div>

            <div className="p-6 space-y-4">
                {/* Add new type */}
                <div className="flex gap-2">
                    <Input
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                        placeholder="Nome do tipo (ex: Consulta de Rotina, Retorno)"
                        className="border-slate-200 flex-1"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddType();
                            }
                        }}
                    />
                    <Button
                        onClick={handleAddType}
                        disabled={isSaving || !newType.trim()}
                        className="bg-teal-600 hover:bg-teal-700 text-white"
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Plus className="w-4 h-4" />
                        )}
                    </Button>
                </div>

                {/* List */}
                {appointmentTypes.length === 0 ? (
                    <div className="text-center py-8">
                        <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">Nenhum tipo cadastrado</p>
                        <p className="text-xs text-slate-400 mt-1">
                            Adicione as modalidades de consulta da sua clínica
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {appointmentTypes.map((type) => (
                            <Badge
                                key={type.id}
                                variant="secondary"
                                className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 group"
                            >
                                {type.name}
                                <button
                                    onClick={() => handleRemoveType(type.id)}
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
                {appointmentTypes.length > 0 && (
                    <p className="text-xs text-slate-400">
                        {appointmentTypes.length} {appointmentTypes.length === 1 ? "tipo cadastrado" : "tipos cadastrados"}
                    </p>
                )}

                <div className="pt-6 border-t border-slate-100">
                    <Label className="text-slate-700 font-semibold">Regra de Retorno (Bloqueio por CPF)</Label>
                    <div className="flex items-center gap-4 mt-2">
                        <div className="flex-1">
                            <Input
                                type="number"
                                min={0}
                                placeholder="Ex: 15"
                                value={returnDays}
                                onChange={(e) => setReturnDays(e.target.value)}
                                className="border-slate-200"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">
                                Dias mínimos entre consultas concluídas para o mesmo CPF. (0 para desativar)
                            </p>
                        </div>
                        <Button
                            onClick={handleSaveReturnDays}
                            disabled={isSaving}
                            variant="outline"
                            className="border-teal-200 text-teal-700 hover:bg-teal-50"
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Regra"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
