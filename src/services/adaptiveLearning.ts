// src/services/adaptiveLearning.ts
import { supabase } from '@/core/auth';

export interface UserProgress {
  userId: string;
  courseId: string;
  progress: number;
  difficulty: string;
  lastAccessed: string;
}

export const adaptiveLearningService = {
  async getUserProgress(userId: string, courseId: string): Promise<UserProgress | null> {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (error) {
      console.error('Error fetching user progress:', error);
      return null;
    }
    return data;
  },

  async updateProgress(userId: string, courseId: string, progress: number): Promise<boolean> {
    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        course_id: courseId,
        progress,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error updating progress:', error);
      return false;
    }
    return true;
  },

  async getRecommendedContent(userId: string) {
    // Add your adaptive learning logic here
    return [];
  }
};