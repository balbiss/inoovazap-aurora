import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { MobileHeader } from "./MobileHeader";

interface LayoutWrapperProps {
  children: ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <div className="min-h-screen bg-slate-50">
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

      {/* Mobile Bottom Nav - Hidden on desktop */}
      <div className="block md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
