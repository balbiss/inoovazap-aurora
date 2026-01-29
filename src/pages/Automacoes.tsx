import { GlassCard } from "@/components/ui/GlassCard";
import { NeonText } from "@/components/ui/NeonText";

export default function Automacoes() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <NeonText as="h1" className="text-3xl md:text-4xl" glow={false}>
          Automações
        </NeonText>
        <p className="text-muted-foreground text-lg">
          Configure fluxos automatizados
        </p>
      </div>

      <GlassCard className="min-h-[400px] flex items-center justify-center">
        <p className="text-muted-foreground">Em breve: Editor de Automações</p>
      </GlassCard>
    </div>
  );
}
