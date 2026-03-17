import { useState, useMemo, useEffect } from "react";
import { format, getDay, isBefore, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Plus, Loader2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResponsiveDialog } from "@/components/ui/ResponsiveDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useActiveDoctors, Doctor, DoctorScheduleConfig } from "@/hooks/useDoctors";
import { usePatients } from "@/hooks/usePatients";
import { useCreateAppointment } from "@/hooks/useAppointments";
import { useInstance } from "@/hooks/useInstance";
import { PatientDialog } from "@/components/patients/PatientDialog";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NewAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
}

interface InsuranceType {
  id: string;
  name: string;
}

interface BusySlot {
  start_time: string;
  end_time: string;
}

const dayNames: Record<number, string> = {
  0: "Dom",
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
};

const durations = [
  { value: "15", label: "15 minutos" },
  { value: "30", label: "30 minutos" },
  { value: "45", label: "45 minutos" },
  { value: "60", label: "1 hora" },
  { value: "90", label: "1h30" },
  { value: "120", label: "2 horas" },
];

// Generate time slots based on doctor's schedule and duration
function generateTimeSlots(config: DoctorScheduleConfig, duration: number, date?: Date): string[] {
  const dayOfWeek = date ? getDay(date) : null;
  const hours = (dayOfWeek !== null && config?.day_schedules?.[dayOfWeek])
    ? config.day_schedules[dayOfWeek]
    : (config?.hours || { open: "08:00", close: "18:00", lunch_start: "12:00", lunch_end: "13:00" });

  const slots: string[] = [];
  const [openH, openM] = hours.open.split(":").map(Number);
  const [closeH, closeM] = hours.close.split(":").map(Number);
  const [lunchStartH, lunchStartM] = hours.lunch_start.split(":").map(Number);
  const [lunchEndH, lunchEndM] = hours.lunch_end.split(":").map(Number);

  let currentH = openH;
  let currentM = openM;

  while (currentH < closeH || (currentH === closeH && currentM < closeM)) {
    const currentMinutes = currentH * 60 + currentM;
    const slotEndMinutes = currentMinutes + duration;
    const lunchStart = lunchStartH * 60 + lunchStartM;
    const lunchEnd = lunchEndH * 60 + lunchEndM;
    const closeMinutes = closeH * 60 + closeM;

    // Skip if slot would extend past closing
    if (slotEndMinutes > closeMinutes) break;

    // Skip if slot overlaps with lunch time
    if (currentMinutes < lunchEnd && slotEndMinutes > lunchStart) {
      // Jump to end of lunch
      currentH = lunchEndH;
      currentM = lunchEndM;
      continue;
    }

    slots.push(`${currentH.toString().padStart(2, "0")}:${currentM.toString().padStart(2, "0")}`);

    currentM += duration;
    if (currentM >= 60) {
      currentH += Math.floor(currentM / 60);
      currentM = currentM % 60;
    }
  }

  return slots;
}

export function NewAppointmentDialog({ open, onOpenChange, defaultDate }: NewAppointmentDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(defaultDate || new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [selectedInsurance, setSelectedInsurance] = useState<string>("particular");
  const [selectedAppointmentType, setSelectedAppointmentType] = useState<string>("");
  const [status, setStatus] = useState<string>("scheduled");
  const [notes, setNotes] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [isPatientDialogOpen, setIsPatientDialogOpen] = useState(false);

  const { data: doctors } = useActiveDoctors();
  const { data: patients } = usePatients(patientSearch);
  const { data: instance } = useInstance();
  const createAppointment = useCreateAppointment();
  const navigate = useNavigate();


  // Get selected doctor
  const selectedDoctor = useMemo(() => {
    return doctors?.find((d) => d.id === selectedDoctorId);
  }, [doctors, selectedDoctorId]);

  // Get current duration value
  const currentDuration = parseInt(duration) || 30;

  // Fetch busy slots for selected doctor and date
  const { data: busySlots } = useQuery({
    queryKey: ["busy-slots-internal", selectedDoctorId, selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""],
    queryFn: async () => {
      if (!selectedDoctorId || !selectedDate || !instance?.id) return [];

      const { data, error } = await supabase
        .from("appointments")
        .select("start_time, end_time")
        .eq("instance_id", instance.id)
        .eq("doctor_id", selectedDoctorId)
        .gte("start_time", startOfDay(selectedDate).toISOString())
        .lte("start_time", endOfDay(selectedDate).toISOString())
        .not("status", "in", '("cancelled","no_show")');

      if (error) throw error;
      return data as BusySlot[];
    },
    enabled: !!selectedDoctorId && !!selectedDate && !!instance?.id,
  });

  // Get insurance and appointment types from instance config
  const { insuranceTypes, appointmentTypes } = useMemo(() => {
    if (!instance?.clinic_config) return { insuranceTypes: [], appointmentTypes: [] };
    const config = instance.clinic_config as {
      insurance_types?: InsuranceType[];
      appointment_types?: { id: string; name: string }[];
    };
    return {
      insuranceTypes: config.insurance_types || [],
      appointmentTypes: config.appointment_types || []
    };
  }, [instance]);

  // Generate time slots based on selected doctor's schedule and filter busy ones
  const availableTimeSlots = useMemo(() => {
    if (!selectedDoctor?.schedule_config) {
      // Default slots if no doctor selected
      return Array.from({ length: 20 }, (_, i) => {
        const hour = Math.floor(i / 2) + 8;
        const minute = (i % 2) * 30;
        return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      });
    }

    const allSlots = generateTimeSlots(selectedDoctor.schedule_config, selectedDoctor.default_duration, selectedDate || undefined);

    if (!selectedDate || !busySlots || busySlots.length === 0) {
      return allSlots;
    }

    // Filter out busy slots
    return allSlots.filter((timeStr) => {
      const [h, m] = timeStr.split(":").map(Number);
      const slotStart = new Date(selectedDate);
      slotStart.setHours(h, m, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + currentDuration);

      // Check if slot is in the past
      if (isBefore(slotStart, new Date())) return false;

      // Check overlap with busy slots
      const overlaps = busySlots.some((b) => {
        const busyStart = new Date(b.start_time);
        const busyEnd = new Date(b.end_time);
        return slotStart < busyEnd && slotEnd > busyStart;
      });

      return !overlaps;
    });
  }, [selectedDoctor, selectedDate, busySlots, currentDuration]);

  // Check if selected date is a work day for the doctor
  const isWorkDay = useMemo(() => {
    if (!selectedDate || !selectedDoctor?.schedule_config?.work_days) return true;
    const dayOfWeek = getDay(selectedDate);
    return selectedDoctor.schedule_config.work_days.includes(dayOfWeek);
  }, [selectedDate, selectedDoctor]);

  // Check if selected date is blocked
  const isBlockedDate = useMemo(() => {
    if (!selectedDate || !selectedDoctor?.schedule_config?.blocked_dates) return false;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return selectedDoctor.schedule_config.blocked_dates.some((b) => b.date === dateStr);
  }, [selectedDate, selectedDoctor]);

  // Set duration to doctor's default when doctor changes
  useEffect(() => {
    if (selectedDoctor) {
      setDuration(selectedDoctor.default_duration.toString());
      // Reset time if current selection is not available
      if (availableTimeSlots.length > 0 && !availableTimeSlots.includes(selectedTime)) {
        setSelectedTime(availableTimeSlots[0]);
      }
    }
  }, [selectedDoctor, availableTimeSlots]);

  const handleSubmit = async () => {
    if (!selectedDate || !selectedDoctorId || !selectedPatientId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!isWorkDay) {
      toast.error("O profissional não atende neste dia da semana");
      return;
    }

    if (isBlockedDate) {
      toast.error("Esta data está bloqueada para o profissional selecionado");
      return;
    }

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(hours, minutes, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + parseInt(duration));


    try {
      await createAppointment.mutateAsync({
        doctor_id: selectedDoctorId,
        patient_id: selectedPatientId,
        start_time: format(startTime, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        end_time: format(endTime, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        status: status as any,
        appointment_type: selectedAppointmentType || null,
        insurance: selectedInsurance || null,
        notes: notes || null,
      });

      toast.success("Agendamento criado com sucesso!");
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      toast.error("Erro ao criar agendamento", {
        description: error.message,
      });
    }
  };

  const resetForm = () => {
    setSelectedDate(defaultDate || new Date());
    setSelectedTime("");
    setDuration("30");
    setSelectedDoctorId("");
    setSelectedPatientId("");
    setSelectedInsurance("particular");
    setSelectedAppointmentType("");
    setStatus("scheduled");
    setNotes("");
  };

  const handlePatientCreated = (patient: any) => {
    setSelectedPatientId(patient.id);
    setIsPatientDialogOpen(false);
  };

  return (
    <>
      <ResponsiveDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Novo Agendamento"
      >
        <div className="space-y-4 py-4 md:py-0">
          {/* Doctor Select */}
          <div className="space-y-2">
            <Label>Profissional *</Label>
            <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o profissional" />
              </SelectTrigger>
              <SelectContent>
                {doctors?.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: doctor.color }}
                      />
                      {doctor.name} - {doctor.specialty}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Doctor Schedule Info */}
            {selectedDoctor && (
              <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-2 border border-slate-200">
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span>
                    {(() => {
                      const dayOfWeek = selectedDate ? getDay(selectedDate) : null;
                      const hours = (dayOfWeek !== null && selectedDoctor.schedule_config.day_schedules?.[dayOfWeek])
                        ? selectedDoctor.schedule_config.day_schedules[dayOfWeek]
                        : selectedDoctor.schedule_config.hours;

                      return (
                        <>
                          <strong>Horário {selectedDate ? `(${dayNames[dayOfWeek!]})` : '(Padrão)'}:</strong> {hours.open} - {hours.close}
                          <span className="text-slate-400 ml-1">
                            (almoço: {hours.lunch_start} - {hours.lunch_end})
                          </span>
                        </>
                      );
                    })()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600"><strong>Dias:</strong></span>
                  <div className="flex gap-1">
                      {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                        <Badge
                          key={day}
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0",
                            (selectedDoctor.schedule_config?.work_days || []).includes(day)
                              ? "bg-teal-50 text-teal-700 border-teal-200"
                              : "bg-slate-100 text-slate-400 border-slate-200"
                          )}
                        >
                          {dayNames[day]}
                        </Badge>
                      ))}
                  </div>
                </div>
                <div className="text-slate-500">
                  <strong>Duração padrão:</strong> {selectedDoctor.default_duration} min
                </div>
              </div>
            )}
          </div>

          {/* Patient Search */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Paciente *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsPatientDialogOpen(true)}
                className="text-teal-600 hover:text-teal-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Novo
              </Button>
            </div>
            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o paciente" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    placeholder="Buscar paciente..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="mb-2"
                  />
                </div>
                {patients?.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.name || patient.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Insurance Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Convênio</Label>
              <Select value={selectedInsurance} onValueChange={setSelectedInsurance}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o convênio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="particular">Particular</SelectItem>
                  {insuranceTypes.map((ins) => (
                    <SelectItem key={ins.id} value={ins.name}>
                      {ins.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Appointment Type */}
            <div className="space-y-2">
              <Label>Tipo de Consulta</Label>
              <Select value={selectedAppointmentType} onValueChange={setSelectedAppointmentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {appointmentTypes.length === 0 ? (
                    <SelectItem value="consulta" disabled>Nenhum tipo cadastrado</SelectItem>
                  ) : (
                    appointmentTypes.map((type) => (
                      <SelectItem key={type.id} value={type.name}>
                        {type.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Data *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  disabled={(date) => {
                    if (!selectedDoctor?.schedule_config) return false;
                    const dayOfWeek = getDay(date);
                    const isWorkDay = (selectedDoctor.schedule_config.work_days || []).includes(dayOfWeek);
                    const dateStr = format(date, "yyyy-MM-dd");
                    const isBlocked = (selectedDoctor.schedule_config.blocked_dates || []).some((b) => b.date === dateStr);
                    return !isWorkDay || isBlocked;
                  }}
                />
              </PopoverContent>
            </Popover>

            {/* Warning for non-work day or blocked date */}
            {selectedDate && selectedDoctor && (!isWorkDay || isBlockedDate) && (
              <div className="flex items-center gap-2 text-rose-600 text-xs bg-rose-50 p-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                {isBlockedDate ? "Esta data está bloqueada" : "O profissional não atende neste dia"}
              </div>
            )}
          </div>

          {/* Time and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Horário *</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {availableTimeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Duração</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durations.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Agendado</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Observações sobre o agendamento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createAppointment.isPending || (!isWorkDay || isBlockedDate)}
            className="gap-2 bg-teal-600 hover:bg-teal-700 text-white"
          >
            {createAppointment.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Agendar
          </Button>
        </div>
      </ResponsiveDialog>

      {/* Quick Patient Creation */}
      <PatientDialog
        open={isPatientDialogOpen}
        onOpenChange={setIsPatientDialogOpen}
        onSuccess={handlePatientCreated}
      />
    </>
  );
}
