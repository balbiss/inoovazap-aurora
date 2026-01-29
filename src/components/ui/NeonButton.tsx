import * as React from "react";
import { cn } from "@/lib/utils";

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({ children, className, variant = "default", size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
    };

    const variantClasses = {
      default: "neon-button",
      outline: cn(
        "relative overflow-hidden rounded-xl font-semibold transition-all duration-300",
        "border-2 border-transparent bg-clip-padding",
        "before:absolute before:inset-0 before:-z-10 before:rounded-xl",
        "before:bg-gradient-to-r before:from-neon-blue before:to-neon-cyan before:opacity-0",
        "hover:before:opacity-20",
        "text-foreground",
        "border-neon-blue/50 hover:border-neon-cyan/80",
        "hover:shadow-neon"
      ),
      ghost: cn(
        "relative overflow-hidden rounded-xl font-semibold transition-all duration-300",
        "bg-transparent hover:bg-neon-blue/10",
        "text-foreground hover:text-primary",
        "hover:shadow-neon"
      ),
    };

    return (
      <button
        ref={ref}
        className={cn(
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

NeonButton.displayName = "NeonButton";

export { NeonButton };
