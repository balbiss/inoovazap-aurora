-- Update create_public_booking to accept CPF
CREATE OR REPLACE FUNCTION public.create_public_booking(
  p_instance_id uuid, 
  p_doctor_id uuid, 
  p_patient_name text, 
  p_patient_phone text, 
  p_start_time timestamp with time zone, 
  p_end_time timestamp with time zone, 
  p_notes text DEFAULT NULL,
  p_patient_cpf text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id uuid;
  v_appointment_id uuid;
BEGIN
  -- Check for existing appointments (Concurrency/Double Booking Check)
  IF EXISTS (
    SELECT 1 FROM appointments 
    WHERE doctor_id = p_doctor_id 
      AND status NOT IN ('cancelled')
      AND (
        (p_start_time >= start_time AND p_start_time < end_time) OR
        (p_end_time > start_time AND p_end_time <= end_time) OR
        (start_time >= p_start_time AND start_time < p_end_time)
      )
  ) THEN
    RAISE EXCEPTION 'Este horário já foi preenchido por outro paciente. Por favor, escolha outro horário.';
  END IF;

  -- Check if patient already exists by phone
  SELECT id INTO v_patient_id
  FROM contacts
  WHERE instance_id = p_instance_id
    AND phone = p_patient_phone
  LIMIT 1;

  -- Create patient if not exists
  IF v_patient_id IS NULL THEN
    INSERT INTO contacts (instance_id, name, phone, cpf)
    VALUES (p_instance_id, p_patient_name, p_patient_phone, NULLIF(TRIM(p_patient_cpf), ''))
    RETURNING id INTO v_patient_id;
  ELSE
    -- Update name and CPF. Always use the name provided in the booking to ensure accuracy.
    UPDATE contacts 
    SET 
      name = p_patient_name,
      cpf = COALESCE(cpf, NULLIF(TRIM(p_patient_cpf), ''))
    WHERE id = v_patient_id;
  END IF;

  -- Create appointment
  INSERT INTO appointments (instance_id, doctor_id, patient_id, start_time, end_time, status, notes)
  VALUES (p_instance_id, p_doctor_id, v_patient_id, p_start_time, p_end_time, 'scheduled', p_notes)
  RETURNING id INTO v_appointment_id;

  RETURN v_appointment_id;
END;
$$;