import { format, addDays, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment } from "@/hooks/useAppointments";
import { AppointmentCard } from "./AppointmentCard";
import { cn } from "@/lib/utils";

interface ScheduleGridProps {
  weekStart: Date;
  appointments: Appointment[];
  isLoading: boolean;
  selectedDoctorId?: string;
}

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const minute = (i % 2) * 30;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
});

export function ScheduleGrid({ weekStart, appointments, isLoading }: ScheduleGridProps) {
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getAppointmentsForSlot = (day: Date, time: string) => {
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.start_time);
      const aptTime = format(aptDate, "HH:mm");
      return isSameDay(aptDate, day) && aptTime === time;
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 min-h-[400px] flex items-center justify-center">
        <p className="text-slate-500">Carregando agenda...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Header - Days of Week */}
      <div className="grid grid-cols-8 border-b border-slate-200">
        <div className="p-3 text-center text-xs font-medium text-slate-500 border-r border-slate-200 bg-slate-50">
          Horário
        </div>
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "p-3 text-center border-r border-slate-200 last:border-r-0",
              isToday(day) && "bg-teal-50"
            )}
          >
            <div className="text-xs font-medium text-slate-500 uppercase">
              {format(day, "EEE", { locale: ptBR })}
            </div>
            <div
              className={cn(
                "text-lg font-semibold",
                isToday(day) ? "text-teal-600" : "text-slate-800"
              )}
            >
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* Time Grid */}
      <div className="max-h-[600px] overflow-y-auto">
        {timeSlots.map((time) => (
          <div
            key={time}
            className="grid grid-cols-8 border-b border-slate-100 last:border-b-0"
          >
            {/* Time Column */}
            <div className="p-2 text-center text-xs text-slate-500 border-r border-slate-100 flex items-center justify-center min-h-[60px] bg-slate-50">
              {time}
            </div>

            {/* Day Columns */}
            {weekDays.map((day) => {
              const slotAppointments = getAppointmentsForSlot(day, time);
              
              return (
                <div
                  key={`${day.toISOString()}-${time}`}
                  className={cn(
                    "p-1 border-r border-slate-100 last:border-r-0 min-h-[60px]",
                    isToday(day) && "bg-teal-50/30"
                  )}
                >
                  {slotAppointments.map((apt) => (
                    <AppointmentCard key={apt.id} appointment={apt} compact />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
