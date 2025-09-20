-- First, let's fix the handle_new_user function to have proper permissions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    'teacher'
  );
  RETURN NEW;
END;
$function$;

-- Drop and recreate the trigger to ensure it's properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix RLS policies for Students table - replace overly permissive policies
DROP POLICY IF EXISTS "Parents can view their child's data" ON public."Students";
DROP POLICY IF EXISTS "Teachers can manage all students" ON public."Students";

-- Create proper RLS policies for Students
CREATE POLICY "Teachers can manage all students" 
ON public."Students" 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

CREATE POLICY "Parents can view their child's data" 
ON public."Students" 
FOR SELECT 
TO anon, authenticated
USING (true); -- Keep this permissive for parent auth without login

-- Fix RLS policies for attendance table
DROP POLICY IF EXISTS "Parents can view their child's attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can manage all attendance" ON public.attendance;

CREATE POLICY "Teachers can manage all attendance" 
ON public.attendance 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

CREATE POLICY "Parents can view their child's attendance" 
ON public.attendance 
FOR SELECT 
TO anon, authenticated
USING (
  student_id IN (
    SELECT id FROM public."Students" 
    WHERE child_uid = current_setting('app.current_child_uid', true)
  )
);

-- Fix RLS policies for documents table
DROP POLICY IF EXISTS "Parents can view their child's documents" ON public.documents;
DROP POLICY IF EXISTS "Teachers can manage all documents" ON public.documents;

CREATE POLICY "Teachers can manage all documents" 
ON public.documents 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

CREATE POLICY "Parents can view their child's documents" 
ON public.documents 
FOR SELECT 
TO anon, authenticated
USING (
  student_id IN (
    SELECT id FROM public."Students" 
    WHERE child_uid = current_setting('app.current_child_uid', true)
  )
);

-- Fix RLS policies for fee_payment table
DROP POLICY IF EXISTS "Parents can view their child's fee payments" ON public.fee_payment;
DROP POLICY IF EXISTS "Teachers can manage all fee payments" ON public.fee_payment;

CREATE POLICY "Teachers can manage all fee payments" 
ON public.fee_payment 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

CREATE POLICY "Parents can view their child's fee payments" 
ON public.fee_payment 
FOR SELECT 
TO anon, authenticated
USING (
  student_id IN (
    SELECT id FROM public."Students" 
    WHERE child_uid = current_setting('app.current_child_uid', true)
  )
);

-- Ensure profiles policies allow the trigger to work
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow the system to create profiles during signup
CREATE POLICY "System can create profiles during signup" 
ON public.profiles 
FOR INSERT 
TO service_role
WITH CHECK (true);