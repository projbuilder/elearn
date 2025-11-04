import { supabase } from '@/integrations/supabase/client';

export interface TutorMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: any;
  visual?: string;
}

export interface StudentProfile {
  id: string;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  currentLevel: number;
  strengths: string[];
  weaknesses: string[];
  preferredPace: 'slow' | 'medium' | 'fast';
  comprehensionLevel: number;
}

export interface LearningContext {
  currentTopic?: string;
  difficulty?: number;
  recentPerformance?: number;
  strugglingAreas?: string[];
  timeOfDay?: string;
  sessionLength?: number;
}

export class IntelligentAITutor {
  private conversationHistory: Map<string, TutorMessage[]> = new Map();
  private studentProfiles: Map<string, StudentProfile> = new Map();

  constructor() {
    this.initializeTutor();
  }

  private async initializeTutor() {
    // Load existing conversations and profiles
    console.log('AI Tutor initialized');
  }

  async generateResponse(
    studentId: string, 
    message: string, 
    context: LearningContext = {}
  ): Promise<TutorMessage> {
    try {
      // Call backend AI tutor edge function
      const { data, error } = await supabase.functions.invoke('ai-tutor-chat', {
        body: {
          message,
          studentId: studentId,
          courseId: context.currentTopic || 'general',
          conversationHistory: this.conversationHistory.get(studentId)?.slice(-10) || []
        }
      });

      if (error) throw error;

      // Update conversation history
      const history = this.conversationHistory.get(studentId) || [];
      const userMessage: TutorMessage = {
        role: 'user',
        content: message,
        timestamp: new Date(),
        context
      };
      
      const assistantMessage: TutorMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        context: data.context
      };
      
      history.push(userMessage, assistantMessage);
      this.conversationHistory.set(studentId, history.slice(-20)); // Keep last 20 messages

      return assistantMessage;
    } catch (error) {
      console.error('Error generating tutor response:', error);
      
      // Fallback to local generation if backend fails
      const profile = await this.getStudentProfile(studentId);
      const intent = this.analyzeIntent(message);
      const response = await this.generateContextualResponse(
        message, 
        intent, 
        profile, 
        context
      );

      const history = this.conversationHistory.get(studentId) || [];
      const userMessage: TutorMessage = {
        role: 'user',
        content: message,
        timestamp: new Date(),
        context
      };
      
      history.push(userMessage, response);
      this.conversationHistory.set(studentId, history.slice(-20));

      return response;
    }
  }

  private analyzeIntent(message: string): {
    type: 'question' | 'help' | 'explanation' | 'practice' | 'encouragement';
    topic?: string;
    difficulty?: 'basic' | 'intermediate' | 'advanced';
    confidence?: number;
  } {
    const lowerMessage = message.toLowerCase();
    
    // Question detection
    if (lowerMessage.includes('?') || lowerMessage.startsWith('how') || 
        lowerMessage.startsWith('what') || lowerMessage.startsWith('why') ||
        lowerMessage.startsWith('when') || lowerMessage.startsWith('where')) {
      return {
        type: 'question',
        topic: this.extractTopic(message),
        difficulty: this.assessDifficulty(message),
        confidence: 0.8
      };
    }

    // Help request
    if (lowerMessage.includes('help') || lowerMessage.includes('stuck') ||
        lowerMessage.includes('confused') || lowerMessage.includes('don\'t understand')) {
      return {
        type: 'help',
        topic: this.extractTopic(message),
        difficulty: 'basic',
        confidence: 0.9
      };
    }

    // Explanation request
    if (lowerMessage.includes('explain') || lowerMessage.includes('tell me about') ||
        lowerMessage.includes('describe')) {
      return {
        type: 'explanation',
        topic: this.extractTopic(message),
        difficulty: 'intermediate',
        confidence: 0.85
      };
    }

    // Practice request
    if (lowerMessage.includes('practice') || lowerMessage.includes('example') ||
        lowerMessage.includes('problem') || lowerMessage.includes('exercise')) {
      return {
        type: 'practice',
        topic: this.extractTopic(message),
        difficulty: 'intermediate',
        confidence: 0.7
      };
    }

    // Default to encouragement for unclear messages
    return {
      type: 'encouragement',
      confidence: 0.5
    };
  }

  private extractTopic(message: string): string {
    const topics = [
      'calculus', 'algebra', 'geometry', 'statistics', 'probability',
      'physics', 'chemistry', 'biology', 'history', 'literature',
      'programming', 'mathematics', 'science'
    ];

    const lowerMessage = message.toLowerCase();
    for (const topic of topics) {
      if (lowerMessage.includes(topic)) {
        return topic;
      }
    }

    return 'general';
  }

  private assessDifficulty(message: string): 'basic' | 'intermediate' | 'advanced' {
    const advancedKeywords = ['complex', 'advanced', 'difficult', 'challenging'];
    const intermediateKeywords = ['understand', 'explain', 'how', 'why'];
    const basicKeywords = ['simple', 'basic', 'easy', 'beginner'];

    const lowerMessage = message.toLowerCase();

    if (advancedKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'advanced';
    }
    if (basicKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'basic';
    }
    return 'intermediate';
  }

  private async generateContextualResponse(
    message: string,
    intent: any,
    profile: StudentProfile,
    context: LearningContext
  ): Promise<TutorMessage> {
    // Adapt response based on learning style
    const responseStyle = this.adaptToLearningStyle(profile.learningStyle);
    
    // Select teaching strategy
    const strategy = this.selectTeachingStrategy(intent, profile, context);
    
    // Generate response based on intent type
    let content = '';
    let visual = undefined;

    switch (intent.type) {
      case 'question':
        content = this.generateQuestionResponse(message, intent, profile, strategy);
        if (profile.learningStyle === 'visual') {
          visual = this.generateVisualAid(intent.topic);
        }
        break;
        
      case 'help':
        content = this.generateHelpResponse(message, intent, profile, context);
        break;
        
      case 'explanation':
        content = this.generateExplanationResponse(message, intent, profile, strategy);
        if (profile.learningStyle === 'visual') {
          visual = this.generateVisualAid(intent.topic);
        }
        break;
        
      case 'practice':
        content = this.generatePracticeResponse(message, intent, profile);
        break;
        
      case 'encouragement':
      default:
        content = this.generateEncouragementResponse(message, profile, context);
        break;
    }

    return {
      role: 'assistant',
      content: this.personalizeResponse(content, profile),
      timestamp: new Date(),
      context: { intent, strategy },
      visual
    };
  }

  private adaptToLearningStyle(style: string): any {
    switch (style) {
      case 'visual':
        return {
          includeAnalogies: true,
          useDiagrams: true,
          structuredFormat: true,
          colorCoding: true
        };
      case 'auditory':
        return {
          conversationalTone: true,
          rhythmicPatterns: true,
          verbalExplanations: true,
          questionAndAnswer: true
        };
      case 'kinesthetic':
        return {
          handsonExamples: true,
          realWorldApplications: true,
          stepByStep: true,
          interactive: true
        };
      case 'reading':
        return {
          detailedText: true,
          bulletPoints: true,
          definitions: true,
          references: true
        };
      default:
        return {
          balanced: true,
          adaptive: true
        };
    }
  }

  private selectTeachingStrategy(intent: any, profile: StudentProfile, context: LearningContext = {}): string {
    if (context.recentPerformance && context.recentPerformance < 0.6) {
      return 'scaffolding'; // Provide more support
    }
    
    if (profile.currentLevel < 3) {
      return 'guided_discovery';
    }
    
    if (intent.difficulty === 'advanced') {
      return 'socratic_method';
    }
    
    return 'constructivist';
  }

  private generateQuestionResponse(message: string, intent: any, profile: StudentProfile, strategy: string): string {
    const responses = {
      calculus: [
        "Great question about calculus! Let me break this down for you step by step.",
        "Calculus can be tricky, but I'll help you understand this concept clearly.",
        "That's an excellent calculus question! Here's how I'd approach it:"
      ],
      algebra: [
        "Algebra is all about patterns and relationships. Let me show you how to think about this.",
        "Good question! In algebra, we're solving for unknowns. Here's the key insight:",
        "Perfect! This algebra concept becomes clearer when we think of it this way:"
      ],
      statistics: [
        "Statistics helps us make sense of data. For your question, let's consider:",
        "Great statistical thinking! The key to understanding this is:",
        "Excellent question about statistics! Here's how we can approach this:"
      ]
    };

    const topicResponses = responses[intent.topic as keyof typeof responses] || [
      "That's a thoughtful question! Let me help you understand this concept.",
      "Great question! I love your curiosity. Here's how I'd explain this:",
      "Excellent question! Let's explore this together step by step."
    ];

    const baseResponse = topicResponses[Math.floor(Math.random() * topicResponses.length)];
    
    // Add strategy-specific guidance
    if (strategy === 'scaffolding') {
      return baseResponse + "\n\nLet's start with the basics and build up your understanding gradually. First, do you understand the fundamental concept we're working with?";
    } else if (strategy === 'socratic_method') {
      return baseResponse + "\n\nBefore I answer directly, let me ask you - what do you think might be the first step in solving this?";
    }
    
    return baseResponse + "\n\nLet me explain this in a way that matches your learning style.";
  }

  private generateHelpResponse(message: string, intent: any, profile: StudentProfile, context: LearningContext): string {
    const encouragements = [
      "Don't worry, getting stuck is part of learning!",
      "It's completely normal to feel confused sometimes.",
      "You're asking great questions - that shows you're thinking deeply!",
      "Let's work through this together step by step."
    ];

    const baseEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
    
    if (context.strugglingAreas?.includes(intent.topic || '')) {
      return `${baseEncouragement} I notice you've been working hard on ${intent.topic}. Let me try a different approach that might click better for you.\n\nSometimes it helps to think about this concept in terms of something you already know well. What's something you feel confident about in your studies?`;
    }

    return `${baseEncouragement} Let me break this down into smaller, manageable pieces.\n\nFirst, let's identify exactly what part is confusing you. Can you tell me where you started to feel lost?`;
  }

  private generateExplanationResponse(message: string, intent: any, profile: StudentProfile, strategy: string): string {
    const topic = intent.topic || 'this concept';
    
    if (profile.learningStyle === 'visual') {
      return `Let me explain ${topic} using a visual approach.\n\nImagine ${topic} as a building - each part has a specific role and they all work together. The foundation is... [I would continue with visual analogies and mention that I'm preparing a diagram for you]`;
    }
    
    if (profile.learningStyle === 'kinesthetic') {
      return `To understand ${topic}, let's think about it through hands-on examples.\n\nImagine you're physically working with this concept - if you could touch it, move it around, what would happen? Let's explore this through real-world applications...`;
    }
    
    if (profile.learningStyle === 'auditory') {
      return `Let's talk through ${topic} together. \n\nI'll explain it conversationally, and feel free to ask questions as we go. Think of this as a friendly discussion about ${topic}.\n\nSo, the key idea is...`;
    }
    
    // Reading/writing style
    return `Here's a comprehensive explanation of ${topic}:\n\n1. Definition: [Clear definition]\n2. Key Components: [Main parts]\n3. How it works: [Process explanation]\n4. Examples: [Concrete examples]\n5. Applications: [Where it's used]`;
  }

  private generatePracticeResponse(message: string, intent: any, profile: StudentProfile): string {
    const topic = intent.topic || 'this topic';
    
    return `Excellent! Practice is the best way to master ${topic}.\n\nLet me create a practice problem that's just right for your level:\n\n[Practice Problem]\n\nTry working through this step by step. I'll guide you if you need help, and remember - making mistakes is part of learning!\n\nWould you like to work through this together, or do you want to try it on your own first?`;
  }

  private generateEncouragementResponse(message: string, profile: StudentProfile, context: LearningContext): string {
    const encouragements = [
      "I'm here to help you succeed! What would you like to explore today?",
      "Your curiosity is wonderful! What's on your mind?",
      "I love helping students learn. What can we work on together?",
      "Every question is a great question. What would you like to know?",
      "Learning is a journey, and I'm here to guide you. What interests you today?"
    ];

    const baseResponse = encouragements[Math.floor(Math.random() * encouragements.length)];
    
    if (context.timeOfDay === 'morning') {
      return `Good morning! ${baseResponse}\n\nMorning is a great time for learning - your mind is fresh and ready to absorb new concepts!`;
    }
    
    if (context.sessionLength && context.sessionLength > 60) {
      return `${baseResponse}\n\nI notice you've been studying for a while. Great dedication! Remember to take breaks when you need them - your brain processes information better when it's rested.`;
    }
    
    return baseResponse;
  }

  private personalizeResponse(content: string, profile: StudentProfile): string {
    // Add personalization based on profile
    if (profile.preferredPace === 'slow') {
      content += "\n\n💡 Take your time with this - there's no rush. Understanding is more important than speed.";
    } else if (profile.preferredPace === 'fast') {
      content += "\n\n⚡ I can see you like to move quickly! Let me know if you want to dive deeper into any part.";
    }

    // Add encouragement based on strengths
    if (profile.strengths.length > 0) {
      const strength = profile.strengths[Math.floor(Math.random() * profile.strengths.length)];
      content += `\n\n🌟 I know you're really good at ${strength} - you can apply that same thinking here!`;
    }

    return content;
  }

  private generateVisualAid(topic?: string): string | undefined {
    if (!topic) return undefined;
    
    // Mock visual aid generation
    const visualAids = {
      calculus: "📈 [Graph showing derivative concepts]",
      algebra: "🔢 [Visual equation solver diagram]",
      geometry: "📐 [Interactive geometric shapes]",
      statistics: "📊 [Data visualization chart]",
      physics: "⚛️ [Physics simulation diagram]"
    };

    return visualAids[topic as keyof typeof visualAids] || "📚 [Conceptual diagram]";
  }

  private async getStudentProfile(studentId: string): Promise<StudentProfile> {
    // Check cache first
    if (this.studentProfiles.has(studentId)) {
      return this.studentProfiles.get(studentId)!;
    }

    try {
      // Get from database
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', studentId)
        .maybeSingle();

      const studentProfile: StudentProfile = {
        id: studentId,
        learningStyle: (profile?.learning_preferences as any)?.learning_style || 'visual',
        currentLevel: (profile?.learning_preferences as any)?.current_level || 3,
        strengths: (profile?.learning_preferences as any)?.strengths || ['problem solving'],
        weaknesses: (profile?.learning_preferences as any)?.weaknesses || [],
        preferredPace: (profile?.learning_preferences as any)?.preferred_pace || 'medium',
        comprehensionLevel: (profile?.learning_preferences as any)?.comprehension_level || 0.7
      };

      this.studentProfiles.set(studentId, studentProfile);
      return studentProfile;
    } catch (error) {
      // Return default profile
      const defaultProfile: StudentProfile = {
        id: studentId,
        learningStyle: 'visual',
        currentLevel: 3,
        strengths: ['curiosity'],
        weaknesses: [],
        preferredPace: 'medium',
        comprehensionLevel: 0.7
      };
      
      this.studentProfiles.set(studentId, defaultProfile);
      return defaultProfile;
    }
  }

  private async storeConversation(studentId: string, userMessage: string, tutorResponse: string) {
    try {
      // Store in student_progress table for now
      await supabase.from('student_progress').upsert({
        student_id: studentId,
        course_id: 'ai-tutor',
        performance_metrics: {
          conversation: {
            user_message: userMessage,
            tutor_response: tutorResponse,
            timestamp: new Date().toISOString()
          }
        } as any,
        progress_percentage: 0,
        last_accessed_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error storing conversation:', error);
    }
  }

  async getConversationHistoryFromDB(studentId: string, limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('student_progress')
        .select('performance_metrics, created_at')
        .eq('student_id', studentId)
        .eq('course_id', 'ai-tutor')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }
  }

  async analyzeStudentProgress(studentId: string): Promise<{
    overallProgress: number;
    strugglingAreas: string[];
    strengths: string[];
    recommendations: string[];
  }> {
    // This would analyze the student's learning data
    return {
      overallProgress: 0.75,
      strugglingAreas: ['calculus', 'advanced algebra'],
      strengths: ['geometry', 'basic statistics'],
      recommendations: [
        'Focus on calculus fundamentals',
        'Practice more algebra problems',
        'Build on your geometry strengths'
      ]
    };
  }
}

export const intelligentAITutor = new IntelligentAITutor();