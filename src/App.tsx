import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/core/auth'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import StudentDashboard from '@/pages/StudentDashboard'
import InstructorDashboard from '@/pages/InstructorDashboard'
import NotFound from '@/pages/NotFound'

const queryClient = new QueryClient()

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole?: string }) {
  const { user, userRole, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fl-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && userRole !== allowedRole) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function DashboardRedirect() {
  const { userRole } = useAuth()
  
  if (userRole === 'instructor') {
    return <Navigate to="/dashboard/instructor" replace />
  }
  return <Navigate to="/dashboard/student" replace />
}

function AppRoutes() {
  const { user, userRole, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fl-primary"></div>
      </div>
    )
  }

  const dashboardPath = userRole === 'instructor' ? '/dashboard/instructor' : '/dashboard/student'

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={dashboardPath} /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to={dashboardPath} /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to={dashboardPath} /> : <SignupPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRedirect />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/student"
        element={
          <ProtectedRoute allowedRole="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/instructor"
        element={
          <ProtectedRoute allowedRole="instructor">
            <InstructorDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App