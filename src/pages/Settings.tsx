import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClinicSettings } from "@/components/settings/ClinicSettings";
import { IntegrationSettings } from "@/components/settings/IntegrationSettings";
import { InsuranceSettings } from "@/components/settings/InsuranceSettings";
import { AppointmentTypeSettings } from "@/components/settings/AppointmentTypeSettings";
import { PublicBookingSettings } from "@/components/settings/PublicBookingSettings";
import { SubscriptionSettings } from "@/components/settings/SubscriptionSettings";
import { useSearchParams } from "react-router-dom";

export default function Settings() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "clinic";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-800">
          Configurações
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Gerencie as configurações da sua clínica
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-lg">
          <TabsTrigger
            value="clinic"
            className="data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm"
          >
            Clínica
          </TabsTrigger>
          <TabsTrigger
            value="booking"
            className="data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm"
          >
            Agendamento Online
          </TabsTrigger>
          <TabsTrigger
            value="atendimento"
            className="data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm"
          >
            Atendimento
          </TabsTrigger>
          <TabsTrigger
            value="integration"
            className="data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm"
          >
            WhatsApp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clinic" className="mt-6">
          <ClinicSettings />
        </TabsContent>

        <TabsContent value="booking" className="mt-6">
          <PublicBookingSettings />
        </TabsContent>

        <TabsContent value="atendimento" className="mt-6 space-y-6">
          <AppointmentTypeSettings />
          <InsuranceSettings />
        </TabsContent>

        <TabsContent value="integration" className="mt-6">
          <IntegrationSettings />
        </TabsContent>

      </Tabs>
    </div>
  );
}
