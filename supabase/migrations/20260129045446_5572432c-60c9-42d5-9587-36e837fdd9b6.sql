-- Function to get busy time slots for a specific doctor on a given date
CREATE OR REPLACE FUNCTION public.get_busy_slots(p_doctor_id uuid, p_date date)
RETURNS TABLE(start_time timestamptz, end_time timestamptz) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT a.start_time, a.end_time
  FROM appointments a
  WHERE a.doctor_id = p_doctor_id
    AND DATE(a.start_time AT TIME ZONE 'America/Sao_Paulo') = p_date
    AND a.status NOT IN ('cancelled', 'no_show')
  ORDER BY a.start_time;
END;
$$;

-- Function to get public clinic info by slug (for public booking page)
CREATE OR REPLACE FUNCTION public.get_clinic_by_slug(p_slug text)
RETURNS TABLE(
  id uuid,
  company_name text,
  clinic_config jsonb,
  schedule_config jsonb,
  public_booking_active boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.company_name, i.clinic_config, i.schedule_config, i.public_booking_active
  FROM instances i
  WHERE i.slug = p_slug
    AND i.active = true
  LIMIT 1;
END;
$$;

-- Function to get active doctors for a clinic (public access)
CREATE OR REPLACE FUNCTION public.get_public_doctors(p_instance_id uuid)
RETURNS TABLE(
  id uuid,
  name text,
  specialty text,
  avatar_url text,
  color text,
  default_duration integer,
  schedule_config jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.name, d.specialty, d.avatar_url, d.color, d.default_duration, d.schedule_config
  FROM doctors d
  WHERE d.instance_id = p_instance_id
    AND d.active = true
  ORDER BY d.name;
END;
$$;

-- Function to create a public booking (patient + appointment)
CREATE OR REPLACE FUNCTION public.create_public_booking(
  p_instance_id uuid,
  p_doctor_id uuid,
  p_patient_name text,
  p_patient_phone text,
  p_start_time timestamptz,
  p_end_time timestamptz,
  p_notes text DEFAULT NULL
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
  -- Check if patient already exists
  SELECT id INTO v_patient_id
  FROM contacts
  WHERE instance_id = p_instance_id
    AND phone = p_patient_phone
  LIMIT 1;

  -- Create patient if not exists
  IF v_patient_id IS NULL THEN
    INSERT INTO contacts (instance_id, name, phone)
    VALUES (p_instance_id, p_patient_name, p_patient_phone)
    RETURNING id INTO v_patient_id;
  ELSE
    -- Update name if patient exists but name was empty
    UPDATE contacts 
    SET name = COALESCE(NULLIF(name, ''), p_patient_name)
    WHERE id = v_patient_id AND (name IS NULL OR name = '');
  END IF;

  -- Create appointment
  INSERT INTO appointments (instance_id, doctor_id, patient_id, start_time, end_time, status, notes)
  VALUES (p_instance_id, p_doctor_id, v_patient_id, p_start_time, p_end_time, 'scheduled', p_notes)
  RETURNING id INTO v_appointment_id;

  RETURN v_appointment_id;
END;
$$;

-- Grant execute permissions on these functions to anon users (for public booking)
GRANT EXECUTE ON FUNCTION public.get_clinic_by_slug(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_doctors(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_busy_slots(uuid, date) TO anon;
GRANT EXECUTE ON FUNCTION public.create_public_booking(uuid, uuid, text, text, timestamptz, timestamptz, text) TO anon;