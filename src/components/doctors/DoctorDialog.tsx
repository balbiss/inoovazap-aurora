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
  defaultScheduleConfig
} from "@/hooks/useDoctors";
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
  const [newBlockDate, setNewBlockDate] = useState<Date | undefined>(undefined);
  const [newBlockReason, setNewBlockReason] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, watch } = useForm<DoctorInput>({
    defaultValues: {
      name: "",
      specialty: "",
      color: "#06b6d4",
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
        default_duration: doctor.default_duration,
        active: doctor.active,
      });
      setScheduleConfig(doctor.schedule_config || defaultScheduleConfig);
    } else {
      reset({
        name: "",
        specialty: "",
        color: "#06b6d4",
        default_duration: 30,
        active: true,
      });
      setScheduleConfig(defaultScheduleConfig);
    }
  }, [doctor, reset]);

  const selectedColor = watch("color");
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
      blocked_dates: prev.blocked_dates.filter((bd) => bd.date !== dateStr),
    }));
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Profissional" : "Adicionar Profissional"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-100">
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
                      onClick={() => toggleWorkDay(day.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                        scheduleConfig.work_days.includes(day.id)
                          ? "bg-teal-600 text-white border-teal-600"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                      )}
                    >
                      {day.short}
                    </button>
                  ))}
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
                      setScheduleConfig(prev => ({
                        ...prev,
                        hours: { open: "08:00", close: "12:00", lunch_start: "12:00", lunch_end: "12:00" }
                      }));
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
                      setScheduleConfig(prev => ({
                        ...prev,
                        hours: { open: "13:00", close: "18:00", lunch_start: "13:00", lunch_end: "13:00" }
                      }));
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
                      setScheduleConfig(prev => ({
                        ...prev,
                        hours: { open: "08:00", close: "18:00", lunch_start: "12:00", lunch_end: "13:00" }
                      }));
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
                      value={scheduleConfig.hours.open}
                      onChange={(e) =>
                        setScheduleConfig((prev) => ({
                          ...prev,
                          hours: { ...prev.hours, open: e.target.value },
                        }))
                      }
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
                      value={scheduleConfig.hours.close}
                      onChange={(e) =>
                        setScheduleConfig((prev) => ({
                          ...prev,
                          hours: { ...prev.hours, close: e.target.value },
                        }))
                      }
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
                  checked={scheduleConfig.hours.lunch_start !== scheduleConfig.hours.lunch_end}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setScheduleConfig(prev => ({
                        ...prev,
                        hours: { ...prev.hours, lunch_start: "12:00", lunch_end: "13:00" }
                      }));
                    } else {
                      setScheduleConfig(prev => ({
                        ...prev,
                        hours: { ...prev.hours, lunch_start: prev.hours.open, lunch_end: prev.hours.open }
                      }));
                    }
                  }}
                />
              </div>

              {/* Lunch Hours (Conditional) */}
              {(scheduleConfig.hours.lunch_start !== scheduleConfig.hours.lunch_end) && (
                <div className="grid gap-4 grid-cols-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="space-y-2">
                    <Label className="text-slate-700">Início Almoço</Label>
                    <div className="relative">
                      <Input
                        type="time"
                        value={scheduleConfig.hours.lunch_start}
                        onChange={(e) =>
                          setScheduleConfig((prev) => ({
                            ...prev,
                            hours: { ...prev.hours, lunch_start: e.target.value },
                          }))
                        }
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
                        value={scheduleConfig.hours.lunch_end}
                        onChange={(e) =>
                          setScheduleConfig((prev) => ({
                            ...prev,
                            hours: { ...prev.hours, lunch_end: e.target.value },
                          }))
                        }
                        className="border-slate-200"
                      />
                      <Clock className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Tab: Bloqueios */}
            <TabsContent value="bloqueios" className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-slate-700">Datas Bloqueadas</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="gap-2">
                      <Plus className="w-4 h-4" />
                      Adicionar
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
                          placeholder="Ex: Férias, Congresso..."
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
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
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
