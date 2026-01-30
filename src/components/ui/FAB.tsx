import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface FABProps {
    onClick: () => void;
    icon?: React.ReactNode;
    className?: string;
}

export function FAB({ onClick, icon, className }: FABProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "fixed bottom-20 right-4 z-50 md:hidden",
                "w-14 h-14 rounded-full bg-teal-600 text-white shadow-lg flex items-center justify-center",
                "hover:bg-teal-700 active:scale-95 transition-all duration-200",
                className
            )}
        >
            {icon || <Plus className="w-6 h-6" />}
        </button>
    );
}
