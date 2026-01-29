import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstance } from "./useInstance";

export interface Patient {
  id: string;
  instance_id: string;
  name: string | null;
  phone: string;
  email: string | null;
  notes: string | null;
  profile_pic_url: string | null;
  birth_date: string | null;
  cpf: string | null;
  health_insurance: string | null;
  created_at: string;
}

export interface PatientInput {
  name?: string | null;
  phone: string;
  email?: string | null;
  notes?: string | null;
  birth_date?: string | null;
  cpf?: string | null;
  health_insurance?: string | null;
}

export function usePatients(searchQuery?: string) {
  const { data: instance } = useInstance();

  return useQuery({
    queryKey: ["patients", instance?.id, searchQuery],
    queryFn: async () => {
      if (!instance?.id) return [];

      let query = supabase
        .from("contacts")
        .select("*")
        .eq("instance_id", instance.id)
        .order("name");

      if (searchQuery && searchQuery.trim()) {
        query = query.or(
          `name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Patient[];
    },
    enabled: !!instance?.id,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  const { data: instance } = useInstance();

  return useMutation({
    mutationFn: async (input: PatientInput) => {
      if (!instance?.id) throw new Error("Instância não encontrada");

      const { data, error } = await supabase
        .from("contacts")
        .insert({
          instance_id: instance.id,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Patient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: PatientInput & { id: string }) => {
      const { data, error } = await supabase
        .from("contacts")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Patient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}
