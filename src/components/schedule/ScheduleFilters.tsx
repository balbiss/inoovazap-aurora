import { format } from "date-fns";
import { Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDoctors } from "@/hooks/useDoctors";
import { AppointmentStatus } from "@/hooks/useAppointments";

interface ScheduleFiltersProps {
  startDate: string;
  endDate: string;
  doctorId: string | undefined;
  status: AppointmentStatus | undefined;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onDoctorChange: (doctorId: string | undefined) => void;
  onStatusChange: (status: AppointmentStatus | undefined) => void;
  onClearFilters: () => void;
}

const statusOptions: { value: AppointmentStatus; label: string }[] = [
  { value: "scheduled", label: "Agendado" },
  { value: "confirmed", label: "Confirmado" },
  { value: "completed", label: "Realizado" },
  { value: "cancelled", label: "Cancelado" },
  { value: "no_show", label: "Não compareceu" },
];

export function ScheduleFilters({
  startDate,
  endDate,
  doctorId,
  status,
  onStartDateChange,
  onEndDateChange,
  onDoctorChange,
  onStatusChange,
  onClearFilters,
}: ScheduleFiltersProps) {
  const { data: doctors } = useDoctors();

  const hasFilters = doctorId || status;

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-700">Filtros</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Start Date */}
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Data Início</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="border-slate-200"
          />
        </div>

        {/* End Date */}
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Data Fim</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="border-slate-200"
          />
        </div>

        {/* Doctor Filter */}
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Profissional</label>
          <Select
            value={doctorId || "all"}
            onValueChange={(val) => onDoctorChange(val === "all" ? undefined : val)}
          >
            <SelectTrigger className="border-slate-200">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os profissionais</SelectItem>
              {doctors?.map((doc) => (
                <SelectItem key={doc.id} value={doc.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: doc.color || "#06b6d4" }}
                    />
                    {doc.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-1">
          <label className="text-xs text-slate-500">Status</label>
          <Select
            value={status || "all"}
            onValueChange={(val) => onStatusChange(val === "all" ? undefined : val as AppointmentStatus)}
          >
            <SelectTrigger className="border-slate-200">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        <div className="flex items-end">
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-slate-500 hover:text-slate-700"
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
