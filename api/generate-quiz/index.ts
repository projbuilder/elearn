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

export async function generateQuiz(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as any;
    const { moduleId, courseId, difficulty = 'medium', questionCount = 5 } = body;

    if (!moduleId && !courseId) {
      return {
        status: 400,
        jsonBody: { error: "Either moduleId or courseId is required" }
      };
    }

    // 1. Get course content
    const { data: content } = await supabase
      .from('course_content')
      .select('content_text, title')
      .eq('course_id', courseId)
      .limit(5);

    if (!content || content.length === 0) {
      return {
        status: 404,
        jsonBody: { error: "No content found for this course" }
      };
    }

    const courseText = content.map(c => c.content_text).join('\n\n').substring(0, 3000);

    // 2. Generate quiz using AI
    const prompt = `Based on the following course material, generate ${questionCount} quiz questions at ${difficulty} difficulty level.

Course Material:
${courseText}

Generate questions in the following JSON format:
{
  "questions": [
    {
      "question": "Question text here?",
      "type": "multiple_choice",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Why this is the correct answer"
    }
  ]
}

Mix question types: multiple_choice, true_false, and short_answer.
Ensure questions test understanding, not just memorization.`;

    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o",
      messages: [
        { role: 'system', content: 'You are an expert educational content creator. Generate high-quality quiz questions.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      response_format: { type: "json_object" }
    });

    const quizData = JSON.parse(completion.choices[0]?.message?.content || '{"questions":[]}');

    // 3. Save quiz to database
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        module_id: moduleId,
        generated_by: 'ai',
        difficulty
      })
      .select('id')
      .single();

    if (quizError) throw quizError;

    // 4. Save questions
    const questions = quizData.questions.map((q: any) => ({
      quiz_id: quiz.id,
      question: q.question,
      type: q.type,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      difficulty_score: difficulty === 'easy' ? 0.3 : difficulty === 'hard' ? 0.8 : 0.5
    }));

    const { error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questions);

    if (questionsError) throw questionsError;

    return {
      status: 200,
      jsonBody: {
        quizId: quiz.id,
        questions: quizData.questions,
        message: `Generated ${questionCount} questions successfully`
      }
    };

  } catch (error: any) {
    context.error('Quiz Generation Error:', error);
    return {
      status: 500,
      jsonBody: { error: error.message || 'Failed to generate quiz' }
    };
  }
}

app.http('generate-quiz', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: generateQuiz
});
