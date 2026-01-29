import { useState } from "react";
import { format, addDays, startOfWeek, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScheduleGrid } from "@/components/schedule/ScheduleGrid";
import { DoctorFilter } from "@/components/schedule/DoctorFilter";
import { NewAppointmentDialog } from "@/components/schedule/NewAppointmentDialog";
import { useWeekAppointments } from "@/hooks/useAppointments";

export default function Schedule() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | undefined>(undefined);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const { data: appointments, isLoading } = useWeekAppointments(selectedDate, selectedDoctorId);

  const handlePrevWeek = () => setSelectedDate(subWeeks(selectedDate, 1));
  const handleNextWeek = () => setSelectedDate(addWeeks(selectedDate, 1));
  const handleToday = () => setSelectedDate(new Date());

  const formattedWeek = `${format(weekStart, "d 'de' MMMM", { locale: ptBR })} - ${format(addDays(weekStart, 6), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-800">
            Agenda
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gerencie os agendamentos da clínica
          </p>
        </div>

        <Button
          onClick={() => setIsNewAppointmentOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevWeek} className="border-slate-200">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Button variant="outline" onClick={handleToday} className="px-4 border-slate-200">
            Hoje
          </Button>
          
          <Button variant="outline" size="icon" onClick={handleNextWeek} className="border-slate-200">
            <ChevronRight className="w-4 h-4" />
          </Button>

          <span className="text-sm text-slate-600 ml-2 hidden md:inline font-medium">
            {formattedWeek}
          </span>
        </div>

        {/* Doctor Filter */}
        <DoctorFilter 
          value={selectedDoctorId} 
          onChange={setSelectedDoctorId} 
        />
      </div>

      {/* Mobile Date Display */}
      <p className="text-sm text-slate-600 md:hidden text-center font-medium">
        {formattedWeek}
      </p>

      {/* Schedule Grid */}
      <ScheduleGrid 
        weekStart={weekStart}
        appointments={appointments || []}
        isLoading={isLoading}
        selectedDoctorId={selectedDoctorId}
      />

      {/* New Appointment Dialog */}
      <NewAppointmentDialog 
        open={isNewAppointmentOpen} 
        onOpenChange={setIsNewAppointmentOpen}
        defaultDate={selectedDate}
      />
    </div>
  );
}
