import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Brain as BrainIcon, 
  Building2, 
  FileText, 
  MessageSquare, 
  Clock, 
  Save, 
  Loader2,
  Sparkles,
  Home,
  BookOpen,
  Users
} from "lucide-react";

interface AIConfig {
  contexto: {
    empresa: string;
    nome_agente: string;
    especialidade: string;
    cidades_bairros: string;
    catalogo: string;
    regra_fotos: string;
    resposta_ouro_tecnica: string;
  };
  fluxo: {
    perguntas_qualificacao: string;
    estilo_conversa: string;
    instrucoes_empatia: string;
  };
}

interface ScheduleConfig {
  semana_inicio: string;
  semana_fim: string;
  sabado_inicio: string;
  sabado_fim: string;
  domingo_inicio: string;
  domingo_fim: string;
  trabalha_domingo: boolean;
}

const defaultAIConfig: AIConfig = {
  contexto: {
    empresa: "",
    nome_agente: "",
    especialidade: "",
    cidades_bairros: "",
    catalogo: "",
    regra_fotos: "",
    resposta_ouro_tecnica: "",
  },
  fluxo: {
    perguntas_qualificacao: "",
    estilo_conversa: "descontraido",
    instrucoes_empatia: "",
  },
};

const defaultScheduleConfig: ScheduleConfig = {
  semana_inicio: "08:00",
  semana_fim: "18:00",
  sabado_inicio: "09:00",
  sabado_fim: "13:00",
  domingo_inicio: "09:00",
  domingo_fim: "12:00",
  trabalha_domingo: false,
};

export default function BrainPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [aiConfig, setAIConfig] = useState<AIConfig>(defaultAIConfig);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>(defaultScheduleConfig);

  useEffect(() => {
    loadInstanceData();
  }, []);

  const loadInstanceData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get user's first instance
      const { data: instances, error } = await supabase
        .from("instances")
        .select("*")
        .eq("user_id", user.id)
        .limit(1);

      if (error) throw error;

      if (instances && instances.length > 0) {
        const instance = instances[0];
        setInstanceId(instance.id);

        // Parse ai_config
        if (instance.ai_config && typeof instance.ai_config === 'object') {
          const config = instance.ai_config as Record<string, unknown>;
          setAIConfig({
            contexto: {
              empresa: (config.contexto as Record<string, string>)?.empresa || "",
              nome_agente: (config.contexto as Record<string, string>)?.nome_agente || "",
              especialidade: (config.contexto as Record<string, string>)?.especialidade || "",
              cidades_bairros: (config.contexto as Record<string, string>)?.cidades_bairros || "",
              catalogo: (config.contexto as Record<string, string>)?.catalogo || "",
              regra_fotos: (config.contexto as Record<string, string>)?.regra_fotos || "",
              resposta_ouro_tecnica: (config.contexto as Record<string, string>)?.resposta_ouro_tecnica || "",
            },
            fluxo: {
              perguntas_qualificacao: (config.fluxo as Record<string, string>)?.perguntas_qualificacao || "",
              estilo_conversa: (config.fluxo as Record<string, string>)?.estilo_conversa || "descontraido",
              instrucoes_empatia: (config.fluxo as Record<string, string>)?.instrucoes_empatia || "",
            },
          });
        }

        // Parse schedule_config
        if (instance.schedule_config && typeof instance.schedule_config === 'object') {
          const schedule = instance.schedule_config as Record<string, unknown>;
          setScheduleConfig({
            semana_inicio: (schedule.semana_inicio as string) || "08:00",
            semana_fim: (schedule.semana_fim as string) || "18:00",
            sabado_inicio: (schedule.sabado_inicio as string) || "09:00",
            sabado_fim: (schedule.sabado_fim as string) || "13:00",
            domingo_inicio: (schedule.domingo_inicio as string) || "09:00",
            domingo_fim: (schedule.domingo_fim as string) || "12:00",
            trabalha_domingo: (schedule.trabalha_domingo as boolean) || false,
          });
        }
      }
    } catch (error) {
      console.error("Error loading instance:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar configurações",
        description: "Não foi possível carregar os dados da instância.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!instanceId) {
      toast({
        variant: "destructive",
        title: "Nenhuma instância encontrada",
        description: "Você precisa ter uma instância configurada.",
      });
      return;
    }

    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke("manage-instance", {
        body: {
          action: "update_config",
          instance_id: instanceId,
          ai_config: aiConfig,
          schedule_config: scheduleConfig,
          agent_name: aiConfig.contexto.nome_agente,
        },
      });

      if (error) throw error;

      toast({
        title: "Configurações salvas!",
        description: "O cérebro da IA foi atualizado com sucesso.",
      });
    } catch (error) {
      console.error("Error saving config:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateContexto = (field: keyof AIConfig["contexto"], value: string) => {
    setAIConfig(prev => ({
      ...prev,
      contexto: { ...prev.contexto, [field]: value },
    }));
  };

  const updateFluxo = (field: keyof AIConfig["fluxo"], value: string) => {
    setAIConfig(prev => ({
      ...prev,
      fluxo: { ...prev.fluxo, [field]: value },
    }));
  };

  const updateSchedule = (field: keyof ScheduleConfig, value: string | boolean) => {
    setScheduleConfig(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/30">
            <BrainIcon className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Cérebro da IA
            </h1>
            <p className="text-slate-400 text-sm">
              Configure como seu assistente deve se comportar
            </p>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving || !instanceId}
          className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white shadow-lg shadow-indigo-500/25"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Configuração
        </Button>
      </div>

      {!instanceId && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-200">
          <p className="text-sm">
            ⚠️ Você ainda não tem uma instância configurada. Configure seu WhatsApp primeiro.
          </p>
        </div>
      )}

      {/* Tabs Container */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6">
        <Tabs defaultValue="identidade" className="w-full">
          <TabsList className="w-full flex flex-wrap gap-1 h-auto bg-white/5 p-1.5 rounded-xl mb-6">
            <TabsTrigger 
              value="identidade" 
              className="flex-1 min-w-[120px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500/30 data-[state=active]:to-violet-500/30 data-[state=active]:text-white text-slate-400 rounded-lg py-2.5 text-sm"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Identidade
            </TabsTrigger>
            <TabsTrigger 
              value="catalogo" 
              className="flex-1 min-w-[120px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500/30 data-[state=active]:to-violet-500/30 data-[state=active]:text-white text-slate-400 rounded-lg py-2.5 text-sm"
            >
              <Home className="h-4 w-4 mr-2" />
              Catálogo
            </TabsTrigger>
            <TabsTrigger 
              value="regras" 
              className="flex-1 min-w-[120px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500/30 data-[state=active]:to-violet-500/30 data-[state=active]:text-white text-slate-400 rounded-lg py-2.5 text-sm"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Regras de Ouro
            </TabsTrigger>
            <TabsTrigger 
              value="fluxo" 
              className="flex-1 min-w-[120px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500/30 data-[state=active]:to-violet-500/30 data-[state=active]:text-white text-slate-400 rounded-lg py-2.5 text-sm"
            >
              <Users className="h-4 w-4 mr-2" />
              Fluxo
            </TabsTrigger>
            <TabsTrigger 
              value="horarios" 
              className="flex-1 min-w-[120px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500/30 data-[state=active]:to-violet-500/30 data-[state=active]:text-white text-slate-400 rounded-lg py-2.5 text-sm"
            >
              <Clock className="h-4 w-4 mr-2" />
              Horários
            </TabsTrigger>
          </TabsList>

          {/* ABA 1: IDENTIDADE */}
          <TabsContent value="identidade" className="space-y-6 mt-0">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-indigo-400" />
              <h2 className="text-lg font-semibold text-white">Contexto do Agente</h2>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="empresa" className="text-slate-300">
                  Nome da Empresa
                </Label>
                <Input
                  id="empresa"
                  placeholder="Ex: Imobiliária Nova Casa"
                  value={aiConfig.contexto.empresa}
                  onChange={(e) => updateContexto("empresa", e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome_agente" className="text-slate-300">
                  Nome do Agente IA
                </Label>
                <Input
                  id="nome_agente"
                  placeholder="Ex: Ana, Carlos, Assistente"
                  value={aiConfig.contexto.nome_agente}
                  onChange={(e) => updateContexto("nome_agente", e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="especialidade" className="text-slate-300">
                  Especialidade
                </Label>
                <Input
                  id="especialidade"
                  placeholder="Ex: Minha Casa Minha Vida, Alto Padrão..."
                  value={aiConfig.contexto.especialidade}
                  onChange={(e) => updateContexto("especialidade", e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500/50"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="cidades" className="text-slate-300">
                  Cidades e Bairros de Atuação
                </Label>
                <Textarea
                  id="cidades"
                  placeholder="Liste as cidades e bairros onde você atua, separados por vírgula ou linha..."
                  value={aiConfig.contexto.cidades_bairros}
                  onChange={(e) => updateContexto("cidades_bairros", e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500/50 min-h-[100px]"
                />
              </div>
            </div>
          </TabsContent>

          {/* ABA 2: CATÁLOGO */}
          <TabsContent value="catalogo" className="space-y-6 mt-0">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">Catálogo de Imóveis</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="catalogo" className="text-slate-300">
                  Catálogo Completo
                </Label>
                <p className="text-xs text-slate-500 mb-2">
                  Cole aqui os detalhes: Nome do Empreendimento, Bairro, Preço e Detalhes.
                </p>
                <Textarea
                  id="catalogo"
                  placeholder={`Exemplo:
                  
🏠 Residencial Parque das Flores
📍 Bairro: Jardim Primavera
💰 A partir de R$ 189.000
✅ 2 quartos, 1 suíte, varanda
✅ Entrada facilitada + FGTS

🏠 Condomínio Villa Verde
📍 Bairro: Centro
💰 A partir de R$ 250.000
✅ 3 quartos, 2 banheiros, garagem`}
                  value={aiConfig.contexto.catalogo}
                  onChange={(e) => updateContexto("catalogo", e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500/50 min-h-[256px] font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="regra_fotos" className="text-slate-300">
                  Link do PDF/Drive com Fotos
                </Label>
                <p className="text-xs text-slate-500 mb-2">
                  Cole o link ou escreva uma instrução de como enviar materiais.
                </p>
                <Input
                  id="regra_fotos"
                  placeholder="Ex: https://drive.google.com/... ou 'Enviarei o PDF completo em seguida'"
                  value={aiConfig.contexto.regra_fotos}
                  onChange={(e) => updateContexto("regra_fotos", e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500/50"
                />
              </div>
            </div>
          </TabsContent>

          {/* ABA 3: REGRAS DE OURO */}
          <TabsContent value="regras" className="space-y-6 mt-0">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">Regras de Ouro</h2>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resposta_ouro" className="text-slate-300">
                Respostas Técnicas Padronizadas
              </Label>
              <p className="text-xs text-slate-500 mb-2">
                Informações importantes que o agente deve saber responder corretamente.
              </p>
              <Textarea
                id="resposta_ouro"
                placeholder={`Exemplo de respostas técnicas:

📋 MINHA CASA MINHA VIDA:
- Subsídio de até R$ 55.000 para famílias com renda até R$ 8.000
- Taxas de juros a partir de 4% ao ano
- É possível usar FGTS para entrada e amortização

📋 DOCUMENTAÇÃO NECESSÁRIA:
- RG e CPF
- Comprovante de renda (3 últimos meses)
- Comprovante de residência atual
- Certidão de nascimento/casamento`}
                value={aiConfig.contexto.resposta_ouro_tecnica}
                onChange={(e) => updateContexto("resposta_ouro_tecnica", e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500/50 min-h-[256px] font-mono text-sm"
              />
            </div>
          </TabsContent>

          {/* ABA 4: FLUXO DE CONVERSA */}
          <TabsContent value="fluxo" className="space-y-6 mt-0">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Fluxo de Conversa</h2>
            </div>

            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="perguntas" className="text-slate-300">
                  Perguntas de Qualificação
                </Label>
                <p className="text-xs text-slate-500 mb-2">
                  Perguntas que o agente deve fazer para qualificar o lead. Uma por linha.
                </p>
                <Textarea
                  id="perguntas"
                  placeholder={`Qual é o seu nome completo?
Qual cidade você está buscando imóvel?
Qual sua faixa de renda familiar?
Você já tem algum imóvel em seu nome?
Pretende usar FGTS?`}
                  value={aiConfig.fluxo.perguntas_qualificacao}
                  onChange={(e) => updateFluxo("perguntas_qualificacao", e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500/50 min-h-[150px]"
                />
              </div>

              <div className="space-y-2 max-w-xs">
                <Label htmlFor="estilo" className="text-slate-300">
                  Estilo da Conversa
                </Label>
                <Select
                  value={aiConfig.fluxo.estilo_conversa}
                  onValueChange={(value) => updateFluxo("estilo_conversa", value)}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-indigo-500/50">
                    <SelectValue placeholder="Selecione o estilo" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-white/10">
                    <SelectItem value="formal" className="text-white hover:bg-white/10">
                      Formal e Profissional
                    </SelectItem>
                    <SelectItem value="descontraido" className="text-white hover:bg-white/10">
                      Descontraído e Amigável
                    </SelectItem>
                    <SelectItem value="empatico" className="text-white hover:bg-white/10">
                      Empático e Acolhedor
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="empatia" className="text-slate-300">
                  Instruções de Empatia
                </Label>
                <p className="text-xs text-slate-500 mb-2">
                  Como o agente deve tratar o cliente em situações específicas.
                </p>
                <Textarea
                  id="empatia"
                  placeholder={`Exemplo de instruções:

- Sempre cumprimente pelo nome quando disponível
- Se o cliente demonstrar dúvidas sobre financiamento, tranquilize e explique passo a passo
- Nunca pressione para fechar negócio rapidamente
- Demonstre entusiasmo genuíno ao apresentar os imóveis
- Em caso de objeções sobre preço, destaque os benefícios e facilidades`}
                  value={aiConfig.fluxo.instrucoes_empatia}
                  onChange={(e) => updateFluxo("instrucoes_empatia", e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500/50 min-h-[150px]"
                />
              </div>
            </div>
          </TabsContent>

          {/* ABA 5: HORÁRIOS */}
          <TabsContent value="horarios" className="space-y-6 mt-0">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-5 w-5 text-rose-400" />
              <h2 className="text-lg font-semibold text-white">Horários de Atendimento</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Segunda a Sexta */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-4">
                <h3 className="font-medium text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                  Segunda a Sexta
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-slate-400 text-xs">Início</Label>
                    <Input
                      type="time"
                      value={scheduleConfig.semana_inicio}
                      onChange={(e) => updateSchedule("semana_inicio", e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-400 text-xs">Fim</Label>
                    <Input
                      type="time"
                      value={scheduleConfig.semana_fim}
                      onChange={(e) => updateSchedule("semana_fim", e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Sábado */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-4">
                <h3 className="font-medium text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Sábado
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-slate-400 text-xs">Início</Label>
                    <Input
                      type="time"
                      value={scheduleConfig.sabado_inicio}
                      onChange={(e) => updateSchedule("sabado_inicio", e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-400 text-xs">Fim</Label>
                    <Input
                      type="time"
                      value={scheduleConfig.sabado_fim}
                      onChange={(e) => updateSchedule("sabado_fim", e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Domingo */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                    Domingo
                  </h3>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="trabalha_domingo"
                      checked={scheduleConfig.trabalha_domingo}
                      onCheckedChange={(checked) => updateSchedule("trabalha_domingo", Boolean(checked))}
                      className="border-white/20 data-[state=checked]:bg-indigo-500"
                    />
                    <Label htmlFor="trabalha_domingo" className="text-slate-400 text-xs cursor-pointer">
                      Ativo
                    </Label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-slate-400 text-xs">Início</Label>
                    <Input
                      type="time"
                      value={scheduleConfig.domingo_inicio}
                      onChange={(e) => updateSchedule("domingo_inicio", e.target.value)}
                      disabled={!scheduleConfig.trabalha_domingo}
                      className="bg-white/5 border-white/10 text-white disabled:opacity-40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-400 text-xs">Fim</Label>
                    <Input
                      type="time"
                      value={scheduleConfig.domingo_fim}
                      onChange={(e) => updateSchedule("domingo_fim", e.target.value)}
                      disabled={!scheduleConfig.trabalha_domingo}
                      className="bg-white/5 border-white/10 text-white disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 text-indigo-200">
              <p className="text-sm">
                💡 O agente responderá automaticamente fora do horário informando que não está disponível no momento.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
