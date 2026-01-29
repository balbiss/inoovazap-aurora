import { useActiveDoctors } from "@/hooks/useDoctors";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DoctorFilterProps {
  value?: string;
  onChange: (value: string | undefined) => void;
}

export function DoctorFilter({ value, onChange }: DoctorFilterProps) {
  const { data: doctors } = useActiveDoctors();

  return (
    <Select
      value={value || "all"}
      onValueChange={(v) => onChange(v === "all" ? undefined : v)}
    >
      <SelectTrigger className="w-[220px] border-slate-200">
        <SelectValue placeholder="Filtrar por profissional" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos os Profissionais</SelectItem>
        {doctors?.map((doctor) => (
          <SelectItem key={doctor.id} value={doctor.id}>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: doctor.color }}
              />
              {doctor.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
