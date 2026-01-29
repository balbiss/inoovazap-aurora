import { GlassCard } from "@/components/ui/GlassCard";
import { NeonText } from "@/components/ui/NeonText";

export default function Perfil() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <NeonText as="h1" className="text-3xl md:text-4xl" glow={false}>
          Perfil
        </NeonText>
        <p className="text-muted-foreground text-lg">
          Gerencie sua conta e configurações
        </p>
      </div>

      <GlassCard className="min-h-[400px] flex items-center justify-center">
        <p className="text-muted-foreground">Em breve: Configurações de Perfil</p>
      </GlassCard>
    </div>
  );
}
