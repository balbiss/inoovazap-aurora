import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { MobileHeader } from "./MobileHeader";
import { NotificationManager } from "@/components/notifications/NotificationManager";
import { FAB } from "@/components/ui/FAB";
import { NewAppointmentDialog } from "@/components/schedule/NewAppointmentDialog";
import { useInstance } from "@/hooks/useInstance";
import { WelcomeClinicModal } from "@/components/auth/WelcomeClinicModal";
import { Loader2 } from "lucide-react";

interface LayoutWrapperProps {
  children: ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const { data: instance, isLoading, error } = useInstance();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">Erro de Conexão</h2>
          <p className="text-slate-600">Não foi possível carregar as configurações da clínica.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all font-medium"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const hasNoClinic = !instance;

  return (
    <div className="min-h-screen bg-slate-50">
      <NotificationManager />

      {/* Welcome Modal for new users - Disabled to allow direct configuration */}
      <WelcomeClinicModal open={false} />

      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Header - Hidden on desktop */}
      <div className="block md:hidden">
        <MobileHeader />
      </div>

      {/* Main Content */}
      <main className="pt-16 pb-20 px-4 md:pt-0 md:pb-0 md:ml-64 md:p-8">
        {children}
      </main>

      {/* Mobile Actions */}
      <div className="block md:hidden">
        <FAB onClick={() => setIsNewAppointmentOpen(true)} />
        <BottomNav />
      </div>

      <NewAppointmentDialog
        open={isNewAppointmentOpen}
        onOpenChange={setIsNewAppointmentOpen}
      />
    </div>
  );
}
