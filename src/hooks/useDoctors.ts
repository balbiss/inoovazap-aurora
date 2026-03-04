import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstance } from "./useInstance";
import { Json } from "@/integrations/supabase/types";

export interface DaySchedule {
  open: string;
  close: string;
  lunch_start: string;
  lunch_end: string;
}

export interface DoctorScheduleConfig {
  work_days: number[];
  hours: DaySchedule;
  day_schedules?: Record<number, DaySchedule>;
  blocked_dates: { date: string; reason: string }[];
}

export const defaultScheduleConfig: DoctorScheduleConfig = {
  work_days: [1, 2, 3, 4, 5],
  hours: {
    open: "08:00",
    close: "18:00",
    lunch_start: "12:00",
    lunch_end: "13:00",
  },
  blocked_dates: [],
};

export interface Doctor {
  id: string;
  instance_id: string;
  name: string;
  specialty: string;
  avatar_url: string | null;
  color: string;
  default_duration: number;
  active: boolean;
  created_at: string;
  schedule_config: DoctorScheduleConfig;
}

export interface DoctorInput {
  name: string;
  specialty: string;
  avatar_url?: string | null;
  color?: string;
  default_duration?: number;
  active?: boolean;
  schedule_config?: DoctorScheduleConfig;
}

// Helper to transform DB row to Doctor with proper typing
function transformDoctor(row: {
  id: string;
  instance_id: string;
  name: string;
  specialty: string;
  avatar_url: string | null;
  color: string | null;
  default_duration: number | null;
  active: boolean | null;
  created_at: string | null;
  schedule_config: Json | null;
}): Doctor {
  const scheduleConfig = row.schedule_config as unknown as DoctorScheduleConfig | null;
  return {
    id: row.id,
    instance_id: row.instance_id,
    name: row.name,
    specialty: row.specialty,
    avatar_url: row.avatar_url,
    color: row.color || "#06b6d4",
    default_duration: row.default_duration || 30,
    active: row.active ?? true,
    created_at: row.created_at || new Date().toISOString(),
    schedule_config: scheduleConfig ? {
      ...defaultScheduleConfig,
      ...scheduleConfig,
      hours: { ...defaultScheduleConfig.hours, ...(scheduleConfig.hours || {}) },
      blocked_dates: scheduleConfig.blocked_dates || [],
    } : defaultScheduleConfig,
  };
}

export function useDoctors() {
  const { data: instance } = useInstance();

  return useQuery({
    queryKey: ["doctors", instance?.id],
    queryFn: async () => {
      if (!instance?.id) return [];

      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("instance_id", instance.id)
        .order("name");

      if (error) throw error;
      return (data || []).map(transformDoctor);
    },
    enabled: !!instance?.id,
  });
}

export function useActiveDoctors() {
  const { data: instance } = useInstance();

  return useQuery({
    queryKey: ["doctors", instance?.id, "active"],
    queryFn: async () => {
      if (!instance?.id) return [];

      const { data, error } = await supabase
        .from("doctors")
        .select("*")
        .eq("instance_id", instance.id)
        .eq("active", true)
        .order("name");

      if (error) throw error;
      return (data || []).map(transformDoctor);
    },
    enabled: !!instance?.id,
  });
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();
  const { data: instance } = useInstance();

  return useMutation({
    mutationFn: async (input: DoctorInput) => {
      if (!instance?.id) throw new Error("Instância não encontrada");

      const { schedule_config, ...rest } = input;
      const { data, error } = await supabase
        .from("doctors")
        .insert({
          instance_id: instance.id,
          ...rest,
          schedule_config: schedule_config ? JSON.parse(JSON.stringify(schedule_config)) : undefined,
        })
        .select()
        .single();

      if (error) throw error;
      return transformDoctor(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, schedule_config, ...rest }: DoctorInput & { id: string }) => {
      const { data, error } = await supabase
        .from("doctors")
        .update({
          ...rest,
          schedule_config: schedule_config ? JSON.parse(JSON.stringify(schedule_config)) : undefined,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return transformDoctor(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}

export function useDeleteDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("doctors")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}
