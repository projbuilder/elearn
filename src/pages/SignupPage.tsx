import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/core/auth'
import { Network, Mail, Lock, User, Shield } from 'lucide-react'

export default function SignupPage() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<'student' | 'instructor'>('student')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    const { error: signUpError } = await signUp(email, password, role, { name: displayName })
    
    if (signUpError) {
      setError(signUpError.message || 'Failed to create account')
      setLoading(false)
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-fl-primary to-fl-secondary rounded-lg flex items-center justify-center">
            <Network className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-fl-gradient">FL Academy</span>
        </div>

        <div className="glass-card p-8 rounded-2xl">
          <h1 className="text-2xl font-bold text-center mb-2">Create Account</h1>
          <p className="text-muted-foreground text-center mb-6">
            Join the privacy-first learning revolution
          </p>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Display Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-fl-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-fl-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`py-2 px-4 rounded-lg font-medium transition-all ${
                    role === 'student'
                      ? 'bg-fl-primary text-white'
                      : 'bg-card border border-border hover:border-fl-primary'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('instructor')}
                  className={`py-2 px-4 rounded-lg font-medium transition-all ${
                    role === 'instructor'
                      ? 'bg-fl-secondary text-white'
                      : 'bg-card border border-border hover:border-fl-secondary'
                  }`}
                >
                  Instructor
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-fl-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-fl-primary"
                  required
                />
              </div>
            </div>

            <div className="flex items-start gap-2 text-sm text-muted-foreground bg-fl-primary/5 p-3 rounded-lg">
              <Shield className="w-4 h-4 mt-0.5 flex-shrink-0 text-fl-primary" />
              <p className="text-xs">
                Your data never leaves your device. We use federated learning to protect your privacy.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-fl-primary to-fl-secondary text-white rounded-lg font-medium hover:shadow-glow transition-all disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-fl-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>

          <div className="mt-4 text-center text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
