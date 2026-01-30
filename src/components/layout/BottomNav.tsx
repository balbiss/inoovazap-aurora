import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Calendar, Stethoscope, Menu, Brain, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Início", path: "/" },
  { icon: Calendar, label: "Agenda", path: "/schedule" },
  { icon: FileText, label: "Relatórios", path: "/reports" },
  { icon: Brain, label: "IA", path: "/ai-brain" },
  { icon: Menu, label: "Menu", path: "/settings" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="clean-bottomnav fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-slate-200 pb-safe">
      <ul className="flex items-center justify-between px-2 py-1.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <li key={item.path} className="flex-1">
              <NavLink
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1 transition-all duration-200",
                  "text-slate-400",
                  isActive && "text-teal-600"
                )}
              >
                <div className={cn(
                  "p-1 rounded-lg transition-colors",
                  isActive && "bg-teal-50"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  "text-[10px] font-medium tracking-tight",
                  isActive ? "text-teal-600" : "text-slate-500"
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
