-- Create user profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor', 'admin')),
  avatar_url TEXT,
  bio TEXT,
  learning_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
  is_published BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Create policies for courses
CREATE POLICY "Published courses are viewable by everyone" 
ON public.courses 
FOR SELECT 
USING (is_published = true OR instructor_id = auth.uid());

CREATE POLICY "Instructors can manage their own courses" 
ON public.courses 
FOR ALL 
USING (instructor_id = auth.uid());

-- Create student progress table
CREATE TABLE public.student_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (progress_percentage BETWEEN 0 AND 100),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  performance_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, course_id)
);

-- Enable RLS for student progress
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for student progress
CREATE POLICY "Users can view their own progress" 
ON public.student_progress 
FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "Users can update their own progress" 
ON public.student_progress 
FOR ALL 
USING (student_id = auth.uid());

CREATE POLICY "Instructors can view progress of their course students" 
ON public.student_progress 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE courses.id = student_progress.course_id 
    AND courses.instructor_id = auth.uid()
  )
);

-- Create federated learning nodes table
CREATE TABLE public.fl_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  node_status TEXT DEFAULT 'inactive' CHECK (node_status IN ('active', 'inactive', 'training')),
  model_version INTEGER DEFAULT 0,
  training_metrics JSONB DEFAULT '{}',
  last_update_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Enable RLS for FL nodes
ALTER TABLE public.fl_nodes ENABLE ROW LEVEL SECURITY;

-- Create policies for FL nodes
CREATE POLICY "Users can manage their own FL nodes" 
ON public.fl_nodes 
FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Instructors can view FL nodes for their courses" 
ON public.fl_nodes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.courses 
    WHERE courses.id = fl_nodes.course_id 
    AND courses.instructor_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_progress_updated_at
  BEFORE UPDATE ON public.student_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();