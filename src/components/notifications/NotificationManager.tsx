import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useInstance } from "@/hooks/useInstance";

export function NotificationManager() {
    const { data: instance } = useInstance();

    useEffect(() => {
        if (!instance?.id) return;

        const channel = supabase
            .channel("new-appointments")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "appointments",
                    filter: `instance_id=eq.${instance.id}`,
                },
                async (payload) => {
                    // Fetch patient name for the notification
                    const { data: patient } = await supabase
                        .from("contacts")
                        .select("name")
                        .eq("id", payload.new.patient_id)
                        .single();

                    const patientName = patient?.name || "Novo Paciente";
                    const time = new Date(payload.new.start_time).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                    });

                    // Play sound
                    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
                    audio.play().catch(e => console.log("Audio play blocked", e));

                    // Show toast
                    toast.success(`📅 Novo agendamento!`, {
                        description: `${patientName} às ${time}`,
                        action: {
                            label: "Ver",
                            onClick: () => window.location.href = "/schedule",
                        },
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [instance?.id]);

    return null;
}
