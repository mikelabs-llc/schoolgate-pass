-- Create a function to set configuration parameters for parent authentication
-- This enables RLS policies to work with the current_child_uid setting

CREATE OR REPLACE FUNCTION public.set_config(setting_name text, setting_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config(setting_name, setting_value, false);
END;
$$;