-- Create terms table for managing school terms and fees
CREATE TABLE public.terms (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  fee_amount NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profile change requests table for parent credential updates
CREATE TABLE public.profile_change_requests (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  student_id BIGINT NOT NULL,
  parent_name VARCHAR,
  parent_email VARCHAR,
  parent_phone VARCHAR,
  new_password VARCHAR,
  status VARCHAR NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  notes TEXT
);

-- Add profile photo column to Students table
ALTER TABLE public."Students" 
ADD COLUMN profile_photo_url VARCHAR;

-- Create storage bucket for passport photos
INSERT INTO storage.buckets (id, name, public) VALUES ('passport-photos', 'passport-photos', false);

-- Enable RLS on new tables
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_change_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for terms table
CREATE POLICY "Teachers can manage all terms" 
ON public.terms 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

CREATE POLICY "Anyone can view active terms" 
ON public.terms 
FOR SELECT 
TO anon, authenticated
USING (is_active = true);

-- RLS policies for profile change requests
CREATE POLICY "Teachers can manage all profile change requests" 
ON public.profile_change_requests 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

CREATE POLICY "Parents can view their own change requests" 
ON public.profile_change_requests 
FOR SELECT 
TO anon, authenticated
USING (
  student_id IN (
    SELECT id FROM public."Students" 
    WHERE child_uid = current_setting('app.current_child_uid', true)
  )
);

-- Storage policies for passport photos
CREATE POLICY "Parents can upload their child's photo" 
ON storage.objects 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  bucket_id = 'passport-photos' AND
  (storage.foldername(name))[1] IN (
    SELECT child_uid FROM public."Students" 
    WHERE child_uid = current_setting('app.current_child_uid', true)
  )
);

CREATE POLICY "Teachers can view all passport photos" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'passport-photos' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'teacher'
  )
);

CREATE POLICY "Parents can view their child's photo" 
ON storage.objects 
FOR SELECT 
TO anon, authenticated
USING (
  bucket_id = 'passport-photos' AND
  (storage.foldername(name))[1] IN (
    SELECT child_uid FROM public."Students" 
    WHERE child_uid = current_setting('app.current_child_uid', true)
  )
);

-- Update triggers for new tables
CREATE TRIGGER update_terms_updated_at
BEFORE UPDATE ON public.terms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert a default active term
INSERT INTO public.terms (name, start_date, end_date, fee_amount, is_active)
VALUES ('Term 1 2024', '2024-01-15', '2024-04-15', 50000, true);