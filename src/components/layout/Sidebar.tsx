import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Calendar, 
  Stethoscope, 
  Users, 
  Settings, 
  LogOut,
  Heart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { icon: LayoutDashboard, label: "Visão Geral", path: "/" },
  { icon: Calendar, label: "Agenda", path: "/schedule" },
  { icon: Stethoscope, label: "Profissionais", path: "/doctors" },
  { icon: Users, label: "Pacientes", path: "/patients" },
  { icon: Settings, label: "Configurações", path: "/settings" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: error.message,
      });
    } else {
      navigate("/auth", { replace: true });
    }
  };

  return (
    <aside className="sidebar-branded fixed left-0 top-0 h-screen w-64 flex flex-col z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
          <Heart className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">InoovaSaúde</h1>
          <p className="text-xs text-white/60">Gestão de Clínicas</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200",
                    "text-white/80 hover:text-white hover:bg-white/10",
                    isActive && "sidebar-active text-white"
                  )}
                >
                  <Icon 
                    className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-white" : "text-white/70"
                    )} 
                  />
                  <span className="font-medium text-sm">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="px-4 pb-4">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 w-full",
            "text-white/70 hover:text-rose-300 hover:bg-white/10"
          )}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Sair</span>
        </button>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-xs text-white/40 text-center">
          © 2025 InoovaSaúde
        </p>
      </div>
    </aside>
  );
}
