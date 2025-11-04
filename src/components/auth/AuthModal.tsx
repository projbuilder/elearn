import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Eye, 
  EyeOff, 
  Brain, 
  Users, 
  Shield, 
  BookOpen,
  User,
  GraduationCap,
  Settings
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  defaultMode = 'signin' 
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const [role, setRole] = useState<'student' | 'instructor'>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    department: '',
    learningStyle: 'visual'
  });

  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Password Mismatch",
            description: "Passwords don't match. Please try again.",
            variant: "destructive"
          });
          return;
        }

        const metadata = {
          name: formData.name,
          learningStyle: formData.learningStyle,
          department: formData.department
        };

        const { data, error } = await signUp(
          formData.email, 
          formData.password, 
          role, 
          metadata
        );

        if (error) throw error;

        toast({
          title: "Welcome to FedLearn!",
          description: "Your account has been created successfully. Please check your email to verify your account.",
        });
      } else {
        const { data, error } = await signIn(formData.email, formData.password);
        
        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "You've successfully signed in to FedLearn.",
        });
      }

      onClose();
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "An error occurred during authentication.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="glass-card border-0">
          <DialogHeader className="p-6 pb-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-fl-primary rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <DialogTitle className="text-xl font-bold text-fl-gradient">FedLearn</DialogTitle>
            </div>
            <DialogDescription>
              {mode === 'signin' 
                ? 'Sign in to continue your learning journey' 
                : 'Join the future of privacy-first education'
              }
            </DialogDescription>
          </DialogHeader>

          <CardContent className="p-6 pt-2">
            {/* Mode Toggle */}
            <div className="flex glass-card rounded-lg p-1 mb-6">
              <Button
                type="button"
                variant={mode === 'signin' ? 'default' : 'ghost'}
                className={`flex-1 ${mode === 'signin' ? 'bg-fl-primary text-white' : ''}`}
                onClick={() => setMode('signin')}
              >
                Sign In
              </Button>
              <Button
                type="button"
                variant={mode === 'signup' ? 'default' : 'ghost'}
                className={`flex-1 ${mode === 'signup' ? 'bg-fl-primary text-white' : ''}`}
                onClick={() => setMode('signup')}
              >
                Sign Up
              </Button>
            </div>

            {/* Role Selection for Sign Up */}
            {mode === 'signup' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6"
              >
                <Label className="text-sm font-medium mb-3 block">I am a:</Label>
                <div className="grid grid-cols-2 gap-3">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all ${
                        role === 'student' 
                          ? 'border-fl-primary bg-fl-primary/5' 
                          : 'hover:border-fl-primary/50'
                      }`}
                      onClick={() => setRole('student')}
                    >
                      <CardContent className="p-4 text-center">
                        <BookOpen className="w-8 h-8 text-fl-primary mx-auto mb-2" />
                        <div className="font-medium">Student</div>
                        <div className="text-xs text-muted-foreground">Learn & Grow</div>
                      </CardContent>
                    </Card>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all ${
                        role === 'instructor' 
                          ? 'border-fl-secondary bg-fl-secondary/5' 
                          : 'hover:border-fl-secondary/50'
                      }`}
                      onClick={() => setRole('instructor')}
                    >
                      <CardContent className="p-4 text-center">
                        <GraduationCap className="w-8 h-8 text-fl-secondary mx-auto mb-2" />
                        <div className="font-medium">Instructor</div>
                        <div className="text-xs text-muted-foreground">Teach & Guide</div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      className="mt-1"
                    />
                  </div>

                  {role === 'student' && (
                    <div>
                      <Label htmlFor="learningStyle">Learning Style</Label>
                      <Select 
                        value={formData.learningStyle} 
                        onValueChange={(value) => handleInputChange('learningStyle', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="visual">🎨 Visual Learner</SelectItem>
                          <SelectItem value="auditory">🎧 Auditory Learner</SelectItem>
                          <SelectItem value="kinesthetic">✋ Kinesthetic Learner</SelectItem>
                          <SelectItem value="reading">📚 Reading/Writing Learner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {role === 'instructor' && (
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        type="text"
                        placeholder="e.g., Mathematics, Computer Science"
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>
                  )}
                </motion.div>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                    className="mt-1"
                  />
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full bg-fl-primary hover:bg-fl-primary/90"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {mode === 'signin' ? 'Signing In...' : 'Creating Account...'}
                  </div>
                ) : (
                  mode === 'signin' ? 'Sign In' : 'Create Account'
                )}
              </Button>
            </form>

            {/* Privacy Notice */}
            <div className="mt-6 p-4 glass-card rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-fl-success mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-fl-success mb-1">
                    Privacy First Learning
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Your learning data stays on your device. We use federated learning 
                    to improve education while keeping your information completely private.
                  </div>
                </div>
              </div>
            </div>

            {/* Switch Mode */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {mode === 'signin' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className="text-fl-primary hover:underline font-medium"
                    onClick={() => setMode('signup')}
                  >
                    Sign up here
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="text-fl-primary hover:underline font-medium"
                    onClick={() => setMode('signin')}
                  >
                    Sign in here
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;