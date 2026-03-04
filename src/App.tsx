import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { AuthGuard } from "@/components/auth/AuthGuard";
import Index from "./pages/Index";
import Schedule from "./pages/Schedule";
import Doctors from "./pages/Doctors";
import Patients from "./pages/Patients";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import PublicBooking from "./pages/PublicBooking";
import AppointmentConfirmation from "./pages/AppointmentConfirmation";
import AIBrain from "./pages/AIBrain";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/book/:slug" element={<PublicBooking />} />
          <Route path="/confirmation/:id" element={<AppointmentConfirmation />} />
          <Route
            path="/*"
            element={
              <AuthGuard>
                <LayoutWrapper>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/schedule" element={<Schedule />} />
                    <Route path="/doctors" element={<Doctors />} />
                    <Route path="/patients" element={<Patients />} />
                    <Route path="/ai-brain" element={<AIBrain />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/subscription" element={<Navigate to="/settings?tab=subscription" replace />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </LayoutWrapper>
              </AuthGuard>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
