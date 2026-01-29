

# Plano: Pagina de Integracao WhatsApp

## Visao Geral

Criar a pagina `/integration` com machine state para gerenciar conexao WhatsApp via Pastorini API. A interface seguira o design system "High-End Dark Glass" ja estabelecido no projeto.

---

## Informacoes da API

**Base URL**: `https://zap.inoovaweb.com.br`
**Autenticacao**: Header `x-api-key: 280896Ab@`

### Endpoints Utilizados

| Acao | Metodo | Endpoint | Descricao |
|------|--------|----------|-----------|
| Criar instancia | POST | `/api/instances` | Body: `{ id: "nome-unico" }` |
| Obter QR Code | GET | `/api/instances/:id/qr` | Retorna `{ qrImage: "data:image/png;base64,..." }` |
| Verificar status | GET | `/api/instances/:id/status` | Retorna `{ status: "CONNECTED", name, phoneNumber }` |
| Deletar instancia | DELETE | `/api/instances/:id` | Remove instancia |
| Configurar webhook | POST | `/api/instances/:id/webhook` | Body: `{ url, enabled, events }` |

---

## Arquitetura da Solucao

```text
+----------------------------------+
|      Frontend (React)            |
|  src/pages/Integration.tsx       |
+----------------------------------+
              |
              v
+----------------------------------+
|    Edge Function (Deno)          |
| supabase/functions/manage-instance|
|  - Proxy seguro para Pastorini   |
|  - Salva dados no Supabase       |
+----------------------------------+
              |
              v
+----------------------------------+
|      Pastorini API               |
|  https://zap.inoovaweb.com.br    |
+----------------------------------+
```

---

## 1. Secret da API

**Acao**: Adicionar secret `PASTORINI_API_KEY` com valor `280896Ab@`

- A API Key sera armazenada de forma segura no Supabase Secrets
- A Edge Function acessara via `Deno.env.get('PASTORINI_API_KEY')`

---

## 2. Edge Function Atualizada

**Arquivo**: `supabase/functions/manage-instance/index.ts`

### Novas Acoes

| Action | Descricao | Parametros |
|--------|-----------|------------|
| `create` | Cria instancia na Pastorini + salva no Supabase | `instance_name` |
| `status` | Obtem status da instancia | `instance_id` |
| `get_qr` | Obtem QR Code para conexao | `instance_id` |
| `delete` | Remove instancia da Pastorini + Supabase | `instance_id` |
| `get_instances` | Lista instancias do usuario | - |

### Logica de Criacao

1. Gerar ID unico para instancia (ex: `user_id_timestamp`)
2. POST para Pastorini `/api/instances`
3. Configurar webhook automaticamente
4. Salvar registro na tabela `instances` do Supabase
5. Retornar dados da instancia

### Headers para Pastorini

```typescript
const headers = {
  'Content-Type': 'application/json',
  'x-api-key': Deno.env.get('PASTORINI_API_KEY')!
}
```

---

## 3. Pagina de Integracao

**Arquivo**: `src/pages/Integration.tsx`

### Estados da Interface

```text
ESTADO 1: OFFLINE (Sem instancia)
+------------------------------------------+
|                                          |
|     [WhatsApp Icon - Cinza]              |
|                                          |
|   Conecte seu WhatsApp para comecar      |
|                                          |
|   [=== Conectar Novo Numero ===]         |
|        (Botao gradiente verde)           |
|                                          |
+------------------------------------------+

ESTADO 2: AGUARDANDO QR CODE
+------------------------------------------+
|                                          |
|   +--------------------+                 |
|   |                    |                 |
|   |   [QR CODE IMG]    |  <-- Borda      |
|   |                    |      animada    |
|   +--------------------+                 |
|                                          |
|   Abra o WhatsApp > Aparelhos...         |
|                                          |
|   [Cancelar]                             |
|                                          |
+------------------------------------------+

ESTADO 3: CONECTADO (Online)
+------------------------------------------+
|                                          |
|   [Check Icon Verde] SISTEMA OPERACIONAL |
|                                          |
| +----------------+ +-------------------+ |
| | Nome Sessao    | | Numero Conectado  | |
| | Atendimento... | | +55 11 9999-9999  | |
| +----------------+ +-------------------+ |
|                                          |
| +--------------------------------------+ |
| | Webhook                    [Ativo]   | |
| | https://n8n.../webhook...            | |
| +--------------------------------------+ |
|                                          |
|   [Desconectar Instancia] (vermelho)     |
|                                          |
+------------------------------------------+
```

### Componentes Internos

#### ConnectionCard (Estado Offline)
- Icone MessageCircle grande (80px) em cinza
- Texto de boas-vindas
- Botao com gradiente verde-para-ciano
- Efeito hover com glow

#### QRCodeCard (Estado QR)
- Container do QR com borda animada (scanning effect)
- Imagem base64 do QR Code
- Instrucoes passo-a-passo
- Botao cancelar para voltar ao estado 1
- Indicador de "Aguardando leitura..."

#### ConnectedPanel (Estado Online)
- Icone CheckCircle2 gigante com glow verde neon
- Texto "SISTEMA OPERACIONAL" em gradiente
- Grid de cards de informacao:
  - Nome da sessao
  - Numero conectado (formatado)
  - Status do webhook
- Botao "Desconectar" com estilo de perigo

### Logica de Polling

```typescript
const { data: statusData, isLoading } = useQuery({
  queryKey: ['instance-status', instanceId],
  queryFn: () => supabase.functions.invoke('manage-instance', {
    body: { action: 'status', instance_id: instanceId }
  }),
  refetchInterval: currentState === 'qr' ? 3000 : false,
  enabled: !!instanceId && currentState === 'qr'
});

// Transicao automatica quando conectar
useEffect(() => {
  if (statusData?.data?.status === 'CONNECTED') {
    setCurrentState('connected');
  }
}, [statusData]);
```

---

## 4. Animacoes CSS

**Arquivo**: `src/index.css` (adicionar)

```css
/* Scanning Border Animation */
@keyframes scanning {
  0% {
    background-position: 0% 0%;
  }
  50% {
    background-position: 100% 100%;
  }
  100% {
    background-position: 0% 0%;
  }
}

.qr-scanning-border {
  background: linear-gradient(
    90deg,
    transparent,
    hsl(142 71% 45%),
    transparent
  );
  background-size: 200% 200%;
  animation: scanning 2s linear infinite;
}

/* Success Pulse */
@keyframes success-pulse {
  0%, 100% {
    box-shadow: 0 0 20px hsl(142 71% 45% / 0.4);
  }
  50% {
    box-shadow: 0 0 40px hsl(142 71% 45% / 0.8);
  }
}

.success-glow {
  animation: success-pulse 2s ease-in-out infinite;
}
```

---

## 5. Roteamento

**Arquivo**: `src/App.tsx`

Adicionar rota `/integration` dentro do AuthGuard.

---

## 6. Navegacao

**Arquivo**: `src/components/layout/Sidebar.tsx`

Adicionar item de navegacao:
```typescript
{ icon: Plug, label: "Integracao", path: "/integration" }
```

---

## Arquivos a Criar

1. `src/pages/Integration.tsx` - Pagina principal de integracao

## Arquivos a Modificar

1. `supabase/functions/manage-instance/index.ts` - Adicionar acoes da Pastorini API
2. `src/App.tsx` - Adicionar rota /integration
3. `src/components/layout/Sidebar.tsx` - Adicionar link de navegacao
4. `src/index.css` - Adicionar animacoes do QR Code

---

## Tratamento de Erros

- Toast de erro se a criacao falhar
- Retry automatico do QR Code se expirar
- Confirmacao antes de deletar instancia
- Loading states em todos os botoes de acao

---

## Fluxo do Usuario

1. Usuario acessa `/integration`
2. Ve estado "Offline" com botao de conectar
3. Clica em "Conectar Novo Numero"
4. Edge Function cria instancia na Pastorini
5. QR Code aparece com animacao de scanning
6. Usuario escaneia com WhatsApp
7. Polling detecta `CONNECTED`
8. Interface transiciona para painel de sucesso
9. Usuario pode desconectar a qualquer momento

