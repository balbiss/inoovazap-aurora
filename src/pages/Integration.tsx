import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  MessageCircle, 
  Loader2, 
  X, 
  Smartphone, 
  Plus,
  QrCode,
  RefreshCw,
  Settings,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonText } from "@/components/ui/NeonText";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type ConnectionState = "loading" | "offline" | "pending" | "connected";

interface InstanceData {
  id: string;
  pastorini_id: string;
  company_name: string;
  pastorini_status: string;
  phone_number?: string;
}

export default function Integration() {
  // Main states
  const [connectionState, setConnectionState] = useState<ConnectionState>("loading");
  const [instanceData, setInstanceData] = useState<InstanceData | null>(null);
  
  // Modal states
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  
  // Modal 1 states
  const [instanceName, setInstanceName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  // Modal 2 states
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [progress, setProgress] = useState(100);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isRefreshingQr, setIsRefreshingQr] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  
  // Profile picture state
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  
  // Refs for cleanup
  const qrRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const queryClient = useQueryClient();

  // Fetch user's instances
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

  // Poll status when QR modal is open (every 2 seconds)
  const { data: statusData } = useQuery({
    queryKey: ["instance-status", instanceData?.pastorini_id],
    queryFn: async () => {
      if (!instanceData?.pastorini_id) return null;
      const { data, error } = await supabase.functions.invoke("manage-instance", {
        body: { action: "status", instance_id: instanceData.pastorini_id },
      });
      if (error) {
        console.error("Status check error:", error);
        return null;
      }
      return data;
    },
    refetchInterval: isQrModalOpen ? 2000 : false,
    enabled: isQrModalOpen && !!instanceData?.pastorini_id,
  });

  // Handle initial load
  useEffect(() => {
    if (loadingInstances) {
      setConnectionState("loading");
      return;
    }

    if (instancesData?.instances?.length > 0) {
      const instance = instancesData.instances[0];
      setInstanceData(instance);

      if (instance.pastorini_status === "CONNECTED" || instance.pastorini_status === "open") {
        setConnectionState("connected");
      } else {
        // Instância existe mas não conectada = pending
        setConnectionState("pending");
      }
    } else {
      setConnectionState("offline");
    }
  }, [instancesData, loadingInstances]);

  // Detect connection success from polling
  useEffect(() => {
    if (statusData?.status === "CONNECTED" || statusData?.status === "open") {
      setIsQrModalOpen(false);
      setConnectionState("connected");
      setQrCode(null);
      queryClient.invalidateQueries({ queryKey: ["user-instances"] });
      
      // Fetch profile picture when connected
      if (instanceData?.pastorini_id) {
        fetchProfilePicture(instanceData.pastorini_id);
      }
      
      toast.success("WhatsApp Conectado!", {
        description: "Seu número foi conectado com sucesso.",
      });
    }
  }, [statusData, queryClient, instanceData?.pastorini_id]);

  // Fetch profile picture when already connected on load
  useEffect(() => {
    if (connectionState === "connected" && instanceData?.pastorini_id && !profilePictureUrl) {
      fetchProfilePicture(instanceData.pastorini_id);
    }
  }, [connectionState, instanceData?.pastorini_id, profilePictureUrl]);

  // Timer for QR code refresh (30 seconds)
  useEffect(() => {
    if (!isQrModalOpen || !instanceData?.pastorini_id) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          refreshQrCode();
          return 30;
        }
        return prev - 1;
      });
      setProgress((prev) => {
        const newProgress = prev - (100 / 30);
        return newProgress <= 0 ? 100 : newProgress;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isQrModalOpen, instanceData?.pastorini_id]);

  // Reset timer states when QR modal opens
  useEffect(() => {
    if (isQrModalOpen) {
      setProgress(100);
      setTimeLeft(30);
    }
  }, [isQrModalOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (qrRetryTimeoutRef.current) {
        clearTimeout(qrRetryTimeoutRef.current);
      }
    };
  }, []);

  const fetchQrCodeWithRetry = useCallback(async (pastoriniId: string, retries = 5): Promise<string | null> => {
    for (let i = 0; i < retries; i++) {
      try {
        const { data, error } = await supabase.functions.invoke("manage-instance", {
          body: { action: "get_qr", instance_id: pastoriniId },
        });
        
        if (error) throw error;
        
        if (data?.qrCode) {
          return data.qrCode;
        }
      } catch (error) {
        console.log(`QR fetch attempt ${i + 1}/${retries} failed:`, error);
      }
      
      // Wait before retrying (increase wait time each attempt)
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    return null;
  }, []);

  const fetchProfilePicture = useCallback(async (pastoriniId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-instance", {
        body: { action: "get_profile_picture", instance_id: pastoriniId },
      });
      
      if (!error && data?.profilePictureUrl) {
        setProfilePictureUrl(data.profilePictureUrl);
      }
    } catch (error) {
      console.log("Error fetching profile picture:", error);
    }
  }, []);

  const refreshQrCode = useCallback(async () => {
    if (!instanceData?.pastorini_id || isRefreshingQr) return;
    
    setIsRefreshingQr(true);
    setQrError(null);
    
    try {
      const qr = await fetchQrCodeWithRetry(instanceData.pastorini_id, 3);
      if (qr) {
        setQrCode(qr);
      } else {
        setQrError("Não foi possível obter o QR Code. Tente novamente.");
      }
    } catch (error) {
      console.error("Error refreshing QR code:", error);
      setQrError("Erro ao atualizar QR Code.");
    } finally {
      setIsRefreshingQr(false);
      setProgress(100);
      setTimeLeft(30);
    }
  }, [instanceData?.pastorini_id, isRefreshingQr, fetchQrCodeWithRetry]);

  const handleCreateInstance = async () => {
    if (instanceName.length < 2) {
      toast.error("Nome muito curto", {
        description: "O nome da instância deve ter pelo menos 2 caracteres.",
      });
      return;
    }

    setIsCreating(true);
    setQrError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("manage-instance", {
        body: { action: "create", instance_name: instanceName },
      });
      
      if (error) throw error;

      setInstanceData(data.instance);
      queryClient.invalidateQueries({ queryKey: ["user-instances"] });
      
      // Fechar Modal 1 e ir para estado PENDING (não abre QR automaticamente)
      setIsNameModalOpen(false);
      setConnectionState("pending");
      
      toast.success("Instância criada!", {
        description: "Clique em Conectar para vincular seu WhatsApp.",
      });
      
    } catch (error: any) {
      toast.error("Erro ao criar instância", {
        description: error.message || "Tente novamente mais tarde.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Função para abrir modal do QR a partir do estado pending
  const handleOpenQrModal = async () => {
    if (!instanceData?.pastorini_id) return;
    
    setIsQrModalOpen(true);
    setIsRefreshingQr(true);
    setQrError(null);
    
    const qr = await fetchQrCodeWithRetry(instanceData.pastorini_id, 5);
    setIsRefreshingQr(false);
    
    if (qr) {
      setQrCode(qr);
    } else {
      setQrError("QR Code não disponível. Clique para tentar novamente.");
    }
  };

  // Cancelar modal QR - volta para pending (não deleta instância)
  const handleCancelQr = () => {
    setIsQrModalOpen(false);
    setQrCode(null);
    setQrError(null);
    setProgress(100);
    setTimeLeft(30);
    // Volta para pending, NÃO deleta a instância
    setConnectionState("pending");
  };

  // Excluir instância do estado pending
  const handleDeleteInstance = async () => {
    if (!instanceData?.pastorini_id) return;
    
    try {
      await supabase.functions.invoke("manage-instance", {
        body: { action: "delete", instance_id: instanceData.pastorini_id },
      });
      
      setInstanceData(null);
      setInstanceName("");
      setConnectionState("offline");
      queryClient.invalidateQueries({ queryKey: ["user-instances"] });
      
      toast.success("Instância excluída", {
        description: "A instância foi removida com sucesso.",
      });
    } catch (error: any) {
      toast.error("Erro ao excluir", {
        description: error.message || "Tente novamente.",
      });
    }
  };

  const handleDisconnect = async () => {
    if (!instanceData?.pastorini_id) return;
    
    try {
      const { error } = await supabase.functions.invoke("manage-instance", {
        body: { action: "delete", instance_id: instanceData.pastorini_id },
      });
      
      if (error) throw error;
      
      setInstanceData(null);
      setQrCode(null);
      setInstanceName("");
      setConnectionState("offline");
      queryClient.invalidateQueries({ queryKey: ["user-instances"] });
      
      toast.success("Desconectado", {
        description: "Sua conexão WhatsApp foi removida com sucesso.",
      });
    } catch (error: any) {
      toast.error("Erro ao desconectar", {
        description: error.message || "Tente novamente.",
      });
    }
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
  if (connectionState === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="space-y-6">
        <div>
          <NeonText as="h1" className="text-3xl font-bold mb-2">
            Integração WhatsApp
          </NeonText>
          <p className="text-muted-foreground">
            {connectionState === "connected" 
              ? "Seu WhatsApp está conectado e operacional"
              : "Conecte seu WhatsApp para começar a automatizar seu atendimento"
            }
          </p>
        </div>

        {/* Offline State */}
        {connectionState === "offline" && (
          <GlassCard className="flex flex-col items-center justify-center py-16 px-8">
            <div className="w-24 h-24 rounded-full bg-muted/30 flex items-center justify-center mb-6">
              <MessageCircle className="w-12 h-12 text-muted-foreground" />
            </div>

            <Badge variant="destructive" className="mb-4">
              Desconectado
            </Badge>

            <h2 className="text-xl font-semibold text-foreground mb-2">
              Nenhuma conexão ativa
            </h2>
            <p className="text-muted-foreground text-center mb-8 max-w-md">
              Conecte seu número de WhatsApp para começar a receber e enviar mensagens
              automatizadas através da plataforma.
            </p>

            <Button
              onClick={() => setIsNameModalOpen(true)}
              size="lg"
              className={cn(
                "flex items-center gap-3 px-8 py-6 rounded-xl font-semibold transition-all duration-300",
                "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600",
                "hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:-translate-y-1",
                "text-white border-0"
              )}
            >
              <Plus className="w-5 h-5" />
              <span>Adicionar WhatsApp</span>
            </Button>
          </GlassCard>
        )}

        {/* Pending State - Instance created, awaiting connection */}
        {connectionState === "pending" && instanceData && (
          <GlassCard className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Icon + Info */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-amber-500" />
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-foreground">
                      {instanceData.company_name}
                    </h3>
                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                      Aguardando Conexão
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Clique em Conectar para escanear o QR Code
                  </p>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  onClick={handleOpenQrModal}
                  size="sm"
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Conectar
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir instância?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação irá excluir a instância "{instanceData.company_name}". 
                        Você precisará criar uma nova para conectar.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteInstance}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Connected State */}
        {connectionState === "connected" && instanceData && (
          <GlassCard className="p-4 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Avatar + Info */}
              <div className="flex items-center gap-4">
                {/* Profile Picture with green ring */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-full ring-2 ring-emerald-500 ring-offset-2 ring-offset-background overflow-hidden">
                    {profilePictureUrl ? (
                      <img 
                        src={profilePictureUrl} 
                        alt="WhatsApp Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-emerald-500/20 flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-emerald-500" />
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-foreground text-lg">
                    {instanceData.company_name}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{instanceData.company_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{formatPhoneNumber(statusData?.phoneNumber || instanceData?.phone_number || "")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Settings className="w-5 h-5" />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
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
                        onClick={handleDisconnect}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Desconectar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Modal 1: Instance Name */}
      <Dialog open={isNameModalOpen} onOpenChange={setIsNameModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              Identifique seu WhatsApp
            </DialogTitle>
            <DialogDescription>
              Dê um nome para esta conexão. Isso ajudará você a identificar 
              diferentes números no futuro.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="instance-name">Nome da Instância</Label>
              <Input
                id="instance-name"
                placeholder="Ex: Comercial, Vendas, Suporte"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value.slice(0, 30))}
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground">
                {instanceName.length}/30 caracteres
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsNameModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateInstance}
              disabled={isCreating || instanceName.length < 2}
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Instância
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal 2: QR Code */}
      <Dialog open={isQrModalOpen} onOpenChange={(open) => {
        if (!open) handleCancelQr();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              Escaneie o QR Code
            </DialogTitle>
            <DialogDescription>
              Use o WhatsApp do seu celular para escanear o código abaixo.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center py-4">
            {/* QR Code with animated border */}
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-2xl qr-scanning-border opacity-60" />
              <div className="absolute inset-[3px] rounded-xl bg-background" />
              
              <div className="relative p-4 rounded-xl bg-white min-w-[240px] min-h-[240px] flex items-center justify-center">
                {isRefreshingQr ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
                    <p className="text-sm text-gray-500">Carregando QR Code...</p>
                  </div>
                ) : qrCode ? (
                  <img
                    src={qrCode}
                    alt="QR Code"
                    className="w-56 h-56 object-contain"
                  />
                ) : qrError ? (
                  <div className="flex flex-col items-center gap-3 p-4 text-center">
                    <p className="text-sm text-gray-500">{qrError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshQrCode}
                      disabled={isRefreshingQr}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Tentar Novamente
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
                    <p className="text-sm text-gray-500">Aguardando QR Code...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Progress bar with timer */}
            {qrCode && !qrError && (
              <div className="w-full space-y-2 mb-4">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {isRefreshingQr ? (
                    "Atualizando QR Code..."
                  ) : (
                    `Atualizando em ${timeLeft}s...`
                  )}
                </p>
              </div>
            )}

            {/* Polling indicator */}
            <div className="flex items-center gap-2 text-primary mb-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Aguardando leitura...</span>
            </div>

            {/* Instructions */}
            <div className="text-center space-y-2 bg-muted/30 rounded-lg p-4 w-full">
              <p className="text-foreground font-medium text-sm">Como conectar:</p>
              <ol className="text-xs text-muted-foreground space-y-1 text-left">
                <li>1. Abra o WhatsApp no seu celular</li>
                <li>2. Toque em <strong>Menu</strong> ou <strong>Configurações</strong></li>
                <li>3. Selecione <strong>Aparelhos conectados</strong></li>
                <li>4. Toque em <strong>Conectar um aparelho</strong></li>
                <li>5. Aponte a câmera para este QR Code</li>
              </ol>
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={handleCancelQr}
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
