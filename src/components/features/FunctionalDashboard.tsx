import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Activity, 
  Users, 
  Brain, 
  Shield,
  Zap,
  TrendingUp,
  MessageCircle,
  Send,
  BookOpen,
  Target,
  Star
} from 'lucide-react';
import { flSimulation } from '@/services/realTimeFLSimulation';
import { intelligentAITutor } from '@/services/intelligentAITutor';
import { adaptiveLearningEngine } from '@/services/adaptiveLearningEngine';
import FLVisualization from '@/components/ui/fl-visualization';

interface FunctionalDashboardProps {
  userRole: 'student' | 'instructor' | 'admin';
}

const FunctionalDashboard: React.FC<FunctionalDashboardProps> = ({ userRole }) => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  // Common state
  const [flMetrics, setFlMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [tutorMessages, setTutorMessages] = useState<any[]>([]);
  const [learningPath, setLearningPath] = useState<any>(null);

  // Simulation state
  const [simulationRunning, setSimulationRunning] = useState(false);

  useEffect(() => {
    initializeDashboard();
    
    // Start FL simulation
    flSimulation.startSimulation();
    setSimulationRunning(true);

    // Set up FL metrics listener
    const unsubscribe = flSimulation.addListener((metrics) => {
      setFlMetrics(metrics);
    });

    return () => {
      unsubscribe();
      flSimulation.stopSimulation();
    };
  }, [user]);

  const initializeDashboard = async () => {
    if (!user) return;

    try {
      // Get initial FL metrics
      const metrics = flSimulation.getCurrentMetrics();
      setFlMetrics(metrics);

      // Initialize user's FL node
      await flSimulation.addUserNode(user.id);

      // Load learning path for students
      if (userRole === 'student') {
        const path = await adaptiveLearningEngine.generatePersonalizedPath(user.id);
        setLearningPath(path);

        // Load recent tutor conversations
        const history = await intelligentAITutor.getConversationHistoryFromDB(user.id, 3);
        setTutorMessages(history.slice(0, 3).map(h => ({
          role: 'assistant',
          content: h.tutor_response,
          timestamp: new Date(h.created_at)
        })));
      }
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
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

  const toggleSimulation = () => {
    if (simulationRunning) {
      flSimulation.stopSimulation();
      setSimulationRunning(false);
      toast({
        title: "FL Simulation Paused",
        description: "Federated learning simulation has been paused",
      });
    } else {
      flSimulation.startSimulation();
      setSimulationRunning(true);
      toast({
        title: "FL Simulation Started", 
        description: "Federated learning simulation is now running",
      });
    }
  };

  const getRecommendation = async () => {
    if (!user || userRole !== 'student') return;

    try {
      const recommendation = await adaptiveLearningEngine.recommendNextActivity(user.id);
      
      toast({
        title: "AI Recommendation",
        description: `Recommended: ${recommendation.type} on ${recommendation.topic} (${recommendation.estimatedTime} min)`,
      });
    } catch (error) {
      console.error('Error getting recommendation:', error);
    }
  };

  // Student Dashboard Content
  if (userRole === 'student') {
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
                <Button variant="outline" size="sm" onClick={getRecommendation}>
                  <Zap className="w-4 h-4 mr-2" />
                  Get AI Recommendation
                </Button>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Learning Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-fl-primary/10 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-fl-primary" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">15</div>
                        <div className="text-sm text-muted-foreground">Day Streak</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-fl-success/10 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-fl-success" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">127</div>
                        <div className="text-sm text-muted-foreground">Lessons</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-fl-secondary/10 rounded-lg flex items-center justify-center">
                        <Star className="w-5 h-5 text-fl-secondary" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">87%</div>
                        <div className="text-sm text-muted-foreground">Accuracy</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-fl-accent/10 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-fl-accent" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">Active</div>
                        <div className="text-sm text-muted-foreground">FL Status</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Learning Path */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-fl-primary" />
                    Adaptive Learning Path
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Current Topic</span>
                        <Badge className="bg-fl-primary/10 text-fl-primary">
                          {learningPath?.currentTopic || 'Loading...'}
                        </Badge>
                      </div>
                      <Progress value={learningPath?.completionPercentage || 0} className="h-2" />
                    </div>
                    
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Difficulty: Level {learningPath?.difficulty || 1}</span>
                      <span>Est. Time: {Math.round((learningPath?.estimatedTime || 60) / 60)}h remaining</span>
                    </div>

                    <Button onClick={startFLTraining} disabled={loading} className="w-full">
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Training...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Start FL Training
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* FL Visualization */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-fl-secondary" />
                    Federated Learning Network
                    {simulationRunning && (
                      <Badge className="bg-fl-primary/10 text-fl-primary animate-pulse">
                        <Activity className="w-3 h-3 mr-1" />
                        Live
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <FLVisualization
                      nodes={flSimulation.getNodes().map(n => ({
                        id: n.id,
                        status: n.status,
                        accuracy: n.localAccuracy * 100,
                        contribution: n.dataSize
                      }))}
                      globalAccuracy={flMetrics?.globalAccuracy * 100 || 0}
                      roundNumber={flMetrics?.round || 0}
                      isTraining={loading}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-fl-primary">{flMetrics?.round || 0}</div>
                      <div className="text-sm text-muted-foreground">Rounds</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-fl-success">
                        {Math.round((flMetrics?.globalAccuracy || 0) * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Global Accuracy</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-fl-accent">{flMetrics?.participatingNodes || 0}</div>
                      <div className="text-sm text-muted-foreground">Active Nodes</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Tutor Sidebar */}
            <div className="space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-fl-secondary" />
                    AI Tutor
                  </CardTitle>
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

              {/* FL Control Panel */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>FL Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={toggleSimulation}
                    className={`w-full ${simulationRunning ? 'bg-fl-warning hover:bg-fl-warning/90' : 'bg-fl-success hover:bg-fl-success/90'}`}
                  >
                    {simulationRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    {simulationRunning ? 'Pause Simulation' : 'Start Simulation'}
                  </Button>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Privacy Budget:</span>
                      <span>{Math.round((flMetrics?.privacyBudget || 0) * 100)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Training Time:</span>
                      <span>{Math.round(flMetrics?.trainingTime || 0)}s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Instructor Dashboard Content
  if (userRole === 'instructor') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
        <header className="glass-nav border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-fl-secondary rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-fl-gradient">Instructor Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Manage your federated learning classroom</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Class Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-fl-secondary/10 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-fl-secondary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">245</div>
                    <div className="text-sm text-muted-foreground">Total Students</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-fl-success/10 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-fl-success" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">187</div>
                    <div className="text-sm text-muted-foreground">Active Today</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-fl-primary/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-fl-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">84%</div>
                    <div className="text-sm text-muted-foreground">Avg Performance</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-fl-accent/10 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-fl-accent" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">100%</div>
                    <div className="text-sm text-muted-foreground">Privacy Safe</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FL Network Overview */}
          <Card className="glass-card mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-fl-primary" />
                Federated Learning Network
                {simulationRunning && (
                  <Badge className="bg-fl-primary/10 text-fl-primary animate-pulse">
                    <Activity className="w-3 h-3 mr-1" />
                    Training Active
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <FLVisualization
                  nodes={flSimulation.getNodes().map(n => ({
                    id: n.id,
                    status: n.status,
                    accuracy: n.localAccuracy * 100,
                    contribution: n.dataSize
                  }))}
                  globalAccuracy={flMetrics?.globalAccuracy * 100 || 0}
                  roundNumber={flMetrics?.round || 0}
                  isTraining={loading}
                />
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 glass-card rounded-lg">
                  <div className="text-2xl font-bold text-fl-primary">{flMetrics?.round || 0}</div>
                  <div className="text-sm text-muted-foreground">Training Rounds</div>
                </div>
                <div className="text-center p-4 glass-card rounded-lg">
                  <div className="text-2xl font-bold text-fl-success">
                    {Math.round((flMetrics?.globalAccuracy || 0) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Global Accuracy</div>
                </div>
                <div className="text-center p-4 glass-card rounded-lg">
                  <div className="text-2xl font-bold text-fl-accent">{flMetrics?.participatingNodes || 0}</div>
                  <div className="text-sm text-muted-foreground">Active Students</div>
                </div>
                <div className="text-center p-4 glass-card rounded-lg">
                  <div className="text-2xl font-bold text-fl-secondary">100%</div>
                  <div className="text-sm text-muted-foreground">Privacy Preserved</div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button 
                  onClick={toggleSimulation}
                  className={simulationRunning ? 'bg-fl-warning hover:bg-fl-warning/90' : 'bg-fl-primary hover:bg-fl-primary/90'}
                >
                  {simulationRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {simulationRunning ? 'Pause FL Training' : 'Start FL Training'}
                </Button>
                
                <Button variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Network
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Admin Dashboard Content (simplified for now)
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Activity className="w-8 h-8 text-fl-primary" />
              Cloud Administrator Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage federated learning infrastructure and coordinate global model training
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={toggleSimulation}
              className={simulationRunning ? 'bg-fl-warning hover:bg-fl-warning/90' : 'bg-fl-primary hover:bg-fl-primary/90'}
            >
              {simulationRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {simulationRunning ? 'Pause Global Training' : 'Start Global Training'}
            </Button>
            
            <Button variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset System
            </Button>
          </div>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-fl-primary/10 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-fl-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{flSimulation.getNodes().length}</div>
                  <div className="text-sm text-muted-foreground">Total Nodes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-fl-success/10 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-fl-success" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{flSimulation.getNodes().filter(n => n.status === 'active').length}</div>
                  <div className="text-sm text-muted-foreground">Active Nodes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-fl-secondary/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-fl-secondary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{Math.round((flMetrics?.globalAccuracy || 0) * 100)}%</div>
                  <div className="text-sm text-muted-foreground">Global Accuracy</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-fl-accent/10 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-fl-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">100%</div>
                  <div className="text-sm text-muted-foreground">System Health</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FL Network Visualization */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-fl-primary" />
              Global Federated Learning Network
              {simulationRunning && (
                <Badge className="bg-fl-primary/10 text-fl-primary animate-pulse">
                  <Activity className="w-3 h-3 mr-1" />
                  Training Active
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FLVisualization
              nodes={flSimulation.getNodes().map(n => ({
                id: n.id,
                status: n.status,
                accuracy: n.localAccuracy * 100,
                contribution: n.dataSize
              }))}
              globalAccuracy={flMetrics?.globalAccuracy * 100 || 0}
              roundNumber={flMetrics?.round || 0}
              isTraining={loading || simulationRunning}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FunctionalDashboard;