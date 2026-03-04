import { useState, useEffect } from "react";
import { useInstance } from "@/hooks/useInstance";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
    Brain,
    User,
    MessageSquare,
    Stethoscope,
    DollarSign,
    MapPin,
    Link as LinkIcon,
    Copy,
    Save,
    Loader2,
    ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AIBrain() {
    const { data: instance, isLoading, refetch } = useInstance();
    const navigate = useNavigate();
    const [isSaving, setIsSaving] = useState(false);

    const isPro = instance?.subscription_status === "active" || instance?.subscription_status === "trialing";

    // Form State
    const [nomeAgente, setNomeAgente] = useState("");
    const [saudacao, setSaudacao] = useState(""); // NOVO
    const [procedimentos, setProcedimentos] = useState("");
    const [valores, setValores] = useState("");
    const [pagamento, setPagamento] = useState("");
    const [endereco, setEndereco] = useState("");
    const [referencia, setReferencia] = useState("");
    const [telefone, setTelefone] = useState("");
    const [autoLink, setAutoLink] = useState(true);
    const [perguntarNome, setPerguntarNome] = useState(false); // NOVO
    const [modoHumanizado, setModoHumanizado] = useState(false); // NOVO
    const [baseConhecimento, setBaseConhecimento] = useState(""); // NOVO

    useEffect(() => {
        if (instance?.ai_config) {
            const config = instance.ai_config as any;
            const contexto = config.contexto || {};
            const fluxo = config.fluxo || {};

            setNomeAgente(contexto.nome_agente || "");
            setSaudacao(contexto.saudacao || "");
            setBaseConhecimento(contexto.base_conhecimento || ""); // NOVO
            setProcedimentos(contexto.procedimentos || "");
            setValores(contexto.valores || "");
            setPagamento(contexto.pagamento || "");

            if (contexto.localizacao) {
                const parts = contexto.localizacao.split(" - ");
                setEndereco(parts[0] || "");
                setReferencia(parts[1] || "");
            }

            setPerguntarNome(fluxo.perguntar_nome === true);
            setModoHumanizado(fluxo.modo_humanizado === true);
            setAutoLink(fluxo.auto_link !== false);
        }

        if (instance?.agent_name && !nomeAgente) {
            setNomeAgente(instance.agent_name);
        }
    }, [instance]);

    const handleCopyLink = () => {
        const link = `${window.location.origin}/book/${instance?.slug}`;
        navigator.clipboard.writeText(link);
        toast.success("Link copiado para a área de transferência!");
    };

    const handleSave = async () => {
        if (!instance?.id) return;

        setIsSaving(true);
        try {
            const aiConfig = {
                contexto: {
                    nome_agente: nomeAgente,
                    saudacao: saudacao,
                    base_conhecimento: baseConhecimento, // NOVO
                    procedimentos: procedimentos,
                    valores: valores,
                    pagamento: pagamento,
                    localizacao: `${endereco}${referencia ? ` - ${referencia}` : ""}`
                },
                fluxo: {
                    perguntar_nome: perguntarNome,
                    modo_humanizado: modoHumanizado,
                    auto_link: autoLink
                }
            };

            const { data, error } = await supabase.functions.invoke("manage-instance", {
                body: {
                    action: "update_config",
                    instance_id: instance.id,
                    ai_config: aiConfig,
                    agent_name: nomeAgente
                },
            });

            if (error) throw error;

            toast.success("Cérebro da IA atualizado com sucesso!");
            refetch();
        } catch (error: any) {
            console.error("Erro ao salvar:", error);
            toast.error("Erro ao salvar as configurações: " + (error.message || "Erro desconhecido"));
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
        );
    }

    const publicLink = `${window.location.host}/book/${instance?.slug || "seu-slug"}`;

    return (
        <div className="space-y-4 pb-20 relative">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-semibold text-slate-800 flex items-center gap-2">
                        <Brain className="w-6 h-6 text-teal-600" />
                        Cérebro da IA
                    </h1>
                    <p className="text-slate-500 text-[13px] mt-0.5">
                        Configure a personalidade e o conhecimento do seu atendente virtual.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CARD 1: IDENTIDADE & HUMANIZAÇÃO */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="py-2.5 border-b border-slate-50">
                        <CardTitle className="text-[15px] font-medium text-slate-800 flex items-center gap-2">
                            <User className="w-5 h-5 text-teal-600" />
                            Personalidade do Agente
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                        <div className="space-y-2">
                            <Label>Nome do Agente</Label>
                            <Input
                                placeholder="Ex: Bia"
                                value={nomeAgente}
                                onChange={(e) => setNomeAgente(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Saudação Inicial</Label>
                            <Textarea
                                placeholder="Olá! Sou a Bia da Inoova. Como posso ajudar?"
                                className="resize-none h-20"
                                value={saudacao}
                                onChange={(e) => setSaudacao(e.target.value)}
                            />
                        </div>

                        <div className="pt-2 space-y-4">
                            <Label className="text-sm font-semibold text-slate-700">Opções de Comportamento</Label>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-sm">Perguntar Nome</Label>
                                    <p className="text-xs text-slate-500">Perguntar o nome do paciente se ele não disser.</p>
                                </div>
                                <Switch
                                    checked={perguntarNome}
                                    onCheckedChange={setPerguntarNome}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-sm">Modo Humanizado</Label>
                                    <p className="text-xs text-slate-500">Usa emojis e tom acolhedor.</p>
                                </div>
                                <Switch
                                    checked={modoHumanizado}
                                    onCheckedChange={setModoHumanizado}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* CARD 2: BASE DE CONHECIMENTO (NOVO) */}
                <Card className="border-none shadow-sm bg-white md:row-span-2">
                    <CardHeader className="py-2.5 border-b border-slate-50">
                        <CardTitle className="text-[15px] font-medium text-slate-800 flex items-center gap-2">
                            <Brain className="w-5 h-5 text-teal-600" />
                            Cérebro & Dados Gerais
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4 h-full flex flex-col">
                        <p className="text-xs text-slate-500">
                            Coloque aqui informações soltas que a IA deve saber para tirar dúvidas.
                        </p>
                        <div className="space-y-2 flex-1 flex flex-col">
                            <Label>Informações Extras / FAQ</Label>
                            <Textarea
                                placeholder="- Temos estacionamento gratuito no subsolo.&#10;- Para exames de sangue, necessário jejum de 8h.&#10;- Dr. João só atende crianças acima de 5 anos.&#10;- Não aceitamos cheque."
                                className="resize-none min-h-[200px] flex-1"
                                value={baseConhecimento}
                                onChange={(e) => setBaseConhecimento(e.target.value)}
                            />
                            <p className="text-[10px] text-teal-600 font-medium">
                                * A IA consultará este campo sempre que o paciente fizer uma pergunta específica.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* CARD 3: O QUE OFERECEMOS? */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="py-2.5 border-b border-slate-50">
                        <CardTitle className="text-[15px] font-medium text-slate-800 flex items-center gap-2">
                            <Stethoscope className="w-5 h-5 text-teal-600" />
                            O que oferecemos?
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                        <div className="space-y-2">
                            <Label>Procedimentos</Label>
                            <Textarea
                                placeholder="Cardiologia, Dermatologia..."
                                className="resize-none h-20"
                                value={procedimentos}
                                onChange={(e) => setProcedimentos(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tabela de Preços</Label>
                            <Textarea
                                placeholder="Consulta R$ 300..."
                                className="resize-none h-20"
                                value={valores}
                                onChange={(e) => setValores(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Formas de Pagamento</Label>
                            <Input
                                placeholder="Pix, Cartão..."
                                value={pagamento}
                                onChange={(e) => setPagamento(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* CARD 4: LOCALIZAÇÃO */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="py-2.5 border-b border-slate-50">
                        <CardTitle className="text-[15px] font-medium text-slate-800 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-teal-600" />
                            Localização
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                        <div className="space-y-2">
                            <Label>Endereço Completo</Label>
                            <Input
                                placeholder="Rua das Flores, 123..."
                                value={endereco}
                                onChange={(e) => setEndereco(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Ponto de Referência</Label>
                            <Input
                                placeholder="Próximo ao Hospital Central"
                                value={referencia}
                                onChange={(e) => setReferencia(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* CARD 5: AGENDAMENTO */}
                <Card className="border-none shadow-sm bg-white">
                    <CardHeader className="py-2.5 border-b border-slate-50">
                        <CardTitle className="text-[15px] font-medium text-slate-800 flex items-center gap-2">
                            <LinkIcon className="w-5 h-5 text-teal-600" />
                            Agendamento
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                        <div className="bg-teal-50 border border-teal-100 p-4 rounded-lg space-y-2">
                            <Label className="text-teal-900 font-semibold text-xs text-uppercase tracking-wider">Link do Agendamento:</Label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-white border border-teal-200 px-3 py-2 rounded text-sm text-teal-800 font-mono truncate">
                                    {publicLink}
                                </div>
                                <Button size="icon" variant="outline" className="border-teal-200 text-teal-600 hover:bg-teal-50" onClick={handleCopyLink}>
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-2">
                            <div className="space-y-1">
                                <Label className="text-base font-medium">Enviar link automaticamente?</Label>
                                <p className="text-xs text-slate-500">
                                    A IA enviará este link assim que identificar que o paciente quer marcar.
                                </p>
                            </div>
                            <Switch
                                checked={autoLink}
                                onCheckedChange={setAutoLink}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Floating Save Button */}
            <div className="fixed bottom-8 right-8 z-50">
                <Button
                    size="lg"
                    className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg gap-2 h-11 px-6 rounded-full text-sm"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    Salvar Configurações
                </Button>
            </div>
        </div>
    );
}
