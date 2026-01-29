import { GlassCard } from "@/components/ui/GlassCard";
import { NeonText } from "@/components/ui/NeonText";

export default function WhatsApp() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <NeonText as="h1" className="text-3xl md:text-4xl" glow={false}>
          WhatsApp
        </NeonText>
        <p className="text-muted-foreground text-lg">
          Gerencie suas conversas e conexões
        </p>
      </div>

      <GlassCard className="min-h-[400px] flex items-center justify-center">
        <p className="text-muted-foreground">Em breve: Integração WhatsApp</p>
      </GlassCard>
    </div>
  );
}
