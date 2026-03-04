import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Heart, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface WelcomeClinicModalProps {
    open: boolean;
}

export function WelcomeClinicModal({ open }: WelcomeClinicModalProps) {
    const [clinicName, setClinicName] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const queryClient = useQueryClient();

    const handleCreateClinic = async (e: React.FormEvent) => {
        e.preventDefault();
        if (clinicName.length < 2) {
            toast.error("Por favor, insira um nome válido para sua clínica.");
            return;
        }

        setIsCreating(true);
        try {
            const { data, error } = await supabase.functions.invoke("manage-instance", {
                body: { action: "create", instance_name: clinicName },
            });

            if (error) throw error;

            toast.success("Clínica registrada com sucesso! Bem-vindo(a).");
            queryClient.invalidateQueries({ queryKey: ["user-instance"] });
            queryClient.invalidateQueries({ queryKey: ["user-instances"] });
        } catch (error: any) {
            console.error("Erro ao criar clínica:", error);
            toast.error("Erro ao registrar clínica: " + (error.message || "Erro desconhecido"));
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-md border-none p-0 overflow-hidden bg-white shadow-2xl">
                <div className="bg-teal-600 p-8 text-center relative overflow-hidden">
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute -top-10 -left-10 w-40 h-40 border-4 border-white rounded-full" />
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 border-4 border-white rounded-full" />
                    </div>

                    <div className="relative z-10 space-y-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm shadow-xl">
                            <Heart className="h-8 w-8 text-white" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-2xl font-bold text-white tracking-tight">Bem-vindo(a)!</DialogTitle>
                            <p className="text-teal-50 text-sm">Vamos configurar seu consultório digital</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <form onSubmit={handleCreateClinic} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="clinicName" className="text-slate-700 font-medium">Nome da sua Clínica ou Consultório</Label>
                            <Input
                                id="clinicName"
                                placeholder="Ex: Clínica Inoova, Consultório Dra. Ana..."
                                value={clinicName}
                                onChange={(e) => setClinicName(e.target.value)}
                                autoFocus
                                className="h-12 border-slate-200 focus:ring-teal-500 focus:border-teal-500 text-lg"
                            />
                            <p className="text-[11px] text-slate-500 italic">
                                Este nome será usado nos seus links de agendamento e mensagens.
                            </p>
                        </div>

                        <Button
                            type="submit"
                            disabled={isCreating}
                            className="w-full h-12 bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-100 flex gap-2 text-base font-semibold transition-all hover:scale-[1.02]"
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Registrando...
                                </>
                            ) : (
                                <>
                                    Começar Agora
                                    <Sparkles className="w-5 h-5" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="pt-2">
                        <p className="text-xs text-center text-slate-400">
                            Ao continuar, você inicia seu período de teste gratuito do InoovaSaúde.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
