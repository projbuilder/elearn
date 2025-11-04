import { supabase } from '@/core/auth'

export interface Course {
  id: number
  title: string
  description: string
  instructor_id: string
  thumbnail_url?: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  duration: string
  students_count: number
  tags?: string[]
  created_at: string
}

export interface Module {
  id: number
  course_id: number
  title: string
  content?: string
  video_url?: string
  order_number: number
  duration_minutes?: number
}

export interface Enrollment {
  id: number
  user_id: string
  course_id: number
  enrolled_at: string
  last_accessed: string
}

export interface Progress {
  id: number
  user_id: string
  course_id: number
  module_id: number
  progress_percent: number
  completed: boolean
  last_accessed: string
}

export const courseService = {
  // Get all courses
  async getAllCourses(): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Get course by ID
  async getCourseById(id: number): Promise<Course | null> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Get courses by instructor
  async getCoursesByInstructor(instructorId: string): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('instructor_id', instructorId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Create course
  async createCourse(course: Partial<Course>): Promise<Course> {
    const { data, error } = await supabase
      .from('courses')
      .insert(course)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update course
  async updateCourse(id: number, updates: Partial<Course>): Promise<Course> {
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete course
  async deleteCourse(id: number): Promise<void> {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Get modules for a course
  async getModules(courseId: number): Promise<Module[]> {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_number', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // Create module
  async createModule(module: Partial<Module>): Promise<Module> {
    const { data, error } = await supabase
      .from('modules')
      .insert(module)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Enroll in course
  async enrollInCourse(userId: string, courseId: number): Promise<Enrollment> {
    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        user_id: userId,
        course_id: courseId
      })
      .select()
      .single()
    
    if (error) throw error

    // Increment student count
    await supabase.rpc('increment_students_count', { course_id: courseId })
    
    return data
  },

  // Get user enrollments
  async getUserEnrollments(userId: string): Promise<(Enrollment & { course: Course })[]> {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        course:courses(*)
      `)
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Get/Update progress
  async getProgress(userId: string, courseId: number): Promise<Progress[]> {
    const { data, error } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
    
    if (error) throw error
    return data || []
  },

  async updateProgress(
    userId: string,
    courseId: number,
    moduleId: number,
    progressPercent: number
  ): Promise<Progress> {
    const { data, error} = await supabase
      .from('progress')
      .upsert({
        user_id: userId,
        course_id: courseId,
        module_id: moduleId,
        progress_percent: progressPercent,
        completed: progressPercent >= 100,
        last_accessed: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Get course analytics (for instructors)
  async getCourseAnalytics(courseId: number) {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id')
      .eq('course_id', courseId)
    
    const { data: avgProgress } = await supabase
      .from('progress')
      .select('progress_percent')
      .eq('course_id', courseId)
    
    const totalStudents = enrollments?.length || 0
    const avgCompletion = avgProgress?.length
      ? avgProgress.reduce((sum, p) => sum + p.progress_percent, 0) / avgProgress.length
      : 0
    
    return {
      totalStudents,
      avgCompletion,
      activeModules: avgProgress?.length || 0
    }
  }
}
