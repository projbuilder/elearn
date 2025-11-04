import { useState } from 'react'
import { Upload, FileText, Sparkles, X, Loader2, CheckCircle } from 'lucide-react'
import { useAuth } from '@/core/auth'

interface PDFCourseUploaderProps {
  onSuccess: () => void
  onClose: () => void
}

export function PDFCourseUploader({ onSuccess, onClose }: PDFCourseUploaderProps) {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [courseTitle, setCourseTitle] = useState('')
  const [preferences, setPreferences] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile)
        setError('')
        // Auto-suggest course title from filename
        const name = selectedFile.name.replace('.pdf', '').replace(/_/g, ' ')
        setCourseTitle(name)
      } else {
        setError('Please upload a PDF file')
      }
    }
  }

  const handleUpload = async () => {
    if (!file || !courseTitle || !user) {
      setError('Please fill in all required fields')
      return
    }

    setUploading(true)
    setProgress('Uploading PDF...')
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('courseTitle', courseTitle)
      formData.append('instructorId', user.id)
      formData.append('preferences', preferences)

      setProgress('Analyzing content with AI...')

      const response = await fetch(`${import.meta.env.VITE_API_URL}/upload-pdf`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      setProgress('Generating course structure...')
      const data = await response.json()
      
      setProgress('Creating modules and quizzes...')
      setResult(data)
      
      setTimeout(() => {
        onSuccess()
      }, 2000)

    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload PDF. Make sure Azure Functions is running.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">AI Course Generator</h3>
              <p className="text-sm text-muted-foreground">Upload a PDF textbook and let AI create your course</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={uploading}
            className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {!result ? (
            <>
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Upload PDF Textbook *</label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    file
                      ? 'border-fl-primary bg-fl-primary/10'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label
                    htmlFor="pdf-upload"
                    className="cursor-pointer block"
                  >
                    {file ? (
                      <div className="flex items-center justify-center gap-3">
                        <FileText className="w-12 h-12 text-fl-primary" />
                        <div className="text-left">
                          <p className="font-semibold">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="font-medium mb-1">Drop PDF here or click to browse</p>
                        <p className="text-sm text-muted-foreground">Max 50MB • Textbooks work best</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Course Title */}
              <div>
                <label className="block text-sm font-medium mb-2">Course Title *</label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  placeholder="e.g., Introduction to Machine Learning"
                  disabled={uploading}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-fl-primary disabled:opacity-50"
                />
              </div>

              {/* Learning Preferences */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  How Should Students Learn? (Optional)
                </label>
                <textarea
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  placeholder="e.g., Focus on practical examples, include coding exercises, make it beginner-friendly, emphasize real-world applications..."
                  disabled={uploading}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-fl-primary resize-none disabled:opacity-50"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  The AI will customize the course based on these preferences
                </p>
              </div>

              {/* Cost Estimate */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-400 mb-1">AI Magic Included:</p>
                    <ul className="space-y-1 text-blue-300">
                      <li>• Analyzes entire textbook content</li>
                      <li>• Creates 6-10 structured modules</li>
                      <li>• Generates quiz questions automatically</li>
                      <li>• Adapts to student learning preferences</li>
                      <li>• Estimated cost: $2-5 per textbook</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Progress */}
              {uploading && (
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-fl-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{progress}</p>
                      <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-fl-primary to-fl-secondary animate-pulse" style={{ width: '70%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Success Result */
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h4 className="text-2xl font-bold mb-2">Course Created Successfully!</h4>
              <p className="text-muted-foreground mb-6">{result.message}</p>
              
              <div className="bg-white/5 rounded-lg p-6 space-y-3 text-left mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Course:</span>
                  <span className="font-semibold">{result.courseTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modules Created:</span>
                  <span className="font-semibold text-fl-primary">{result.modulesCreated}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AI Cost:</span>
                  <span className="font-semibold text-green-400">{result.cost}</span>
                </div>
              </div>

              {result.learningObjectives && (
                <div className="bg-white/5 rounded-lg p-4 text-left mb-6">
                  <p className="font-semibold mb-2">Learning Objectives:</p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    {result.learningObjectives.map((obj: string, i: number) => (
                      <li key={i}>• {obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Redirecting to your courses...
              </p>
            </div>
          )}
        </div>

        {!result && (
          <div className="flex gap-3 p-6 border-t border-border">
            <button
              onClick={onClose}
              disabled={uploading}
              className="flex-1 px-4 py-3 bg-card border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || !courseTitle || uploading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Course...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Course with AI
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
