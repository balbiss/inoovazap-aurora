import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, CheckCircle2, Loader2, X, Smartphone, Zap, Plug } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonText } from "@/components/ui/NeonText";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type IntegrationState = "loading" | "offline" | "qr" | "connected";

interface InstanceData {
  id: string;
  pastorini_id: string;
  company_name: string;
  pastorini_status: string;
  phone_number?: string;
}

export default function Integration() {
  const [currentState, setCurrentState] = useState<IntegrationState>("loading");
  const [instanceData, setInstanceData] = useState<InstanceData | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's instance
  const { data: instancesData, isLoading: loadingInstances } = useQuery({
    queryKey: ["user-instances"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-instance", {
        body: { action: "get_instances" },
      });
      if (error) throw error;
      return data;
    },
  });

  // Poll status when in QR state
  const { data: statusData } = useQuery({
    queryKey: ["instance-status", instanceData?.pastorini_id],
    queryFn: async () => {
      if (!instanceData?.pastorini_id) return null;
      const { data, error } = await supabase.functions.invoke("manage-instance", {
        body: { action: "status", instance_id: instanceData.pastorini_id },
      });
      if (error) throw error;
      return data;
    },
    refetchInterval: currentState === "qr" ? 3000 : false,
    enabled: !!instanceData?.pastorini_id && currentState === "qr",
  });

  // Create instance mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-instance", {
        body: { action: "create", instance_name: `inst_${Date.now()}` },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setInstanceData(data.instance);
      if (data.qrCode) {
        setQrCode(data.qrCode);
        setCurrentState("qr");
      }
      queryClient.invalidateQueries({ queryKey: ["user-instances"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar instância",
        description: error.message,
      });
    },
  });

  // Delete instance mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!instanceData?.pastorini_id) throw new Error("Nenhuma instância selecionada");
      const { data, error } = await supabase.functions.invoke("manage-instance", {
        body: { action: "delete", instance_id: instanceData.pastorini_id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setInstanceData(null);
      setQrCode(null);
      setCurrentState("offline");
      queryClient.invalidateQueries({ queryKey: ["user-instances"] });
      toast({
        title: "Instância desconectada",
        description: "Sua conexão WhatsApp foi removida com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao desconectar",
        description: error.message,
      });
    },
  });

  // Handle initial load and state transitions
  useEffect(() => {
    if (loadingInstances) {
      setCurrentState("loading");
      return;
    }

    if (instancesData?.instances?.length > 0) {
      const instance = instancesData.instances[0];
      setInstanceData(instance);

      if (instance.pastorini_status === "CONNECTED") {
        setCurrentState("connected");
      } else if (instance.pastorini_status === "qr" || instance.pastorini_status === "created") {
        // Fetch QR code
        fetchQrCode(instance.pastorini_id);
      } else {
        setCurrentState("offline");
      }
    } else {
      setCurrentState("offline");
    }
  }, [instancesData, loadingInstances]);

  // Watch status polling for connection
  useEffect(() => {
    if (statusData?.status === "CONNECTED") {
      setCurrentState("connected");
      setQrCode(null);
      queryClient.invalidateQueries({ queryKey: ["user-instances"] });
    }
  }, [statusData, queryClient]);

  const fetchQrCode = async (pastoriniId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-instance", {
        body: { action: "get_qr", instance_id: pastoriniId },
      });
      if (error) throw error;
      if (data?.qrCode) {
        setQrCode(data.qrCode);
        setCurrentState("qr");
      }
    } catch (error) {
      console.error("Error fetching QR code:", error);
    }
  };

  const handleCancelQr = () => {
    setQrCode(null);
    setCurrentState("offline");
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "Não disponível";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    return phone;
  };

  // Loading state
  if (currentState === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // Offline state - no instance
  if (currentState === "offline") {
    return (
      <div className="space-y-6">
        <div>
          <NeonText as="h1" className="text-3xl font-bold mb-2">
            Integração WhatsApp
          </NeonText>
          <p className="text-muted-foreground">
            Conecte seu WhatsApp para começar a automatizar seu atendimento
          </p>
        </div>

        <GlassCard className="flex flex-col items-center justify-center py-16 px-8">
          <div className="w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center mb-6">
            <MessageCircle className="w-12 h-12 text-muted-foreground" />
          </div>

          <h2 className="text-xl font-semibold text-foreground mb-2">
            Nenhuma conexão ativa
          </h2>
          <p className="text-muted-foreground text-center mb-8 max-w-md">
            Conecte seu número de WhatsApp para começar a receber e enviar mensagens
            automatizadas através da plataforma.
          </p>

          <button
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className={cn(
              "flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all duration-300",
              "bg-gradient-to-r from-emerald-500 to-cyan-500",
              "hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:-translate-y-1",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            )}
          >
            {createMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plug className="w-5 h-5" />
            )}
            <span>Conectar Novo Número</span>
          </button>
        </GlassCard>
      </div>
    );
  }

  // QR Code state
  if (currentState === "qr") {
    return (
      <div className="space-y-6">
        <div>
          <NeonText as="h1" className="text-3xl font-bold mb-2">
            Integração WhatsApp
          </NeonText>
          <p className="text-muted-foreground">
            Escaneie o QR Code para conectar seu WhatsApp
          </p>
        </div>

        <GlassCard className="flex flex-col items-center justify-center py-12 px-8">
          <div className="relative mb-6">
            {/* Animated border */}
            <div className="absolute inset-0 rounded-2xl qr-scanning-border opacity-60" />
            <div className="absolute inset-[3px] rounded-xl bg-background" />

            {/* QR Code container */}
            <div className="relative p-4 rounded-xl bg-white">
              {qrCode ? (
                <img
                  src={qrCode}
                  alt="QR Code"
                  className="w-64 h-64 object-contain"
                />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center">
                  <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-primary mb-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Aguardando leitura do QR Code...</span>
          </div>

          <div className="text-center space-y-2 mb-8">
            <p className="text-foreground font-medium">Como conectar:</p>
            <ol className="text-sm text-muted-foreground space-y-1">
              <li>1. Abra o WhatsApp no seu celular</li>
              <li>2. Toque em <strong>Menu</strong> ou <strong>Configurações</strong></li>
              <li>3. Selecione <strong>Aparelhos conectados</strong></li>
              <li>4. Toque em <strong>Conectar um aparelho</strong></li>
              <li>5. Aponte a câmera para este QR Code</li>
            </ol>
          </div>

          <button
            onClick={handleCancelQr}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300",
              "text-muted-foreground hover:text-foreground",
              "border border-border hover:border-muted-foreground"
            )}
          >
            <X className="w-4 h-4" />
            <span>Cancelar</span>
          </button>
        </GlassCard>
      </div>
    );
  }

  // Connected state
  return (
    <div className="space-y-6">
      <div>
        <NeonText as="h1" className="text-3xl font-bold mb-2">
          Integração WhatsApp
        </NeonText>
        <p className="text-muted-foreground">
          Seu WhatsApp está conectado e operacional
        </p>
      </div>

      <GlassCard className="p-8">
        {/* Success header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 success-glow">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            SISTEMA OPERACIONAL
          </h2>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Nome da Sessão</p>
                <p className="font-medium text-foreground">
                  {instanceData?.company_name || "Atendimento"}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Número Conectado</p>
                <p className="font-medium text-foreground">
                  {formatPhoneNumber(statusData?.phoneNumber || instanceData?.phone_number || "")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Webhook status */}
        <div className="glass-card p-4 rounded-xl mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Webhook</p>
                <p className="font-medium text-foreground text-sm truncate max-w-[200px] md:max-w-none">
                  Configurado automaticamente
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400">
              Ativo ⚡
            </span>
          </div>
        </div>

        {/* Disconnect button */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300",
                "text-destructive border border-destructive/50",
                "hover:bg-destructive/10 hover:border-destructive"
              )}
            >
              <X className="w-4 h-4" />
              <span>Desconectar Instância</span>
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Desconectar WhatsApp?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação irá desconectar seu WhatsApp da plataforma. Você poderá
                conectar novamente a qualquer momento.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteMutation.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Desconectar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </GlassCard>
    </div>
  );
}
