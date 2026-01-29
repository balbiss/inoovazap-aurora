import { Heart } from "lucide-react";

export function MobileHeader() {
  return (
    <header className="clean-bottomnav fixed top-0 left-0 right-0 z-50 md:hidden border-b border-slate-200">
      <div className="flex items-center justify-center gap-2 px-4 py-3">
        <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-lg font-bold text-slate-800">InoovaSaúde</h1>
      </div>
    </header>
  );
}
