import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClinicSettings } from "@/components/settings/ClinicSettings";
import { IntegrationSettings } from "@/components/settings/IntegrationSettings";

export default function Settings() {
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
      <Tabs defaultValue="clinic" className="w-full">
        <TabsList className="bg-slate-100 p-1 rounded-lg">
          <TabsTrigger 
            value="clinic" 
            className="data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm"
          >
            Clínica
          </TabsTrigger>
          <TabsTrigger 
            value="integration"
            className="data-[state=active]:bg-white data-[state=active]:text-teal-700 data-[state=active]:shadow-sm"
          >
            Integração WhatsApp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clinic" className="mt-6">
          <ClinicSettings />
        </TabsContent>

        <TabsContent value="integration" className="mt-6">
          <IntegrationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
