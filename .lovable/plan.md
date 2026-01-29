

# Plano: Redesign do Card de Estado Pending

## Problema Atual

O card do estado "Pending" esta ocupando muito espaco vertical com:
- Padding excessivo (`py-12`)
- Icone muito grande (`w-20 h-20`)
- Layout centralizado que estende a altura
- Texto explicativo desnecessariamente longo

## Solucao Proposta

Transformar o card em um layout horizontal compacto, similar a um item de lista, mantendo todas as informacoes essenciais mas em um formato mais elegante e profissional.

---

## Antes vs Depois

```text
ANTES (Layout Vertical Centralizado):
+------------------------------------------------+
|                                                |
|                   [ICONE]                      |
|                                                |
|              [Aguardando Conexao]              |
|                                                |
|                  Atendimento                   |
|                                                |
|        Sua instancia foi criada...             |
|                                                |
|         [Conectar]    [Excluir]                |
|                                                |
+------------------------------------------------+

DEPOIS (Layout Horizontal Compacto):
+------------------------------------------------+
|  [ICONE]  |  Atendimento          [Conectar]   |
|   amber   |  Aguardando conexao   [Excluir]    |
+------------------------------------------------+
```

---

## Novo Codigo para o Estado Pending

```typescript
{connectionState === "pending" && instanceData && (
  <GlassCard className="p-4 sm:p-6">
    <div className="flex items-center justify-between gap-4">
      {/* Left: Icon + Info */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-6 h-6 text-amber-500" />
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">
              {instanceData.company_name}
            </h3>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
              Aguardando Conexao
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
          className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white"
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
          {/* ... AlertDialog content permanece igual ... */}
        </AlertDialog>
      </div>
    </div>
  </GlassCard>
)}
```

---

## Mudancas Principais

| Aspecto | Antes | Depois |
|---------|-------|--------|
| Layout | Vertical centralizado | Horizontal flexbox |
| Padding | `py-12 px-8` | `p-4 sm:p-6` |
| Icone | `w-20 h-20` | `w-12 h-12` |
| Badge | Separado em linha propria | Inline com titulo |
| Texto | Paragrafo longo | Uma linha curta |
| Botao Excluir | Botao com texto | Icone apenas |
| Altura Total | ~300px | ~80px |

---

## Responsividade

Em telas pequenas (mobile):
- O layout continuara horizontal mas os botoes podem empilhar se necessario
- Usa `gap-4` para espacamento adequado
- `flex-shrink-0` nos elementos que nao devem encolher

---

## Arquivo a Modificar

| Arquivo | Linhas | Acao |
|---------|--------|------|
| `src/pages/Integration.tsx` | 415-478 | Substituir bloco do estado pending |

