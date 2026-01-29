

## 🚀 InoovaZap - Frontend Premium Dark Glass

### Visão Geral
Criar uma aplicação híbrida (Desktop + Mobile PWA) com visual premium, futurista e tecnológico usando glassmorphism, gradientes profundos e efeitos neon.

---

### 📐 Fase 1: Design System Foundation

**Configuração do Tema Dark Premium**
- Atualizar CSS com variáveis de gradientes escuros (gray-900 → slate-900 → indigo-950)
- Adicionar fonte Inter como padrão
- Criar classes utilitárias para glassmorphism (`glass-card`, `glass-sidebar`, `glass-bottomnav`)
- Definir cores de destaque neon (azul elétrico → ciano)
- Adicionar animações de glow e hover suaves

**Componentes Base Customizados**
- `GlassCard` - Container com efeito vidro fosco
- `NeonButton` - Botão gradiente com glow no hover
- `NeonText` - Texto com efeito brilhante para marca

---

### 🖥️ Fase 2: Layout Híbrido Responsivo

**LayoutWrapper Inteligente**
- Detecta automaticamente se é desktop ou mobile
- Gerencia rotas e navegação

**Desktop (≥768px)**
- Sidebar lateral fixa à esquerda com efeito glass
- Logo "InoovaZap" com texto neon/glow no topo
- 4 itens de menu: Dashboard, WhatsApp, Automações, Perfil
- Ícones brilhantes com indicador de item ativo
- Área de conteúdo principal com padding adequado

**Mobile (<768px)**
- Header limpo e minimalista
- Logo compacto no topo
- Bottom Navigation Bar fixa com efeito glass
- 4 ícones principais com labels
- Transições suaves entre páginas

---

### 📱 Fase 3: Configuração PWA

**Instalação e Configuração**
- Instalar `vite-plugin-pwa`
- Configurar manifest.json com cores e ícones do tema
- Adicionar meta tags mobile-optimized
- Criar página `/install` para prompt de instalação
- Configurar service worker para funcionamento offline

---

### 📊 Fase 4: Página Dashboard (Validação Visual)

**Estrutura Inicial**
- Título "Visão Geral" com tipografia premium
- Subtítulo em cinza azulado (slate-400)
- Grid de cards glass vazios para demonstrar o efeito
- Card de boas-vindas com ícone animado

---

### 🎨 Resultado Visual Esperado

| Elemento | Estilo |
|----------|--------|
| Fundo | Gradiente profundo indigo/slate |
| Cards | Vidro fosco com borda sutil branca |
| Sidebar | Glass escuro com blur forte |
| Botões | Gradiente azul→ciano com glow |
| Textos | Branco (slate-100) / Cinza (slate-400) |
| Navegação | Ícones Lucide com brilho ativo |

