

# Plano: Redesign do Dashboard "High-Tech"

## Visao Geral

Vamos recriar completamente a pagina inicial (`/`) com foco em visual futurista, glassmorphism premium e efeitos de iluminacao sofisticados. O design sera inspirado em paineis de controle de nivel empresarial.

---

## Estrutura de Componentes

```text
src/
  pages/
    Index.tsx              -- Dashboard principal (reescrito)
  components/
    dashboard/
      DashboardHeader.tsx  -- Novo cabecalho com saudacao e data
      KPICard.tsx          -- Card de KPI individual estilizado
      KPIGrid.tsx          -- Grid de 4 KPIs com carrossel mobile
      ActivityChart.tsx    -- Grafico de linha dark mode
      RecentContacts.tsx   -- Lista de contatos recentes
```

---

## 1. Cabecalho do Dashboard

**Arquivo**: `src/components/dashboard/DashboardHeader.tsx`

**Elementos**:
- Saudacao dinamica: "Ola, [Nome da Empresa]" em `text-3xl font-light text-white`
- Data atual formatada em portugues (ex: "Quarta-feira, 29 de Janeiro de 2025") em `text-slate-400`
- Botao "Novo Agendamento" com gradiente indigo-to-violet e icone Plus brilhante

**Integracao**:
- Buscar dados do perfil do usuario via Supabase (`profiles.company_name`)
- Usar `date-fns` para formatacao de data em pt-BR

---

## 2. Grid de KPIs (O Fator Uau)

**Arquivo**: `src/components/dashboard/KPICard.tsx`

**Estilo do Card**:
```text
bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6
hover:bg-white/[0.07] transition-all duration-300
```

**Estrutura Interna**:
- **Icone**: Container circular com fundo transparente colorido (ex: `bg-indigo-500/20`) e icone na cor neon
- **Titulo**: `text-slate-400 text-sm font-medium uppercase tracking-wider`
- **Numero Grande**: `text-3xl md:text-4xl font-bold text-white` com possivel gradiente
- **Badge de Variacao**: Badge pequeno verde neon (`bg-emerald-500/20 text-emerald-400`) ou vermelho neon para crescimento negativo

**Dados Fake**:
| KPI | Valor | Variacao |
|-----|-------|----------|
| Mensagens | 12.847 | +12% |
| Leads Capturados | 2.350 | +8% |
| Automacoes Ativas | 18 | +3 |
| Taxa de Resposta | 94.2% | -0.8% |

**Arquivo**: `src/components/dashboard/KPIGrid.tsx`

**Responsividade**:
- **Desktop**: Grid de 4 colunas (`grid-cols-4 gap-4`)
- **Mobile**: Scroll horizontal com `overflow-x-auto` e cards com `min-w-[260px]` ou grid de 2 colunas (`grid-cols-2`)

---

## 3. Grafico de Atividade (Activity Chart)

**Arquivo**: `src/components/dashboard/ActivityChart.tsx`

**Container**: Card glass largo ocupando a largura total ou 2/3 da tela

**Configuracao Recharts (Dark Mode)**:
- **Grid Lines**: `stroke="hsl(217, 33%, 12%)"` - quase invisiveis
- **Linha do Grafico**: Gradiente Ciano Neon (`hsl(188, 94%, 43%)`) para Roxo (`hsl(270, 91%, 60%)`)
- **Area Preenchida**: Gradiente com opacidade de 0.3 no topo para 0 na base
- **Tooltip**: Fundo escuro (`bg-slate-900/95`) com borda sutil (`border-white/10`)
- **Eixos**: `stroke="hsl(215, 20%, 45%)"` com fonte pequena

**Dados**: 7 dias da semana com valores de atividade

---

## 4. Lista de Contatos Recentes

**Arquivo**: `src/components/dashboard/RecentContacts.tsx`

**Container**: Card glass ocupando 1/3 da tela (ao lado do grafico em desktop)

**Estrutura do Item**:
```text
[Avatar] Nome do Contato         [Badge Status]
         Ultima mensagem...      
--------------------------------------------- (border-white/5)
```

**Avatar**: Circulo com iniciais ou foto, fundo gradiente se nao houver foto

**Badges de Status**:
- "Agendado": `bg-emerald-500/20 text-emerald-400 border-emerald-500/30`
- "Pendente": `bg-amber-500/20 text-amber-400 border-amber-500/30`
- "Concluido": `bg-slate-500/20 text-slate-400 border-slate-500/30`

**Dados Fake**: 5 contatos com nomes e status variados

---

## 5. Pagina Principal Atualizada

**Arquivo**: `src/pages/Index.tsx`

**Layout Desktop**:
```text
+--------------------------------------------------+
| DashboardHeader (Saudacao + Data + Botao)        |
+--------------------------------------------------+
| KPI 1    | KPI 2    | KPI 3    | KPI 4           |
+--------------------------------------------------+
| ActivityChart (2/3)     | RecentContacts (1/3)  |
+--------------------------------------------------+
```

**Layout Mobile**:
```text
+---------------------------+
| DashboardHeader           |
+---------------------------+
| <- KPIs em scroll ->      |
+---------------------------+
| ActivityChart             |
+---------------------------+
| RecentContacts            |
+---------------------------+
```

---

## Detalhes Tecnicos

### Dependencias Utilizadas
- `date-fns`: Para formatacao de data em portugues (ja instalado)
- `recharts`: Para grafico de linha (ja instalado)
- `lucide-react`: Icones (ja instalado)
- `@supabase/supabase-js`: Para buscar dados do perfil (ja configurado)

### Efeitos Visuais Especiais
1. **Glow sutil nos icones** ao hover
2. **Transicoes suaves** (300ms) em todos os cards
3. **Gradientes de texto** nos numeros grandes
4. **Sombras neon** sutis nos elementos interativos
5. **Blur de fundo** nos cards glass (`backdrop-blur-xl`)

### Cores Principais
```text
Fundo Card: bg-white/5
Borda Card: border-white/10
Texto Principal: text-white
Texto Secundario: text-slate-400
Neon Azul: hsl(217, 91%, 60%)
Neon Ciano: hsl(188, 94%, 43%)
Verde Positivo: text-emerald-400
Vermelho Negativo: text-rose-400
```

---

## Arquivos a Criar
1. `src/components/dashboard/DashboardHeader.tsx`
2. `src/components/dashboard/KPICard.tsx`
3. `src/components/dashboard/KPIGrid.tsx`
4. `src/components/dashboard/ActivityChart.tsx`
5. `src/components/dashboard/RecentContacts.tsx`

## Arquivos a Modificar
1. `src/pages/Index.tsx` - Reescrever com nova estrutura

## Arquivos a Remover/Substituir
- Os componentes `QuickStats.tsx` e `RecentActivity.tsx` serao substituidos pelos novos

---

## Resultado Esperado

Um dashboard premium com visual futurista que transmite profissionalismo e tecnologia avancada. Cada elemento tera atencao aos detalhes de iluminacao, espacamento e hierarquia visual, criando uma experiencia de usuario de nivel SaaS empresarial.

