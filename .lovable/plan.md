


# Plano: Novo Fluxo de Integracao com Estados Intermediarios

## Visao Geral

Modificar o fluxo da pagina `/integration` para ter um estado intermediario entre a criacao da instancia e a conexao. O novo fluxo sera:

```text
+--------------------+     +----------------------+     +----------------------+
|   ESTADO INICIAL   | --> |   MODAL 1: NOME      | --> |   ESTADO PENDENTE    |
|   (Desconectado)   |     |   DA INSTANCIA       |     |   (Card + Conectar)  |
+--------------------+     +----------------------+     +----------------------+
                                                                   |
                                                                   v
         +--------------------+     +----------------------+       |
         |   ESTADO CONECTADO | <-- |   MODAL 2: QR CODE   | <-----+
         |   (Online)         |     |   (Com Timer 30s)    |
         +--------------------+     +----------------------+
```

---

## Novos Estados

### 1. ESTADO INICIAL (offline) - Sem nenhuma instancia
- Card com icone WhatsApp cinza
- Badge "Desconectado"
- Botao "Adicionar WhatsApp"
- Ao clicar: Abre Modal 1

### 2. MODAL 1: Nome da Instancia (sem mudancas)
- Input para nome da instancia
- Botao "Criar Instancia" (mudanca de label)
- Ao clicar: Cria instancia e fecha modal
- Depois: Vai para Estado Pendente (NAO abre QR automaticamente)

### 3. ESTADO PENDENTE (novo) - Instancia criada, nao conectada
- Card com nome da instancia
- Badge "Aguardando Conexao" (amarelo)
- Botao "Conectar" (verde)
- Ao clicar: Abre Modal 2 (QR Code)
- Botao secundario "Excluir" (vermelho outline)

### 4. MODAL 2: QR Code (sem mudancas na logica)
- QR Code com timer de 30s
- Progress bar
- Polling de status a cada 2s
- Ao detectar conexao: Fecha modal, vai para Estado Conectado

### 5. ESTADO CONECTADO (connected) - Igual ao atual
- Card verde "Sistema Online"
- Informacoes da instancia
- Botao "Desconectar"

---

## Mudancas no Tipo de Estado

```typescript
// Antes
type ConnectionState = "loading" | "offline" | "connected";

// Depois
type ConnectionState = "loading" | "offline" | "pending" | "connected";
```

---

## Logica de Determinacao do Estado

```typescript
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
      // Nova logica: instancia existe mas nao conectada = pending
      setConnectionState("pending");
    }
  } else {
    setConnectionState("offline");
  }
}, [instancesData, loadingInstances]);
```

---

## Novo Componente: Estado Pendente

```typescript
{connectionState === "pending" && instanceData && (
  <GlassCard className="flex flex-col items-center justify-center py-12 px-8">
    <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mb-6">
      <MessageCircle className="w-10 h-10 text-amber-500" />
    </div>

    <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 mb-4">
      Aguardando Conexao
    </Badge>

    <h2 className="text-xl font-semibold text-foreground mb-2">
      {instanceData.company_name}
    </h2>
    <p className="text-muted-foreground text-center mb-8 max-w-md">
      Sua instancia foi criada. Clique em "Conectar" para escanear o QR Code
      e vincular seu WhatsApp.
    </p>

    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
      <Button
        onClick={handleOpenQrModal}
        size="lg"
        className="flex-1 bg-gradient-to-r from-emerald-500 to-cyan-500"
      >
        <QrCode className="w-5 h-5 mr-2" />
        Conectar
      </Button>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="lg" className="text-destructive border-destructive/50">
            <X className="w-5 h-5 mr-2" />
            Excluir
          </Button>
        </AlertDialogTrigger>
        {/* Confirmacao de exclusao */}
      </AlertDialog>
    </div>
  </GlassCard>
)}
```

---

## Modificacao do Modal 1

Mudanca no botao:
- Antes: "Gerar QR Code"
- Depois: "Criar Instancia"

Mudanca no comportamento:
```typescript
const handleCreateInstance = async () => {
  // ... validacao e criacao ...
  
  setInstanceData(data.instance);
  queryClient.invalidateQueries({ queryKey: ["user-instances"] });
  
  // Fechar Modal 1 e ir para estado PENDING (nao abre QR)
  setIsNameModalOpen(false);
  setConnectionState("pending");
  
  // NÃO abre o modal do QR automaticamente
  // O usuario clicara em "Conectar" no card
  
  toast.success("Instancia criada!", {
    description: "Clique em Conectar para vincular seu WhatsApp.",
  });
};
```

---

## Nova Funcao: Abrir Modal QR

```typescript
const handleOpenQrModal = async () => {
  if (!instanceData?.pastorini_id) return;
  
  setIsQrModalOpen(true);
  setIsRefreshingQr(true);
  setQrError(null);
  
  // Buscar QR Code
  const qr = await fetchQrCodeWithRetry(instanceData.pastorini_id, 5);
  setIsRefreshingQr(false);
  
  if (qr) {
    setQrCode(qr);
  } else {
    setQrError("QR Code nao disponivel. Clique para tentar novamente.");
  }
};
```

---

## Modificacao do handleCancelQr

Mudanca: Ao cancelar o modal do QR, NAO deleta a instancia, apenas fecha o modal e volta para estado pending.

```typescript
const handleCancelQr = async () => {
  setIsQrModalOpen(false);
  setQrCode(null);
  setQrError(null);
  setProgress(100);
  setTimeLeft(30);
  // Volta para pending, NAO deleta a instancia
  setConnectionState("pending");
};
```

---

## Nova Funcao: Excluir Instancia

```typescript
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
    
    toast.success("Instancia excluida", {
      description: "A instancia foi removida com sucesso.",
    });
  } catch (error: any) {
    toast.error("Erro ao excluir", {
      description: error.message || "Tente novamente.",
    });
  }
};
```

---

## Resumo das Modificacoes

| Item | Mudanca |
|------|---------|
| `ConnectionState` | Adicionar estado `"pending"` |
| `handleCreateInstance` | Nao abre QR automaticamente, vai para pending |
| `handleCancelQr` | Nao deleta instancia, volta para pending |
| `handleOpenQrModal` | Nova funcao para abrir QR do estado pending |
| `handleDeleteInstance` | Nova funcao para excluir do estado pending |
| Modal 1 botao | "Gerar QR Code" → "Criar Instancia" |
| UI | Novo card para estado pending |

---

## Arquivo a Modificar

| Arquivo | Acao |
|---------|------|
| `src/pages/Integration.tsx` | Modificar logica de estados e adicionar estado pending |


