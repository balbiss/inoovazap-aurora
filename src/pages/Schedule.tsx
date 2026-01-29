import { useState } from "react";
import { format, addDays, subDays, startOfWeek, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NeonText } from "@/components/ui/NeonText";
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
          <NeonText as="h1" className="text-3xl md:text-4xl" glow={false}>
            Agenda
          </NeonText>
          <p className="text-muted-foreground text-lg">
            Gerencie os agendamentos da clínica
          </p>
        </div>

        <Button
          onClick={() => setIsNewAppointmentOpen(true)}
          className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Date Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Button variant="outline" onClick={handleToday} className="px-4">
            Hoje
          </Button>
          
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>

          <span className="text-sm text-muted-foreground ml-2 hidden md:inline">
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
      <p className="text-sm text-muted-foreground md:hidden text-center">
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
