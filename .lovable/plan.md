

# Plano: Transformacao em Sistema de Gestao de Clinicas (Medical SaaS)

## Visao Geral do Projeto

Transformar a aplicacao atual de WhatsApp Marketing em um **Sistema de Gestao de Clinicas** completo, mantendo o Design System futurista Dark Mode com Glassmorphism e cores neon.

---

## Fase 1: Estrutura do Banco de Dados

### 1.1 Criar Tabela `doctors` (Profissionais)

```sql
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  avatar_url TEXT,
  color TEXT DEFAULT '#06b6d4',  -- Cor na agenda (hex)
  default_duration INTEGER DEFAULT 30,  -- Duracao padrao em minutos
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- RLS Policy
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinica ve apenas seus medicos" ON public.doctors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM instances i 
      WHERE i.id = doctors.instance_id 
      AND i.user_id = auth.uid()
    )
  );
```

### 1.2 Criar Tabela `appointments` (Agendamentos)

```sql
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- RLS Policy
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinica ve apenas seus agendamentos" ON public.appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM instances i 
      WHERE i.id = appointments.instance_id 
      AND i.user_id = auth.uid()
    )
  );
```

### 1.3 Atualizar Tabela `contacts` (Pacientes)

Adicionar campos uteis para contexto medico:

```sql
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS health_insurance TEXT;
```

---

## Fase 2: Nova Estrutura de Navegacao

### 2.1 Atualizar Sidebar e BottomNav

| Rota Atual | Nova Rota | Icone | Label |
|------------|-----------|-------|-------|
| `/` | `/` | LayoutDashboard | Visao Geral |
| `/whatsapp` | `/schedule` | Calendar | Agenda |
| `/automacoes` | `/doctors` | Stethoscope | Profissionais |
| `/brain` | `/patients` | Users | Pacientes |
| `/integration` | `/integration` | Plug | Integracao |
| `/perfil` | `/settings` | Settings | Configuracoes |

### 2.2 Codigo da Navegacao Atualizada

```typescript
const navItems = [
  { icon: LayoutDashboard, label: "Visao Geral", path: "/" },
  { icon: Calendar, label: "Agenda", path: "/schedule" },
  { icon: Stethoscope, label: "Profissionais", path: "/doctors" },
  { icon: Users, label: "Pacientes", path: "/patients" },
  { icon: Settings, label: "Configuracoes", path: "/settings" },
];
```

---

## Fase 3: Pagina Dashboard (/) - Visao Geral do Dia

### 3.1 Novos KPIs Medicos

```text
+----------------+  +----------------+  +----------------+  +----------------+
| Pacientes Hoje |  |  Confirmados   |  |    Faltas      |  | Novos Cadastros|
|      12        |  |      8         |  |      2         |  |       4        |
|  +3 vs ontem   |  |   67% taxa     |  |  -1 vs ontem   |  |  +2 esta semana|
+----------------+  +----------------+  +----------------+  +----------------+
```

- **Pacientes Hoje**: Total de agendamentos do dia
- **Confirmados**: Status = confirmed (badge verde)
- **Faltas**: Status = no_show (badge vermelho)
- **Novos Cadastros**: Pacientes criados esta semana

### 3.2 Timeline do Dia (Componente Novo)

Lista vertical cronologica dos proximos pacientes:

```text
+------------------------------------------------------------------------+
| Timeline de Hoje                                           Ver Agenda > |
+------------------------------------------------------------------------+
|  08:00  |  Maria Silva         |  Dr. Pedro Santos  |   Confirmado     |
|  08:30  |  Joao Costa          |  Dra. Ana Lima     |   Aguardando     |
|  09:00  |  Carlos Oliveira     |  Dr. Pedro Santos  |   Agendado       |
|  09:30  |  [Horario Livre]     |                    |                  |
|  10:00  |  Fernanda Mendes     |  Dra. Ana Lima     |   Confirmado     |
+------------------------------------------------------------------------+
```

### 3.3 Estrutura de Componentes

```text
src/pages/Index.tsx (Dashboard)
  - DashboardHeader (Nome da clinica + Data + Botao Novo Agendamento)
  - MedicalKPIGrid
      - MedicalKPICard (4 cards)
  - DayTimeline
      - TimelineItem
  - QuickActions (opcional)
```

---

## Fase 4: Pagina Agenda (/schedule) - O Coracao do Sistema

### 4.1 Layout Principal

```text
+------------------------------------------------------------------------+
|  Agenda da Clinica                                      + Novo Agendamento |
+------------------------------------------------------------------------+
|  [< Anterior]  Segunda, 27 de Janeiro 2025  [Proximo >]                |
|  Filtrar: [Todos os Profissionais v]                                   |
+------------------------------------------------------------------------+
|                                                                        |
|   07:00 |                    |                    |                    |
|   08:00 |  [Maria Silva]     |                    |  [Carlos Rocha]    |
|         |   Dr. Pedro        |                    |   Dra. Ana         |
|   08:30 |                    |  [Joao Santos]     |                    |
|         |                    |   Dr. Pedro        |                    |
|   09:00 |  [Ana Costa]       |                    |                    |
|         |   Dra. Ana         |                    |                    |
|                                                                        |
+------------------------------------------------------------------------+
```

### 4.2 Componentes da Agenda

```text
src/pages/Schedule.tsx
  - ScheduleHeader
      - DateNavigator (< anterior | data | proximo >)
      - DoctorFilter (Select com profissionais)
  - ScheduleGrid
      - TimeColumn (07:00, 08:00, 09:00...)
      - AppointmentCard (bloco colorido com nome paciente + status)
  - NewAppointmentDialog
      - DoctorSelect
      - PatientAutocomplete (busca da tabela contacts)
      - DateTimePicker
      - StatusSelect
```

### 4.3 Cards de Agendamento

Estilos por status:
- **Agendado**: Borda azul ciano, fundo translucido
- **Confirmado**: Borda verde esmeralda, badge verde
- **Concluido**: Borda cinza, texto desbotado
- **Cancelado**: Borda vermelha, texto tachado
- **Falta (no_show)**: Fundo vermelho suave

### 4.4 Dialog de Novo Agendamento

```text
+--------------------------------------------------+
|  Novo Agendamento                           [X]  |
+--------------------------------------------------+
|                                                  |
|  Profissional *                                  |
|  [Dr. Pedro Santos           v]                  |
|                                                  |
|  Paciente *                                      |
|  [Buscar paciente...         ] + Cadastrar Novo  |
|                                                  |
|  Data *              Horario Inicio *            |
|  [27/01/2025]       [09:00      v]               |
|                                                  |
|  Duracao             Horario Fim                 |
|  [30 min   v]       [09:30 (auto)]               |
|                                                  |
|  Status                                          |
|  [Agendado  v]                                   |
|                                                  |
|  Observacoes                                     |
|  [                                          ]    |
|                                                  |
|  [Cancelar]                     [Agendar]        |
+--------------------------------------------------+
```

---

## Fase 5: Pagina Profissionais (/doctors)

### 5.1 Layout Grid de Cards

```text
+------------------------------------------------------------------------+
|  Profissionais                                        + Adicionar Medico |
+------------------------------------------------------------------------+
|                                                                        |
|  +-------------------+  +-------------------+  +-------------------+    |
|  |     [Avatar]      |  |     [Avatar]      |  |     [Avatar]      |    |
|  |   Dr. Pedro       |  |   Dra. Ana        |  |   Dr. Carlos      |    |
|  |   Cardiologia     |  |   Dermatologia    |  |   Ortopedia       |    |
|  |   [Ativo]         |  |   [Ativo]         |  |   [Inativo]       |    |
|  |   [Editar] [X]    |  |   [Editar] [X]    |  |   [Editar] [X]    |    |
|  +-------------------+  +-------------------+  +-------------------+    |
|                                                                        |
+------------------------------------------------------------------------+
```

### 5.2 Dialog de Adicionar/Editar Medico

```text
+--------------------------------------------------+
|  Adicionar Profissional                     [X]  |
+--------------------------------------------------+
|                                                  |
|  Nome Completo *                                 |
|  [Dr. Pedro Santos                          ]    |
|                                                  |
|  Especialidade *                                 |
|  [Cardiologia                               ]    |
|                                                  |
|  Cor na Agenda                                   |
|  [ #06b6d4 ] [Ciano] [Verde] [Violeta] [Rosa]    |
|                                                  |
|  Duracao Padrao da Consulta                      |
|  [30 minutos  v]                                 |
|                                                  |
|  [Cancelar]                     [Salvar]         |
+--------------------------------------------------+
```

---

## Fase 6: Pagina Pacientes (/patients)

### 6.1 Lista de Pacientes com Busca

Reutilizar e expandir a tabela `contacts` existente:

```text
+------------------------------------------------------------------------+
|  Pacientes                                         + Adicionar Paciente |
+------------------------------------------------------------------------+
|  [Buscar por nome, telefone ou email...]                               |
+------------------------------------------------------------------------+
|  Nome              | Telefone       | Email            | Ultima Visita |
|  Maria Silva       | (11) 99999-1234| maria@email.com  | 20/01/2025    |
|  Joao Santos       | (11) 99999-5678| joao@email.com   | 18/01/2025    |
|  Ana Costa         | (11) 99999-9012| ana@email.com    | 15/01/2025    |
+------------------------------------------------------------------------+
```

### 6.2 Dialog de Paciente

```text
+--------------------------------------------------+
|  Novo Paciente                              [X]  |
+--------------------------------------------------+
|  Nome Completo *                                 |
|  [                                          ]    |
|                                                  |
|  Telefone *                                      |
|  [(11) 99999-0000                           ]    |
|                                                  |
|  Email                                           |
|  [                                          ]    |
|                                                  |
|  Data de Nascimento                              |
|  [dd/mm/aaaa]                                    |
|                                                  |
|  Convenio                                        |
|  [                                          ]    |
|                                                  |
|  Observacoes                                     |
|  [                                          ]    |
|                                                  |
|  [Cancelar]                     [Salvar]         |
+--------------------------------------------------+
```

---

## Fase 7: Pagina Configuracoes (/settings)

Unificar Perfil + Integracao:

```text
+------------------------------------------------------------------------+
|  Configuracoes                                                          |
+------------------------------------------------------------------------+
|  [Clinica]  [Integracao WhatsApp]  [Horarios]                          |
+------------------------------------------------------------------------+
|                                                                        |
|  Tab Clinica:                                                          |
|  - Nome da Clinica                                                     |
|  - Endereco                                                            |
|  - Telefone                                                            |
|                                                                        |
|  Tab Integracao:                                                       |
|  - (Mover conteudo atual da pagina Integration)                        |
|                                                                        |
|  Tab Horarios:                                                         |
|  - Horario de funcionamento por dia da semana                          |
|  - Intervalo minimo entre consultas                                    |
+------------------------------------------------------------------------+
```

---

## Resumo de Arquivos

### Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/Schedule.tsx` | Pagina principal da Agenda |
| `src/pages/Doctors.tsx` | Gestao de Profissionais |
| `src/pages/Patients.tsx` | Gestao de Pacientes |
| `src/pages/Settings.tsx` | Configuracoes unificadas |
| `src/components/schedule/ScheduleGrid.tsx` | Grade visual do calendario |
| `src/components/schedule/AppointmentCard.tsx` | Card de agendamento |
| `src/components/schedule/NewAppointmentDialog.tsx` | Modal de criacao |
| `src/components/schedule/DateNavigator.tsx` | Navegacao de datas |
| `src/components/schedule/DoctorFilter.tsx` | Filtro de profissionais |
| `src/components/doctors/DoctorCard.tsx` | Card de medico |
| `src/components/doctors/DoctorDialog.tsx` | Modal de criacao/edicao |
| `src/components/patients/PatientTable.tsx` | Tabela de pacientes |
| `src/components/patients/PatientDialog.tsx` | Modal de criacao |
| `src/components/dashboard/MedicalKPIGrid.tsx` | KPIs medicos |
| `src/components/dashboard/DayTimeline.tsx` | Timeline do dia |
| `src/hooks/useDoctors.ts` | Hook para buscar medicos |
| `src/hooks/useAppointments.ts` | Hook para buscar agendamentos |
| `src/hooks/usePatients.ts` | Hook para buscar pacientes |

### Arquivos a Modificar

| Arquivo | Modificacao |
|---------|-------------|
| `src/App.tsx` | Atualizar rotas |
| `src/components/layout/Sidebar.tsx` | Novos itens de menu |
| `src/components/layout/BottomNav.tsx` | Novos itens de menu |
| `src/pages/Index.tsx` | Refazer Dashboard medico |

### Arquivos a Remover (ou Reutilizar)

| Arquivo | Acao |
|---------|------|
| `src/pages/WhatsApp.tsx` | Remover (substituido por Schedule) |
| `src/pages/Automacoes.tsx` | Remover (substituido por Doctors) |
| `src/pages/Brain.tsx` | Remover (substituido por Patients) |
| `src/pages/Perfil.tsx` | Mover conteudo para Settings |
| `src/pages/Integration.tsx` | Mover conteudo para Settings |

---

## Cores Semanticas do Design System

| Status | Cor | CSS Classes |
|--------|-----|-------------|
| Confirmado/Sucesso | Verde Esmeralda | `bg-emerald-500/20 text-emerald-400 border-emerald-500/30` |
| Pendente/Atencao | Ambar | `bg-amber-500/20 text-amber-400 border-amber-500/30` |
| Cancelado/Falta | Rose | `bg-rose-500/20 text-rose-400 border-rose-500/30` |
| Medico/Agenda | Ciano | `bg-cyan-500/20 text-cyan-400 border-cyan-500/30` |
| Neutro/Concluido | Slate | `bg-slate-500/20 text-slate-400 border-slate-500/30` |

---

## Ordem de Implementacao

1. **Migracoes SQL** - Criar tabelas doctors e appointments
2. **Navegacao** - Atualizar Sidebar e BottomNav
3. **Rotas** - Atualizar App.tsx com novas rotas
4. **Hooks** - Criar useDoctors, useAppointments, usePatients
5. **Dashboard** - Refazer Index.tsx com KPIs medicos
6. **Profissionais** - Pagina /doctors completa
7. **Pacientes** - Pagina /patients completa
8. **Agenda** - Pagina /schedule (mais complexa, por ultimo)
9. **Configuracoes** - Unificar settings

