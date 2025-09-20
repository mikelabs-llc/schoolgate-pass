-- Enable leaked password protection for better security
UPDATE auth.config SET 
  password_min_length = 6,
  password_lower_case = true,
  password_upper_case = true,
  password_number = true,
  password_special = false,
  password_hibp = true
WHERE true;