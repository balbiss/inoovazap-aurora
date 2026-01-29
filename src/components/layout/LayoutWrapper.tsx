import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { MobileHeader } from "./MobileHeader";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutWrapperProps {
  children: ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}

      {/* Mobile Header */}
      {isMobile && <MobileHeader />}

      {/* Main Content */}
      <main
        className={
          isMobile
            ? "pt-20 pb-24 px-4"
            : "ml-64 p-8"
        }
      >
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      {isMobile && <BottomNav />}
    </div>
  );
}
