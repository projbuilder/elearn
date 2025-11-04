import { useAuth } from '@/core/auth'
import { useState, useEffect } from 'react'
import { LogOut, User as UserIcon, Plus, BookOpen, Users, BarChart, Edit, Eye, Trash2, X, Upload, Sparkles } from 'lucide-react'
import { courseService, Course } from '@/services/courseService'
import { aiTutorService } from '@/services/aiTutorService'
import { PDFCourseUploader } from '@/components/PDFCourseUploader'

export default function InstructorDashboard() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<'courses' | 'analytics'>('courses')
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPDFUploader, setShowPDFUploader] = useState(false)
  const [stats, setStats] = useState({ totalCourses: 0, totalStudents: 0, avgCompletion: 0 })
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    level: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    duration: '',
    thumbnail_url: ''
  })

  useEffect(() => {
    loadInstructorData()
  }, [user])

  async function loadInstructorData() {
    if (!user) return

    setLoading(true)
    try {
      const instructorCourses = await courseService.getCoursesByInstructor(user.id)
      setCourses(instructorCourses)

      // Calculate stats
      let totalStudents = 0
      let totalCompletion = 0
      
      for (const course of instructorCourses) {
        const analytics = await courseService.getCourseAnalytics(course.id)
        totalStudents += analytics.totalStudents
        totalCompletion += analytics.avgCompletion
      }

      const avgCompletion = instructorCourses.length > 0
        ? Math.round(totalCompletion / instructorCourses.length)
        : 0

      setStats({
        totalCourses: instructorCourses.length,
        totalStudents,
        avgCompletion
      })
    } catch (error) {
      console.error('Error loading instructor data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateCourse() {
    if (!user || !newCourse.title || !newCourse.description) {
      alert('Please fill in all required fields')
      return
    }

    try {
      await courseService.createCourse({
        ...newCourse,
        instructor_id: user.id
      })

      setShowCreateModal(false)
      setNewCourse({
        title: '',
        description: '',
        level: 'Beginner',
        duration: '',
        thumbnail_url: ''
      })
      await loadInstructorData()
    } catch (error) {
      console.error('Error creating course:', error)
      alert('Failed to create course')
    }
  }

  async function handleGenerateQuiz(courseId: number) {
    try {
      await aiTutorService.generateQuiz(courseId, undefined, 'medium', 5)
      alert('Quiz generated successfully! Students can now access it.')
    } catch (error) {
      console.error('Quiz generation error:', error)
      alert('Failed to generate quiz. Make sure Azure Functions is running.')
    }
  }

  async function handleDeleteCourse(courseId: number) {
    if (!confirm('Are you sure you want to delete this course?')) return

    try {
      await courseService.deleteCourse(courseId)
      await loadInstructorData()
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete course')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fl-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass-nav border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-fl-gradient">FL Academy - Instructor</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm">{user?.email}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm bg-card border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Instructor Dashboard</h2>
          <p className="text-muted-foreground">Manage your courses and track student progress</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-8 h-8 text-fl-primary" />
              <div className="text-3xl font-bold text-fl-primary">{stats.totalCourses}</div>
            </div>
            <div className="text-sm text-muted-foreground">Your Courses</div>
          </div>
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-fl-secondary" />
              <div className="text-3xl font-bold text-fl-secondary">{stats.totalStudents}</div>
            </div>
            <div className="text-sm text-muted-foreground">Total Students</div>
          </div>
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <BarChart className="w-8 h-8 text-fl-accent" />
              <div className="text-3xl font-bold text-fl-accent">{stats.avgCompletion}%</div>
            </div>
            <div className="text-sm text-muted-foreground">Avg Completion</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('courses')}
            className={`pb-2 px-4 font-medium transition-colors ${
              activeTab === 'courses'
                ? 'text-fl-primary border-b-2 border-fl-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            My Courses
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-2 px-4 font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'text-fl-primary border-b-2 border-fl-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Analytics
          </button>
        </div>

        {/* Content */}
        {activeTab === 'courses' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Your Courses</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowPDFUploader(true)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-glow transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  AI Course from PDF
                </button>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-fl-primary to-fl-secondary text-white rounded-lg hover:shadow-glow transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Manually
                </button>
              </div>
            </div>

            {courses.length === 0 ? (
              <div className="glass-card p-12 rounded-xl text-center">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-xl font-bold mb-2">No Courses Yet</h4>
                <p className="text-muted-foreground mb-6">Create your first course to start teaching!</p>
                <div className="flex gap-4 justify-center">
                  <button 
                    onClick={() => setShowPDFUploader(true)}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-glow transition-all inline-flex items-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    Upload PDF Textbook
                  </button>
                  <button 
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-fl-primary to-fl-secondary text-white rounded-lg hover:shadow-glow transition-all inline-flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Create Manually
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <div key={course.id} className="glass-card rounded-xl overflow-hidden hover:shadow-glow transition-all">
                    <div className="h-40 bg-gradient-to-br from-fl-primary to-fl-secondary relative">
                      {course.thumbnail_url && (
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
                        {course.level}
                      </div>
                    </div>
                    <div className="p-6">
                      <h4 className="font-bold mb-2 line-clamp-1">{course.title}</h4>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {course.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                        <Users className="w-3 h-3" />
                        <span>{course.students_count || 0} students</span>
                      </div>
                      <div className="space-y-2">
                        <button 
                          onClick={() => handleGenerateQuiz(course.id)}
                          className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-glow transition-all text-sm flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          Generate AI Quiz
                        </button>
                        <div className="flex gap-2">
                          <button className="flex-1 py-2 bg-fl-primary text-white rounded-lg hover:bg-fl-primary/90 transition-colors text-sm flex items-center justify-center gap-1">
                            <Edit className="w-3 h-3" />
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteCourse(course.id)}
                            className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <h3 className="text-2xl font-bold mb-6">Course Analytics</h3>
            <div className="space-y-6">
              {courses.length === 0 ? (
                <div className="glass-card p-12 rounded-xl text-center">
                  <BarChart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-xl font-bold mb-2">No Analytics Yet</h4>
                  <p className="text-muted-foreground">Create courses to see student analytics and insights</p>
                </div>
              ) : (
                courses.map((course) => (
                  <div key={course.id} className="glass-card p-6 rounded-xl">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-bold text-lg mb-1">{course.title}</h4>
                        <p className="text-sm text-muted-foreground">{course.level} · {course.duration}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-fl-primary">{course.students_count || 0}</div>
                        <div className="text-xs text-muted-foreground">Students</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-sm text-muted-foreground mb-1">Enrollments</div>
                        <div className="text-xl font-bold">{course.students_count || 0}</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-sm text-muted-foreground mb-1">Avg Progress</div>
                        <div className="text-xl font-bold text-fl-secondary">--</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-sm text-muted-foreground mb-1">Completion</div>
                        <div className="text-xl font-bold text-fl-accent">--</div>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-sm text-blue-400">
                        💡 <strong>FL Insights:</strong> Detailed analytics with federated learning metrics will be available once students start training local models.
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Create Course Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl">
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h3 className="text-2xl font-bold">Create New Course</h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Course Title *</label>
                  <input
                    type="text"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    placeholder="e.g., Introduction to Federated Learning"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-fl-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description *</label>
                  <textarea
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    placeholder="Describe what students will learn..."
                    rows={4}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-fl-primary resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Level</label>
                    <select
                      value={newCourse.level}
                      onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value as any })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-fl-primary"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Duration</label>
                    <input
                      type="text"
                      value={newCourse.duration}
                      onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                      placeholder="e.g., 6 weeks"
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-fl-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Thumbnail URL (optional)</label>
                  <input
                    type="text"
                    value={newCourse.thumbnail_url}
                    onChange={(e) => setNewCourse({ ...newCourse, thumbnail_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-fl-primary"
                  />
                </div>
              </div>
              <div className="flex gap-3 p-6 border-t border-border">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCourse}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-fl-primary to-fl-secondary text-white rounded-lg hover:shadow-glow transition-all"
                >
                  Create Course
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PDF Uploader Modal */}
        {showPDFUploader && (
          <PDFCourseUploader
            onSuccess={() => {
              setShowPDFUploader(false)
              loadInstructorData()
            }}
            onClose={() => setShowPDFUploader(false)}
          />
        )}
      </main>
    </div>
  )
}
