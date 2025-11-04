import { Link } from 'react-router-dom'
import { Users, Shield, Network, Brain, Database, Lock, Award, Clock } from 'lucide-react'

export default function LandingPage() {
  const courses = [
    {
      id: 1,
      title: "Introduction to Federated Learning",
      description: "Learn the fundamentals of distributed machine learning while preserving privacy",
      students: 1234,
      duration: "6 weeks",
      level: "Beginner",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop"
    },
    {
      id: 2,
      title: "Privacy-Preserving AI",
      description: "Deep dive into differential privacy and secure aggregation techniques",
      students: 856,
      duration: "8 weeks",
      level: "Intermediate",
      image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&auto=format&fit=crop"
    },
    {
      id: 3,
      title: "Federated Deep Learning",
      description: "Advanced neural network training across distributed devices",
      students: 542,
      duration: "10 weeks",
      level: "Advanced",
      image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-fl-primary to-fl-secondary rounded-lg flex items-center justify-center animate-glow-pulse">
                <Network className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-fl-gradient">FL Academy</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                Login
              </Link>
              <Link to="/signup" className="px-4 py-2 bg-gradient-to-r from-fl-primary to-fl-secondary text-white rounded-lg hover:shadow-glow transition-all">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-fl-primary/10 via-fl-secondary/10 to-fl-accent/10" />
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold">
              Learn AI Without
              <span className="text-fl-gradient"> Compromising Privacy</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Master federated learning through hands-on courses while your data stays secure on your device
            </p>
            
            {/* Stats */}
            <div className="flex justify-center gap-8 pt-8">
              <div className="glass-card px-6 py-4 rounded-xl">
                <div className="text-3xl font-bold text-fl-primary">2.5K+</div>
                <div className="text-sm text-muted-foreground">Active Learners</div>
              </div>
              <div className="glass-card px-6 py-4 rounded-xl">
                <div className="text-3xl font-bold text-fl-secondary">50+</div>
                <div className="text-sm text-muted-foreground">FL Courses</div>
              </div>
              <div className="glass-card px-6 py-4 rounded-xl">
                <div className="text-3xl font-bold text-fl-accent">100%</div>
                <div className="text-sm text-muted-foreground">Privacy Protected</div>
              </div>
            </div>

            <div className="pt-6">
              <Link 
                to="/signup" 
                className="inline-block px-8 py-4 bg-gradient-to-r from-fl-primary to-fl-secondary text-white rounded-xl font-medium text-lg hover:shadow-glow transition-all"
              >
                Start Learning Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Federated Learning?</h2>
            <p className="text-muted-foreground text-lg">
              The future of privacy-preserving collaborative AI education
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-2xl hover:shadow-glow transition-all cursor-pointer group">
              <div className="w-14 h-14 bg-gradient-to-br from-fl-primary to-fl-secondary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Privacy First</h3>
              <p className="text-muted-foreground">
                Your data never leaves your device. Learn collaboratively while maintaining complete privacy.
              </p>
            </div>

            <div className="glass-card p-8 rounded-2xl hover:shadow-glow transition-all cursor-pointer group">
              <div className="w-14 h-14 bg-gradient-to-br from-fl-secondary to-fl-accent rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Collaborative Learning</h3>
              <p className="text-muted-foreground">
                Train models together with thousands of learners without sharing raw data.
              </p>
            </div>

            <div className="glass-card p-8 rounded-2xl hover:shadow-glow transition-all cursor-pointer group">
              <div className="w-14 h-14 bg-gradient-to-br from-fl-accent to-fl-success rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Network className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Distributed Network</h3>
              <p className="text-muted-foreground">
                Be part of a global decentralized learning network with real-time synchronization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Featured Courses</h2>
            <p className="text-muted-foreground text-lg">
              Start your federated learning journey today
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {courses.map((course) => (
              <div key={course.id} className="glass-card rounded-2xl overflow-hidden hover:shadow-glow transition-all cursor-pointer group">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={course.image} 
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-4 right-4 px-3 py-1 bg-fl-primary text-white text-sm font-medium rounded-full">
                    {course.level}
                  </div>
                </div>
                
                <div className="p-6 space-y-4">
                  <h3 className="text-xl font-bold">{course.title}</h3>
                  <p className="text-muted-foreground text-sm">{course.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{course.students.toLocaleString()} students</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration}</span>
                    </div>
                  </div>
                  
                  <Link 
                    to="/signup"
                    className="block w-full py-3 bg-gradient-to-r from-fl-primary to-fl-secondary text-white rounded-lg font-medium hover:shadow-glow transition-all text-center"
                  >
                    Enroll Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-12 rounded-3xl text-center space-y-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-fl-primary/20 to-fl-secondary/20" />
            <div className="relative">
              <Award className="w-16 h-16 text-fl-primary mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-4">
                Ready to Join the FL Revolution?
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Start learning today and be part of the privacy-preserving AI movement
              </p>
              <Link 
                to="/signup"
                className="inline-block px-8 py-4 bg-gradient-to-r from-fl-primary to-fl-secondary text-white rounded-xl font-medium text-lg hover:shadow-glow transition-all"
              >
                Start Your Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-fl-primary to-fl-secondary rounded-lg flex items-center justify-center">
                  <Network className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-fl-gradient">FL Academy</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Privacy-preserving education for the AI era
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Courses</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-foreground cursor-pointer transition-colors">Beginner</li>
                <li className="hover:text-foreground cursor-pointer transition-colors">Intermediate</li>
                <li className="hover:text-foreground cursor-pointer transition-colors">Advanced</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-foreground cursor-pointer transition-colors">Documentation</li>
                <li className="hover:text-foreground cursor-pointer transition-colors">Tutorials</li>
                <li className="hover:text-foreground cursor-pointer transition-colors">Community</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-foreground cursor-pointer transition-colors">About</li>
                <li className="hover:text-foreground cursor-pointer transition-colors">Privacy</li>
                <li className="hover:text-foreground cursor-pointer transition-colors">Contact</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2024 FL Academy. All rights reserved. Built with privacy in mind.
          </div>
        </div>
      </footer>
    </div>
  )
}
