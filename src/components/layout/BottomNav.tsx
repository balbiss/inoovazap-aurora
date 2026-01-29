import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Calendar, Stethoscope, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Início", path: "/" },
  { icon: Calendar, label: "Agenda", path: "/schedule" },
  { icon: Stethoscope, label: "Médicos", path: "/doctors" },
  { icon: Users, label: "Pacientes", path: "/patients" },
  { icon: Settings, label: "Config", path: "/settings" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="clean-bottomnav fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <ul className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                  "text-slate-500",
                  isActive && "bottomnav-active text-teal-600"
                )}
              >
                <Icon 
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive && "text-teal-600"
                  )} 
                />
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive && "text-teal-600"
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
