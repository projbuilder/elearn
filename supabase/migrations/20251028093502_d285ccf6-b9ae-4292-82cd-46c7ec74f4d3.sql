-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'instructor', 'student');

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Policy: Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Update profiles table to remove role column (we'll use user_roles instead)
-- But keep it for backwards compatibility and update via trigger
CREATE OR REPLACE FUNCTION public.sync_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update profile role based on user_roles table
  UPDATE public.profiles
  SET role = (
    SELECT ur.role::text
    FROM public.user_roles ur
    WHERE ur.user_id = NEW.user_id
    ORDER BY 
      CASE 
        WHEN ur.role = 'admin' THEN 1
        WHEN ur.role = 'instructor' THEN 2
        WHEN ur.role = 'student' THEN 3
      END
    LIMIT 1
  )
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to sync role to profiles
CREATE TRIGGER sync_profile_role_trigger
AFTER INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_role();

-- Update handle_new_user function to create role in user_roles table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get role from metadata, default to 'student'
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  
  -- Create profile
  INSERT INTO public.profiles (user_id, display_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    user_role
  );
  
  -- Create user role entry
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;