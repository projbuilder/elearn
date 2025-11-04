-- Create missing tables for FL updates and AI tutor conversations
CREATE TABLE public.fl_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  model_weights JSONB NOT NULL DEFAULT '{}',
  training_metrics JSONB NOT NULL DEFAULT '{}',
  privacy_metrics JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on fl_updates
ALTER TABLE public.fl_updates ENABLE ROW LEVEL SECURITY;

-- Create policies for fl_updates
CREATE POLICY "Users can manage their own FL updates" 
ON public.fl_updates 
FOR ALL 
USING (student_id = auth.uid());

CREATE POLICY "Instructors can view FL updates for their courses" 
ON public.fl_updates 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.courses 
  WHERE courses.id = fl_updates.course_id 
  AND courses.instructor_id = auth.uid()
));

-- Create tutor conversations table
CREATE TABLE public.tutor_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  conversation_context JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tutor_conversations
ALTER TABLE public.tutor_conversations ENABLE ROW LEVEL SECURITY;

-- Create policies for tutor_conversations
CREATE POLICY "Users can manage their own conversations" 
ON public.tutor_conversations 
FOR ALL 
USING (student_id = auth.uid());

CREATE POLICY "Instructors can view conversations for their courses" 
ON public.tutor_conversations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.courses 
  WHERE courses.id = tutor_conversations.course_id 
  AND courses.instructor_id = auth.uid()
));

-- **SECURITY FIX**: Update profiles table policies to restrict access
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create secure policies for profiles
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_fl_updates_student_course ON public.fl_updates(student_id, course_id);
CREATE INDEX idx_tutor_conversations_student_course ON public.tutor_conversations(student_id, course_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);