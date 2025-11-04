import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/core/auth';
import { StudentDashboard } from '@/modules/student';
import { InstructorDashboard } from '@/modules/instructor';
import { 
  Brain, 
  Users, 
  BookOpen, 
  Shield, 
  Menu, 
  X,
  ArrowRight,
  Play,
  Star,
  Zap
} from 'lucide-react';
import HeroSection from '@/components/features/HeroSection';
import PrivacyExplainer from '@/components/features/PrivacyExplainer';

const Index = () => {
  const { user, userRole } = useAuth();
  const [activeView, setActiveView] = useState<'landing' | 'student' | 'instructor'>('landing');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Show functional dashboard for authenticated users
  if (user) {
    // Show loading while role is being fetched
    if (!userRole) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fl-primary"></div>
        </div>
      );
    }
    
    if (userRole === 'student') return <StudentDashboard />;
    if (userRole === 'instructor') return <InstructorDashboard />;
    if (userRole === 'admin' && window.location.pathname !== '/admin') {
      window.location.replace('/admin');
      return null;
    }
  }

  if (activeView === 'student') {
    return <StudentDashboard />;
  }

  if (activeView === 'instructor') {
    return <InstructorDashboard />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="glass-nav fixed top-0 w-full z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-8 h-8 bg-fl-primary rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-fl-gradient">FedLearn</span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium hover:text-fl-primary transition-colors">
                Features
              </a>
              <a href="#privacy" className="text-sm font-medium hover:text-fl-primary transition-colors">
                Privacy
              </a>
              <a href="#demo" className="text-sm font-medium hover:text-fl-primary transition-colors">
                Demo
              </a>
              <a href="#about" className="text-sm font-medium hover:text-fl-primary transition-colors">
                About
              </a>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {!user && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setActiveView('student')}
                  >
                    Student Demo
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setActiveView('instructor')}
                  >
                    Instructor Demo
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-fl-primary hover:bg-fl-primary/90"
                    onClick={() => window.location.href = '/login'}
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-4 border-t glass-border"
            >
              <div className="flex flex-col gap-4">
                <a href="#features" className="text-sm font-medium">Features</a>
                <a href="#privacy" className="text-sm font-medium">Privacy</a>
                <a href="#demo" className="text-sm font-medium">Demo</a>
                <a href="#about" className="text-sm font-medium">About</a>
                <div className="flex flex-col gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveView('student')}
                  >
                    Student View
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveView('instructor')}
                  >
                    Instructor View
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-fl-primary hover:bg-fl-primary/90"
                    onClick={() => window.location.href = '/login'}
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Features Section */}
        <section id="features" className="py-20 bg-muted/20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <Badge className="mb-4 bg-fl-secondary/10 text-fl-secondary">Revolutionary Technology</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Federated Learning Advantages
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Experience the next generation of e-learning with privacy-preserving AI that adapts to your needs
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Shield,
                  title: "Privacy by Design",
                  description: "Your data never leaves your device. Learn with complete privacy protection.",
                  color: "fl-success"
                },
                {
                  icon: Brain,
                  title: "Adaptive AI Tutor",
                  description: "Personalized learning paths that adapt in real-time to your progress and style.",
                  color: "fl-primary"
                },
                {
                  icon: Users,
                  title: "Collective Intelligence",
                  description: "Benefit from global knowledge while contributing to everyone's learning.",
                  color: "fl-secondary"
                },
                {
                  icon: Zap,
                  title: "Real-time Adaptation",
                  description: "Dynamic difficulty adjustment based on your performance and learning patterns.",
                  color: "fl-accent"
                },
                {
                  icon: BookOpen,
                  title: "Multi-modal Content",
                  description: "Visual, auditory, and interactive content tailored to your learning preferences.",
                  color: "fl-warning"
                },
                {
                  icon: Star,
                  title: "Proven Results",
                  description: "25% better learning outcomes compared to traditional e-learning platforms.",
                  color: "fl-success"
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="glass-card p-6 rounded-xl hover:shadow-glow transition-all duration-300 group"
                >
                  <div className={`w-12 h-12 bg-${feature.color}/10 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-6 h-6 text-${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Privacy Explainer */}
        <PrivacyExplainer />

        {/* Demo Section */}
        <section id="demo" className="py-20 bg-gradient-to-br from-fl-primary/5 to-fl-secondary/5">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-12"
            >
              <Badge className="mb-4 bg-fl-primary/10 text-fl-primary">Interactive Demo</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Experience Federated Learning
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                Try our platform with different user roles and see how federated learning 
                revolutionizes online education
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="glass-card p-8 rounded-xl text-center group hover:shadow-glow transition-all duration-300"
              >
                <div className="w-16 h-16 bg-fl-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-8 h-8 text-fl-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Student Experience</h3>
                <p className="text-muted-foreground mb-6">
                  Explore personalized learning paths, AI tutoring, and privacy-first education
                </p>
                <Button 
                  onClick={() => setActiveView('student')}
                  className="bg-fl-primary hover:bg-fl-primary/90 group"
                >
                  Try Student Dashboard
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="glass-card p-8 rounded-xl text-center group hover:shadow-glow transition-all duration-300"
              >
                <div className="w-16 h-16 bg-fl-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-fl-secondary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Instructor Control</h3>
                <p className="text-muted-foreground mb-6">
                  Manage students, track progress, and leverage federated learning insights
                </p>
                <Button 
                  onClick={() => setActiveView('instructor')}
                  className="bg-fl-secondary hover:bg-fl-secondary/90 group"
                >
                  Try Instructor Dashboard
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-fl-primary to-fl-secondary text-white">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Transform Education?
              </h2>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                Join the privacy-first learning revolution. Experience education that adapts to you 
                while keeping your data secure.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="bg-white text-fl-primary hover:bg-white/90"
                  onClick={() => window.location.href = '/login'}
                >
                  Start Free Trial
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <Play className="w-4 h-4 mr-2" />
                  Watch Demo
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-fl-primary rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-fl-gradient">FedLearn</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-fl-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-fl-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-fl-primary transition-colors">Contact</a>
            </div>
          </div>
          <div className="border-t border-muted mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2024 FedLearn. Pioneering privacy-first education technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
