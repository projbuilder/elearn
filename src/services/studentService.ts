import { supabase } from '@/integrations/supabase/client';

export interface LearningStats {
  currentStreak: number;
  totalLessons: number;
  accuracy: number;
  weeklyProgress: number;
  flContribution: string;
}

export const studentService = {
  async getStudentStats(studentId: string): Promise<LearningStats> {
    const { data: progress } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false });

    if (!progress || progress.length === 0) {
      return {
        currentStreak: 0,
        totalLessons: 0,
        accuracy: 0,
        weeklyProgress: 0,
        flContribution: 'Inactive'
      };
    }

    const totalLessons = progress.length;
    const accuracies = progress
      .map(p => {
        const metrics = p.performance_metrics as any;
        return metrics?.accuracy || 0;
      })
      .filter(a => a > 0);
    const avgAccuracy = accuracies.length > 0
      ? (accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length) * 100
      : 0;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentProgress = progress.filter(p => 
      new Date(p.updated_at) >= weekAgo
    );
    const weeklyProgress = recentProgress.length > 0
      ? (recentProgress.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / recentProgress.length)
      : 0;

    // Calculate streak
    const sortedDates = progress
      .map(p => new Date(p.last_accessed_at || p.updated_at))
      .sort((a, b) => b.getTime() - a.getTime());
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const date of sortedDates) {
      const accessDate = new Date(date);
      accessDate.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((currentDate.getTime() - accessDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === streak) {
        streak++;
      } else if (diffDays > streak) {
        break;
      }
    }

    const flContribution = avgAccuracy >= 80 ? 'Active' : avgAccuracy >= 60 ? 'Contributing' : 'Learning';

    return {
      currentStreak: streak,
      totalLessons,
      accuracy: Math.round(avgAccuracy),
      weeklyProgress: Math.round(weeklyProgress),
      flContribution
    };
  },

  async getRecentLessons(studentId: string, limit: number = 4) {
    const { data } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    return (data || []).map(p => ({
      title: (p.performance_metrics as any)?.topic || 'General Learning',
      progress: Math.round(p.progress_percentage || 0),
      difficulty: (p.performance_metrics as any)?.difficulty || 'Medium',
      aiRecommended: ((p.performance_metrics as any)?.accuracy || 0) < 0.7
    }));
  },

  async getWeeklyProgress(studentId: string) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', studentId)
      .gte('updated_at', weekAgo.toISOString())
      .order('updated_at', { ascending: true });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekData = Array(7).fill(null).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        day: dayNames[date.getDay()],
        hours: 0,
        lessons: 0,
        accuracy: 0
      };
    });

    (data || []).forEach(p => {
      const date = new Date(p.updated_at);
      const dayIndex = (date.getDay() + 6 - new Date().getDay()) % 7;
      
      if (dayIndex >= 0 && dayIndex < 7) {
        weekData[dayIndex].lessons++;
        weekData[dayIndex].hours += 0.5; // Estimate 30 min per lesson
        const metrics = p.performance_metrics as any;
        const acc = (metrics?.accuracy || 0) * 100;
        weekData[dayIndex].accuracy = Math.round(
          (weekData[dayIndex].accuracy * (weekData[dayIndex].lessons - 1) + acc) / weekData[dayIndex].lessons
        );
      }
    });

    return weekData;
  }
};
