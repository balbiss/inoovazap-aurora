import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MedicalKPIGrid } from "@/components/dashboard/MedicalKPIGrid";
import { DayTimeline } from "@/components/dashboard/DayTimeline";
import { NewAppointmentDialog } from "@/components/schedule/NewAppointmentDialog";

export default function Dashboard() {
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);

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
