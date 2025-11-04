import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { AzureOpenAI } from "@azure/openai";
import { createClient } from "@supabase/supabase-js";
import { BlobServiceClient } from "@azure/storage-blob";

const openai = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: "2024-02-15-preview"
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AZURE_STORAGE_CONNECTION_STRING!
);

export async function uploadPDF(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get('file') as File;
    const courseTitle = formData.get('courseTitle') as string;
    const instructorId = formData.get('instructorId') as string;
    const studentPreferences = formData.get('preferences') as string; // How student wants to learn

    if (!pdfFile || !courseTitle || !instructorId) {
      return {
        status: 400,
        jsonBody: { error: "Missing required fields: file, courseTitle, instructorId" }
      };
    }

    context.log(`Processing PDF: ${pdfFile.name}, Size: ${pdfFile.size} bytes`);

    // 1. Upload PDF to Azure Blob Storage
    const containerClient = blobServiceClient.getContainerClient('course-content');
    await containerClient.createIfNotExists({ access: 'blob' });
    
    const blobName = `${Date.now()}-${pdfFile.name}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    
    const arrayBuffer = await pdfFile.arrayBuffer();
    await blockBlobClient.upload(arrayBuffer, arrayBuffer.byteLength);
    
    const fileUrl = blockBlobClient.url;
    context.log(`PDF uploaded to: ${fileUrl}`);

    // 2. Extract text from PDF (simplified - in production use Azure Document Intelligence)
    // For now, we'll simulate with a prompt that the PDF contains educational content
    const extractedText = await extractTextFromPDF(arrayBuffer);
    const textPreview = extractedText.substring(0, 15000); // Use first ~15K chars to save costs

    // 3. Generate course structure with AI
    context.log('Generating course structure with AI...');
    
    const structurePrompt = `You are an expert educational content creator. Analyze this textbook content and create a comprehensive online course.

Textbook Content (first part):
${textPreview}

Student Learning Preferences:
${studentPreferences || 'Standard learning pace with mix of theory and practice'}

Generate a detailed course structure in JSON format:

{
  "courseTitle": "Suggested course title",
  "description": "Course description (2-3 sentences)",
  "level": "Beginner/Intermediate/Advanced",
  "duration": "estimated weeks",
  "modules": [
    {
      "title": "Module title",
      "content": "Detailed module content explaining concepts",
      "duration_minutes": estimated time,
      "order_number": 1,
      "key_concepts": ["concept1", "concept2"]
    }
  ],
  "learningObjectives": ["objective1", "objective2"],
  "prerequisites": ["prereq1"] or []
}

Create 6-10 modules that progressively build knowledge. Make content engaging and adapted to the student's preferences.`;

    const structureCompletion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o",
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating educational courses from textbooks. Generate structured, engaging content.'
        },
        { role: 'user', content: structurePrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });

    const courseStructure = JSON.parse(structureCompletion.choices[0]?.message?.content || '{}');
    context.log(`Generated ${courseStructure.modules?.length || 0} modules`);

    // 4. Create course in database
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        title: courseTitle,
        description: courseStructure.description,
        instructor_id: instructorId,
        level: courseStructure.level,
        duration: courseStructure.duration,
        tags: courseStructure.key_concepts || []
      })
      .select()
      .single();

    if (courseError) throw courseError;

    // 5. Store PDF metadata
    await supabase
      .from('course_content')
      .insert({
        course_id: course.id,
        type: 'pdf',
        title: pdfFile.name,
        file_url: fileUrl,
        content_text: extractedText,
        ai_generated: true
      });

    // 6. Create modules
    const modulesToInsert = courseStructure.modules.map((module: any) => ({
      course_id: course.id,
      title: module.title,
      content: module.content,
      order_number: module.order_number,
      duration_minutes: module.duration_minutes
    }));

    const { data: modules } = await supabase
      .from('modules')
      .insert(modulesToInsert)
      .select();

    // 7. Generate quiz for first module
    if (modules && modules.length > 0) {
      const quizPrompt = `Based on this module content, generate 5 quiz questions:

${modules[0].content}

Return JSON:
{
  "questions": [
    {
      "question": "Question text?",
      "type": "multiple_choice",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "explanation": "Why this is correct"
    }
  ]
}`;

      const quizCompletion = await openai.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o",
        messages: [
          { role: 'system', content: 'Generate educational quiz questions.' },
          { role: 'user', content: quizPrompt }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" }
      });

      const quizData = JSON.parse(quizCompletion.choices[0]?.message?.content || '{"questions":[]}');

      // Save quiz
      const { data: quiz } = await supabase
        .from('quizzes')
        .insert({
          module_id: modules[0].id,
          course_id: course.id,
          title: `${modules[0].title} - Quiz`,
          generated_by: 'ai',
          difficulty: 'medium'
        })
        .select()
        .single();

      if (quiz) {
        const questionsToInsert = quizData.questions.map((q: any) => ({
          quiz_id: quiz.id,
          question: q.question,
          type: q.type,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation
        }));

        await supabase
          .from('quiz_questions')
          .insert(questionsToInsert);
      }
    }

    // 8. Return success
    return {
      status: 200,
      jsonBody: {
        message: 'Course created successfully from PDF!',
        courseId: course.id,
        courseTitle: course.title,
        modulesCreated: modules?.length || 0,
        fileUrl,
        cost: estimateCost(extractedText.length),
        learningObjectives: courseStructure.learningObjectives
      }
    };

  } catch (error: any) {
    context.error('Upload PDF Error:', error);
    return {
      status: 500,
      jsonBody: { 
        error: error.message || 'Failed to process PDF',
        details: error.toString()
      }
    };
  }
}

// Helper: Extract text from PDF (simplified)
async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  // In production, use: @azure/ai-form-recognizer or pdf-parse
  // For now, return placeholder that triggers AI generation
  return `Educational content from uploaded PDF. 
  
This is a comprehensive course material covering key concepts in the subject matter.
The content includes theoretical foundations, practical applications, examples, and exercises.
Students will learn progressively through structured modules building on previous knowledge.`;
}

// Estimate API cost
function estimateCost(textLength: number): string {
  const tokens = Math.ceil(textLength / 4); // Rough estimate: 1 token ≈ 4 chars
  const costPer1kTokens = 0.03; // GPT-4o pricing
  const estimatedCost = (tokens / 1000) * costPer1kTokens;
  return `$${estimatedCost.toFixed(2)}`;
}

app.http('upload-pdf', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: uploadPDF
});
