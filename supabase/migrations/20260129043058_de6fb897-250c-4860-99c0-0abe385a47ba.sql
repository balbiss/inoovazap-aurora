-- Adicionar coluna schedule_config aos doctors para configurações individuais de agenda
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