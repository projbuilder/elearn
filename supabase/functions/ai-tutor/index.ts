import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface TutorSession {
  userId: string;
  courseId: string;
  topic: string;
  difficulty: number;
  messages: ChatMessage[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { action, payload } = await req.json();
    console.log('AI Tutor action:', action);

    switch (action) {
      case 'chat':
        return await handleChat(supabase, payload);
      
      case 'get_explanation':
        return await getExplanation(supabase, payload);
      
      case 'generate_quiz':
        return await generateQuiz(supabase, payload);
      
      case 'get_hints':
        return await getHints(supabase, payload);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('AI Tutor error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleChat(supabase: any, payload: { message: string, userId: string, topic: string }) {
  console.log('Processing chat message:', payload.message.substring(0, 50));

  // Simulate intelligent AI response based on the message content
  const responses = generateContextualResponse(payload.message, payload.topic);
  
  // Store conversation in user's learning history
  const conversationEntry = {
    user_id: payload.userId,
    interaction_type: 'ai_chat',
    topic: payload.topic,
    content: {
      user_message: payload.message,
      ai_response: responses.message,
      confidence: responses.confidence,
      difficulty_adjustment: responses.difficultyAdjustment
    },
    created_at: new Date().toISOString()
  };

  // Note: In a real implementation, you'd store this in a conversations table
  console.log('Conversation logged:', conversationEntry);

  return new Response(
    JSON.stringify({
      message: responses.message,
      confidence: responses.confidence,
      suggestions: responses.suggestions,
      resources: responses.resources,
      difficultyAdjustment: responses.difficultyAdjustment
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getExplanation(supabase: any, payload: { concept: string, level: string }) {
  const explanations = {
    'machine learning': {
      beginner: "Machine Learning is like teaching a computer to learn patterns from examples, just like how you learn to recognize faces by seeing many different people.",
      intermediate: "Machine Learning uses algorithms to find patterns in data and make predictions or decisions without being explicitly programmed for each specific task.",
      advanced: "Machine Learning encompasses various algorithmic approaches including supervised, unsupervised, and reinforcement learning paradigms that enable systems to improve performance through experience."
    },
    'federated learning': {
      beginner: "Federated Learning is like having a study group where everyone learns together but keeps their notes private. Each person improves from the group's knowledge without sharing their personal study materials.",
      intermediate: "Federated Learning trains AI models across multiple devices or servers while keeping data localized, using techniques like FedAvg to aggregate model updates rather than raw data.",
      advanced: "Federated Learning implements distributed machine learning where model parameters are collaboratively trained across decentralized nodes using differential privacy and secure aggregation protocols."
    },
    'neural networks': {
      beginner: "Neural Networks are inspired by how our brain works - they have layers of connected nodes that process information step by step to solve problems.",
      intermediate: "Neural Networks consist of interconnected layers of neurons that transform input data through weighted connections and activation functions to produce outputs.",
      advanced: "Neural Networks are computational graphs with learnable parameters that approximate complex functions through gradient-based optimization and backpropagation."
    }
  };

  const concept = payload.concept.toLowerCase();
  const level = payload.level.toLowerCase();
  
  const explanation = explanations[concept]?.[level] || 
    "I'd be happy to explain that concept! Could you provide a bit more context about what specifically you'd like to understand?";

  const resources = generateResources(concept, level);

  return new Response(
    JSON.stringify({
      explanation,
      resources,
      relatedConcepts: getRelatedConcepts(concept),
      difficulty: level,
      estimatedReadTime: Math.floor(explanation.length / 20) + 1 // roughly 20 chars per second
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function generateQuiz(supabase: any, payload: { topic: string, difficulty: number, questionCount: number }) {
  const quizQuestions = {
    'machine learning': [
      {
        question: "What is the main goal of supervised learning?",
        options: [
          "To find hidden patterns in data",
          "To learn from labeled examples to make predictions",
          "To reward an agent for good actions",
          "To reduce the dimensionality of data"
        ],
        correct: 1,
        explanation: "Supervised learning uses labeled training data to learn a mapping from inputs to outputs."
      },
      {
        question: "Which of these is NOT a type of machine learning?",
        options: [
          "Supervised Learning",
          "Unsupervised Learning", 
          "Reinforcement Learning",
          "Deterministic Learning"
        ],
        correct: 3,
        explanation: "Deterministic Learning is not a recognized type of machine learning paradigm."
      }
    ],
    'federated learning': [
      {
        question: "What is the key advantage of Federated Learning?",
        options: [
          "Faster training speed",
          "Data privacy and security", 
          "Lower computational costs",
          "Better accuracy"
        ],
        correct: 1,
        explanation: "Federated Learning's main advantage is keeping data local while still enabling collaborative learning."
      },
      {
        question: "In Federated Learning, what is typically shared between nodes?",
        options: [
          "Raw training data",
          "Model parameters/updates",
          "Personal information", 
          "Database schemas"
        ],
        correct: 1,
        explanation: "Only model parameters or gradients are shared, never the raw training data."
      }
    ]
  };

  const topicQuestions = quizQuestions[payload.topic.toLowerCase()] || quizQuestions['machine learning'];
  const selectedQuestions = topicQuestions.slice(0, payload.questionCount);

  return new Response(
    JSON.stringify({
      topic: payload.topic,
      difficulty: payload.difficulty,
      questions: selectedQuestions,
      timeLimit: payload.questionCount * 60, // 1 minute per question
      passingScore: 70
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getHints(supabase: any, payload: { question: string, topic: string }) {
  const hints = [
    "Think about the core concepts we've discussed in this topic.",
    "Consider the practical applications and real-world examples.",
    "Break down the problem into smaller components.",
    "Remember the key differences between similar concepts."
  ];

  const contextualHints = generateContextualHints(payload.question, payload.topic);

  return new Response(
    JSON.stringify({
      hints: contextualHints.length > 0 ? contextualHints : hints,
      difficulty: "adaptive",
      confidence: 0.8
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function generateContextualResponse(message: string, topic: string) {
  const lowerMessage = message.toLowerCase();
  
  // Basic keyword matching and response generation
  if (lowerMessage.includes('help') || lowerMessage.includes('confused')) {
    return {
      message: "I understand you're looking for help! Let me break this down step by step. What specific part of " + topic + " would you like me to clarify?",
      confidence: 0.9,
      suggestions: ["Ask for examples", "Request step-by-step explanation", "Get practice problems"],
      resources: ["Interactive tutorial", "Video explanation", "Practice exercises"],
      difficultyAdjustment: -1
    };
  }
  
  if (lowerMessage.includes('example') || lowerMessage.includes('show me')) {
    return {
      message: `Great question! Here's a practical example of ${topic}: Imagine you're training a model to recognize cats in photos. In traditional ML, you'd collect all photos in one place. With federated learning, each phone keeps its cat photos private but contributes to improving the global cat-recognition model.`,
      confidence: 0.95,
      suggestions: ["Try the interactive demo", "See more examples", "Test your understanding"],
      resources: ["Visual demonstration", "Code example", "Case study"],
      difficultyAdjustment: 0
    };
  }
  
  if (lowerMessage.includes('why') || lowerMessage.includes('explain')) {
    return {
      message: `Excellent question about ${topic}! The key insight is that this approach solves real privacy concerns while still enabling collaborative AI. Think of it like a study group where everyone learns from each other's insights without sharing their personal notes.`,
      confidence: 0.85,
      suggestions: ["Deep dive into technical details", "Explore related concepts", "Compare with alternatives"],
      resources: ["Technical paper", "Comparison chart", "Advanced tutorial"],
      difficultyAdjustment: 1
    };
  }

  // Default response
  return {
    message: `That's an interesting point about ${topic}! I can see you're thinking critically about this. Would you like me to elaborate on any specific aspect, or shall we explore how this connects to other concepts you're learning?`,
    confidence: 0.7,
    suggestions: ["Ask follow-up questions", "Request more details", "Move to next topic"],
    resources: ["Related articles", "Discussion forum", "Office hours"],
    difficultyAdjustment: 0
  };
}

function generateResources(concept: string, level: string) {
  const baseResources = {
    beginner: ["Interactive tutorial", "Video explanation", "Simple examples"],
    intermediate: ["Detailed guide", "Code walkthrough", "Practice problems"], 
    advanced: ["Research papers", "Implementation details", "Advanced case studies"]
  };
  
  return baseResources[level] || baseResources.intermediate;
}

function getRelatedConcepts(concept: string) {
  const relationships = {
    'machine learning': ['artificial intelligence', 'data science', 'statistics'],
    'federated learning': ['machine learning', 'privacy', 'distributed systems'],
    'neural networks': ['deep learning', 'artificial intelligence', 'backpropagation']
  };
  
  return relationships[concept] || ['artificial intelligence', 'data science'];
}

function generateContextualHints(question: string, topic: string) {
  // Generate hints based on question context
  const hints = [];
  
  if (question.toLowerCase().includes('federated')) {
    hints.push("Think about the privacy aspect - what stays local vs what gets shared?");
    hints.push("Consider the difference between sharing data vs sharing model updates.");
  }
  
  if (question.toLowerCase().includes('accuracy') || question.toLowerCase().includes('performance')) {
    hints.push("Compare local performance vs global model performance.");
    hints.push("Think about how many participants affect the outcome.");
  }
  
  return hints;
}