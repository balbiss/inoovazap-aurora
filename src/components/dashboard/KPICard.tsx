import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  iconColor: string;
  iconBg: string;
}

export function KPICard({ icon: Icon, title, value, change, trend, iconColor, iconBg }: KPICardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : TrendingDown;
  
  return (
    <div className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-6 hover:bg-white/[0.07] transition-all duration-300 min-w-[240px] md:min-w-0">
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">
            {title}
          </p>
          
          <p className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            {value}
          </p>
          
          <div 
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
              trend === "up" 
                ? "bg-emerald-500/20 text-emerald-400" 
                : "bg-rose-500/20 text-rose-400"
            )}
          >
            <TrendIcon className="w-3 h-3" />
            {change}
          </div>
        </div>
        
        <div 
          className={cn(
            "p-3 rounded-xl transition-all duration-300 group-hover:scale-110",
            iconBg
          )}
        >
          <Icon className={cn("w-5 h-5 md:w-6 md:h-6", iconColor)} />
        </div>
      </div>
    </div>
  );
}
