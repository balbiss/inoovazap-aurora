import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { 
  Loader2, 
  LogOut, 
  Clock, 
  Calendar, 
  Settings2, 
  Plus, 
  Trash2,
  Building2
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useInstance } from "@/hooks/useInstance";
import { cn } from "@/lib/utils";

const WEEK_DAYS = [
  { id: 0, label: "Domingo", short: "Dom" },
  { id: 1, label: "Segunda", short: "Seg" },
  { id: 2, label: "Terça", short: "Ter" },
  { id: 3, label: "Quarta", short: "Qua" },
  { id: 4, label: "Quinta", short: "Qui" },
  { id: 5, label: "Sexta", short: "Sex" },
  { id: 6, label: "Sábado", short: "Sáb" },
];

interface BlockedDate {
  date: string;
  reason: string;
}

interface ClinicConfig {
  work_days: number[];
  hours: {
    open: string;
    close: string;
    lunch_start: string;
    lunch_end: string;
  };
  blocked_dates: BlockedDate[];
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
  work_days: [1, 2, 3, 4, 5],
  hours: {
    open: "08:00",
    close: "18:00",
    lunch_start: "12:00",
    lunch_end: "13:00",
  },
  blocked_dates: [],
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
  const [newBlockDate, setNewBlockDate] = useState<Date | undefined>(undefined);
  const [newBlockReason, setNewBlockReason] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

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

        // Load schedule config from instance
        if (instance?.schedule_config) {
          const savedConfig = instance.schedule_config as unknown as ClinicConfig;
          setConfig({
            ...defaultConfig,
            ...savedConfig,
            hours: { ...defaultConfig.hours, ...(savedConfig.hours || {}) },
            blocked_dates: savedConfig.blocked_dates || [],
          });
        }
      }
      setIsLoading(false);
    };

    fetchData();
  }, [reset, instance]);

  const toggleWorkDay = (dayId: number) => {
    setConfig((prev) => ({
      ...prev,
      work_days: prev.work_days.includes(dayId)
        ? prev.work_days.filter((d) => d !== dayId)
        : [...prev.work_days, dayId].sort(),
    }));
  };

  const addBlockedDate = () => {
    if (!newBlockDate) return;
    
    const dateStr = format(newBlockDate, "yyyy-MM-dd");
    if (config.blocked_dates.some((bd) => bd.date === dateStr)) {
      toast.error("Esta data já está bloqueada");
      return;
    }

    setConfig((prev) => ({
      ...prev,
      blocked_dates: [
        ...prev.blocked_dates,
        { date: dateStr, reason: newBlockReason || "Bloqueado" },
      ].sort((a, b) => a.date.localeCompare(b.date)),
    }));
    setNewBlockDate(undefined);
    setNewBlockReason("");
    setIsCalendarOpen(false);
  };

  const removeBlockedDate = (dateStr: string) => {
    setConfig((prev) => ({
      ...prev,
      blocked_dates: prev.blocked_dates.filter((bd) => bd.date !== dateStr),
    }));
  };

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

      // Update instance schedule_config
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

      {/* Horário de Funcionamento */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-50">
            <Clock className="w-5 h-5 text-sky-600" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Horário de Funcionamento</h3>
        </div>
        <div className="p-6 space-y-6">
          {/* Dias de trabalho */}
          <div className="space-y-3">
            <Label className="text-slate-700">Dias de Trabalho</Label>
            <div className="flex flex-wrap gap-2">
              {WEEK_DAYS.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => toggleWorkDay(day.id)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors border",
                    config.work_days.includes(day.id)
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  )}
                >
                  {day.short}
                </button>
              ))}
            </div>
          </div>

          {/* Horários */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-slate-700">Abertura</Label>
              <Input
                type="time"
                value={config.hours.open}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    hours: { ...prev.hours, open: e.target.value },
                  }))
                }
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Fechamento</Label>
              <Input
                type="time"
                value={config.hours.close}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    hours: { ...prev.hours, close: e.target.value },
                  }))
                }
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Início Almoço</Label>
              <Input
                type="time"
                value={config.hours.lunch_start}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    hours: { ...prev.hours, lunch_start: e.target.value },
                  }))
                }
                className="border-slate-200"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700">Fim Almoço</Label>
              <Input
                type="time"
                value={config.hours.lunch_end}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    hours: { ...prev.hours, lunch_end: e.target.value },
                  }))
                }
                className="border-slate-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Regras de Agendamento */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50">
            <Settings2 className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Regras de Agendamento</h3>
        </div>
        <div className="p-6 grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-slate-700">Duração da Consulta (min)</Label>
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
          </div>
        </div>
      </div>

      {/* Bloqueio de Agenda */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-50">
              <Calendar className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">Bloqueio de Agenda</h3>
          </div>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Bloqueio
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <div className="space-y-4">
                <CalendarComponent
                  mode="single"
                  selected={newBlockDate}
                  onSelect={setNewBlockDate}
                  locale={ptBR}
                  className="rounded-md border"
                />
                <div className="space-y-2">
                  <Label className="text-slate-700">Motivo</Label>
                  <Input
                    value={newBlockReason}
                    onChange={(e) => setNewBlockReason(e.target.value)}
                    placeholder="Ex: Feriado, Manutenção..."
                    className="border-slate-200"
                  />
                </div>
                <Button
                  type="button"
                  onClick={addBlockedDate}
                  disabled={!newBlockDate}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  Adicionar
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        <div className="p-6">
          {config.blocked_dates.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">
              Nenhuma data bloqueada. Adicione feriados ou folgas.
            </p>
          ) : (
            <div className="space-y-2">
              {config.blocked_dates.map((bd) => (
                <div
                  key={bd.date}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">
                      {format(new Date(bd.date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    <span className="text-sm text-slate-500">— {bd.reason}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBlockedDate(bd.date)}
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
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
