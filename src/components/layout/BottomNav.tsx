import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, MessageCircle, Workflow, User, Plug } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Plug, label: "Integração", path: "/integration" },
  { icon: MessageCircle, label: "WhatsApp", path: "/whatsapp" },
  { icon: Workflow, label: "Automações", path: "/automacoes" },
  { icon: User, label: "Perfil", path: "/perfil" },
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
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300",
                  "text-muted-foreground",
                  isActive && "bottomnav-active text-foreground"
                )}
              >
                <Icon 
                  className={cn(
                    "w-6 h-6 transition-all duration-300",
                    isActive && "text-primary glow"
                  )} 
                />
                <span className={cn(
                  "text-xs font-medium",
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
