

# Plano: Refatoracao da Pagina de Integracao com Fluxo de Modais

## Visao Geral

Reescrever a pagina `/integration` com uma experiencia de "Wizard" guiada atraves de modais (Dialogs). O fluxo sera mais profissional, com passos claros e feedback visual aprimorado.

---

## Fluxo do Usuario

```text
+--------------------+     +----------------------+     +--------------------+
|   ESTADO INICIAL   | --> |   MODAL 1: NOME      | --> |   MODAL 2: QR CODE |
|   (Desconectado)   |     |   DA INSTANCIA       |     |   (Com Timer 30s)  |
+--------------------+     +----------------------+     +--------------------+
         ^                                                        |
         |                                                        v
         |                                              +--------------------+
         +----------------------------------------------+   ESTADO CONECTADO |
                     (Desconectar)                      +--------------------+
```

---

## Estados e Componentes

### ESTADO INICIAL (Sem Conexao)

**Visual:**
- GlassCard com status "Desconectado"
- Icone de WhatsApp cinza
- Badge de status vermelho
- Botao "Adicionar WhatsApp" (gradiente verde/ciano)

**Comportamento:**
- Ao clicar no botao, abre Modal 1

---

### MODAL 1: Nome da Instancia

**Visual (Dialog do Shadcn):**
- Titulo: "Identifique seu WhatsApp"
- Descricao: Explicacao breve
- Input com label "Nome da Instancia"
- Placeholder: "Ex: Comercial, Vendas, Suporte"
- Botao "Gerar QR Code" (neon-button)

**Comportamento:**
1. Usuario digita nome da instancia
2. Ao clicar "Gerar QR Code":
   - Botao entra em loading
   - Chama `manage-instance` com `{ action: 'create', instance_name: 'nome_digitado' }`
   - Se sucesso: Fecha Modal 1, abre Modal 2 com QR Code
   - Se erro: Toast de erro, mantem modal aberto

**Validacao:**
- Nome obrigatorio (minimo 2 caracteres)
- Maximo 30 caracteres

---

### MODAL 2: Leitura do QR Code

**Visual (Dialog do Shadcn):**
- Titulo: "Escaneie o QR Code"
- Container do QR Code com borda animada (scanning)
- Progress Bar embaixo do QR (30 segundos)
- Instrucoes de como escanear
- Botao "Cancelar" (fecha modal e deleta instancia)

**Comportamento - Timer de Refresh (30s):**
```typescript
// useEffect para timer de 30 segundos
const [progress, setProgress] = useState(100);
const [timeLeft, setTimeLeft] = useState(30);

useEffect(() => {
  if (!isQrModalOpen) return;
  
  const interval = setInterval(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        // Refresh QR code
        refreshQrCode();
        return 30;
      }
      return prev - 1;
    });
    setProgress((prev) => Math.max(0, prev - (100 / 30)));
  }, 1000);
  
  return () => clearInterval(interval);
}, [isQrModalOpen]);
```

**Comportamento - Polling de Status (2s):**
```typescript
const { data: statusData } = useQuery({
  queryKey: ['instance-status', instanceId],
  queryFn: async () => {
    const { data } = await supabase.functions.invoke('manage-instance', {
      body: { action: 'status', instance_id: instanceId }
    });
    return data;
  },
  refetchInterval: 2000,
  enabled: isQrModalOpen && !!instanceId
});

// Detectar conexao
useEffect(() => {
  if (statusData?.status === 'CONNECTED' || statusData?.status === 'open') {
    setIsQrModalOpen(false);
    setConnectionState('connected');
    toast.success('WhatsApp Conectado!', {
      description: 'Seu numero foi conectado com sucesso.'
    });
  }
}, [statusData]);
```

**Ao Cancelar:**
1. Fecha modal
2. Chama `{ action: 'delete', instance_id: ... }`
3. Volta para Estado Inicial

---

### ESTADO CONECTADO (Online)

**Visual:**
- GlassCard com status verde "Sistema Online"
- Icone de CheckCircle2 com glow verde
- Grid de informacoes:
  - Nome da Instancia
  - Numero Conectado (formatado)
  - Status do Webhook (badge "Ativo")
- Botao "Desconectar" (vermelho, perigo)

**Ao Desconectar:**
1. Abre AlertDialog de confirmacao
2. Se confirmar: Chama `{ action: 'delete' }`
3. Toast de sucesso
4. Volta para Estado Inicial

---

## Estrutura do Codigo

```typescript
// src/pages/Integration.tsx

export default function Integration() {
  // Estados principais
  const [connectionState, setConnectionState] = useState<'loading' | 'offline' | 'connected'>('loading');
  const [instanceData, setInstanceData] = useState<InstanceData | null>(null);
  
  // Estados dos modais
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  
  // Estados do Modal 1
  const [instanceName, setInstanceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Estados do Modal 2
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [progress, setProgress] = useState(100);
  const [timeLeft, setTimeLeft] = useState(30);
  
  // ... queries, mutations, effects
  
  return (
    <>
      {/* Header da pagina */}
      <PageHeader />
      
      {/* Conteudo baseado no estado */}
      {connectionState === 'loading' && <LoadingState />}
      {connectionState === 'offline' && <OfflineCard onConnect={() => setIsNameModalOpen(true)} />}
      {connectionState === 'connected' && <ConnectedCard instance={instanceData} onDisconnect={...} />}
      
      {/* Modal 1: Nome da Instancia */}
      <Dialog open={isNameModalOpen} onOpenChange={setIsNameModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Identifique seu WhatsApp</DialogTitle>
            <DialogDescription>...</DialogDescription>
          </DialogHeader>
          <Input value={instanceName} onChange={...} placeholder="Ex: Comercial, Vendas" />
          <DialogFooter>
            <Button onClick={handleCreate} disabled={isCreating || !instanceName}>
              {isCreating ? <Loader2 /> : 'Gerar QR Code'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal 2: QR Code */}
      <Dialog open={isQrModalOpen} onOpenChange={handleQrModalClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escaneie o QR Code</DialogTitle>
          </DialogHeader>
          
          {/* QR Code com borda animada */}
          <QRCodeDisplay qrCode={qrCode} />
          
          {/* Progress bar com timer */}
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-xs text-muted-foreground text-center">
              Atualizando em {timeLeft}s...
            </p>
          </div>
          
          {/* Instrucoes */}
          <Instructions />
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

## Arquivos a Modificar

### 1. `src/pages/Integration.tsx`
- Reescrever completamente com novo fluxo de modais
- Implementar timer de 30s com Progress Bar
- Implementar polling de status a cada 2s
- Usar Dialog e Progress do Shadcn UI

---

## Componentes Shadcn Utilizados

| Componente | Uso |
|------------|-----|
| `Dialog` | Modais de Nome e QR Code |
| `DialogContent` | Container do conteudo do modal |
| `DialogHeader` | Cabecalho com titulo e descricao |
| `DialogFooter` | Botoes de acao |
| `Progress` | Barra de progresso do timer 30s |
| `Input` | Campo de nome da instancia |
| `Button` | Acoes em todos os estados |
| `AlertDialog` | Confirmacao de desconexao |
| `Label` | Label do input |

---

## Detalhes Visuais

### Borda Animada do QR Code
- Reutilizar classe `.qr-scanning-border` ja existente no CSS
- Aplicar em container envolvendo o QR Code

### Progress Bar Estilizada
- Usar componente Progress do Shadcn
- Cor primaria (ciano/azul) para indicar tempo restante
- Animacao suave de decremento

### Cards de Status
- Glassmorphism com backdrop-blur
- Icones com cores indicativas (cinza = offline, verde = online)
- Badges de status com cores contrastantes

---

## Tratamento de Erros

1. **Erro ao criar instancia:**
   - Toast de erro com mensagem da API
   - Manter Modal 1 aberto
   - Limpar loading do botao

2. **Erro ao obter QR Code:**
   - Mostrar mensagem no lugar do QR
   - Botao "Tentar Novamente"

3. **Erro ao verificar status:**
   - Continuar polling (ignorar erros temporarios)
   - Apenas logar no console

4. **QR Code expirado:**
   - Timer de 30s detecta
   - Chama `get_qr` automaticamente
   - Atualiza imagem sem fechar modal

---

## Resumo das Alteracoes

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/pages/Integration.tsx` | Reescrever | Nova logica com fluxo de modais wizard-style |

