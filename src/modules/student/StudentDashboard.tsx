import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/core/auth';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  Brain, 
  Trophy, 
  Target, 
  MessageCircle, 
  TrendingUp,
  Shield,
  Users,
  Clock,
  Star,
  Send,
  Zap,
  Activity,
  Award
} from 'lucide-react';
import FLVisualization from '@/components/ui/fl-visualization';
import { flSimulation } from '@/modules/federated-learning/services/simulation.service';
import { intelligentAITutor } from '@/modules/ai-tutor/services/tutor.service';
import { adaptiveLearningEngine } from '@/modules/adaptive-learning/services/learning-path.service';
import { studentService } from './services/student.service';
import aiTutorIcon from '@/assets/ai-tutor-icon.jpg';
import adaptiveLearningImage from '@/assets/adaptive-learning.jpg';

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'learning' | 'progress' | 'fl'>('overview');
  const [chatMessage, setChatMessage] = useState('');
  const [tutorMessages, setTutorMessages] = useState<any[]>([]);
  const [flMetrics, setFlMetrics] = useState<any>(null);
  const [learningPath, setLearningPath] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [learningStats, setLearningStats] = useState<any>(null);
  const [recentLessons, setRecentLessons] = useState<any[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      initializeDashboard();
    }
  }, [user]);

  const initializeDashboard = async () => {
    if (!user) return;
    
    try {
      // Load student stats
      const stats = await studentService.getStudentStats(user.id);
      setLearningStats(stats);

      // Load recent lessons
      const lessons = await studentService.getRecentLessons(user.id);
      setRecentLessons(lessons);

      // Load weekly progress
      const weekly = await studentService.getWeeklyProgress(user.id);
      setWeeklyProgress(weekly);

      // Load FL metrics
      const metrics = flSimulation.getCurrentMetrics();
      setFlMetrics(metrics);

      // Initialize user's FL node
      await flSimulation.addUserNode(user.id);

      // Load learning path
      const path = await adaptiveLearningEngine.generatePersonalizedPath(user.id);
      setLearningPath(path);

      // Load recent tutor conversations
      const history = await intelligentAITutor.getConversationHistoryFromDB(user.id, 5);
      setTutorMessages(history.slice(0, 3).map(h => ({
        role: 'assistant',
        content: h.ai_response || h.tutor_response,
        timestamp: new Date(h.created_at)
      })));
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    }
  };

  const startFLTraining = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const metrics = await flSimulation.simulateUserTraining(user.id);
      setFlMetrics(metrics);
      
      toast({
        title: "FL Training Started",
        description: `Training completed with accuracy: ${Math.round(metrics.globalAccuracy * 100)}%`,
      });
    } catch (error) {
      toast({
        title: "Training Failed",
        description: "Failed to start federated learning training",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendTutorMessage = async () => {
    if (!chatMessage.trim() || !user) return;

    const userMessage = chatMessage;
    setChatMessage('');
    
    // Add user message to chat
    setTutorMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    try {
      const response = await intelligentAITutor.generateResponse(
        user.id, 
        userMessage,
        { 
          currentTopic: learningPath?.currentTopic,
          difficulty: learningPath?.difficulty
        }
      );
      
      setTutorMessages(prev => [...prev, response]);
    } catch (error) {
      toast({
        title: "Tutor Error",
        description: "Failed to get response from AI tutor",
        variant: "destructive"
      });
    }
  };


  const achievements = [
    { name: 'First Steps', description: 'Completed your first lesson', icon: '🎯', earned: true },
    { name: 'Week Warrior', description: '7 day learning streak', icon: '🔥', earned: true },
    { name: 'FL Pioneer', description: 'Contributed to federated learning', icon: '🤝', earned: true },
    { name: 'Perfect Score', description: 'Scored 100% on an assessment', icon: '⭐', earned: false },
    { name: 'Marathon Learner', description: 'Studied for 30+ hours this month', icon: '🏃', earned: false },
    { name: 'Knowledge Sharer', description: 'Helped 5 fellow students', icon: '💡', earned: false }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      {/* Header */}
      <header className="glass-nav border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-fl-primary rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-fl-gradient">Student Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back, {user?.user_metadata?.name || 'Student'}!</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <MessageCircle className="w-4 h-4 mr-2" />
                AI Tutor
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 glass-card p-1 rounded-lg w-fit">
          {[
            { id: 'overview', label: 'Overview', icon: BookOpen },
            { id: 'learning', label: 'Learning Path', icon: Target },
            { id: 'progress', label: 'Progress', icon: TrendingUp },
            { id: 'fl', label: 'FL Network', icon: Users }
          ].map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
              className={activeTab === tab.id ? "bg-fl-primary text-white" : ""}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {activeTab === 'overview' && learningStats && (
            <OverviewTab 
              stats={learningStats} 
              recentLessons={recentLessons}
              tutorMessages={tutorMessages}
              chatMessage={chatMessage}
              setChatMessage={setChatMessage}
              sendTutorMessage={sendTutorMessage}
            />
          )}

          {activeTab === 'learning' && (
            <LearningPathTab 
              learningPath={learningPath}
              aiTutorIcon={aiTutorIcon}
              adaptiveLearningImage={adaptiveLearningImage}
            />
          )}

          {activeTab === 'progress' && weeklyProgress.length > 0 && (
            <ProgressTab 
              weeklyProgress={weeklyProgress} 
              achievements={achievements}
            />
          )}

          {activeTab === 'fl' && (
            <FederatedLearningTab 
              flMetrics={flMetrics}
              startTraining={startFLTraining}
              loading={loading}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

// Tab Components
const OverviewTab = ({ stats, recentLessons, tutorMessages, chatMessage, setChatMessage, sendTutorMessage }: any) => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    {/* Stats Cards */}
    <div className="lg:col-span-2 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title="Learning Streak"
          value={stats.currentStreak}
          suffix="days"
          icon={<Target className="w-5 h-5" />}
          trend="+2 from last week"
        />
        <StatsCard
          title="Total Lessons"
          value={stats.totalLessons}
          icon={<BookOpen className="w-5 h-5" />}
          trend="+12 this week"
        />
        <StatsCard
          title="Avg Accuracy"
          value={stats.accuracy}
          suffix="%"
          icon={<Star className="w-5 h-5" />}
          trend="+5% improvement"
        />
        <StatsCard
          title="FL Contribution"
          value={stats.flContribution}
          icon={<Shield className="w-5 h-5" />}
          trend="Helping others learn"
        />
      </div>

      {/* Recent Lessons */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-fl-primary" />
            Recent Lessons
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentLessons.map((lesson: any, index: number) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-fl-primary/10 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-fl-primary" />
                </div>
                <div>
                  <div className="font-medium">{lesson.title}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant={lesson.difficulty === 'Hard' ? 'destructive' : 'secondary'} className="text-xs">
                      {lesson.difficulty}
                    </Badge>
                    {lesson.aiRecommended && (
                      <Badge variant="outline" className="text-xs text-fl-accent border-fl-accent">
                        AI Recommended
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{lesson.progress}%</div>
                <Progress value={lesson.progress} className="w-16 h-2 mt-1" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>

    {/* AI Tutor Chat */}
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-fl-secondary" />
            AI Tutor
          </CardTitle>
          <CardDescription>Get personalized help and guidance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
            {tutorMessages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Brain className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p>Ask me anything about your studies!</p>
              </div>
            ) : (
              tutorMessages.map((msg: any, index: number) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-fl-primary text-white' 
                      : 'bg-muted text-foreground'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Ask your AI tutor..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendTutorMessage()}
            />
            <Button size="sm" onClick={sendTutorMessage}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

const LearningPathTab = ({ learningPath, aiTutorIcon, adaptiveLearningImage }: any) => (
  <div className="space-y-8">
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-fl-primary" />
          Adaptive Learning Path
        </CardTitle>
        <CardDescription>Personalized learning journey based on your progress and style</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Current Topic</h4>
                <Badge className="bg-fl-primary/10 text-fl-primary border-fl-primary">
                  {learningPath?.currentTopic || 'Loading...'}
                </Badge>
              </div>
              <div>
                <h4 className="font-medium mb-2">Difficulty Level</h4>
                <div className="flex items-center gap-2">
                  <Progress value={(learningPath?.difficulty || 1) * 10} className="flex-1" />
                  <span className="text-sm font-medium">{learningPath?.difficulty || 1}/10</span>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Estimated Time</h4>
                <p className="text-sm text-muted-foreground">
                  {Math.round((learningPath?.estimatedTime || 60) / 60)} hours remaining
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg overflow-hidden">
            <img 
              src={adaptiveLearningImage} 
              alt="Adaptive Learning" 
              className="w-full h-48 object-cover"
            />
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="glass-card">
      <CardHeader>
        <CardTitle>AI Insights</CardTitle>
        <CardDescription>Personalized recommendations based on your learning patterns</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[
            "You excel at visual learning - I've added more diagrams to your path",
            "Your performance improves 23% in afternoon sessions",
            "Consider reviewing algebra fundamentals before advanced topics",
            "You're ready for more challenging probability problems"
          ].map((insight, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Zap className="w-5 h-5 text-fl-accent mt-0.5" />
              <p className="text-sm">{insight}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

const ProgressTab = ({ weeklyProgress, achievements }: any) => (
  <div className="space-y-8">
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-fl-success" />
          Weekly Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weeklyProgress.map((day: any, index: number) => (
            <div key={index} className="text-center space-y-2">
              <div className="text-sm font-medium text-muted-foreground">{day.day}</div>
              <div className="space-y-1">
                <div className="text-xs">Hours</div>
                <Progress value={(day.hours / 4) * 100} className="h-2" />
                <div className="text-xs font-medium">{day.hours}h</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs">Lessons</div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-fl-secondary h-2 rounded-full"
                    style={{ width: `${(day.lessons / 5) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs font-medium">{day.lessons}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs">Accuracy</div>
                <div className="text-sm font-medium text-fl-accent">{day.accuracy}%</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-fl-warning" />
          Achievement Badges
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement: any, index: number) => (
            <div 
              key={index}
              className={`p-4 rounded-lg border-2 transition-all ${
                achievement.earned 
                  ? 'border-fl-success bg-fl-success/5' 
                  : 'border-muted bg-muted/20'
              }`}
            >
              <div className="text-center space-y-2">
                <div className={`text-2xl ${achievement.earned ? '' : 'grayscale opacity-50'}`}>
                  {achievement.icon}
                </div>
                <div className="font-medium">{achievement.name}</div>
                <div className="text-sm text-muted-foreground">{achievement.description}</div>
                {achievement.earned && (
                  <Badge className="bg-fl-success text-white">Earned!</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

const FederatedLearningTab = ({ flMetrics, startTraining, loading }: any) => (
  <div className="space-y-8">
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-fl-secondary" />
          Federated Learning Contribution
        </CardTitle>
        <CardDescription>Your device helps train the global model while keeping data private</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <FLVisualization 
            isTraining={loading}
            roundNumber={flMetrics?.round || 0}
            globalAccuracy={flMetrics?.globalAccuracy || 0}
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 glass-card rounded-lg">
            <div className="text-2xl font-bold text-fl-primary">{flMetrics?.round || 0}</div>
            <div className="text-sm text-muted-foreground">Training Rounds</div>
          </div>
          <div className="text-center p-3 glass-card rounded-lg">
            <div className="text-2xl font-bold text-fl-success">{Math.round((flMetrics?.globalAccuracy || 0) * 100)}%</div>
            <div className="text-sm text-muted-foreground">Model Accuracy</div>
          </div>
          <div className="text-center p-3 glass-card rounded-lg">
            <div className="text-2xl font-bold text-fl-accent">{flMetrics?.participatingNodes || 0}</div>
            <div className="text-sm text-muted-foreground">Active Nodes</div>
          </div>
          <div className="text-center p-3 glass-card rounded-lg">
            <div className="text-2xl font-bold text-fl-warning">
              {Math.round((flMetrics?.privacyBudget || 0) * 100)}%
            </div>
            <div className="text-sm text-muted-foreground">Privacy Preserved</div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button 
            onClick={startTraining}
            disabled={loading}
            className="bg-fl-secondary hover:bg-fl-secondary/90"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Training in Progress...
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                Start FL Training Round
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

const StatsCard = ({ title, value, suffix, icon, trend }: any) => (
  <Card className="glass-card">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        <div className="text-fl-primary">{icon}</div>
      </div>
      <div className="text-2xl font-bold">
        {value}{suffix}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{trend}</div>
    </CardContent>
  </Card>
);

export default StudentDashboard;