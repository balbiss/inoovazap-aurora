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

const SubdomainRouter = () => {
  const host = window.location.hostname;
  const mainDomains = ["inoovaweb.com.br", "localhost", "127.0.0.1", "aurora-app.com.br"];

  // Is it a subdomain of one of the main domains?
  const isSubdomain = !mainDomains.some(domain => host === domain) && host.split(".").length > 2;

  // For subdomains, the root path should show the public booking page
  if (isSubdomain) {
    return (
      <Routes>
        <Route path="/" element={<PublicBooking />} />
        <Route path="/book/:slug" element={<PublicBooking />} />
        <Route path="/confirmation/:id" element={<AppointmentConfirmation />} />
        <Route path="/auth" element={<Auth />} />
        {/* If something else is accessed on a subdomain, show public booking but we could also show NotFound */}
        <Route path="*" element={<PublicBooking />} />
      </Routes>
    );
  }

  // Standard Application Routing (Main Domain)
  return (
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
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SubdomainRouter />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
