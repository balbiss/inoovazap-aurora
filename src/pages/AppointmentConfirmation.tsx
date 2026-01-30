import { useState, useMemo, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, getDay, addDays, isBefore, startOfDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Check,
    X,
    Calendar as CalendarIcon,
    Clock,
    Stethoscope,
    Loader2,
    AlertCircle,
    Heart,
    ChevronLeft
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DoctorScheduleConfig, defaultScheduleConfig } from "@/hooks/useDoctors";

interface AppointmentDetails {
    id: string;
    start_time: string;
    end_time: string;
    status: string;
    patient_name: string;
    doctor_name: string;
    doctor_specialty: string;
    doctor_id: string;
    doctor_duration: number;
    doctor_schedule_config: any;
    company_name: string;
    clinic_config: any;
}

interface BusySlot {
    start_time: string;
    end_time: string;
}

export default function AppointmentConfirmation() {
    const { id } = useParams<{ id: string }>();
    const [mode, setMode] = useState<"view" | "reschedule" | "success">("view");
    const [selectedDate, setSelectedDate] = useState<Date | undefined>();
    const [selectedTime, setSelectedTime] = useState("");

    // Fetch appointment details
    const { data: appointment, isLoading, error, refetch } = useQuery({
        queryKey: ["appointment-confirmation", id],
        queryFn: async () => {
            const { data, error } = await supabase.rpc("get_appointment_details_public", { p_id: id });

            if (error) throw error;
            if (!data || data.length === 0) return null;

            const apt = data[0];
            console.log("Appointment Data Public:", apt);

            return {
                id: apt.id,
                start_time: apt.start_time,
                end_time: apt.end_time,
                status: apt.status,
                patient_name: apt.patient_name || "Paciente",
                doctor_name: apt.doctor_name || "Médico",
                doctor_specialty: apt.doctor_specialty || "",
                doctor_id: apt.doctor_id,
                doctor_duration: apt.doctor_duration || 30,
                doctor_schedule_config: apt.doctor_schedule_config || {},
                company_name: apt.company_name || "Clínica",
                clinic_config: apt.clinic_config || {}
            } as AppointmentDetails;
        },
        enabled: !!id,
    });

    // Fetch busy slots for rescheduling
    const { data: busySlots } = useQuery({
        queryKey: ["busy-slots", appointment?.doctor_id, selectedDate],
        queryFn: async () => {
            const { data, error } = await supabase.rpc("get_busy_slots", {
                p_doctor_id: appointment!.doctor_id,
                p_date: format(selectedDate!, "yyyy-MM-dd"),
            });
            if (error) throw error;
            return data as BusySlot[];
        },
        enabled: mode === "reschedule" && !!selectedDate && !!appointment?.doctor_id,
    });

    // Actions mutation
    const actionMutation = useMutation({
        mutationFn: async ({ action, newStart }: { action: string; newStart?: string }) => {
            const { error } = await supabase.rpc("patient_update_appointment", {
                p_id: id,
                p_action: action,
                p_new_start: newStart,
            });
            if (error) throw error;
        },
        onSuccess: (_, variables) => {
            if (variables.action === "confirm") {
                setMode("success");
                toast.success("Presença confirmada!");
            } else {
                setMode("success");
                toast.success("Consulta reagendada com sucesso!");
            }
            refetch();
        },
        onError: (err: any) => {
            toast.error("Erro ao processar sua solicitação", { description: err.message });
        },
    });

    // Generate available time slots
    const availableSlots = useMemo(() => {
        if (!appointment || !selectedDate) return [];

        const scheduleConfig = appointment.doctor_schedule_config ? {
            ...defaultScheduleConfig,
            ...appointment.doctor_schedule_config,
            hours: { ...defaultScheduleConfig.hours, ...(appointment.doctor_schedule_config.hours || {}) },
        } : defaultScheduleConfig;

        // Use the duration from the doctor config explicitly
        const duration = appointment.doctor_duration || 30;
        const slots: string[] = [];

        const [openH, openM] = scheduleConfig.hours.open.split(":").map(Number);
        const [closeH, closeM] = scheduleConfig.hours.close.split(":").map(Number);

        // Handle lunch hours
        const hasLunch = scheduleConfig.hours.lunch_start !== scheduleConfig.hours.lunch_end;
        const [lunchStartH, lunchStartM] = hasLunch ? scheduleConfig.hours.lunch_start.split(":").map(Number) : [0, 0];
        const [lunchEndH, lunchEndM] = hasLunch ? scheduleConfig.hours.lunch_end.split(":").map(Number) : [0, 0];

        let currentH = openH;
        let currentM = openM;

        while (currentH < closeH || (currentH === closeH && currentM < closeM)) {
            const currentMinutes = currentH * 60 + currentM;
            const slotEndMinutes = currentMinutes + duration;
            const lunchStart = lunchStartH * 60 + lunchStartM;
            const lunchEnd = lunchEndH * 60 + lunchEndM;
            const closeMinutes = closeH * 60 + closeM;

            if (slotEndMinutes > closeMinutes) break;

            if (hasLunch && currentMinutes < lunchEnd && slotEndMinutes > lunchStart) {
                currentH = lunchEndH;
                currentM = lunchEndM;
                continue;
            }

            const timeStr = `${currentH.toString().padStart(2, "0")}:${currentM.toString().padStart(2, "0")}`;

            const slotStartDay = new Date(selectedDate);
            slotStartDay.setHours(currentH, currentM, 0, 0);

            // Critical check: Ensure the selected date is still a valid workday in case of state desync
            const dayOfWeek = getDay(selectedDate);
            if (!scheduleConfig.work_days.includes(dayOfWeek)) return [];

            const slotEndDay = new Date(slotStartDay);
            slotEndDay.setMinutes(slotEndDay.getMinutes() + duration);

            const isBusy = busySlots?.some((b) => {
                const busyStart = new Date(b.start_time);
                const busyEnd = new Date(b.end_time);
                // Overlap check
                return slotStartDay < busyEnd && slotEndDay > busyStart;
            });

            const isPast = isBefore(slotStartDay, new Date());

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
    }, [appointment, selectedDate, busySlots]);

    const handleConfirm = () => actionMutation.mutate({ action: "confirm" });

    const handleReschedule = () => {
        if (!selectedDate || !selectedTime) return;
        const [h, m] = selectedTime.split(":").map(Number);
        const newStart = new Date(selectedDate);
        newStart.setHours(h, m, 0, 0);
        actionMutation.mutate({ action: "reschedule", newStart: format(newStart, "yyyy-MM-dd'T'HH:mm:ssXXX") });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
                <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-4" />
                <div className="w-full max-w-sm space-y-4">
                    <div className="h-8 bg-slate-100 animate-pulse rounded w-3/4 mx-auto" />
                    <div className="h-40 bg-slate-50 animate-pulse rounded-2xl" />
                    <div className="h-14 bg-slate-100 animate-pulse rounded-xl" />
                </div>
            </div>
        );
    }

    if (error || !appointment) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-10 h-10 text-rose-500" />
                </div>
                <h1 className="text-xl font-bold text-slate-800 mb-2">Ops! Link Inválido</h1>
                <p className="text-slate-500 mb-6">Agendamento não encontrado ou o link expirou.</p>
                <Button variant="outline" onClick={() => window.location.reload()}>Tentar Novamente</Button>
            </div>
        );
    }

    const isConfirmed = appointment.status === "confirmed" || mode === "success";

    return (
        <div className="min-h-screen bg-white selection:bg-teal-100">
            <div className="max-w-md mx-auto min-h-screen flex flex-col">
                {/* Header */}
                <header className="py-8 px-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Heart className="w-6 h-6 text-teal-600 fill-teal-600" />
                        <span className="text-lg font-bold text-slate-800 tracking-tight">{appointment.company_name}</span>
                    </div>
                    <p className="text-slate-500 text-sm">Olá, {appointment.patient_name.split(" ")[0]}!</p>
                </header>

                <main className="flex-1 px-6 pb-12">
                    {mode === "view" || mode === "success" ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {/* Hero Card */}
                            <div className="bg-slate-50 rounded-[2rem] p-8 text-center border border-slate-100 shadow-sm relative overflow-hidden">
                                {isConfirmed && (
                                    <div className="absolute top-4 right-4 animate-in zoom-in duration-500">
                                        <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white border-0 py-1">
                                            Confirmado
                                        </Badge>
                                    </div>
                                )}

                                <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mb-4">Sua Consulta</p>

                                <div className="space-y-1 mb-8">
                                    <h2 className="text-4xl font-bold text-slate-900 tracking-tight">
                                        {format(parseISO(appointment.start_time), "EEEE", { locale: ptBR })}
                                    </h2>
                                    <p className="text-2xl font-semibold text-teal-600">
                                        {format(parseISO(appointment.start_time), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                </div>

                                <div className="flex flex-col items-center pt-6 border-t border-slate-200/60">
                                    <div className="text-slate-800 font-semibold text-lg">{appointment.doctor_name}</div>
                                    <div className="text-slate-500 text-sm">{appointment.doctor_specialty}</div>
                                </div>
                            </div>

                            {/* Action Area */}
                            {!isConfirmed ? (
                                <div className="space-y-4 pt-4">
                                    <Button
                                        onClick={handleConfirm}
                                        disabled={actionMutation.isPending}
                                        className="w-full h-16 text-lg bg-teal-600 hover:bg-teal-700 text-white rounded-2xl shadow-lg shadow-teal-100 transition-all active:scale-[0.98]"
                                    >
                                        {actionMutation.isPending ? (
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        ) : (
                                            <Check className="w-6 h-6 mr-2 stroke-[3]" />
                                        )}
                                        VOU COMPARECER
                                    </Button>

                                    <button
                                        onClick={() => setMode("reschedule")}
                                        className="w-full py-4 text-slate-500 font-medium hover:text-slate-800 transition-colors text-sm"
                                    >
                                        Preciso reagendar ou cancelar
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center space-y-4 animate-in zoom-in duration-500">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                                        <Check className="w-8 h-8 stroke-[3]" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800">Tudo certo!</h3>
                                        <p className="text-slate-500">Sua presença foi confirmada e aguardamos você.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            <button
                                onClick={() => setMode("view")}
                                className="flex items-center gap-2 text-slate-500 font-medium mb-4"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Voltar
                            </button>

                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-slate-800">Novo Horário</h2>
                                <p className="text-sm text-slate-500">Escolha quando prefere vir</p>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-sm">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    locale={ptBR}
                                    disabled={(date) => {
                                        // Disable past dates
                                        if (isBefore(date, startOfDay(new Date()))) return true;

                                        // Normalize config
                                        const config = appointment.doctor_schedule_config ? {
                                            ...defaultScheduleConfig,
                                            ...appointment.doctor_schedule_config,
                                            blocked_dates: appointment.doctor_schedule_config.blocked_dates || [],
                                        } : defaultScheduleConfig;

                                        // Disable non-work days
                                        const dayOfWeek = getDay(date);
                                        if (!config.work_days.includes(dayOfWeek)) return true;

                                        // Disable blocked dates
                                        const dateStr = format(date, "yyyy-MM-dd");
                                        if (config.blocked_dates.some((b: any) => b.date === dateStr)) return true;

                                        // Limit to 60 days in future
                                        if (isBefore(addDays(new Date(), 60), date)) return true;

                                        return false;
                                    }}
                                    className="mx-auto"
                                />
                            </div>

                            {selectedDate && (
                                <div className="space-y-4 pt-4">
                                    <div className="flex items-center gap-2 text-slate-700 font-semibold px-1">
                                        <Clock className="w-4 h-4 text-teal-600" />
                                        Horários Disponíveis
                                    </div>

                                    {availableSlots.length === 0 ? (
                                        <div className="bg-slate-50 p-4 rounded-xl text-center text-slate-500 text-sm">
                                            Nenhum horário disponível para este dia.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2">
                                            {availableSlots.map((time) => (
                                                <button
                                                    key={time}
                                                    onClick={() => setSelectedTime(time)}
                                                    className={cn(
                                                        "py-3 rounded-xl text-sm font-semibold transition-all border",
                                                        selectedTime === time
                                                            ? "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-100"
                                                            : "bg-white border-slate-200 text-slate-600 hover:border-teal-300"
                                                    )}
                                                >
                                                    {time}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <Button
                                onClick={handleReschedule}
                                disabled={!selectedDate || !selectedTime || actionMutation.isPending}
                                className="w-full h-14 mt-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg transition-all"
                            >
                                {actionMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar Reagendamento"}
                            </Button>
                        </div>
                    )}
                </main>

                <footer className="py-8 px-6 text-center text-[10px] text-slate-400 uppercase tracking-widest mt-auto border-t border-slate-50">
                    Powered by InoovaSaúde
                </footer>
            </div>
        </div>
    );
}
