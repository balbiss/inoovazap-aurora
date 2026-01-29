import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, MessageCircle, Workflow, User } from "lucide-react";
import { NeonText } from "@/components/ui/NeonText";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: MessageCircle, label: "WhatsApp", path: "/whatsapp" },
  { icon: Workflow, label: "Automações", path: "/automacoes" },
  { icon: User, label: "Perfil", path: "/perfil" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="glass-sidebar fixed left-0 top-0 h-screen w-64 flex flex-col z-50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-blue to-neon-cyan flex items-center justify-center shadow-neon">
          <MessageCircle className="w-6 h-6 text-background" />
        </div>
        <NeonText as="h1" className="text-2xl tracking-tight" glow={false}>
          InoovaZap
        </NeonText>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300",
                    "text-muted-foreground hover:text-foreground",
                    "hover:bg-secondary/50",
                    isActive && "nav-active text-foreground"
                  )}
                >
                  <Icon 
                    className={cn(
                      "w-5 h-5 transition-all duration-300",
                      isActive && "text-primary glow"
                    )} 
                  />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-6 py-6 border-t border-border/50">
        <p className="text-xs text-muted-foreground text-center">
          © 2024 InoovaZap
        </p>
      </div>
    </aside>
  );
}
