

# Plano: Configuracao de Horarios por Medico

## Contexto

Atualmente, as configuracoes de dias de trabalho, horarios e bloqueios estao no nivel da clinica (tabela `instances.schedule_config`). Porem, cada medico pode ter sua propria agenda, trabalhando em dias e horarios diferentes.

## Mudancas Propostas

### 1. Migrar Banco de Dados

Adicionar uma coluna `schedule_config` na tabela `doctors` para armazenar as configuracoes individuais de cada profissional:

```sql
ALTER TABLE public.doctors 
ADD COLUMN schedule_config JSONB DEFAULT '{
  "work_days": [1, 2, 3, 4, 5],
  "hours": {
    "open": "08:00",
    "close": "18:00",
    "lunch_start": "12:00",
    "lunch_end": "13:00"
  },
  "blocked_dates": []
}'::jsonb;
```

### 2. Estrutura do JSON por Medico

```json
{
  "work_days": [1, 2, 3, 4, 5],
  "hours": {
    "open": "08:00",
    "close": "18:00",
    "lunch_start": "12:00",
    "lunch_end": "13:00"
  },
  "blocked_dates": [
    { "date": "2025-02-15", "reason": "Ferias" },
    { "date": "2025-03-01", "reason": "Congresso" }
  ]
}
```

### 3. Atualizar Dialog de Medico

Expandir o `DoctorDialog` para incluir as configuracoes de agenda do profissional:

```text
+--------------------------------------------------+
|  Adicionar Profissional                     [X]  |
+--------------------------------------------------+
|  [Dados Basicos]  [Horarios]  [Bloqueios]        |
+--------------------------------------------------+
|                                                  |
|  Tab "Dados Basicos":                            |
|  - Nome, Especialidade, Cor, Duracao             |
|                                                  |
|  Tab "Horarios":                                 |
|  - Dias de Trabalho: [Seg] [Ter] [Qua] ...       |
|  - Abertura: [08:00]  Fechamento: [18:00]        |
|  - Almoco: [12:00] - [13:00]                     |
|                                                  |
|  Tab "Bloqueios":                                |
|  - Lista de datas bloqueadas para este medico   |
|  - [+ Adicionar Bloqueio]                        |
|                                                  |
+--------------------------------------------------+
```

### 4. Simplificar Configuracoes da Clinica

Remover as configuracoes de "Horario de Funcionamento" e "Bloqueio de Agenda" da pagina `/settings`, deixando apenas:

- Dados da Clinica (nome, responsavel, telefone)
- Regras de Agendamento (duracao padrao, intervalo entre consultas, antecedencia minima)
- Integracoes

As configuracoes de horario agora vivem no cadastro de cada medico.

### 5. Atualizar Hooks

Modificar `useDoctors.ts` para incluir o novo campo:

```typescript
export interface DoctorScheduleConfig {
  work_days: number[];
  hours: {
    open: string;
    close: string;
    lunch_start: string;
    lunch_end: string;
  };
  blocked_dates: { date: string; reason: string }[];
}

export interface Doctor {
  // ... campos existentes
  schedule_config: DoctorScheduleConfig;
}

export interface DoctorInput {
  // ... campos existentes
  schedule_config?: DoctorScheduleConfig;
}
```

### 6. Validacao na Agenda

Ao criar um novo agendamento no `NewAppointmentDialog`, validar:

1. Se a data selecionada e um dia de trabalho do medico escolhido
2. Se o horario esta dentro do expediente do medico
3. Se a data nao esta na lista de bloqueios do medico

---

## Arquivos a Modificar

| Arquivo | Mudanca |
|---------|---------|
| `supabase/migrations/...` | Adicionar coluna `schedule_config` na tabela `doctors` |
| `src/integrations/supabase/types.ts` | Atualizar tipos com novo campo |
| `src/hooks/useDoctors.ts` | Adicionar interface `DoctorScheduleConfig` e atualizar tipos |
| `src/components/doctors/DoctorDialog.tsx` | Adicionar tabs com configuracoes de horarios e bloqueios |
| `src/components/settings/ClinicSettings.tsx` | Remover secoes de horario e bloqueio (manter apenas dados da clinica e regras gerais) |
| `src/components/schedule/NewAppointmentDialog.tsx` | Adicionar validacao de disponibilidade do medico |

---

## Resumo Visual da Nova Estrutura

```text
Configuracoes da Clinica (/settings)
  - Dados da Clinica (nome, telefone)
  - Regras Gerais (duracao padrao, buffer, antecedencia)
  - Integracoes

Profissionais (/doctors)
  - Card do Dr. Pedro
      - Dados: Nome, Especialidade, Cor
      - Horarios: Seg-Sex, 08:00-18:00
      - Bloqueios: 15/02 (Ferias), 01/03 (Congresso)
  
  - Card da Dra. Ana
      - Dados: Nome, Especialidade, Cor
      - Horarios: Ter-Qui, 14:00-20:00
      - Bloqueios: 20/02 (Curso)
```

---

## Secao Tecnica

### Migracao SQL Completa

```sql
-- Adicionar coluna schedule_config aos doctors
ALTER TABLE public.doctors 
ADD COLUMN IF NOT EXISTS schedule_config JSONB 
DEFAULT '{
  "work_days": [1, 2, 3, 4, 5],
  "hours": {
    "open": "08:00",
    "close": "18:00",
    "lunch_start": "12:00",
    "lunch_end": "13:00"
  },
  "blocked_dates": []
}'::jsonb;
```

### Logica de Validacao no Dialog de Agendamento

```typescript
// Validar se a data e horario estao disponiveis para o medico
const validateDoctorAvailability = (doctor: Doctor, date: Date, time: string) => {
  const config = doctor.schedule_config;
  const dayOfWeek = date.getDay(); // 0 = domingo
  
  // 1. Verificar dia de trabalho
  if (!config.work_days.includes(dayOfWeek)) {
    return { valid: false, message: "Medico nao atende neste dia" };
  }
  
  // 2. Verificar horario
  if (time < config.hours.open || time >= config.hours.close) {
    return { valid: false, message: "Horario fora do expediente" };
  }
  
  // 3. Verificar almoco
  if (time >= config.hours.lunch_start && time < config.hours.lunch_end) {
    return { valid: false, message: "Horario de almoco" };
  }
  
  // 4. Verificar bloqueios
  const dateStr = format(date, "yyyy-MM-dd");
  const blocked = config.blocked_dates.find(b => b.date === dateStr);
  if (blocked) {
    return { valid: false, message: `Bloqueado: ${blocked.reason}` };
  }
  
  return { valid: true };
};
```

### Ordem de Implementacao

1. Criar migracao SQL para adicionar `schedule_config` na tabela `doctors`
2. Atualizar `types.ts` com o novo campo
3. Atualizar `useDoctors.ts` com a interface de configuracao
4. Expandir `DoctorDialog.tsx` com tabs para horarios e bloqueios
5. Simplificar `ClinicSettings.tsx` removendo configuracoes que agora sao por medico
6. Adicionar validacao no `NewAppointmentDialog.tsx`
7. Testar fluxo completo

