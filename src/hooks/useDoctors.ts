import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstance } from "./useInstance";

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
}

export interface DoctorInput {
  name: string;
  specialty: string;
  avatar_url?: string | null;
  color?: string;
  default_duration?: number;
  active?: boolean;
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
      return data as Doctor[];
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
      return data as Doctor[];
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

      const { data, error } = await supabase
        .from("doctors")
        .insert({
          instance_id: instance.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Doctor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
    },
  });
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: DoctorInput & { id: string }) => {
      const { data, error } = await supabase
        .from("doctors")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Doctor;
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
