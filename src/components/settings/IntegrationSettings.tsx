import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  MessageCircle,
  Loader2,
  X,
  Plus,
  QrCode,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { WhatsAppAutomationSettings } from "./WhatsAppAutomationSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
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
  instance_name?: string;
  pastorini_status: string;
  phone_number?: string;
}

export function IntegrationSettings() {
  const [connectionState, setConnectionState] = useState<ConnectionState>("loading");
  const [instanceData, setInstanceData] = useState<InstanceData | null>(null);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [instanceName, setInstanceName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [progress, setProgress] = useState(100);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isRefreshingQr, setIsRefreshingQr] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const qrRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const queryClient = useQueryClient();

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

  const { data: statusData } = useQuery({
    queryKey: ["instance-status", instanceData?.pastorini_id],
    queryFn: async () => {
      if (!instanceData?.pastorini_id) return null;
      const { data, error } = await supabase.functions.invoke("manage-instance", {
        body: { action: "status", instance_id: instanceData.pastorini_id },
      });
      if (error) return null;
      return data;
    },
    refetchInterval: isQrModalOpen ? 2000 : false,
    enabled: isQrModalOpen && !!instanceData?.pastorini_id,
  });

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
        setConnectionState("pending");
      }
    } else {
      setConnectionState("offline");
    }
  }, [instancesData, loadingInstances]);


  useEffect(() => {
    if (statusData?.status === "CONNECTED" || statusData?.status === "open") {
      setIsQrModalOpen(false);
      setConnectionState("connected");
      setQrCode(null);
      queryClient.invalidateQueries({ queryKey: ["user-instances"] });

      if (instanceData?.pastorini_id) {
        fetchProfilePicture(instanceData.pastorini_id);
      }

      toast.success("WhatsApp Conectado!");
    }
  }, [statusData, queryClient, instanceData?.pastorini_id]);

  useEffect(() => {
    if (connectionState === "connected" && instanceData?.pastorini_id && !profilePictureUrl) {
      fetchProfilePicture(instanceData.pastorini_id);
    }
  }, [connectionState, instanceData?.pastorini_id, profilePictureUrl]);

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

  useEffect(() => {
    if (isQrModalOpen) {
      setProgress(100);
      setTimeLeft(30);
    }
  }, [isQrModalOpen]);

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
        if (data?.qrCode) return data.qrCode;
      } catch (error) {
        console.log(`QR fetch attempt ${i + 1}/${retries} failed:`, error);
      }

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
        setQrError("Não foi possível obter o QR Code.");
      }
    } catch (error) {
      setQrError("Erro ao atualizar QR Code.");
    } finally {
      setIsRefreshingQr(false);
      setProgress(100);
      setTimeLeft(30);
    }
  }, [instanceData?.pastorini_id, isRefreshingQr, fetchQrCodeWithRetry]);

  const handleCreateInstance = async () => {
    if (instanceName.length < 2) {
      toast.error("Nome muito curto");
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
      setIsNameModalOpen(false);
      setConnectionState("pending");

      toast.success("Instância criada!");
    } catch (error: any) {
      toast.error("Erro ao criar instância", { description: error.message });
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestartInstance = async () => {
    if (!instanceData?.pastorini_id) return;

    setIsRefreshingQr(true);
    setQrError(null);

    try {
      // Primeiro tenta dar logout (limpar sessão)
      await supabase.functions.invoke("manage-instance", {
        body: { action: "logout", instance_id: instanceData.pastorini_id },
      });

      // Depois busca um novo QR
      const qr = await fetchQrCodeWithRetry(instanceData.pastorini_id, 3);
      if (qr) {
        setQrCode(qr);
        toast.success("Sessão reiniciada! Tente escanear agora.");
      } else {
        setQrError("Não foi possível obter um novo QR Code.");
      }
    } catch (error) {
      toast.error("Erro ao reiniciar instância.");
    } finally {
      setIsRefreshingQr(false);
    }
  };

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
      setQrError("QR Code não disponível.");
    }
  };

  const handleCancelQr = () => {
    setIsQrModalOpen(false);
    setQrCode(null);
    setQrError(null);
    setProgress(100);
    setTimeLeft(30);
    setConnectionState("pending");
  };

  const handleDeleteInstance = async () => {
    if (!instanceData?.pastorini_id) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("manage-instance", {
        body: { action: "delete", instance_id: instanceData.pastorini_id },
      });

      if (error) throw error;

      setInstanceData(null);
      setInstanceName("");
      setQrCode(null);
      setConnectionState("offline");
      queryClient.invalidateQueries({ queryKey: ["user-instances"] });

      toast.success("Instância excluída com sucesso", {
        description: "A instância foi removida da API e do banco de dados.",
      });
    } catch (error: any) {
      toast.error("Erro ao excluir instância", { description: error.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!instanceData?.pastorini_id) return;

    try {
      await supabase.functions.invoke("manage-instance", {
        body: { action: "logout", instance_id: instanceData.pastorini_id },
      });

      setQrCode(null);
      setConnectionState("pending"); // Change to pending instead of offline since the instance still exists
      queryClient.invalidateQueries({ queryKey: ["user-instances"] });

      toast.success("Desconectado (Agendamentos preservados)");
    } catch (error: any) {
      toast.error("Erro ao desconectar", { description: error.message });
    }
  };

  if (connectionState === "loading") {
    return (
      <GlassCard className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </GlassCard>
    );
  }

  return (
    <>
      {/* Offline State */}
      {connectionState === "offline" && (
        <GlassCard className="flex flex-col items-center justify-center py-12 px-8 text-center bg-slate-50/10">
          <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-6">
            <MessageCircle className="w-10 h-10 text-muted-foreground" />
          </div>


          <h2 className="text-xl font-semibold text-foreground mb-2">
            Configurar Conexão WhatsApp
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Sua clínica já está registrada, mas para usar o WhatsApp você precisa configurar sua instância.
          </p>

          <Button
            onClick={() => setIsNameModalOpen(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-2 h-12 px-8"
          >
            Configurar Instância
          </Button>
        </GlassCard>
      )}

      {/* Pending State */}
      {connectionState === "pending" && instanceData && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-amber-500" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">
                    {instanceData.company_name}
                  </h3>
                  <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                    Aguardando
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {instanceData.instance_name && (
                    <span className="font-medium text-foreground/70">{instanceData.instance_name} · </span>
                  )}
                  Clique em Conectar para escanear o QR Code
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleOpenQrModal}
                size="sm"
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Conectar
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-destructive hover:bg-destructive/90 text-white"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Excluindo...</>
                    ) : (
                      <><X className="w-4 h-4 mr-2" /> Excluir</>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>⚠️ Excluir instância permanentemente?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <span className="block">Você está prestes a excluir a instância <strong>"{instanceData.company_name}"</strong>.</span>
                      <span className="block text-destructive font-medium">Esta ação irá:</span>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>Desconectar e remover a sessão do WhatsApp na API</li>
                        <li>Excluir a instância permanentemente do banco de dados</li>
                      </ul>
                      <span className="block mt-2">Esta ação <strong>não pode ser desfeita</strong>.</span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteInstance}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Sim, excluir tudo
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
        <GlassCard className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center overflow-hidden">
                {profilePictureUrl ? (
                  <img src={profilePictureUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <MessageCircle className="w-6 h-6 text-emerald-500" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">
                    {instanceData.company_name}
                  </h3>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    Conectado
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {instanceData.instance_name && (
                    <span className="font-medium text-foreground/70">{instanceData.instance_name} · </span>
                  )}
                  WhatsApp ativo e funcionando
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Desconectar - mantém dados, só encerra a sessão */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-amber-600 border-amber-500/30 hover:bg-amber-500/10">
                    Desconectar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Desconectar WhatsApp?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <span className="block">A sessão do WhatsApp será encerrada, mas <strong>seus dados e configurações serão mantidos</strong>.</span>
                      <span className="block text-sm">Você poderá reconectar escaneando um novo QR Code.</span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDisconnect} className="bg-amber-600 hover:bg-amber-700">
                      Desconectar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Excluir - remove tudo da API e do banco */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/20 hover:bg-destructive/10"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Excluindo...</>
                    ) : (
                      <><X className="w-4 h-4 mr-1" /> Excluir</>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>⚠️ Excluir instância permanentemente?</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <span className="block">Você está prestes a excluir a instância <strong>"{instanceData.company_name}"</strong>.</span>
                      <span className="block text-destructive font-medium">Esta ação irá:</span>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        <li>Desconectar e remover a sessão do WhatsApp na API</li>
                        <li>Excluir a instância permanentemente do banco de dados</li>
                      </ul>
                      <span className="block mt-2">Esta ação <strong>não pode ser desfeita</strong>.</span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteInstance}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Sim, excluir tudo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Automation Settings (Visible if an instance exists) */}
      {instanceData && <WhatsAppAutomationSettings />}

      {/* Name Modal */}
      <Dialog open={isNameModalOpen} onOpenChange={setIsNameModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Conexão WhatsApp</DialogTitle>
            <DialogDescription>
              O nome da clínica será preenchido automaticamente do seu perfil.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da instância</Label>
              <Input
                placeholder="Ex: Recepção, Atendimento, WhatsApp Principal..."
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                É o apelido desta conexão — útil se você tiver mais de um WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsNameModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateInstance} disabled={isCreating}>
              {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Modal */}
      <Dialog open={isQrModalOpen} onOpenChange={handleCancelQr}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Escanear QR Code</DialogTitle>
            <DialogDescription>
              Abra o WhatsApp no seu celular e escaneie o código.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center py-4">
            {isRefreshingQr ? (
              <div className="w-64 h-64 flex items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
            ) : qrError ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-4">
                  <X className="w-12 h-12 text-destructive mb-4" />
                  <p className="text-destructive font-medium mb-4">{qrError}</p>
                  <div className="flex gap-2">
                    <Button onClick={refreshQrCode} variant="outline" size="sm">
                      Tentar Novamente
                    </Button>
                    <Button onClick={handleRestartInstance} variant="secondary" size="sm">
                      Reiniciar Sessão
                    </Button>
                  </div>
                </div>
              ) : qrCode ? (
                <div className="flex flex-col items-center gap-6">
                  <div className="bg-white p-4 rounded-xl shadow-inner inline-block">
                    <img
                      src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                      alt="WhatsApp QR Code"
                      className="w-64 h-64"
                    />
                  </div>
                  
                  <div className="w-full space-y-4">
                    <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
                      <span>Atualiza em {timeLeft}s</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                    
                    <p className="text-xs text-center text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border/50">
                      Se o seu celular não ler, tente clicar em <b>Reiniciar Sessão</b> para limpar conexões antigas.
                    </p>

                    <Button 
                      onClick={handleRestartInstance} 
                      variant="outline" 
                      className="w-full text-xs h-8"
                      disabled={isRefreshingQr}
                    >
                      {isRefreshingQr ? "Reiniciando..." : "Reiniciar Sessão"}
                    </Button>
                  </div>
                </div>
              ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
