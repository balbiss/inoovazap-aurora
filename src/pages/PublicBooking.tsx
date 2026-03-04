import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, getDay, addDays, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Heart,
  ChevronLeft,
  ChevronRight,
  Check,
  Loader2,
  Calendar as CalendarIcon,
  User,
  Phone,
  Stethoscope,
  Clock,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DoctorScheduleConfig, defaultScheduleConfig } from "@/hooks/useDoctors";

interface ClinicData {
  id: string;
  company_name: string;
  clinic_config: {
    appointment_types?: { id: string; name: string }[];
    insurance_types?: { id: string; name: string }[];
  } | null;
  schedule_config: any;
  public_booking_active: boolean;
  subscription_status: string;
}

interface PublicDoctor {
  id: string;
  name: string;
  specialty: string;
  avatar_url: string | null;
  color: string | null;
  default_duration: number;
  schedule_config: DoctorScheduleConfig;
}

interface BusySlot {
  start_time: string;
  end_time: string;
}

// Phone mask helper
function formatPhone(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
}

// CPF mask helper
function formatCPF(value: string): string {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
}

export default function PublicBooking() {
  const { slug: paramsSlug } = useParams<{ slug: string }>();

  // Extract slug from subdomain if not in params
  const slug = useMemo(() => {
    if (paramsSlug) return paramsSlug;

    const host = window.location.hostname;
    // Common domains to exclude
    const mainDomains = ["inoovaweb.com.br", "inoovasaude.inoovaweb.com.br", "localhost", "127.0.0.1", "aurora-app.com.br"];

    // Check if the current host is one of the main domains
    if (mainDomains.some(domain => host === domain)) return null;

    // If it has a subdomain, extract it (e.g., clinic.inoovaweb.com.br -> clinic)
    const parts = host.split(".");
    if (parts.length > 2) {
      // Handles clinic.inoovaweb.com.br and similar
      return parts[0];
    }

    return null;
  }, [paramsSlug]);

  const [step, setStep] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState<PublicDoctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientCPF, setPatientCPF] = useState("");
  const [appointmentType, setAppointmentType] = useState("Consulta");
  const [insurance, setInsurance] = useState("Particular");
  const [bookingResult, setBookingResult] = useState<{
    doctorName: string;
    date: string;
    time: string;
  } | null>(null);

  // Fetch clinic by slug
  const { data: clinic, isLoading: isLoadingClinic, error: clinicError } = useQuery({
    queryKey: ["public-clinic", slug],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_clinic_by_slug", { p_slug: slug });
      if (error) throw error;
      if (!data || data.length === 0) return null;
      console.log("Clinic data from RPC:", data[0]); // Debug log
      return data[0] as ClinicData;
    },
    enabled: !!slug,
  });

  // Fetch doctors for this clinic
  const { data: doctors, isLoading: isLoadingDoctors } = useQuery({
    queryKey: ["public-doctors", clinic?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_doctors", {
        p_instance_id: clinic!.id
      });
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        schedule_config: d.schedule_config ? {
          ...defaultScheduleConfig,
          ...d.schedule_config,
          hours: { ...defaultScheduleConfig.hours, ...(d.schedule_config.hours || {}) },
          blocked_dates: d.schedule_config.blocked_dates || [],
        } : defaultScheduleConfig,
      })) as PublicDoctor[];
    },
    enabled: !!clinic?.id,
  });

  useEffect(() => {
    if (clinic?.company_name) {
      document.title = `${clinic.company_name} | Agendamento Online`;
    }
  }, [clinic?.company_name]);

  // Set default appointment type and insurance from clinic config
  useEffect(() => {
    if (clinic?.clinic_config) {
      const config = clinic.clinic_config;
      if (config.appointment_types?.length) {
        setAppointmentType(config.appointment_types[0].name);
      }
      if (config.insurance_types?.length) {
        // Keep 'Particular' as first choice if it exists, otherwise use first config
        const hasParticular = config.insurance_types.some(i => i.name === "Particular");
        if (!hasParticular) {
          setInsurance("Particular"); // Always have Particular as an option
        } else {
          setInsurance(config.insurance_types[0].name);
        }
      }
    }
  }, [clinic]);

  // Fetch busy slots for selected doctor and date
  const { data: busySlots } = useQuery({
    queryKey: ["busy-slots", selectedDoctor?.id, selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_busy_slots", {
        p_doctor_id: selectedDoctor!.id,
        p_date: format(selectedDate!, "yyyy-MM-dd"),
      });
      if (error) throw error;
      return data as BusySlot[];
    },
    enabled: !!selectedDoctor?.id && !!selectedDate,
  });

  // Generate available time slots
  const availableSlots = useMemo(() => {
    if (!selectedDoctor || !selectedDate) return [];

    const config = selectedDoctor.schedule_config;
    const dayOfWeek = getDay(selectedDate);
    const daySchedule = config.day_schedules?.[dayOfWeek];
    const hours = daySchedule || config.hours;

    // Use doctor's default_duration as source of truth
    const duration = selectedDoctor.default_duration || 30;
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

      const timeStr = `${currentH.toString().padStart(2, "0")}:${currentM.toString().padStart(2, "0")}`;

      // Build slot start and end times for overlap check
      const slotStart = new Date(selectedDate);
      slotStart.setHours(currentH, currentM, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + duration);

      // Check if slot overlaps with any busy slot
      const isBusy = busySlots?.some((b) => {
        const busyStart = new Date(b.start_time);
        const busyEnd = new Date(b.end_time);
        // Overlap: slot starts before busy ends AND slot ends after busy starts
        return slotStart < busyEnd && slotEnd > busyStart;
      });

      // Check if slot is in the past
      const now = new Date();
      const isPast = isBefore(slotStart, now);

      if (!isBusy && !isPast) {
        slots.push(timeStr);
      }

      currentM += duration;
      if (currentM >= 60) {
        currentH += Math.floor(currentM / 60);
        currentM = currentM % 60;
      }
    }

    return slots;
  }, [selectedDoctor, selectedDate, busySlots, clinic]);

  // Create booking mutation
  const createBooking = useMutation({
    mutationFn: async () => {
      if (!clinic || !selectedDoctor || !selectedDate || !selectedTime) {
        throw new Error("Dados incompletos");
      }

      const [hours, minutes] = selectedTime.split(":").map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);

      const duration = selectedDoctor.default_duration || 30;
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration);

      const { data, error } = await supabase.rpc("create_public_booking", {
        p_instance_id: clinic.id,
        p_doctor_id: selectedDoctor.id,
        p_patient_name: patientName,
        p_patient_phone: patientPhone.replace(/\D/g, ""),
        p_start_time: format(startTime, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        p_end_time: format(endTime, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        p_patient_cpf: patientCPF.replace(/\D/g, "") || null,
        p_appointment_type: appointmentType,
        p_insurance: insurance,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (appointmentId) => {
      // Trigger WhatsApp confirmation
      supabase.functions.invoke("manage-instance", {
        body: {
          action: "send_public_confirmation",
          appointment_id: appointmentId
        },
      }).catch(err => {
        console.error("Erro ao enviar confirmação WhatsApp:", err);
      });

      setBookingResult({
        doctorName: selectedDoctor!.name,
        date: format(selectedDate!, "d 'de' MMMM", { locale: ptBR }),
        time: selectedTime,
      });
      setStep(4);
    },
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPatientPhone(formatPhone(e.target.value));
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPatientCPF(formatCPF(e.target.value));
  };

  const handleSelectDoctor = (doctor: PublicDoctor) => {
    setSelectedDoctor(doctor);
    setSelectedDate(undefined);
    setSelectedTime("");
    setStep(2);
  };

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
    setStep(3);
  };

  const handleSubmit = () => {
    const rawPhone = patientPhone.replace(/\D/g, "");
    const rawCPF = patientCPF.replace(/\D/g, "");

    if (!patientName.trim() || rawPhone.length < 10 || rawCPF.length !== 11) {
      return;
    }
    createBooking.mutate();
  };

  const handleReset = () => {
    setStep(1);
    setSelectedDoctor(null);
    setSelectedDate(undefined);
    setSelectedTime("");
    setPatientName("");
    setPatientPhone("");
    setPatientCPF("");
    setBookingResult(null);
  };

  // Loading state
  if (isLoadingClinic) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-500">Carregando...</p>
        </div>
      </div>
    );
  }

  // Clinic not found
  if (!clinic || clinicError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Clínica não encontrada</h1>
          <p className="text-slate-500">
            O link que você acessou não corresponde a nenhuma clínica cadastrada.
          </p>
        </div>
      </div>
    );
  }

  // Resilient isPro check: always true now
  const isPro = true;

  // Booking disabled or not Pro
  if (!isPro || !clinic.public_booking_active) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Agendamento Online Indisponível</h1>
          <p className="text-slate-500">
            {!isPro
              ? "Esta clínica está configurando o sistema. Por favor, tente novamente mais tarde."
              : `${clinic.company_name} não está aceitando agendamentos online no momento.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-teal-700 text-white py-6 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart className="w-6 h-6" />
            <span className="text-xl font-bold">{clinic.company_name}</span>
          </div>
          <p className="text-teal-100 text-sm">Agende sua consulta online</p>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b border-slate-200 py-3 px-4">
        <div className="max-w-md mx-auto flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                  step >= s
                    ? "bg-teal-600 text-white"
                    : "bg-slate-200 text-slate-500"
                )}
              >
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={cn(
                    "w-12 h-1 mx-1 rounded transition-colors",
                    step > s ? "bg-teal-600" : "bg-slate-200"
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-md mx-auto p-4 pb-8">
        {/* Step 1: Select Doctor */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Escolha o Profissional</h2>
              <p className="text-sm text-slate-500 mt-1">Selecione o médico para sua consulta</p>
            </div>

            {isLoadingDoctors ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-4 border border-slate-200 animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-slate-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                        <div className="h-3 bg-slate-200 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : doctors?.length === 0 ? (
              <div className="text-center py-8">
                <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhum profissional disponível</p>
              </div>
            ) : (
              <div className="space-y-3">
                {doctors?.map((doctor) => (
                  <button
                    key={doctor.id}
                    onClick={() => handleSelectDoctor(doctor)}
                    className="w-full bg-white rounded-xl p-4 border border-slate-200 hover:border-teal-300 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      {doctor.avatar_url ? (
                        <img
                          src={doctor.avatar_url}
                          alt={doctor.name}
                          className="w-14 h-14 rounded-full object-cover border border-slate-100"
                        />
                      ) : (
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
                          style={{ backgroundColor: doctor.color || "#0d9488" }}
                        >
                          {doctor.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800">{doctor.name}</h3>
                        <p className="text-sm text-slate-500">{doctor.specialty}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {step === 2 && selectedDoctor && (
          <div className="space-y-4">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </button>

            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-3">
                {selectedDoctor.avatar_url ? (
                  <img
                    src={selectedDoctor.avatar_url}
                    alt={selectedDoctor.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-100"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: selectedDoctor.color || "#0d9488" }}
                  >
                    {selectedDoctor.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-800">{selectedDoctor.name}</p>
                  <p className="text-xs text-slate-500">{selectedDoctor.specialty}</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-800">Escolha Data e Horário</h2>
            </div>

            {/* Calendar */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ptBR}
                disabled={(date) => {
                  // Disable past dates
                  if (isBefore(date, startOfDay(new Date()))) return true;
                  // Disable non-work days
                  const dayOfWeek = getDay(date);
                  if (!selectedDoctor.schedule_config.work_days.includes(dayOfWeek)) return true;
                  // Disable blocked dates
                  const dateStr = format(date, "yyyy-MM-dd");
                  if (selectedDoctor.schedule_config.blocked_dates.some((b) => b.date === dateStr)) return true;
                  // Disable dates more than 30 days in the future
                  if (isBefore(addDays(new Date(), 30), date)) return true;
                  return false;
                }}
                className="pointer-events-auto mx-auto"
              />
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div className="space-y-3">
                <h3 className="font-medium text-slate-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  Horários disponíveis
                </h3>

                {availableSlots.length === 0 ? (
                  <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm text-center">
                    Nenhum horário disponível para esta data
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => handleSelectTime(time)}
                        className="py-3 px-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 transition-colors"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Patient Info */}
        {step === 3 && (
          <div className="space-y-4">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
              Voltar
            </button>

            {/* Summary */}
            <div className="bg-teal-50 rounded-xl p-4 border border-teal-200">
              <div className="flex items-center gap-3 mb-3">
                {selectedDoctor?.avatar_url ? (
                  <img
                    src={selectedDoctor.avatar_url}
                    alt={selectedDoctor.name}
                    className="w-10 h-10 rounded-full object-cover border border-teal-200"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: selectedDoctor?.color || "#0d9488" }}
                  >
                    {selectedDoctor?.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-800">{selectedDoctor?.name}</p>
                  <p className="text-xs text-slate-600">{selectedDoctor?.specialty}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-teal-700">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-4 h-4" />
                  {selectedDate && format(selectedDate, "d 'de' MMM", { locale: ptBR })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {selectedTime}
                </span>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-800">Seus Dados</h2>
              <p className="text-sm text-slate-500 mt-1">Informe seus dados para confirmar</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-700">
                  <User className="w-4 h-4 inline mr-1" />
                  Nome Completo
                </Label>
                <Input
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Digite seu nome completo"
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">
                  <Phone className="w-4 h-4 inline mr-1" />
                  WhatsApp
                </Label>
                <Input
                  value={patientPhone}
                  onChange={handlePhoneChange}
                  placeholder="(99) 99999-9999"
                  className="h-12 text-base"
                  type="tel"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 text-xs">Tipo de Consulta</Label>
                  <Select value={appointmentType} onValueChange={setAppointmentType}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {clinic?.clinic_config?.appointment_types?.length ? (
                        clinic.clinic_config.appointment_types.map((t) => (
                          <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="Consulta">Consulta</SelectItem>
                          <SelectItem value="Retorno">Retorno</SelectItem>
                          <SelectItem value="Exame">Exame</SelectItem>
                          <SelectItem value="Procedimento">Procedimento</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 text-xs">Convênio</Label>
                  <Select value={insurance} onValueChange={setInsurance}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Particular">Particular</SelectItem>
                      {clinic?.clinic_config?.insurance_types?.map((i) => (
                        i.name !== "Particular" && <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>
                      ))}
                      {!clinic?.clinic_config?.insurance_types?.length && (
                        <>
                          <SelectItem value="Unimed">Unimed</SelectItem>
                          <SelectItem value="Cassi">Cassi</SelectItem>
                          <SelectItem value="Bradesco">Bradesco</SelectItem>
                          <SelectItem value="Amil">Amil</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">
                  CPF <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={patientCPF}
                  onChange={handleCPFChange}
                  placeholder="000.000.000-00"
                  className="h-12 text-base"
                  inputMode="numeric"
                />
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={
                createBooking.isPending ||
                !patientName.trim() ||
                patientPhone.replace(/\D/g, "").length < 10 ||
                patientCPF.replace(/\D/g, "").length !== 11
              }
              className="w-full h-14 text-lg bg-teal-600 hover:bg-teal-700 text-white"
            >
              {createBooking.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Check className="w-5 h-5 mr-2" />
              )}
              CONFIRMAR AGENDAMENTO
            </Button>

            {createBooking.isError && (
              <div className="bg-rose-50 text-rose-700 p-3 rounded-lg text-sm text-center">
                {(createBooking.error as any)?.message || "Erro ao agendar. Tente novamente."}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && bookingResult && (
          <div className="text-center py-8 space-y-6">
            <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center mx-auto animate-bounce">
              <Check className="w-10 h-10 text-teal-600" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Agendamento Confirmado!
              </h2>
              <p className="text-slate-500">
                Você receberá uma confirmação via WhatsApp
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200 text-left">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Stethoscope className="w-5 h-5 text-teal-600" />
                  <span className="text-slate-700">{bookingResult.doctorName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-teal-600" />
                  <span className="text-slate-700">{bookingResult.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-teal-600" />
                  <span className="text-slate-700">{bookingResult.time}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleReset}
              variant="outline"
              className="mt-4"
            >
              Agendar outra consulta
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-3 px-4">
        <p className="text-xs text-slate-400 text-center">
          Powered by <span className="text-teal-600 font-medium">InoovaSaúde</span>
        </p>
      </footer>
    </div>
  );
}
