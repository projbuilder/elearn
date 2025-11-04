-- ============================================
-- QUICK DATABASE SETUP - RUN THIS FIRST!
-- Copy and paste this into Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  role TEXT CHECK (role IN ('student', 'instructor', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. COURSES TABLE
CREATE TABLE IF NOT EXISTS public.courses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  instructor_id UUID REFERENCES public.profiles(id),
  thumbnail_url TEXT,
  tags TEXT[],
  level TEXT CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  duration TEXT,
  students_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view courses" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Instructors can create courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (auth.uid() = instructor_id);
CREATE POLICY "Instructors can update own courses" ON public.courses FOR UPDATE TO authenticated USING (auth.uid() = instructor_id);
CREATE POLICY "Instructors can delete own courses" ON public.courses FOR DELETE TO authenticated USING (auth.uid() = instructor_id);

-- 3. MODULES TABLE
CREATE TABLE IF NOT EXISTS public.modules (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  order_number INTEGER,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view modules" ON public.modules FOR SELECT TO authenticated USING (true);

-- 4. ENROLLMENTS TABLE
CREATE TABLE IF NOT EXISTS public.enrollments (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own enrollments" ON public.enrollments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can enroll themselves" ON public.enrollments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 5. PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.progress (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id INTEGER REFERENCES public.modules(id) ON DELETE CASCADE,
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  completed BOOLEAN DEFAULT FALSE,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id, module_id)
);

ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own progress" ON public.progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 6. TUTOR CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.tutor_conversations (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES public.courses(id),
  messages JSONB NOT NULL DEFAULT '[]',
  context_used JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.tutor_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own conversations" ON public.tutor_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON public.tutor_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.tutor_conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 7. COURSE CONTENT TABLE (for PDF uploads)
CREATE TABLE IF NOT EXISTS public.course_content (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES public.courses(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('pdf', 'video', 'document', 'text')),
  title TEXT NOT NULL,
  file_url TEXT,
  content_text TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.course_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view course content" ON public.course_content FOR SELECT TO authenticated USING (true);

-- 8. QUIZZES TABLE
CREATE TABLE IF NOT EXISTS public.quizzes (
  id SERIAL PRIMARY KEY,
  module_id INTEGER REFERENCES public.modules(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT,
  generated_by TEXT DEFAULT 'ai',
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view quizzes" ON public.quizzes FOR SELECT TO authenticated USING (true);

-- 9. QUIZ QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id SERIAL PRIMARY KEY,
  quiz_id INTEGER REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  type TEXT CHECK (type IN ('multiple_choice', 'true_false', 'short_answer')),
  options JSONB,
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  difficulty_score FLOAT DEFAULT 0.5
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view quiz questions" ON public.quiz_questions FOR SELECT TO authenticated USING (true);

-- 10. AUTO-CREATE PROFILE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. SAMPLE DATA (3 courses)
INSERT INTO public.courses (title, description, level, duration, thumbnail_url, tags, students_count) VALUES
('Introduction to Federated Learning', 'Learn the fundamentals of distributed machine learning while preserving privacy. Understand how FL works, why it matters, and how to implement it.', 'Beginner', '6 weeks', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800', ARRAY['AI', 'Privacy', 'ML'], 0),
('Privacy-Preserving AI', 'Deep dive into differential privacy, secure aggregation, and homomorphic encryption techniques for protecting user data.', 'Intermediate', '8 weeks', 'https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800', ARRAY['Privacy', 'Security', 'AI'], 0),
('Advanced Federated Deep Learning', 'Master neural network training across distributed devices with advanced optimization techniques.', 'Advanced', '10 weeks', 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800', ARRAY['Deep Learning', 'Advanced', 'Neural Networks'], 0)
ON CONFLICT DO NOTHING;

-- SUCCESS MESSAGE
DO $$
BEGIN
  RAISE NOTICE '✅ Database setup complete! You can now use the platform.';
  RAISE NOTICE '📚 3 sample courses added';
  RAISE NOTICE '🔐 Row Level Security enabled';
  RAISE NOTICE '👤 User profiles auto-create on signup';
END $$;
