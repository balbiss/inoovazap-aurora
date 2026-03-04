-- Update get_clinic_by_slug to include subscription_status
CREATE OR REPLACE FUNCTION public.get_clinic_by_slug(p_slug text)
RETURNS TABLE(
  id uuid,
  company_name text,
  clinic_config jsonb,
  schedule_config jsonb,
  public_booking_active boolean,
  subscription_status text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.company_name, i.clinic_config, i.schedule_config, i.public_booking_active, i.subscription_status
  FROM instances i
  WHERE i.slug = p_slug
    AND i.active = true
  LIMIT 1;
END;
$$;
