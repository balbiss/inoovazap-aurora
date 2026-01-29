

# Plano: Redesign da Sidebar InoovaSaúde

## Objetivo
Transformar a sidebar branca atual em uma sidebar com fundo verde teal forte, criando uma "moldura" profissional que dá mais personalidade à marca InoovaSaúde.

## Mudanças Visuais

### Antes vs Depois

| Elemento | Antes (Branco) | Depois (Verde Teal) |
|----------|----------------|---------------------|
| Fundo | `bg-white` | `bg-teal-700` |
| Texto menu | `text-slate-600` | `text-white/80` |
| Ícones | `text-slate-500` | `text-white/70` |
| Item ativo | `bg-teal-50 text-teal-700` | `bg-white/10` com borda esquerda branca |
| Logo texto | `text-slate-800` | `text-white` |
| Logo ícone | `bg-teal-600` | `bg-white/20` com ícone branco |
| Bordas | `border-slate-200` | `border-white/10` |
| Botão Sair | `text-slate-600` | `text-white/70` hover `text-rose-300` |

### Resultado Visual Esperado

```text
+------------------------+     +--------------------------------+
|  ♥ InoovaSaúde        |     |                                |
|     Gestão de Clínicas |     |   Área de Conteúdo             |
+------------------------+     |   (bg-slate-50)                |
|  ┃ ▢ Visão Geral      |     |                                |
|    📅 Agenda           |     |   Dashboard / Agenda /         |
|    🩺 Profissionais    |     |   Pacientes / etc              |
|    👥 Pacientes        |     |                                |
|    ⚙ Configurações    |     |   Fundo claro para             |
+------------------------+     |   legibilidade máxima          |
|  ↪ Sair               |     |                                |
+------------------------+     +--------------------------------+
      bg-teal-700                     bg-slate-50
```

## Arquivos a Modificar

### 1. `src/index.css`
- Atualizar classe `.clean-sidebar` de `bg-white` para `bg-teal-700`
- Atualizar classe `.nav-active` para usar `bg-white/10` com borda branca
- Atualizar variáveis CSS de sidebar para refletir novo tema escuro

### 2. `src/components/layout/Sidebar.tsx`
- Logo: Mudar fundo do ícone para `bg-white/20`, texto para `text-white`
- Navegação: Ícones e textos em branco/branco translúcido
- Item ativo: Fundo translúcido com indicador lateral branco
- Botão Sair: Branco translúcido com hover em rose claro
- Footer: Texto em `text-white/50`

### 3. `src/components/layout/MobileHeader.tsx`
- Aplicar mesmo estilo teal no header mobile para consistência
- Fundo `bg-teal-700`, texto e ícone em branco

### 4. `src/components/layout/BottomNav.tsx`
- Manter branco (fica na parte inferior, não faz parte da "moldura")
- Apenas ajustar cores de destaque para combinar

---

## Detalhes Técnicos

### Sidebar.tsx - Novas Classes

```tsx
// Aside container
<aside className="sidebar-branded fixed left-0 top-0 h-screen w-64 flex flex-col z-50">

// Logo área
<div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
    <Heart className="w-6 h-6 text-white" />
  </div>
  <div>
    <h1 className="text-lg font-bold text-white">InoovaSaúde</h1>
    <p className="text-xs text-white/60">Gestão de Clínicas</p>
  </div>
</div>

// Item de navegação
<NavLink className={cn(
  "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200",
  "text-white/80 hover:text-white hover:bg-white/10",
  isActive && "sidebar-active bg-white/15 text-white"
)}>
  <Icon className={cn(
    "w-5 h-5 transition-colors",
    isActive ? "text-white" : "text-white/70"
  )} />
</NavLink>

// Botão Sair
<button className="text-white/70 hover:text-rose-300 hover:bg-white/10">

// Footer
<p className="text-xs text-white/40">© 2025 InoovaSaúde</p>
```

### index.css - Nova Classe `.sidebar-branded`

```css
.sidebar-branded {
  @apply bg-teal-700;
}

.sidebar-active {
  @apply relative;
}

.sidebar-active::before {
  content: '';
  @apply absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-white;
}
```

### Variáveis CSS Atualizadas

```css
/* Sidebar com tema escuro */
--sidebar-background: 175 43% 35%; /* teal-700 */
--sidebar-foreground: 0 0% 100%;
--sidebar-primary: 0 0% 100%;
--sidebar-primary-foreground: 175 43% 35%;
--sidebar-accent: 0 0% 100% / 0.1;
--sidebar-accent-foreground: 0 0% 100%;
--sidebar-border: 0 0% 100% / 0.1;
```

## Área de Conteúdo
A área principal (Dashboard, Agenda, etc.) permanece com `bg-slate-50` conforme solicitado, criando o contraste desejado entre a "moldura" verde e o conteúdo limpo.

## Ordem de Implementação

1. Atualizar `src/index.css` com novas classes e variáveis
2. Refatorar `src/components/layout/Sidebar.tsx` com novo esquema de cores
3. Atualizar `src/components/layout/MobileHeader.tsx` para consistência
4. Testar contraste e legibilidade em todas as telas

