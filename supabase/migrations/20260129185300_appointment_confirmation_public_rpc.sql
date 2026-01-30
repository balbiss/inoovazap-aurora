-- Function to fetch appointment details for public confirmation page
CREATE OR REPLACE FUNCTION public.get_appointment_details_public(p_id uuid)
RETURNS TABLE (
  id uuid,
  start_time timestamptz,
  end_time timestamptz,
  status text,
  patient_name text,
  doctor_name text,
  doctor_specialty text,
  doctor_id uuid,
  doctor_duration integer,
  doctor_schedule_config jsonb,
  company_name text,
  clinic_config jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.start_time,
    a.end_time,
    a.status,
    c.name as patient_name,
    d.name as doctor_name,
    d.specialty as doctor_specialty,
    d.id as doctor_id,
    d.default_duration as doctor_duration,
    d.schedule_config as doctor_schedule_config,
    i.company_name,
    i.clinic_config
  FROM appointments a
  JOIN contacts c ON a.patient_id = c.id
  JOIN doctors d ON a.doctor_id = d.id
  JOIN instances i ON a.instance_id = i.id
  WHERE a.id = p_id;
END;
$$;

-- Function to handle patient actions (confirm/reschedule) publicly
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
BEGIN
  IF p_action = 'confirm' THEN
    UPDATE appointments 
    SET status = 'confirmed', updated_at = now()
    WHERE id = p_id;
  
  ELSIF p_action = 'reschedule' AND p_new_start IS NOT NULL THEN
    -- Calculate duration of existing appointment to maintain it
    SELECT (end_time - start_time) INTO v_duration
    FROM appointments WHERE id = p_id;

    UPDATE appointments 
    SET 
      start_time = p_new_start,
      end_time = p_new_start + v_duration,
      status = 'scheduled',
      updated_at = now()
    WHERE id = p_id;
  END IF;
END;
$$;

-- Grant permissions to anonymous users
GRANT EXECUTE ON FUNCTION public.get_appointment_details_public(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.patient_update_appointment(uuid, text, timestamptz) TO anon;
