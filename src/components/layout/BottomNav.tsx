import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Calendar, Stethoscope, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Visão Geral", path: "/" },
  { icon: Calendar, label: "Agenda", path: "/schedule" },
  { icon: Stethoscope, label: "Profissionais", path: "/doctors" },
  { icon: Users, label: "Pacientes", path: "/patients" },
  { icon: Settings, label: "Configurações", path: "/settings" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="glass-bottomnav fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <ul className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300",
                  "text-muted-foreground",
                  isActive && "bottomnav-active text-foreground"
                )}
              >
                <Icon 
                  className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isActive && "text-primary glow"
                  )} 
                />
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive && "text-primary"
                )}>
                  {item.label}
                </span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
