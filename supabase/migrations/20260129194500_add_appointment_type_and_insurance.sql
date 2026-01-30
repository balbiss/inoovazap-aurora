-- Add appointment_type and insurance columns to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_type text;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS insurance text;

-- Update the get_appointment_details_public function to include these new fields
CREATE OR REPLACE FUNCTION public.get_appointment_details_public(p_id uuid)
RETURNS TABLE (
  id uuid,
  start_time timestamptz,
  end_time timestamptz,
  status text,
  appointment_type text,
  insurance text,
  doctor_name text,
  doctor_specialty text,
  doctor_avatar_url text,
  patient_name text,
  clinic_name text,
  clinic_logo_url text,
  clinic_slug text,
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
    a.appointment_type,
    a.insurance,
    d.name as doctor_name,
    d.specialty as doctor_specialty,
    d.avatar_url as doctor_avatar_url,
    c.name as patient_name,
    i.company_name as clinic_name,
    (i.clinic_config->>'logo_url') as clinic_logo_url,
    i.slug as clinic_slug,
    i.clinic_config
  FROM appointments a
  JOIN doctors d ON a.doctor_id = d.id
  JOIN contacts c ON a.patient_id = c.id
  JOIN instances i ON a.instance_id = i.id
  WHERE a.id = p_id;
END;
$$;
