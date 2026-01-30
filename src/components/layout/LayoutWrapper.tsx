import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { MobileHeader } from "./MobileHeader";
import { NotificationManager } from "@/components/notifications/NotificationManager";
import { FAB } from "@/components/ui/FAB";
import { NewAppointmentDialog } from "@/components/schedule/NewAppointmentDialog";

interface LayoutWrapperProps {
  children: ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <NotificationManager />

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
