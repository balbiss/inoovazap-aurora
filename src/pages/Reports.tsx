import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    FileText,
    Download,
    Filter,
    Calendar as CalendarIcon,
    User,
    Activity,
    ChevronDown,
    ChevronRight,
    Search,
    Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useInstance } from "@/hooks/useInstance";

export default function Reports() {
    const { data: instance } = useInstance();
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });
    const [selectedDoctor, setSelectedDoctor] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");

    // Fetch doctors for the filter
    const { data: doctors } = useQuery({
        queryKey: ["doctors", instance?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("doctors")
                .select("id, name")
                .eq("instance_id", instance?.id);
            if (error) throw error;
            return data;
        },
        enabled: !!instance?.id,
    });

    // Fetch appointments for the report
    const { data: appointments, isLoading } = useQuery({
        queryKey: ["reports-data", instance?.id, selectedDoctor, selectedStatus],
        queryFn: async () => {
            let query = supabase
                .from("appointments")
                .select(`
          id,
          start_time,
          status,
          appointment_type,
          insurance,
          doctor:doctors!appointments_doctor_id_fkey(name),
          patient:contacts!appointments_patient_id_fkey(name)
        `)
                .eq("instance_id", instance?.id)
                .order("start_time", { ascending: false });

            if (selectedDoctor !== "all") {
                query = query.eq("doctor_id", selectedDoctor);
            }
            if (selectedStatus !== "all") {
                query = query.eq("status", selectedStatus);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        },
        enabled: !!instance?.id,
    });

    // Client-side date filtering (more flexible for UI)
    const filteredAppointments = useMemo(() => {
        if (!appointments) return [];

        return appointments.filter(apt => {
            if (!dateRange.from || !dateRange.to) return true;
            const aptDate = parseISO(apt.start_time);
            return isWithinInterval(aptDate, {
                start: dateRange.from,
                end: dateRange.to,
            });
        });
    }, [appointments, dateRange]);

    const generatePDF = () => {
        if (!filteredAppointments.length) {
            toast.error("Não há dados para exportar no período selecionado.");
            return;
        }

        const doc = new jsPDF();
        const clinicName = instance?.company_name || "Clínica";
        const reportDate = format(new Date(), "dd/MM/yyyy HH:mm");

        // Header
        doc.setFontSize(20);
        doc.setTextColor(15, 118, 110); // Teal 700
        doc.text(clinicName, 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Relatório de Atendimentos - Gerado em ${reportDate}`, 14, 30);
        doc.text(`Período: ${format(dateRange.from!, "dd/MM/yy")} até ${format(dateRange.to!, "dd/MM/yy")}`, 14, 35);

        // Table
        const tableData = filteredAppointments.map(apt => [
            format(parseISO(apt.start_time), "dd/MM/yyyy HH:mm"),
            (apt.patient as any)?.name || "N/A",
            (apt.doctor as any)?.name || "N/A",
            apt.appointment_type || "Consulta",
            apt.insurance || "Particular",
            apt.status === "confirmed" ? "Confirmado" : apt.status === "scheduled" ? "Agendado" : "Cancelado"
        ]);

        autoTable(doc, {
            startY: 45,
            head: [["Data/Hora", "Paciente", "Profissional", "Procedimento", "Convênio", "Status"]],
            body: tableData,
            headStyles: { fillColor: [15, 118, 110] }, // Teal 700
            alternateRowStyles: { fillColor: [240, 250, 249] },
            margin: { top: 45 },
        });

        doc.save(`Relatorio_${clinicName}_${format(new Date(), "yyyy-MM-dd")}.pdf`);
        toast.success("PDF gerado com sucesso!");
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "confirmed":
                return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">Confirmado</Badge>;
            case "scheduled":
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">Agendado</Badge>;
            case "canceled":
                return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none">Cancelado</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6 pb-20 md:pb-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 flex items-center gap-2">
                        <FileText className="w-8 h-8 text-teal-600" />
                        Relatórios
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Analise o desempenho e histórico de atendimentos da sua clínica
                    </p>
                </div>
                <Button
                    onClick={generatePDF}
                    disabled={isLoading || !filteredAppointments.length}
                    className="bg-teal-600 hover:bg-teal-700 text-white gap-2 h-11"
                >
                    <Download className="w-4 h-4" />
                    Exportar PDF
                </Button>
            </div>

            {/* Filter Card */}
            <Card className="border-slate-200 shadow-sm overflow-visible z-30">
                <CardHeader className="pb-3 border-b border-slate-100 mb-6">
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Filter className="w-4 h-4" />
                        Filtros
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Date Picker */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Período</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal border-slate-200 h-11",
                                            !dateRange && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-teal-600" />
                                        {dateRange?.from ? (
                                            dateRange.to ? (
                                                <>
                                                    {format(dateRange.from, "dd/MM/yy")} - {format(dateRange.to, "dd/MM/yy")}
                                                </>
                                            ) : (
                                                format(dateRange.from, "dd/MM/yy")
                                            )
                                        ) : (
                                            <span>Selecionar data</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={dateRange?.from}
                                        selected={dateRange}
                                        onSelect={(range: any) => setDateRange(range)}
                                        numberOfMonths={2}
                                        locale={ptBR}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Doctor Select */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Profissional</label>
                            <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                                <SelectTrigger className="h-11 border-slate-200">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-teal-600" />
                                        <SelectValue placeholder="Selecione um profissional" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Profissionais</SelectItem>
                                    {doctors?.map(doc => (
                                        <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status Select */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</label>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="h-11 border-slate-200">
                                    <div className="flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-teal-600" />
                                        <SelectValue placeholder="Status do agendamento" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos os Status</SelectItem>
                                    <SelectItem value="scheduled">Agendados</SelectItem>
                                    <SelectItem value="confirmed">Confirmados</SelectItem>
                                    <SelectItem value="canceled">Cancelados</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Card */}
            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-medium text-slate-700">Resultados</CardTitle>
                        <Badge variant="outline" className="bg-white border-slate-200 text-slate-600 font-normal">
                            {filteredAppointments.length} atendimentos encontrados
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center p-20 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                            <p className="text-sm text-slate-500 animate-pulse">Carregando dados do relatório...</p>
                        </div>
                    ) : filteredAppointments.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                        <th className="px-6 py-4 font-semibold text-slate-600">Data/Hora</th>
                                        <th className="px-6 py-4 font-semibold text-slate-600">Paciente</th>
                                        <th className="px-6 py-4 font-semibold text-slate-600">Profissional</th>
                                        <th className="px-6 py-4 font-semibold text-slate-600">Procedimento/Convênio</th>
                                        <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredAppointments.map((apt) => (
                                        <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4 font-medium text-slate-700 whitespace-nowrap">
                                                {format(parseISO(apt.start_time), "dd/MM/yyyy 'às' HH:mm")}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {(apt.patient as any)?.name || "N/A"}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {(apt.doctor as any)?.name || "N/A"}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                <div className="flex flex-col">
                                                    <span>{apt.appointment_type || "Consulta"}</span>
                                                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{apt.insurance || "Particular"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(apt.status)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-20 text-center gap-2">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                                <Search className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-slate-700 font-medium">Nenhum agendamento encontrado</h3>
                            <p className="text-slate-500 text-sm max-w-xs mx-auto">
                                Não localizamos atendimentos com os filtros selecionados. Tente mudar o período ou os critérios.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
