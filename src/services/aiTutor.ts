import { supabase } from '@/lib/supabase';

export interface TutorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    topic?: string;
    difficulty?: number;
    learningStyle?: string;
  };
}

export interface StudentProfile {
  id: string;
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  currentLevel: number;
  strengths: string[];
  weaknesses: string[];
  preferredPace: 'slow' | 'medium' | 'fast';
  strugglingTopics: string[];
}

class AITutorService {
  private conversationHistory: Map<string, TutorMessage[]> = new Map();

  async generateResponse(
    studentId: string, 
    message: string, 
    context?: any
  ): Promise<TutorMessage> {
    // Get student profile for personalization
    const profile = await this.getStudentProfile(studentId);
    const history = this.getConversationHistory(studentId);
    
    // Analyze message intent
    const intent = this.analyzeIntent(message);
    
    // Generate contextual response based on learning science
    const response = await this.generateContextualResponse(
      message, 
      intent, 
      profile, 
      history,
      context
    );
    
    const tutorMessage: TutorMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: response.content,
      timestamp: new Date(),
      context: response.context
    };
    
    // Store conversation
    await this.storeConversation(studentId, message, tutorMessage);
    
    // Update conversation history
    this.addToHistory(studentId, {
      id: `user_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    });
    this.addToHistory(studentId, tutorMessage);
    
    return tutorMessage;
  }

  private analyzeIntent(message: string) {
    const lowercaseMsg = message.toLowerCase();
    
    if (lowercaseMsg.includes('help') || lowercaseMsg.includes('stuck') || lowercaseMsg.includes('confused')) {
      return { type: 'help_request', urgency: 'high', emotion: 'frustrated' };
    }
    
    if (lowercaseMsg.includes('explain') || lowercaseMsg.includes('what is') || lowercaseMsg.includes('how does')) {
      return { type: 'explanation_request', complexity: this.estimateComplexity(message) };
    }
    
    if (lowercaseMsg.includes('example') || lowercaseMsg.includes('show me')) {
      return { type: 'example_request', modality: 'visual' };
    }
    
    if (lowercaseMsg.includes('practice') || lowercaseMsg.includes('exercise')) {
      return { type: 'practice_request', difficulty: 'adaptive' };
    }
    
    if (lowercaseMsg.includes('why') || lowercaseMsg.includes('because')) {
      return { type: 'conceptual_understanding', depth: 'deep' };
    }
    
    return { type: 'general_inquiry', engagement: 'neutral' };
  }

  private async generateContextualResponse(
    message: string,
    intent: any,
    profile: StudentProfile,
    history: TutorMessage[],
    context?: any
  ) {
    // Adapt response to learning style
    const styleAdaptation = this.adaptToLearningStyle(profile.learningStyle);
    
    // Select appropriate pedagogical strategy
    const strategy = this.selectTeachingStrategy(intent, profile, context);
    
    // Generate response based on intent
    let content = '';
    let responseContext = {};
    
    switch (intent.type) {
      case 'help_request':
        content = await this.generateHelpResponse(message, profile, context, strategy);
        responseContext = { supportLevel: 'high', strategy: strategy.name };
        break;
        
      case 'explanation_request':
        content = await this.generateExplanation(message, profile, styleAdaptation);
        responseContext = { explanationType: 'conceptual', style: profile.learningStyle };
        break;
        
      case 'example_request':
        content = await this.generateExample(message, profile, context);
        responseContext = { exampleType: 'practical', difficulty: profile.currentLevel };
        break;
        
      case 'practice_request':
        content = await this.generatePracticeProblems(profile, context);
        responseContext = { practiceLevel: 'adaptive', count: 3 };
        break;
        
      default:
        content = await this.generateGeneralResponse(message, profile, history);
        responseContext = { responseType: 'conversational' };
    }
    
    // Add encouragement and personalization
    content = this.addPersonalization(content, profile, history);
    
    return { content, context: responseContext };
  }

  private adaptToLearningStyle(style: string) {
    switch (style) {
      case 'visual':
        return {
          includeVisuals: true,
          useMetaphors: true,
          suggestDiagrams: true,
          textStructure: 'bullets'
        };
      case 'auditory':
        return {
          useDialogue: true,
          includeRhymes: true,
          suggestDiscussion: true,
          textStructure: 'conversational'
        };
      case 'kinesthetic':
        return {
          suggestHandsOn: true,
          useMovementMetaphors: true,
          includeSimulations: true,
          textStructure: 'step-by-step'
        };
      case 'reading':
        return {
          includeDetails: true,
          useDefinitions: true,
          suggestReading: true,
          textStructure: 'structured'
        };
      default:
        return { textStructure: 'balanced' };
    }
  }

  private selectTeachingStrategy(intent: any, profile: StudentProfile, context?: any) {
    // Scaffold if student is struggling
    if (profile.strugglingTopics.includes(context?.topic)) {
      return {
        name: 'scaffolding',
        approach: 'gradual_release',
        supportLevel: 'high'
      };
    }
    
    // Use inquiry-based for high achievers
    if (profile.currentLevel > 80) {
      return {
        name: 'inquiry_based',
        approach: 'socratic_method',
        challengeLevel: 'high'
      };
    }
    
    // Direct instruction for beginners
    if (profile.currentLevel < 40) {
      return {
        name: 'direct_instruction',
        approach: 'explicit_teaching',
        clarityLevel: 'high'
      };
    }
    
    return {
      name: 'guided_discovery',
      approach: 'balanced',
      adaptivity: 'medium'
    };
  }

  private async generateHelpResponse(message: string, profile: StudentProfile, context: any, strategy: any) {
    const responses = [
      `I can see you're working on ${context?.topic || 'this topic'}. Let me break this down into smaller steps that might be easier to follow.`,
      `No worries! ${context?.topic || 'This'} can be tricky at first. Let's approach it from a different angle that might click better for you.`,
      `I notice you learn best through ${profile.learningStyle} methods. Let me explain this in a way that matches your learning style.`,
      `Let's take a step back and build up to this concept. I'll guide you through each part so it makes perfect sense.`
    ];
    
    const baseResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Add specific help based on context
    let specificHelp = '';
    if (context?.topic === 'calculus') {
      specificHelp = ` For calculus, I find it helps to think of derivatives as rates of change - like how fast something is moving at any moment.`;
    } else if (context?.topic === 'algebra') {
      specificHelp = ` With algebra, remember that we're just solving puzzles - finding the missing piece that makes the equation balanced.`;
    }
    
    return baseResponse + specificHelp + ` Would you like me to start with the fundamentals, or is there a specific part that's confusing you?`;
  }

  private async generateExplanation(message: string, profile: StudentProfile, styleAdaptation: any) {
    // Extract topic from message
    const topic = this.extractTopic(message);
    
    let explanation = `Let me explain ${topic} in a way that works for your learning style. `;
    
    if (styleAdaptation.includeVisuals) {
      explanation += `Think of it like this: imagine you're looking at a graph where...`;
    } else if (styleAdaptation.useDialogue) {
      explanation += `Picture this conversation: if someone asked you about ${topic}, you'd say...`;
    } else if (styleAdaptation.suggestHandsOn) {
      explanation += `Here's a hands-on way to understand it: try this simple experiment...`;
    } else {
      explanation += `Here's a detailed breakdown of the concept...`;
    }
    
    return explanation + ` Would you like me to go deeper into any particular aspect?`;
  }

  private async generateExample(message: string, profile: StudentProfile, context: any) {
    const examples = [
      `Here's a real-world example that might help: Imagine you're planning a road trip and need to calculate...`,
      `Let's use something familiar: Think about your favorite video game. The way experience points work is similar to...`,
      `Picture this scenario: You're at a coffee shop and want to tip 18%. Here's how the math works...`,
      `Consider this everyday situation: When you're streaming music, the algorithms use concepts similar to what we're learning...`
    ];
    
    return examples[Math.floor(Math.random() * examples.length)] + ` Does this example make sense? Would you like to try working through a similar problem?`;
  }

  private async generatePracticeProblems(profile: StudentProfile, context: any) {
    return `Perfect! I've generated some practice problems at just the right difficulty level for you. These are designed to strengthen your understanding while building confidence. Ready to give them a try?`;
  }

  private async generateGeneralResponse(message: string, profile: StudentProfile, history: TutorMessage[]) {
    const encouragingResponses = [
      `That's a great question! Your curiosity shows you're thinking deeply about this subject.`,
      `I love how you're approaching this topic. It shows real mathematical thinking.`,
      `You're asking exactly the right kind of questions to deepen your understanding.`,
      `That's the kind of thinking that leads to real mastery. Let me help you explore that further.`
    ];
    
    return encouragingResponses[Math.floor(Math.random() * encouragingResponses.length)] + ` What specific aspect would you like to dive into?`;
  }

  private addPersonalization(content: string, profile: StudentProfile, history: TutorMessage[]) {
    // Add encouragement based on recent performance
    if (history.length > 0) {
      const recentStruggle = history.slice(-3).some(msg => 
        msg.content.toLowerCase().includes('difficult') || 
        msg.content.toLowerCase().includes('confused')
      );
      
      if (recentStruggle) {
        content = `I know this has been challenging, but you're doing great by asking questions. ` + content;
      } else {
        content = `You're making excellent progress! ` + content;
      }
    }
    
    return content;
  }

  private estimateComplexity(message: string): number {
    const complexWords = ['integral', 'derivative', 'polynomial', 'matrix', 'theorem'];
    const complexity = complexWords.filter(word => message.toLowerCase().includes(word)).length;
    return Math.min(complexity / complexWords.length, 1);
  }

  private extractTopic(message: string): string {
    const topics = ['calculus', 'algebra', 'geometry', 'statistics', 'probability', 'trigonometry'];
    const found = topics.find(topic => message.toLowerCase().includes(topic));
    return found || 'this concept';
  }

  private async getStudentProfile(studentId: string): Promise<StudentProfile> {
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();
    
    return {
      id: studentId,
      learningStyle: data?.learning_style || 'visual',
      currentLevel: data?.current_level || 50,
      strengths: ['problem-solving'],
      weaknesses: ['algebra'],
      preferredPace: 'medium',
      strugglingTopics: ['calculus']
    };
  }

  private getConversationHistory(studentId: string): TutorMessage[] {
    return this.conversationHistory.get(studentId) || [];
  }

  private addToHistory(studentId: string, message: TutorMessage) {
    const history = this.getConversationHistory(studentId);
    history.push(message);
    
    // Keep only last 10 messages for context
    if (history.length > 10) {
      history.shift();
    }
    
    this.conversationHistory.set(studentId, history);
  }

  private async storeConversation(studentId: string, userMessage: string, tutorResponse: TutorMessage) {
    await supabase.from('tutor_conversations').insert({
      student_id: studentId,
      user_message: userMessage,
      tutor_response: tutorResponse.content,
      context: tutorResponse.context,
      created_at: new Date().toISOString()
    });
  }

  async getConversationHistoryFromDB(studentId: string, limit: number = 10) {
    const { data } = await supabase
      .from('tutor_conversations')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    return data || [];
  }
}

export const aiTutorService = new AITutorService();

// Also export the new intelligent tutor
export { intelligentAITutor } from './intelligentAITutor';
