import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Plus, Trash2, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCreateDoctor,
  useUpdateDoctor,
  Doctor,
  DoctorInput,
  DoctorScheduleConfig,
  DaySchedule,
  defaultScheduleConfig
} from "@/hooks/useDoctors";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { cn } from "@/lib/utils";

interface DoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctor?: Doctor | null;
}

const colorOptions = [
  { value: "#06b6d4", label: "Ciano" },
  { value: "#10b981", label: "Verde" },
  { value: "#8b5cf6", label: "Violeta" },
  { value: "#f43f5e", label: "Rosa" },
  { value: "#f59e0b", label: "Âmbar" },
  { value: "#3b82f6", label: "Azul" },
];


const WEEK_DAYS = [
  { id: 0, label: "Domingo", short: "Dom" },
  { id: 1, label: "Segunda", short: "Seg" },
  { id: 2, label: "Terça", short: "Ter" },
  { id: 3, label: "Quarta", short: "Qua" },
  { id: 4, label: "Quinta", short: "Qui" },
  { id: 5, label: "Sexta", short: "Sex" },
  { id: 6, label: "Sábado", short: "Sáb" },
];

export function DoctorDialog({ open, onOpenChange, doctor }: DoctorDialogProps) {
  const isEditing = !!doctor;
  const createDoctor = useCreateDoctor();
  const updateDoctor = useUpdateDoctor();

  const [scheduleConfig, setScheduleConfig] = useState<DoctorScheduleConfig>(defaultScheduleConfig);
  const [selectedDayTab, setSelectedDayTab] = useState<number>(new Date().getDay() || 1);
  const [newBlockDate, setNewBlockDate] = useState<Date | undefined>(undefined);
  const [newBlockReason, setNewBlockReason] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, watch } = useForm<DoctorInput>({
    defaultValues: {
      name: "",
      specialty: "",
      color: "#06b6d4",
      avatar_url: null,
      default_duration: 30,
      active: true,
    },
  });

  useEffect(() => {
    if (doctor) {
      reset({
        name: doctor.name,
        specialty: doctor.specialty,
        color: doctor.color,
        avatar_url: doctor.avatar_url,
        default_duration: doctor.default_duration,
        active: doctor.active,
      });
      // Safety: ensure schedule_config has all fields even if doctor object has it missing or null
      setScheduleConfig({
        ...defaultScheduleConfig,
        ...(doctor.schedule_config || {}),
        hours: { 
          ...defaultScheduleConfig.hours, 
          ...(doctor.schedule_config?.hours || {}) 
        },
        blocked_dates: doctor.schedule_config?.blocked_dates || [],
      });
    } else {
      reset({
        name: "",
        specialty: "",
        color: "#06b6d4",
        avatar_url: null,
        default_duration: 30,
        active: true,
      });
      setScheduleConfig(defaultScheduleConfig);
    }
  }, [doctor, reset]);

  const selectedColor = watch("color");
  const avatarUrl = watch("avatar_url");
  const isActive = watch("active");

  const toggleWorkDay = (dayId: number) => {
    setScheduleConfig((prev) => ({
      ...prev,
      work_days: prev.work_days.includes(dayId)
        ? prev.work_days.filter((d) => d !== dayId)
        : [...prev.work_days, dayId].sort(),
    }));
  };

  const addBlockedDate = () => {
    if (!newBlockDate) return;

    const dateStr = format(newBlockDate, "yyyy-MM-dd");
    if (scheduleConfig.blocked_dates.some((bd) => bd.date === dateStr)) {
      toast.error("Esta data já está bloqueada");
      return;
    }

    setScheduleConfig((prev) => ({
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
    setScheduleConfig((prev) => ({
      ...prev,
      blocked_dates: (prev.blocked_dates || []).filter((bd) => bd.date !== dateStr),
    }));
  };

  // Helper to get current hours for selected day
  const currentDaySchedule = scheduleConfig.day_schedules?.[selectedDayTab] || scheduleConfig.hours;

  const updateDaySchedule = (updates: Partial<DaySchedule>) => {
    setScheduleConfig((prev) => {
      const newDaySchedules = { ...(prev.day_schedules || {}) };
      newDaySchedules[selectedDayTab] = {
        ...(prev.day_schedules?.[selectedDayTab] || prev.hours),
        ...updates
      };
      return { ...prev, day_schedules: newDaySchedules };
    });
  };

  const applyToAllDays = () => {
    setScheduleConfig(prev => ({
      ...prev,
      hours: currentDaySchedule,
      day_schedules: {} // Reset overrides to use new global default
    }));
    toast.success("Horário aplicado a todos os dias!");
  };

  const onSubmit = async (data: DoctorInput) => {
    try {
      const payload = {
        ...data,
        schedule_config: scheduleConfig,
      };

      if (isEditing && doctor) {
        await updateDoctor.mutateAsync({ id: doctor.id, ...payload });
        toast.success("Profissional atualizado com sucesso!");
      } else {
        await createDoctor.mutateAsync(payload);
        toast.success("Profissional criado com sucesso!");
      }

      reset();
      setScheduleConfig(defaultScheduleConfig);
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast.error(isEditing ? "Erro ao atualizar profissional" : "Erro ao criar profissional", {
        description: message,
      });
    }
  };

  const isPending = createDoctor.isPending || updateDoctor.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-lg p-0 overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh]">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>
            {isEditing ? "Editar Profissional" : "Adicionar Profissional"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-2 pb-6 custom-scrollbar">
            <Tabs defaultValue="dados" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-100 sticky top-0 z-10">
              <TabsTrigger
                value="dados"
                className="data-[state=active]:bg-white data-[state=active]:text-teal-700"
              >
                Dados
              </TabsTrigger>
              <TabsTrigger
                value="horarios"
                className="data-[state=active]:bg-white data-[state=active]:text-teal-700"
              >
                Horários
              </TabsTrigger>
              <TabsTrigger
                value="bloqueios"
                className="data-[state=active]:bg-white data-[state=active]:text-teal-700"
              >
                Bloqueios
              </TabsTrigger>
            </TabsList>

            {/* Tab: Dados Básicos */}
            <TabsContent value="dados" className="space-y-4 pt-4">
              {/* Avatar Upload */}
              <ImageUpload
                label="Foto do Profissional"
                value={avatarUrl}
                onChange={(url) => setValue("avatar_url", url)}
                folder="avatars"
              />

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700">Nome Completo *</Label>
                <Input
                  id="name"
                  placeholder="Dr. Nome Sobrenome"
                  className="border-slate-200"
                  {...register("name", { required: true })}
                />
              </div>

              {/* Specialty */}
              <div className="space-y-2">
                <Label htmlFor="specialty" className="text-slate-700">Especialidade *</Label>
                <Input
                  id="specialty"
                  placeholder="Cardiologia, Dermatologia, etc."
                  className="border-slate-200"
                  {...register("specialty", { required: true })}
                />
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label className="text-slate-700">Cor na Agenda</Label>
                <div className="flex items-center gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setValue("color", color.value)}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all",
                        selectedColor === color.value
                          ? "border-slate-800 scale-110"
                          : "border-transparent"
                      )}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label className="text-slate-700">Duração Padrão da Consulta (min)</Label>
                <Input
                  type="number"
                  min={5}
                  max={240}
                  className="border-slate-200"
                  {...register("default_duration", {
                    required: true,
                    valueAsNumber: true,
                    min: 5,
                    max: 240
                  })}
                />
              </div>

              {/* Active */}
              <div className="flex items-center justify-between">
                <Label htmlFor="active" className="text-slate-700">Profissional Ativo</Label>
                <Switch
                  id="active"
                  checked={isActive}
                  onCheckedChange={(checked) => setValue("active", checked)}
                />
              </div>
            </TabsContent>

            {/* Tab: Horários */}
            <TabsContent value="horarios" className="space-y-6 pt-4">
              {/* Dias de trabalho */}
              <div className="space-y-3">
                <Label className="text-slate-700 font-medium">Dias de Trabalho</Label>
                <div className="flex flex-wrap gap-2">
                  {WEEK_DAYS.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => {
                        toggleWorkDay(day.id);
                        setSelectedDayTab(day.id);
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                        (scheduleConfig.work_days || []).includes(day.id)
                          ? "bg-teal-600 text-white border-teal-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                      )}
                    >
                      {day.short}
                    </button>
                  ))}
                </div>
              </div>

              {/* Day Selector for Timing */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-700 font-medium">Configurar Horários para:</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-[10px] h-6 text-teal-600 hover:text-teal-700 p-0"
                    onClick={applyToAllDays}
                  >
                    Aplicar este horário a todos os dias
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {WEEK_DAYS.filter(d => (scheduleConfig.work_days || []).includes(d.id)).map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => setSelectedDayTab(day.id)}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                        selectedDayTab === day.id
                          ? "bg-teal-100 text-teal-700 ring-1 ring-teal-500"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      {day.label}
                    </button>
                  ))}
                  {(scheduleConfig.work_days || []).length === 0 && (
                    <p className="text-[11px] text-slate-400 italic">Selecione os dias de trabalho acima primeiro</p>
                  )}
                </div>
              </div>

              {/* Presets */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <Label className="text-slate-700 font-medium text-xs uppercase tracking-wider">Atalhos de Horário</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      updateDaySchedule({ open: "08:00", close: "12:00", lunch_start: "12:00", lunch_end: "12:00" });
                    }}
                  >
                    Manhã (08-12)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      updateDaySchedule({ open: "13:00", close: "18:00", lunch_start: "13:00", lunch_end: "13:00" });
                    }}
                  >
                    Tarde (13-18)
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      updateDaySchedule({ open: "08:00", close: "18:00", lunch_start: "12:00", lunch_end: "13:00" });
                    }}
                  >
                    Dia Todo (08-18 c/ Almoço)
                  </Button>
                </div>
              </div>

              {/* Horários de Atendimento */}
              <div className="grid gap-4 grid-cols-2 pt-2 border-t border-slate-100">
                <div className="space-y-2">
                  <Label className="text-slate-700">Abertura</Label>
                  <div className="relative">
                    <Input
                      type="time"
                      value={currentDaySchedule.open}
                      onChange={(e) => updateDaySchedule({ open: e.target.value })}
                      className="border-slate-200"
                    />
                    <Clock className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Fechamento</Label>
                  <div className="relative">
                    <Input
                      type="time"
                      value={currentDaySchedule.close}
                      onChange={(e) => updateDaySchedule({ close: e.target.value })}
                      className="border-slate-200"
                    />
                    <Clock className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Almoço Toggle */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="space-y-0.5">
                  <Label className="text-slate-800 font-medium">Intervalo de Almoço</Label>
                  <p className="text-xs text-slate-500">Bloqueia agendamentos neste horário</p>
                </div>
                <Switch
                  checked={currentDaySchedule.lunch_start !== currentDaySchedule.lunch_end}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateDaySchedule({ lunch_start: "12:00", lunch_end: "13:00" });
                    } else {
                      updateDaySchedule({ lunch_start: currentDaySchedule.open, lunch_end: currentDaySchedule.open });
                    }
                  }}
                />
              </div>

              {/* Lunch Hours (Conditional) */}
              {(currentDaySchedule.lunch_start !== currentDaySchedule.lunch_end) && (
                <div className="grid gap-4 grid-cols-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-2">
                    <Label className="text-slate-700">Início Almoço</Label>
                    <div className="relative">
                      <Input
                        type="time"
                        value={currentDaySchedule.lunch_start}
                        onChange={(e) => updateDaySchedule({ lunch_start: e.target.value })}
                        className="border-slate-200"
                      />
                      <Clock className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Fim Almoço</Label>
                    <div className="relative">
                      <Input
                        type="time"
                        value={currentDaySchedule.lunch_end}
                        onChange={(e) => updateDaySchedule({ lunch_end: e.target.value })}
                        className="border-slate-200"
                      />
                      <Clock className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Tab: Bloqueios */}
            <TabsContent value="bloqueios" className="space-y-4 pt-4 pb-4">
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <Label className="text-slate-700 font-semibold text-sm">Bloquear Nova Data</Label>
                
                <div className="flex flex-col gap-4">
                  <div className="bg-white rounded-lg border border-slate-200 p-2 flex justify-center shadow-sm">
                    <CalendarComponent
                      mode="single"
                      selected={newBlockDate}
                      onSelect={setNewBlockDate}
                      locale={ptBR}
                      className="rounded-md"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-slate-700 text-sm">Motivo do Bloqueio</Label>
                    <Input
                      value={newBlockReason}
                      onChange={(e) => setNewBlockReason(e.target.value)}
                      placeholder="Ex: F\u00e9rias, Congresso..."
                      className="border-slate-200 bg-white"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={addBlockedDate}
                    disabled={!newBlockDate}
                    className="w-full bg-teal-600 hover:bg-teal-700 h-10 shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Bloquear Data Selecionada
                  </Button>
                </div>
              </div>

              <div className="pt-2">
                <Label className="text-slate-700 font-semibold text-sm block mb-3">Datas Bloqueadas Ativas</Label>

              {scheduleConfig.blocked_dates.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">
                  Nenhuma data bloqueada para este profissional.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {scheduleConfig.blocked_dates.map((bd) => (
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
            </TabsContent>
          </Tabs>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-white mt-auto">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-teal-600 hover:bg-teal-700 text-white"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? "Salvar" : "Criar"}
          </Button>
        </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
