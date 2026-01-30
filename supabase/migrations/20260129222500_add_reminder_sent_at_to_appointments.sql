-- Add reminder_sent_at column to appointments table
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- Add index for performance on reminder checks
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_sent_at ON public.appointments(reminder_sent_at) WHERE reminder_sent_at IS NULL;
