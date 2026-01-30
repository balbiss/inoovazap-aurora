-- Add rescheduled_from column to track when a patient changes their appointment time
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS rescheduled_from TIMESTAMPTZ;

-- Update the RPC to record the previous start_time
CREATE OR REPLACE FUNCTION public.patient_update_appointment(
  p_id uuid,
  p_action text,
  p_new_start timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_duration interval;
  v_old_start timestamptz;
BEGIN
  IF p_action = 'confirm' THEN
    UPDATE appointments 
    SET status = 'confirmed', updated_at = now()
    WHERE id = p_id;
  
  ELSIF p_action = 'reschedule' AND p_new_start IS NOT NULL THEN
    -- Get current start_time and duration
    SELECT start_time, (end_time - start_time) INTO v_old_start, v_duration
    FROM appointments WHERE id = p_id;

    UPDATE appointments 
    SET 
      rescheduled_from = v_old_start,
      start_time = p_new_start,
      end_time = p_new_start + v_duration,
      status = 'scheduled',
      updated_at = now()
    WHERE id = p_id;
  END IF;
END;
$$;
