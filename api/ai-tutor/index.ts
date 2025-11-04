import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AzureOpenAI } from "@azure/openai";
import { createClient } from "@supabase/supabase-js";

const openai = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: "2024-02-15-preview"
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function aiTutor(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as any;
    const { userId, courseId, message, conversationId } = body;

    if (!userId || !message) {
      return {
        status: 400,
        jsonBody: { error: "Missing required fields: userId, message" }
      };
    }

    // 1. Retrieve conversation history
    let conversation: any[] = [];
    if (conversationId) {
      const { data: existingConv } = await supabase
        .from('tutor_conversations')
        .select('messages')
        .eq('id', conversationId)
        .single();
      
      conversation = existingConv?.messages || [];
    }

    // 2. Get relevant course content (RAG - Retrieval Augmented Generation)
    let courseContext = "";
    if (courseId) {
      // Get course content using vector similarity search
      const { data: courseContent } = await supabase
        .from('course_content')
        .select('content_text, title')
        .eq('course_id', courseId)
        .limit(3);

      if (courseContent && courseContent.length > 0) {
        courseContext = courseContent
          .map(c => `${c.title}:\n${c.content_text}`)
          .join('\n\n');
      }
    }

    // 3. Build system prompt with course context
    const systemPrompt = `You are an AI tutor for a privacy-preserving e-learning platform using Federated Learning.

Your role:
- Help students understand concepts from their courses
- Generate practice questions and explanations
- Provide personalized learning guidance
- Be encouraging and supportive
- Never share raw student data

${courseContext ? `\n\nCourse Context:\n${courseContext.substring(0, 2000)}` : ''}

Guidelines:
- Answer based on the course content provided
- If the question is outside the course scope, politely redirect
- Provide examples and analogies
- Ask clarifying questions when needed
- Encourage active learning`;

    // 4. Add current message to conversation
    conversation.push({ role: 'user', content: message });

    // 5. Call Azure OpenAI with streaming
    const chatCompletion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o",
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversation.slice(-10) // Last 10 messages for context
      ],
      temperature: 0.7,
      max_tokens: 1000,
      stream: false // Set to true for streaming in production
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    // 6. Save conversation to database
    conversation.push({ role: 'assistant', content: aiResponse });

    const conversationData = {
      user_id: userId,
      course_id: courseId,
      messages: conversation,
      context_used: courseContext ? { hasContext: true } : null,
      updated_at: new Date().toISOString()
    };

    let savedConversationId = conversationId;
    if (conversationId) {
      await supabase
        .from('tutor_conversations')
        .update(conversationData)
        .eq('id', conversationId);
    } else {
      const { data: newConv } = await supabase
        .from('tutor_conversations')
        .insert(conversationData)
        .select('id')
        .single();
      savedConversationId = newConv?.id;
    }

    // 7. Return response
    return {
      status: 200,
      jsonBody: {
        response: aiResponse,
        conversationId: savedConversationId,
        hasContext: !!courseContext
      }
    };

  } catch (error: any) {
    context.error('AI Tutor Error:', error);
    return {
      status: 500,
      jsonBody: { error: error.message || 'Internal server error' }
    };
  }
}

app.http('ai-tutor', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: aiTutor
});
