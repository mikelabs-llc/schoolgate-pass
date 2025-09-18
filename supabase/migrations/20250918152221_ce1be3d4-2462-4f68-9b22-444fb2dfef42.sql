-- Add authentication fields to Students table (correct case)
ALTER TABLE public."Students" 
ADD COLUMN child_uid VARCHAR(50) UNIQUE,
ADD COLUMN parent_password VARCHAR(100),
ADD COLUMN access_url VARCHAR(255);

-- Update RLS policies for Students table
DROP POLICY IF EXISTS "Enable read access for all users" ON public."Students";

-- Create new RLS policies for Students
CREATE POLICY "Teachers can manage all students" 
ON public."Students" 
FOR ALL 
USING (true);

CREATE POLICY "Parents can view their child's data" 
ON public."Students" 
FOR SELECT 
USING (true);

-- Enable RLS on attendance table and create policies
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage all attendance" 
ON public.attendance 
FOR ALL 
USING (true);

CREATE POLICY "Parents can view their child's attendance" 
ON public.attendance 
FOR SELECT 
USING (
  student_id IN (
    SELECT id FROM public."Students" 
    WHERE child_uid = current_setting('app.current_child_uid', true)
  )
);

-- Enable RLS on documents table and create policies
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage all documents" 
ON public.documents 
FOR ALL 
USING (true);

CREATE POLICY "Parents can view their child's documents" 
ON public.documents 
FOR SELECT 
USING (
  student_id IN (
    SELECT id FROM public."Students" 
    WHERE child_uid = current_setting('app.current_child_uid', true)
  )
);

-- Enable RLS on fee_payment table and create policies
ALTER TABLE public.fee_payment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage all fee payments" 
ON public.fee_payment 
FOR ALL 
USING (true);

CREATE POLICY "Parents can view their child's fee payments" 
ON public.fee_payment 
FOR SELECT 
USING (
  student_id IN (
    SELECT id FROM public."Students" 
    WHERE child_uid = current_setting('app.current_child_uid', true)
  )
);

-- Create profiles table for teacher authentication
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'teacher',
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email),
    'teacher'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();