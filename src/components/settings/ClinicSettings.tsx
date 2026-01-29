import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/GlassCard";
import { supabase } from "@/integrations/supabase/client";

interface ClinicFormData {
  company_name: string;
  full_name: string;
  phone: string;
}

export function ClinicSettings() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { register, handleSubmit, reset } = useForm<ClinicFormData>();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile) {
          reset({
            company_name: profile.company_name || "",
            full_name: profile.full_name || "",
            phone: profile.phone || "",
          });
        }
      }
      setIsLoading(false);
    };

    fetchProfile();
  }, [reset]);

  const onSubmit = async (data: ClinicFormData) => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Configurações salvas com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao salvar configurações", {
        description: error.message,
      });
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
      <GlassCard className="p-6">
        <p className="text-muted-foreground text-center">Carregando...</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6 max-w-xl">
      <h3 className="text-lg font-semibold text-foreground mb-6">
        Dados da Clínica
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="company_name">Nome da Clínica</Label>
          <Input
            id="company_name"
            placeholder="Nome da sua clínica"
            {...register("company_name")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="full_name">Responsável</Label>
          <Input
            id="full_name"
            placeholder="Nome do responsável"
            {...register("full_name")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            placeholder="(11) 99999-0000"
            {...register("phone")}
          />
        </div>

        <div className="flex items-center justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleLogout}
            className="text-destructive border-destructive/20 hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair da Conta
          </Button>

          <Button
            type="submit"
            disabled={isSaving}
            className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white"
          >
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </div>
      </form>
    </GlassCard>
  );
}
