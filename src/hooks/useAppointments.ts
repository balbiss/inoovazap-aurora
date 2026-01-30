import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstance } from "./useInstance";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, format, parseISO } from "date-fns";

export type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";

export interface Appointment {
  id: string;
  instance_id: string;
  doctor_id: string;
  patient_id: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes: string | null;
  appointment_type: string | null;
  insurance: string | null;
  reminder_sent_at: string | null;
  rescheduled_from: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  doctor?: {
    id: string;
    name: string;
    specialty: string;
    color: string;
  };
  patient?: {
    id: string;
    name: string | null;
    phone: string;
  };
}

export interface AppointmentInput {
  doctor_id: string;
  patient_id: string;
  start_time: string;
  end_time: string;
  status?: AppointmentStatus;
  notes?: string | null;
  appointment_type?: string | null;
  insurance?: string | null;
}

export function useAppointments(date: Date | string, doctorId?: string) {
  const { data: instance } = useInstance();

  return useQuery({
    queryKey: ["appointments", instance?.id, typeof date === "string" ? date : format(date, "yyyy-MM-dd"), doctorId],
    queryFn: async () => {
      if (!instance?.id) return [];

      const parsedDate = typeof date === "string" ? parseISO(date) : date;

      let query = supabase
        .from("appointments")
        .select(`
          *,
          doctor:doctors(id, name, specialty, color),
          patient:contacts!appointments_patient_id_fkey(id, name, phone)
        `)
        .eq("instance_id", instance.id)
        .gte("start_time", startOfDay(parsedDate).toISOString())
        .lte("start_time", endOfDay(parsedDate).toISOString())
        .order("start_time");

      if (doctorId) {
        query = query.eq("doctor_id", doctorId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!instance?.id,
  });
}

export function useWeekAppointments(date: Date | string, doctorId?: string) {
  const { data: instance } = useInstance();
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  const weekStart = startOfWeek(parsedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(parsedDate, { weekStartsOn: 1 });

  return useQuery({
    queryKey: ["appointments", instance?.id, "week", format(weekStart, "yyyy-MM-dd"), doctorId],
    queryFn: async () => {
      if (!instance?.id) return [];

      let query = supabase
        .from("appointments")
        .select(`
          *,
          doctor:doctors(id, name, specialty, color),
          patient:contacts!appointments_patient_id_fkey(id, name, phone)
        `)
        .eq("instance_id", instance.id)
        .gte("start_time", weekStart.toISOString())
        .lte("start_time", weekEnd.toISOString())
        .order("start_time");

      if (doctorId) {
        query = query.eq("doctor_id", doctorId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!instance?.id,
  });
}

export function useFilteredAppointments(
  startDate: Date | string,
  endDate: Date | string,
  doctorId?: string,
  status?: AppointmentStatus
) {
  const { data: instance } = useInstance();

  return useQuery({
    queryKey: [
      "appointments",
      instance?.id,
      "filtered",
      typeof startDate === "string" ? startDate : format(startDate, "yyyy-MM-dd"),
      typeof endDate === "string" ? endDate : format(endDate, "yyyy-MM-dd"),
      doctorId,
      status,
    ],
    queryFn: async () => {
      if (!instance?.id) return [];

      const start = typeof startDate === "string" ? parseISO(startDate) : startDate;
      const end = typeof endDate === "string" ? parseISO(endDate) : endDate;

      let query = supabase
        .from("appointments")
        .select(`
          *,
          doctor:doctors(id, name, specialty, color),
          patient:contacts!appointments_patient_id_fkey(id, name, phone)
        `)
        .eq("instance_id", instance.id)
        .gte("start_time", startOfDay(start).toISOString())
        .lte("start_time", endOfDay(end).toISOString())
        .order("start_time");

      if (doctorId) {
        query = query.eq("doctor_id", doctorId);
      }

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!instance?.id,
  });
}

export function useTodayStats() {
  const { data: instance } = useInstance();
  const today = new Date();

  return useQuery({
    queryKey: ["appointments", instance?.id, "stats", format(today, "yyyy-MM-dd")],
    queryFn: async () => {
      if (!instance?.id) return { total: 0, confirmed: 0, noShow: 0, newPatients: 0 };

      // Appointments today
      const { data: appointments, error: appError } = await supabase
        .from("appointments")
        .select("status")
        .eq("instance_id", instance.id)
        .gte("start_time", startOfDay(today).toISOString())
        .lte("start_time", endOfDay(today).toISOString());

      if (appError) throw appError;

      // New patients this week
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const { count: newPatients, error: patError } = await supabase
        .from("contacts")
        .select("*", { count: "exact", head: true })
        .eq("instance_id", instance.id)
        .gte("created_at", weekStart.toISOString());

      if (patError) throw patError;

      const total = appointments?.length || 0;
      const confirmed = appointments?.filter(a => a.status === "confirmed" || a.status === "completed").length || 0;
      const noShow = appointments?.filter(a => a.status === "no_show").length || 0;

      return {
        total,
        confirmed,
        noShow,
        newPatients: newPatients || 0,
      };
    },
    enabled: !!instance?.id,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { data: instance } = useInstance();

  return useMutation({
    mutationFn: async (input: AppointmentInput) => {
      if (!instance?.id) throw new Error("Instância não encontrada");

      const { data, error } = await supabase
        .from("appointments")
        .insert({
          instance_id: instance.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<AppointmentInput> & { id: string }) => {
      const { data, error } = await supabase
        .from("appointments")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Appointment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
