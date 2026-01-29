import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import Index from "./pages/Index";
import WhatsApp from "./pages/WhatsApp";
import Automacoes from "./pages/Automacoes";
import Perfil from "./pages/Perfil";
import Auth from "./pages/Auth";
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
          <Route
            path="/*"
            element={
              <LayoutWrapper>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/whatsapp" element={<WhatsApp />} />
                  <Route path="/automacoes" element={<Automacoes />} />
                  <Route path="/perfil" element={<Perfil />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </LayoutWrapper>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
