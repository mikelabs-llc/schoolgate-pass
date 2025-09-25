-- Update some existing students to have parent passwords for testing
UPDATE "Students" 
SET parent_password = 'password123' 
WHERE child_uid IN ('KCS001', 'KCS002', 'KCS003');

-- Also ensure KCS02 gets mapped to KCS002 by updating the existing record
-- or create a test record if needed