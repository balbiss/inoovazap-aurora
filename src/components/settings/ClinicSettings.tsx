import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2, LogOut, Settings2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useInstance } from "@/hooks/useInstance";

interface ClinicConfig {
  slot_duration: number;
  buffer: number;
  min_advance_hours: number;
}

interface ClinicFormData {
  company_name: string;
  full_name: string;
  phone: string;
}

const defaultConfig: ClinicConfig = {
  slot_duration: 30,
  buffer: 10,
  min_advance_hours: 2,
};

export function ClinicSettings() {
  const navigate = useNavigate();
  const { data: instance, refetch: refetchInstance } = useInstance();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<ClinicConfig>(defaultConfig);

  const { register, handleSubmit, reset } = useForm<ClinicFormData>();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile) {
          reset({
            company_name: profile.company_name || "",
            full_name: profile.full_name || "",
            phone: profile.phone || "",
          });
        }

        // Load schedule config from instance (only general rules now)
        if (instance?.schedule_config) {
          const savedConfig = instance.schedule_config as unknown as ClinicConfig;
          setConfig({
            ...defaultConfig,
            slot_duration: savedConfig.slot_duration || defaultConfig.slot_duration,
            buffer: savedConfig.buffer || defaultConfig.buffer,
            min_advance_hours: savedConfig.min_advance_hours || defaultConfig.min_advance_hours,
          });
        }
      }
      setIsLoading(false);
    };

    fetchData();
  }, [reset, instance]);

  const onSubmit = async (data: ClinicFormData) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update(data)
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Update instance schedule_config (only general rules)
      if (instance) {
        const { error: instanceError } = await supabase
          .from("instances")
          .update({ schedule_config: JSON.parse(JSON.stringify(config)) })
          .eq("id", instance.id);

        if (instanceError) throw instanceError;
      }

      await refetchInstance();
      toast.success("Configurações salvas com sucesso!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error("Erro ao salvar configurações", { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair", { description: error.message });
    } else {
      navigate("/auth", { replace: true });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
        <p className="text-slate-500 text-center">Carregando...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Dados da Clínica */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-50">
            <Building2 className="w-5 h-5 text-teal-600" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Dados da Clínica</h3>
        </div>
        <div className="p-6 grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="company_name" className="text-slate-700">Nome da Clínica</Label>
            <Input
              id="company_name"
              placeholder="Nome da sua clínica"
              className="border-slate-200"
              {...register("company_name")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-slate-700">Responsável</Label>
            <Input
              id="full_name"
              placeholder="Nome do responsável"
              className="border-slate-200"
              {...register("full_name")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-slate-700">Telefone</Label>
            <Input
              id="phone"
              placeholder="(11) 99999-0000"
              className="border-slate-200"
              {...register("phone")}
            />
          </div>
        </div>
      </div>

      {/* Regras de Agendamento */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50">
            <Settings2 className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-800">Regras de Agendamento</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Configurações gerais da clínica. Os horários e bloqueios são configurados por profissional.
            </p>
          </div>
        </div>
        <div className="p-6 grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-slate-700">Duração Padrão (min)</Label>
            <Input
              type="number"
              min={10}
              max={120}
              value={config.slot_duration}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  slot_duration: parseInt(e.target.value) || 30,
                }))
              }
              className="border-slate-200"
            />
            <p className="text-xs text-slate-400">Tempo padrão de cada consulta</p>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700">Intervalo entre Consultas (min)</Label>
            <Input
              type="number"
              min={0}
              max={60}
              value={config.buffer}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  buffer: parseInt(e.target.value) || 0,
                }))
              }
              className="border-slate-200"
            />
            <p className="text-xs text-slate-400">Tempo de preparo entre pacientes</p>
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700">Antecedência Mínima (horas)</Label>
            <Input
              type="number"
              min={0}
              max={72}
              value={config.min_advance_hours}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  min_advance_hours: parseInt(e.target.value) || 0,
                }))
              }
              className="border-slate-200"
            />
            <p className="text-xs text-slate-400">Limite para novos agendamentos</p>
          </div>
        </div>
      </div>

      {/* Info sobre horários por médico */}
      <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
        <p className="text-sm text-sky-800">
          <strong>Dica:</strong> Os horários de trabalho e bloqueios de agenda agora são configurados individualmente para cada profissional. 
          Acesse <a href="/doctors" className="underline font-medium">Profissionais</a> para editar.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleLogout}
          className="text-rose-600 border-rose-200 hover:bg-rose-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair da Conta
        </Button>

        <Button
          type="submit"
          disabled={isSaving}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Salvar Configurações
        </Button>
      </div>
    </form>
  );
}
