import * as React from "react";
import { cn } from "@/lib/utils";

interface NeonTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  className?: string;
  as?: "span" | "h1" | "h2" | "h3" | "h4" | "p";
  glow?: boolean;
}

const NeonText = React.forwardRef<HTMLSpanElement, NeonTextProps>(
  ({ children, className, as: Component = "span", glow = true, ...props }, ref) => {
    return (
      <Component
        ref={ref as any}
        className={cn(
          "neon-text font-bold",
          glow && "animate-glow-pulse",
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

NeonText.displayName = "NeonText";

export { NeonText };
