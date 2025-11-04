import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for your database
export interface Course {
  id: number
  title: string
  description: string
  students: number
  duration: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  image_url: string
  created_at: string
}

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  created_at: string
}

export interface Enrollment {
  id: number
  user_id: string
  course_id: number
  progress: number
  enrolled_at: string
}

// Helper functions
export const auth = {
  signUp: async (email: string, password: string) => {
    return await supabase.auth.signUp({ email, password })
  },
  
  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password })
  },
  
  signOut: async () => {
    return await supabase.auth.signOut()
  },
  
  getUser: async () => {
    return await supabase.auth.getUser()
  }
}

export const courses = {
  getAll: async () => {
    return await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false })
  },
  
  getById: async (id: number) => {
    return await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single()
  }
}

export const enrollments = {
  enroll: async (userId: string, courseId: number) => {
    return await supabase
      .from('enrollments')
      .insert({ user_id: userId, course_id: courseId })
  },
  
  getUserEnrollments: async (userId: string) => {
    return await supabase
      .from('enrollments')
      .select('*, courses(*)')
      .eq('user_id', userId)
  },
  
  updateProgress: async (enrollmentId: number, progress: number) => {
    return await supabase
      .from('enrollments')
      .update({ progress })
      .eq('id', enrollmentId)
  }
}