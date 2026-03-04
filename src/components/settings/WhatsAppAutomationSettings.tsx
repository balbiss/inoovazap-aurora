import { useState, useEffect } from "react";
import { Bell, Clock, Loader2, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useInstance } from "@/hooks/useInstance";
import { GlassCard } from "@/components/ui/GlassCard";

interface AutomationConfig {
    enabled: boolean;
    lead_time_hours: number;
}

export function WhatsAppAutomationSettings() {
    const { data: instance, refetch: refetchInstance } = useInstance();
    const [leadTime, setLeadTime] = useState(24);
    const [enabled, setEnabled] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();


    useEffect(() => {
        if (instance?.clinic_config) {
            const config = (instance.clinic_config as any).automation as AutomationConfig;
            if (config) {
                setEnabled(config.enabled || false);
                setLeadTime(config.lead_time_hours || 24);
            }
        }
    }, [instance]);

    const handleSave = async () => {
        if (!instance) return;

        setIsSaving(true);
        try {
            const currentConfig = (instance.clinic_config as any) || {};
            const updatedConfig = {
                ...currentConfig,
                automation: {
                    enabled,
                    lead_time_hours: Number(leadTime),
                },
            };

            const { error } = await supabase
                .from("instances")
                .update({ clinic_config: updatedConfig })
                .eq("id", instance.id);

            if (error) throw error;

            await refetchInstance();
            toast.success("Configurações de automação atualizadas!");
        } catch (error: any) {
            toast.error("Erro ao salvar configurações", { description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <GlassCard className="mt-6">
            <div className="px-6 py-4 border-b border-slate-200/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-teal-50">
                        <Bell className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-slate-800">Automação de Lembretes</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Envio automático de mensagens para o paciente antes da consulta
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Switch
                        checked={enabled}
                        onCheckedChange={(val) => {
                            setEnabled(val);
                        }}
                    />
                </div>
            </div>

            <div className={cn("p-6 space-y-6 transition-opacity duration-200", !enabled && "opacity-50 pointer-events-none")}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            Tempo de antecedência (horas)
                        </Label>
                        <div className="flex items-center gap-3">
                            <Input
                                type="number"
                                min="1"
                                max="168"
                                value={leadTime}
                                onChange={(e) => setLeadTime(Number(e.target.value))}
                                className="max-w-[120px]"
                            />
                            <span className="text-sm text-slate-500">horas antes do agendamento</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                            O sistema enviará o lembrete automaticamente quando faltar este tempo para a consulta.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Salvar Configurações
                    </Button>
                </div>
            </div>
        </GlassCard>
    );
}

// Added helper for cn since I might need it and it wasn't in imports
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
