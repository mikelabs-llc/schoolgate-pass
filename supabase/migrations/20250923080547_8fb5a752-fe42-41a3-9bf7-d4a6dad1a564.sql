-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION generate_student_uid()
RETURNS TEXT AS $$
DECLARE
    next_id INTEGER;
    formatted_id TEXT;
BEGIN
    -- Get the next sequence value
    SELECT nextval('student_id_sequence') INTO next_id;
    
    -- Format as KCS with zero-padding to 3 digits
    formatted_id := 'KCS' || LPAD(next_id::TEXT, 3, '0');
    
    -- Check if this ID already exists (shouldn't happen with sequence, but safety check)
    WHILE EXISTS (SELECT 1 FROM "Students" WHERE child_uid = formatted_id) LOOP
        SELECT nextval('student_id_sequence') INTO next_id;
        formatted_id := 'KCS' || LPAD(next_id::TEXT, 3, '0');
    END LOOP;
    
    RETURN formatted_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;