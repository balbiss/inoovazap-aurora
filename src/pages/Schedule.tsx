import { useState } from "react";
import { format, addDays, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppointmentList } from "@/components/schedule/AppointmentList";
import { ScheduleFilters } from "@/components/schedule/ScheduleFilters";
import { NewAppointmentDialog } from "@/components/schedule/NewAppointmentDialog";
import { useFilteredAppointments, AppointmentStatus } from "@/hooks/useAppointments";

export default function Schedule() {
  const today = new Date();
  const [startDate, setStartDate] = useState(format(today, "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(addDays(today, 7), "yyyy-MM-dd"));
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | undefined>(undefined);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);

  const { data: appointments, isLoading } = useFilteredAppointments(
    startDate,
    endDate,
    selectedDoctorId,
    selectedStatus
  );

  const handleClearFilters = () => {
    setSelectedDoctorId(undefined);
    setSelectedStatus(undefined);
  };

  const handleQuickNav = (direction: "prev" | "next" | "today") => {
    if (direction === "today") {
      setStartDate(format(today, "yyyy-MM-dd"));
      setEndDate(format(addDays(today, 7), "yyyy-MM-dd"));
    } else {
      const currentStart = new Date(startDate);
      const currentEnd = new Date(endDate);
      const diff = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));

      if (direction === "prev") {
        setStartDate(format(subDays(currentStart, diff), "yyyy-MM-dd"));
        setEndDate(format(subDays(currentEnd, diff), "yyyy-MM-dd"));
      } else {
        setStartDate(format(addDays(currentStart, diff), "yyyy-MM-dd"));
        setEndDate(format(addDays(currentEnd, diff), "yyyy-MM-dd"));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="space-y-0.5">
          <h1 className="text-xl md:text-2xl font-semibold text-slate-800">
            Agenda
          </h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium">
            Gerencie os agendamentos da clínica
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border border-slate-200 rounded-lg bg-white p-1">
            <Button variant="ghost" size="icon" onClick={() => handleQuickNav("prev")} className="h-8 w-8">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => handleQuickNav("today")} className="px-3">
              Hoje
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleQuickNav("next")} className="h-8 w-8">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Button
            onClick={() => setIsNewAppointmentOpen(true)}
            className="hidden md:flex bg-teal-600 hover:bg-teal-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Filters */}
      <ScheduleFilters
        startDate={startDate}
        endDate={endDate}
        doctorId={selectedDoctorId}
        status={selectedStatus}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onDoctorChange={setSelectedDoctorId}
        onStatusChange={setSelectedStatus}
        onClearFilters={handleClearFilters}
      />

      {/* Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Mostrando <span className="font-medium text-slate-800">{appointments?.length || 0}</span> agendamentos
          {selectedStatus && <span className="text-slate-400"> • Filtrado por status</span>}
          {selectedDoctorId && <span className="text-slate-400"> • Filtrado por profissional</span>}
        </p>
      </div>

      {/* Appointment List */}
      <AppointmentList
        appointments={appointments || []}
        isLoading={isLoading}
      />

      {/* New Appointment Dialog */}
      <NewAppointmentDialog
        open={isNewAppointmentOpen}
        onOpenChange={setIsNewAppointmentOpen}
        defaultDate={new Date(startDate)}
      />
    </div>
  );
}
