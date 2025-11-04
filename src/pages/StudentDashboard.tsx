import { useAuth } from '@/core/auth'
import { Link } from 'react-router-dom'
import { BookOpen, LogOut, User as UserIcon, MessageSquare, TrendingUp, Award, Clock, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { courseService, Course } from '@/services/courseService'
import { AITutorChat } from '@/components/AITutorChat'

interface EnrolledCourse {
  course: Course
  progress: number
  lastAccessed: string
}

export default function StudentDashboard() {
  const { user, signOut } = useAuth()
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([])
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showAIChat, setShowAIChat] = useState(false)
  const [stats, setStats] = useState({ enrolled: 0, avgProgress: 0, completed: 0 })

  useEffect(() => {
    loadDashboardData()
  }, [user])

  async function loadDashboardData() {
    if (!user) return

    setLoading(true)
    try {
      // Fetch enrolled courses
      const enrollments = await courseService.getUserEnrollments(user.id)
      
      const coursesWithProgress = await Promise.all(
        enrollments.map(async (enrollment) => {
          const progress = await courseService.getProgress(user.id, enrollment.course.id)
          const avgProgress = progress.length > 0
            ? progress.reduce((sum, p) => sum + p.progress_percent, 0) / progress.length
            : 0
          
          return {
            course: enrollment.course,
            progress: Math.round(avgProgress),
            lastAccessed: enrollment.last_accessed
          }
        })
      )

      setEnrolledCourses(coursesWithProgress)

      // Calculate stats
      const completed = coursesWithProgress.filter(c => c.progress >= 100).length
      const avgProgress = coursesWithProgress.length > 0
        ? Math.round(coursesWithProgress.reduce((sum, c) => sum + c.progress, 0) / coursesWithProgress.length)
        : 0

      setStats({
        enrolled: coursesWithProgress.length,
        avgProgress,
        completed
      })

      // Fetch all available courses for enrollment
      const allCoursesList = await courseService.getAllCourses()
      const unenrolledCourses = allCoursesList.filter(
        course => !coursesWithProgress.some(ec => ec.course.id === course.id)
      )
      setAllCourses(unenrolledCourses)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  async function enrollInCourse(courseId: number) {
    if (!user) return
    
    try {
      await courseService.enrollInCourse(user.id, courseId)
      await loadDashboardData() // Refresh data
    } catch (error) {
      console.error('Enrollment error:', error)
      alert('Failed to enroll in course')
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
            <h1 className="text-xl font-bold text-fl-gradient">FL Academy - Student</h1>
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
          <h2 className="text-3xl font-bold mb-2">Welcome Back!</h2>
          <p className="text-muted-foreground">Continue your learning journey</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="w-8 h-8 text-fl-primary" />
              <div className="text-3xl font-bold text-fl-primary">{stats.enrolled}</div>
            </div>
            <div className="text-sm text-muted-foreground">Enrolled Courses</div>
          </div>
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 text-fl-secondary" />
              <div className="text-3xl font-bold text-fl-secondary">{stats.avgProgress}%</div>
            </div>
            <div className="text-sm text-muted-foreground">Average Progress</div>
          </div>
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-fl-accent" />
              <div className="text-3xl font-bold text-fl-accent">{stats.completed}</div>
            </div>
            <div className="text-sm text-muted-foreground">Completed Courses</div>
          </div>
        </div>

        {/* My Courses */}
        <div>
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            My Courses
          </h3>
          
          {enrolledCourses.length === 0 ? (
            <div className="glass-card p-12 rounded-xl text-center">
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-xl font-bold mb-2">No Courses Yet</h4>
              <p className="text-muted-foreground mb-6">Enroll in a course below to start learning!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((enrolled) => (
                <div key={enrolled.course.id} className="glass-card rounded-xl overflow-hidden hover:shadow-glow transition-all">
                  <div className="h-40 bg-gradient-to-br from-fl-primary to-fl-secondary relative">
                    {enrolled.course.thumbnail_url && (
                      <img 
                        src={enrolled.course.thumbnail_url} 
                        alt={enrolled.course.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
                      {enrolled.course.level}
                    </div>
                  </div>
                  <div className="p-6">
                    <h4 className="font-bold mb-2 line-clamp-2">{enrolled.course.title}</h4>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {enrolled.course.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Clock className="w-3 h-3" />
                      <span>{enrolled.course.duration}</span>
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold text-fl-primary">{enrolled.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-fl-primary to-fl-secondary transition-all duration-300" 
                          style={{ width: `${enrolled.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <button className="w-full py-2 bg-fl-primary text-white rounded-lg hover:bg-fl-primary/90 transition-colors">
                      Continue Learning
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Courses */}
        {allCourses.length > 0 && (
          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-4">Available Courses</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allCourses.slice(0, 6).map((course) => (
                <div key={course.id} className="glass-card rounded-xl overflow-hidden hover:shadow-glow transition-all">
                  <div className="h-40 bg-gradient-to-br from-purple-500 to-pink-500 relative">
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
                    <h4 className="font-bold mb-2 line-clamp-2">{course.title}</h4>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{course.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <UserIcon className="w-3 h-3" />
                        <span>{course.students_count || 0} students</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => enrollInCourse(course.id)}
                      className="w-full py-2 bg-gradient-to-r from-fl-accent to-fl-success text-white rounded-lg hover:shadow-glow transition-all"
                    >
                      Enroll Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Tutor Section */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            AI Tutor Assistant
          </h3>
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold mb-2">Get Help Anytime</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Ask questions, generate practice quizzes, create flashcards, or get personalized learning recommendations. 
                  Powered by Azure OpenAI GPT-4o.
                </p>
                <button 
                  onClick={() => setShowAIChat(true)}
                  className="px-6 py-3 bg-gradient-to-r from-fl-accent to-fl-success text-white rounded-lg hover:shadow-glow transition-all flex items-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  Chat with AI Tutor
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Chat Modal */}
        {showAIChat && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-background rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-xl font-bold">AI Tutor Chat</h3>
                <button 
                  onClick={() => setShowAIChat(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <AITutorChat 
                  courseId={enrolledCourses[0]?.course.id}
                  moduleName={enrolledCourses[0]?.course.title}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
