import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MedicalKPIGrid } from "@/components/dashboard/MedicalKPIGrid";
import { DayTimeline } from "@/components/dashboard/DayTimeline";
import { NewAppointmentDialog } from "@/components/schedule/NewAppointmentDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Escuta mudanças em tempo real na tabela de agendamentos
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta inserções, atualizações e exclusões
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log('Mudança detectada no agendamento:', payload);
          // Invalida as queries de agendamentos para forçar o refetch automático
          queryClient.invalidateQueries({ queryKey: ["appointments"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return (
    <div className="space-y-6">
      {/* Header with greeting and action button */}
      <DashboardHeader onNewAppointment={() => setIsNewAppointmentOpen(true)} />

      {/* KPI Cards Grid */}
      <MedicalKPIGrid />

      {/* Timeline */}
      <DayTimeline />

      {/* New Appointment Dialog */}
      <NewAppointmentDialog 
        open={isNewAppointmentOpen} 
        onOpenChange={setIsNewAppointmentOpen}
      />
    </div>
  );
}
