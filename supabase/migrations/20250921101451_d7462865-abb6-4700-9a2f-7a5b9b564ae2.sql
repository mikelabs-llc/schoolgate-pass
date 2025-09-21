-- Fix critical security vulnerability in Students table RLS policy
-- Replace the overly permissive 'true' condition with proper parent authentication

-- Drop the existing insecure policy
DROP POLICY IF EXISTS "Parents can view their child's data" ON public."Students";

-- Create a secure policy that only allows parents to view their own child's data
-- This uses the app.current_child_uid setting that should be set during parent authentication
CREATE POLICY "Parents can view their child's data" 
ON public."Students" 
FOR SELECT 
USING (
  -- Allow if the current child_uid matches this student's child_uid
  (child_uid)::text = current_setting('app.current_child_uid'::text, true)
);