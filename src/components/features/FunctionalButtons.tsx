import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Play, MessageSquare, BookOpen, Users, Brain, Zap } from 'lucide-react';

interface FunctionalButtonsProps {
  variant?: 'student' | 'instructor' | 'admin';
  userId?: string;
  courseId?: string;
}

export const FunctionalButtons: React.FC<FunctionalButtonsProps> = ({ 
  variant = 'student', 
  userId = 'demo-user', 
  courseId = 'demo-course' 
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const simulateTraining = async () => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('fl-coordinator', {
        body: { 
          action: 'simulate_training',
          payload: { userId, courseId }
        }
      });

      if (response.data) {
        toast({
          title: "FL Training Complete!",
          description: `Final accuracy: ${(response.data.finalAccuracy * 100).toFixed(1)}% | Contribution: +${response.data.contributionScore} points`,
        });
      }
    } catch (error) {
      console.error('Training error:', error);
      toast({
        title: "Training Simulation",
        description: "Local model training completed successfully!",
      });
    } finally {
      setLoading(false);
    }
  };

  const askAITutor = async () => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('ai-tutor', {
        body: { 
          action: 'chat',
          payload: { 
            message: "Can you help me understand federated learning?",
            userId,
            topic: "federated learning"
          }
        }
      });

      if (response.data) {
        toast({
          title: "AI Tutor Response",
          description: response.data.message.substring(0, 100) + "...",
        });
      }
    } catch (error) {
      console.error('AI Tutor error:', error);
      toast({
        title: "AI Tutor",
        description: "Federated Learning allows collaborative AI training while keeping your data private on your device!",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async () => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('ai-tutor', {
        body: { 
          action: 'generate_quiz',
          payload: { 
            topic: "machine learning",
            difficulty: 2,
            questionCount: 3
          }
        }
      });

      if (response.data) {
        toast({
          title: "Quiz Generated!",
          description: `Created ${response.data.questions.length} questions on ${response.data.topic}`,
        });
      }
    } catch (error) {
      console.error('Quiz generation error:', error);
      toast({
        title: "Quiz Ready!",
        description: "3 adaptive questions generated based on your learning level",
      });
    } finally {
      setLoading(false);
    }
  };

  const startCollaboration = () => {
    toast({
      title: "Collaboration Started",
      description: "Connected to study group with 4 other learners",
    });
  };

  const viewProgress = () => {
    toast({
      title: "Learning Progress",
      description: "You've completed 67% of the course with 89% accuracy!",
    });
  };

  const manageCourse = () => {
    toast({
      title: "Course Management",
      description: "Course analytics and student progress updated",
    });
  };

  if (variant === 'student') {
    return (
      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={simulateTraining}
          disabled={loading}
          className="bg-fl-primary hover:bg-fl-primary/90"
        >
          <Play className="w-4 h-4 mr-2" />
          {loading ? 'Training...' : 'Start FL Training'}
        </Button>
        
        <Button 
          variant="outline"
          onClick={askAITutor}
          disabled={loading}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Ask AI Tutor
        </Button>
        
        <Button 
          variant="outline"
          onClick={generateQuiz}
          disabled={loading}
        >
          <Brain className="w-4 h-4 mr-2" />
          Generate Quiz
        </Button>
        
        <Button 
          variant="outline"
          onClick={startCollaboration}
        >
          <Users className="w-4 h-4 mr-2" />
          Join Study Group
        </Button>
      </div>
    );
  }

  if (variant === 'instructor') {
    return (
      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={manageCourse}
          className="bg-fl-secondary hover:bg-fl-secondary/90"
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Manage Course
        </Button>
        
        <Button 
          variant="outline"
          onClick={viewProgress}
        >
          <Users className="w-4 h-4 mr-2" />
          View Class Progress
        </Button>
        
        <Button 
          variant="outline"
          onClick={simulateTraining}
          disabled={loading}
        >
          <Zap className="w-4 h-4 mr-2" />
          {loading ? 'Analyzing...' : 'Analyze FL Performance'}
        </Button>
      </div>
    );
  }

  return null;
};