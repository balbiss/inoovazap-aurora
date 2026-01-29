import { MessageCircle } from "lucide-react";
import { NeonText } from "@/components/ui/NeonText";

export function MobileHeader() {
  return (
    <header className="glass-bottomnav fixed top-0 left-0 right-0 z-50 md:hidden">
      <div className="flex items-center justify-center gap-2 px-4 py-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-cyan flex items-center justify-center shadow-neon">
          <MessageCircle className="w-5 h-5 text-background" />
        </div>
        <NeonText as="h1" className="text-xl tracking-tight" glow={false}>
          InoovaZap
        </NeonText>
      </div>
    </header>
  );
}
