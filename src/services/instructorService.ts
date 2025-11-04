import { supabase } from '@/integrations/supabase/client';

export interface StudentInfo {
  id: string;
  name: string;
  email: string;
  progress: number;
  accuracy: number;
  status: 'excellent' | 'good' | 'struggling';
  lastActive: string;
  currentTopic: string;
  flContribution: string;
}

export interface ClassStats {
  totalStudents: number;
  activeToday: number;
  avgProgress: number;
  completionRate: number;
  avgAccuracy: number;
  strugglingStudents: number;
  excellentPerformers: number;
}

export const instructorService = {
  async getInstructorCourses(instructorId: string) {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('instructor_id', instructorId);
    
    if (error) throw error;
    return data || [];
  },

  async getStudentsForCourse(courseId: string): Promise<StudentInfo[]> {
    const { data: progressData, error } = await supabase
      .from('student_progress')
      .select(`
        *,
        profiles:student_id (
          display_name,
          user_id
        )
      `)
      .eq('course_id', courseId);

    if (error) {
      console.error('Error fetching students:', error);
      return [];
    }

    return (progressData || []).map((p: any) => {
      const metrics = p.performance_metrics || {};
      const progress = p.progress_percentage || 0;
      const accuracy = metrics.accuracy || 0;
      
      return {
        id: p.student_id,
        name: p.profiles?.display_name || 'Student',
        email: `student${p.student_id.slice(0, 8)}@example.com`,
        progress: Math.round(progress),
        accuracy: Math.round(accuracy * 100),
        status: accuracy >= 0.85 ? 'excellent' : accuracy >= 0.65 ? 'good' : 'struggling',
        lastActive: new Date(p.last_accessed_at || p.updated_at).toLocaleDateString(),
        currentTopic: metrics.current_topic || 'Getting Started',
        flContribution: accuracy >= 0.8 ? 'High' : accuracy >= 0.6 ? 'Medium' : 'Low'
      };
    });
  },

  async getClassStats(instructorId: string): Promise<ClassStats> {
    const courses = await this.getInstructorCourses(instructorId);
    
    if (courses.length === 0) {
      return {
        totalStudents: 0,
        activeToday: 0,
        avgProgress: 0,
        completionRate: 0,
        avgAccuracy: 0,
        strugglingStudents: 0,
        excellentPerformers: 0
      };
    }

    const courseIds = courses.map(c => c.id);
    
    const { data: allProgress } = await supabase
      .from('student_progress')
      .select('*')
      .in('course_id', courseIds);

    if (!allProgress || allProgress.length === 0) {
      return {
        totalStudents: 0,
        activeToday: 0,
        avgProgress: 0,
        completionRate: 0,
        avgAccuracy: 0,
        strugglingStudents: 0,
        excellentPerformers: 0
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalStudents = allProgress.length;
    const activeToday = allProgress.filter(p => 
      new Date(p.last_accessed_at || p.updated_at) >= today
    ).length;

    const avgProgress = allProgress.reduce((sum, p) => 
      sum + (p.progress_percentage || 0), 0
    ) / totalStudents;

    const completed = allProgress.filter(p => 
      (p.progress_percentage || 0) >= 90
    ).length;
    const completionRate = (completed / totalStudents) * 100;

    const accuracies = allProgress
      .map(p => {
        const metrics = p.performance_metrics as any;
        return metrics?.accuracy || 0;
      })
      .filter(a => a > 0);
    const avgAccuracy = accuracies.length > 0
      ? (accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length) * 100
      : 0;

    const strugglingStudents = allProgress.filter(p => {
      const metrics = p.performance_metrics as any;
      return (metrics?.accuracy || 0) < 0.6;
    }).length;

    const excellentPerformers = allProgress.filter(p => {
      const metrics = p.performance_metrics as any;
      return (metrics?.accuracy || 0) >= 0.85;
    }).length;

    return {
      totalStudents,
      activeToday,
      avgProgress: Math.round(avgProgress),
      completionRate: Math.round(completionRate),
      avgAccuracy: Math.round(avgAccuracy),
      strugglingStudents,
      excellentPerformers
    };
  },

  async getRecentActivity(instructorId: string, limit: number = 5) {
    const courses = await this.getInstructorCourses(instructorId);
    const courseIds = courses.map(c => c.id);

    if (courseIds.length === 0) return [];

    const { data: conversations } = await supabase
      .from('tutor_conversations')
      .select('*')
      .in('course_id', courseIds)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Get student names separately
    const studentIds = [...new Set((conversations || []).map(c => c.student_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .in('user_id', studentIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);

    return (conversations || []).map(c => ({
      student: profileMap.get(c.student_id) || 'Student',
      action: c.user_message.slice(0, 50) + '...',
      time: new Date(c.created_at).toLocaleString(),
      type: 'info' as const
    }));
  }
};
