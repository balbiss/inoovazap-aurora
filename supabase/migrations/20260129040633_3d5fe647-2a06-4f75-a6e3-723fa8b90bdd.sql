-- =============================================
-- FASE 1: Estrutura do Banco de Dados Médico
-- =============================================

-- 1.1 Criar tabela doctors (Profissionais)
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  avatar_url TEXT,
  color TEXT DEFAULT '#06b6d4',
  default_duration INTEGER DEFAULT 30,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- RLS Policy para doctors
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinica ve apenas seus medicos" ON public.doctors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM instances i 
      WHERE i.id = doctors.instance_id 
      AND i.user_id = auth.uid()
    )
  );

-- 1.2 Criar tabela appointments (Agendamentos)
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Trigger para validar status
CREATE OR REPLACE FUNCTION public.validate_appointment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_appointment_status_trigger
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_appointment_status();

-- RLS Policy para appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinica ve apenas seus agendamentos" ON public.appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM instances i 
      WHERE i.id = appointments.instance_id 
      AND i.user_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at em appointments
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 1.3 Adicionar campos médicos à tabela contacts (pacientes)
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS health_insurance TEXT;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_doctors_instance_id ON public.doctors(instance_id);
CREATE INDEX IF NOT EXISTS idx_appointments_instance_id ON public.appointments(instance_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);