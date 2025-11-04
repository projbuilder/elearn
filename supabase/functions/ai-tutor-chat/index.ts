import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, studentId, courseId, conversationHistory } = await req.json();

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get student's learning preferences and progress
    const { data: profile } = await supabase
      .from('profiles')
      .select('learning_preferences')
      .eq('user_id', studentId)
      .single();

    const { data: progress } = await supabase
      .from('student_progress')
      .select('progress_percentage, performance_metrics')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .single();

    // Simulate AI response (in production, integrate with actual AI service)
    const aiResponse = generateTutorResponse(
      message,
      profile?.learning_preferences || {},
      progress?.performance_metrics || {},
      conversationHistory || []
    );

    // Store conversation in database
    await supabase
      .from('tutor_conversations')
      .insert({
        student_id: studentId,
        course_id: courseId,
        user_message: message,
        ai_response: aiResponse,
        conversation_context: {
          learning_preferences: profile?.learning_preferences,
          progress_percentage: progress?.progress_percentage,
          timestamp: new Date().toISOString()
        }
      });

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        context: {
          progressPercentage: progress?.progress_percentage || 0,
          learningStyle: profile?.learning_preferences?.learning_style || 'adaptive'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('AI Tutor error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        response: 'I apologize, but I encountered an error. Please try again.'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function generateTutorResponse(
  message: string, 
  learningPrefs: any, 
  performanceMetrics: any,
  history: any[]
): string {
  const messageLower = message.toLowerCase();
  
  // Adaptive responses based on learning preferences and performance
  if (messageLower.includes('help') || messageLower.includes('explain')) {
    const style = learningPrefs?.learning_style || 'balanced';
    
    if (style === 'visual') {
      return "I understand you need help! Let me explain this concept visually. Imagine the federated learning process like a classroom where students learn independently at home, then share only their insights (not their homework) with the teacher to improve the overall lesson plan. Would you like me to break this down into a step-by-step diagram?";
    } else if (style === 'auditory') {
      return "Let me explain this concept in a narrative way. Think of federated learning as a story where many learners contribute to a shared knowledge base without revealing their personal data. Each participant trains locally, shares improvements, and everyone benefits from collective wisdom. What specific aspect would you like to explore further?";
    } else {
      return "I'm here to help! Federated learning allows you to learn collaboratively while keeping your data private. Your device trains locally, shares model updates (not data), and the global model improves for everyone. What part would you like me to clarify?";
    }
  }
  
  if (messageLower.includes('privacy') || messageLower.includes('secure')) {
    return "Great question about privacy! Your learning data never leaves your device. We use federated learning with differential privacy, which means: 1) All training happens locally on your device, 2) Only encrypted model updates are shared, 3) Your personal data remains 100% private. The global model learns from patterns across all users without ever accessing individual data. Feel secure?";
  }
  
  if (messageLower.includes('progress') || messageLower.includes('how am i doing')) {
    const progressPercent = performanceMetrics?.overall_accuracy || 0;
    if (progressPercent > 80) {
      return `Excellent work! You're performing at ${progressPercent}% accuracy. You're mastering the concepts well. I recommend challenging yourself with more advanced topics or helping peers who might be struggling. Keep up the outstanding effort!`;
    } else if (progressPercent > 60) {
      return `You're making good progress at ${progressPercent}% accuracy! Focus on practicing the fundamentals, and don't hesitate to ask questions. Review the areas where you scored lower, and try the interactive exercises. You're on the right track!`;
    } else {
      return `I see you're at ${progressPercent}% accuracy. Don't worry - learning takes time! Let's break down the challenging concepts into smaller parts. I recommend starting with the basics and building up gradually. Would you like me to create a personalized study plan for you?`;
    }
  }
  
  if (messageLower.includes('quiz') || messageLower.includes('test')) {
    return "I can generate a personalized quiz for you! Based on your learning history, I'll focus on areas where you can improve while reinforcing your strengths. The quiz will adapt to your performance in real-time. Ready to start? Just let me know what topic you'd like to be quizzed on!";
  }
  
  // Default helpful response
  return "I'm your AI learning assistant, powered by federated learning technology. I can help you with:\n\n• Explaining concepts in your preferred learning style\n• Answering questions about course material\n• Generating personalized quizzes\n• Tracking your progress\n• Recommending study strategies\n\nWhat would you like to explore today?";
}
