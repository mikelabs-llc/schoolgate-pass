-- Create a sequence for generating unique student IDs
CREATE SEQUENCE IF NOT EXISTS student_id_sequence START 1;

-- Create a function to generate the next student ID in format KCS001, KCS002, etc.
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
$$ LANGUAGE plpgsql;

-- Update the Students table to auto-generate child_uid if not provided
ALTER TABLE "Students" ALTER COLUMN child_uid SET DEFAULT generate_student_uid();

-- Update existing students that don't have a child_uid
UPDATE "Students" 
SET child_uid = generate_student_uid() 
WHERE child_uid IS NULL OR child_uid = '';

-- Make child_uid NOT NULL since it's now required
ALTER TABLE "Students" ALTER COLUMN child_uid SET NOT NULL;