import { useState } from "react";
import { NeonText } from "@/components/ui/NeonText";
import { GlassCard } from "@/components/ui/GlassCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClinicSettings } from "@/components/settings/ClinicSettings";
import { IntegrationSettings } from "@/components/settings/IntegrationSettings";

export default function Settings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <NeonText as="h1" className="text-3xl md:text-4xl" glow={false}>
          Configurações
        </NeonText>
        <p className="text-muted-foreground text-lg">
          Gerencie as configurações da sua clínica
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="clinic" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="clinic">Clínica</TabsTrigger>
          <TabsTrigger value="integration">Integração WhatsApp</TabsTrigger>
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
