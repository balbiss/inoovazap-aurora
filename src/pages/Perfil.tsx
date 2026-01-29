import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonText } from "@/components/ui/NeonText";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";

export default function Perfil() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: error.message,
      });
    } else {
      navigate("/auth", { replace: true });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <NeonText as="h1" className="text-3xl md:text-4xl" glow={false}>
            Perfil
          </NeonText>
          <p className="text-muted-foreground text-lg">
            Gerencie sua conta e configurações
          </p>
        </div>

        {/* Logout button visible on mobile */}
        <Button
          variant="outline"
          onClick={handleLogout}
          className="md:hidden bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20 hover:text-destructive"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair da Conta
        </Button>
      </div>

      <GlassCard className="min-h-[400px] flex items-center justify-center">
        <p className="text-muted-foreground">Em breve: Configurações de Perfil</p>
      </GlassCard>
    </div>
  );
}
