import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2, LogOut, Settings2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useInstance } from "@/hooks/useInstance";
import { ImageUpload } from "@/components/shared/ImageUpload";


interface ClinicFormData {
  company_name: string;
  full_name: string;
  phone: string;
  logo_url?: string | null;
}


export function ClinicSettings() {
  const navigate = useNavigate();
  const { data: instance, refetch: refetchInstance } = useInstance();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, watch } = useForm<ClinicFormData>();
  const logoUrl = watch("logo_url");

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch profile data - Try user_id first
        let { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        // If not found by user_id, try by id (some schemas use id for the user uuid)
        if (!profile) {
          const { data: profileById } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();
          profile = profileById;
        }

        // Use instance data for company name as primary source
        reset({
          company_name: instance?.company_name || profile?.company_name || "",
          full_name: profile?.full_name || "",
          phone: profile?.phone || "",
          logo_url: instance?.logo_url || null,
        });

      }
      setIsLoading(false);
    };

    fetchData();
  }, [reset, instance]);

  const onSubmit = async (data: ClinicFormData) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Update or Create profile using upsert
      // Pick only existing columns for the profiles table to avoid 400 error
      const profileData = {
        user_id: user.id,
        full_name: data.full_name,
        phone: data.phone,
        company_name: data.company_name,
        avatar_url: data.logo_url, // Map logo_url to avatar_url for profiles
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(profileData, { onConflict: 'user_id' });

      if (profileError) {
        // Fallback for cases where id might be the preferred conflict key
        const { error: profileFallbackError } = await supabase
          .from("profiles")
          .upsert({
            id: user.id,
            ...profileData
          }, { onConflict: 'id' });

        if (profileFallbackError) throw profileFallbackError;
      }

      // Update instance schedule_config and company_name
      if (instance) {
        const { error: instanceError } = await supabase
          .from("instances")
          .update({
            company_name: data.company_name,
            logo_url: data.logo_url
          })
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
        <div className="p-6 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-3">
            <ImageUpload
              label="Logomarca da Clínica"
              value={logoUrl}
              onChange={(url) => setValue("logo_url", url)}
              folder="logos"
            />
          </div>
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
