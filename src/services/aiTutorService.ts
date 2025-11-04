const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7071/api'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export interface TutorResponse {
  response: string
  conversationId: number
  hasContext: boolean
}

export const aiTutorService = {
  // Send message to AI tutor
  async sendMessage(
    userId: string,
    message: string,
    courseId?: number,
    conversationId?: number
  ): Promise<TutorResponse> {
    const response = await fetch(`${API_BASE_URL}/ai-tutor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        courseId,
        message,
        conversationId
      })
    })

    if (!response.ok) {
      throw new Error('Failed to get AI response')
    }

    return await response.json()
  },

  // Generate quiz from course content
  async generateQuiz(
    courseId: number,
    moduleId?: number,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    questionCount: number = 5
  ) {
    const response = await fetch(`${API_BASE_URL}/generate-quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courseId,
        moduleId,
        difficulty,
        questionCount
      })
    })

    if (!response.ok) {
      throw new Error('Failed to generate quiz')
    }

    return await response.json()
  },

  // Generate flashcards
  async generateFlashcards(courseId: number, moduleId?: number, count: number = 10) {
    const response = await fetch(`${API_BASE_URL}/generate-flashcards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        courseId,
        moduleId,
        count
      })
    })

    if (!response.ok) {
      throw new Error('Failed to generate flashcards')
    }

    return await response.json()
  },

  // Get personalized learning path
  async getLearningPath(userId: string, courseId: number) {
    const response = await fetch(`${API_BASE_URL}/learning-path`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        courseId
      })
    })

    if (!response.ok) {
      throw new Error('Failed to get learning path')
    }

    return await response.json()
  },

  // Analyze student performance
  async analyzePerformance(userId: string, courseId: number) {
    const response = await fetch(`${API_BASE_URL}/analyze-performance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        courseId
      })
    })

    if (!response.ok) {
      throw new Error('Failed to analyze performance')
    }

    return await response.json()
  }
}

// Real-time streaming chat (for future implementation)
export async function* streamChat(
  userId: string,
  message: string,
  courseId?: number,
  conversationId?: number
) {
  const response = await fetch(`${API_BASE_URL}/ai-tutor-stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      courseId,
      message,
      conversationId
    })
  })

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()

  if (!reader) {
    throw new Error('No response reader')
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    
    const chunk = decoder.decode(value)
    yield chunk
  }
}
