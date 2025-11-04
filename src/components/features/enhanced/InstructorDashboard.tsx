import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  BookOpen,
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  MessageSquare,
  Settings,
  PlusCircle,
  Search,
  Filter,
  Download
} from 'lucide-react';
import FLVisualization from '@/components/ui/fl-visualization';
import { flSimulation } from '@/services/realTimeFLSimulation';
import { instructorService, StudentInfo, ClassStats } from '@/services/instructorService';
import { ProgressChart } from '@/components/charts/ProgressChart';

const InstructorDashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'content' | 'analytics' | 'fl'>('overview');
  const [flMetrics, setFlMetrics] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [classStats, setClassStats] = useState<ClassStats | null>(null);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = initializeDashboard();
    
    return () => {
      if (unsubscribe) {
        unsubscribe.then(unsub => unsub && unsub());
      }
      flSimulation.stopSimulation();
    };
  }, []);

  const initializeDashboard = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load FL metrics
      const metrics = flSimulation.getCurrentMetrics();
      setFlMetrics(metrics);
      flSimulation.startSimulation();
      
      const unsubscribe = flSimulation.addListener((metrics) => {
        setFlMetrics(metrics);
      });

      // Load real data
      const stats = await instructorService.getClassStats(user.id);
      setClassStats(stats);

      // Load students from first course
      const courses = await instructorService.getInstructorCourses(user.id);
      if (courses.length > 0) {
        const studentsData = await instructorService.getStudentsForCourse(courses[0].id);
        setStudents(studentsData);
      }

      // Load recent activity
      const activity = await instructorService.getRecentActivity(user.id);
      setRecentActivity(activity);

      return unsubscribe;
    } catch (error) {
      console.error('Failed to initialize dashboard:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      {/* Header */}
      <header className="glass-nav border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-fl-secondary rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-fl-gradient">Instructor Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user?.user_metadata?.name || 'Instructor'}!
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <PlusCircle className="w-4 h-4 mr-2" />
                New Course
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
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
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'students', label: 'Students', icon: Users },
            { id: 'content', label: 'Content', icon: BookOpen },
            { id: 'analytics', label: 'Analytics', icon: Target },
            { id: 'fl', label: 'FL Network', icon: Brain }
          ].map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
              className={activeTab === tab.id ? "bg-fl-secondary text-white" : ""}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fl-primary"></div>
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {activeTab === 'overview' && classStats && (
              <OverviewTab stats={classStats} recentActivity={recentActivity} />
            )}

            {activeTab === 'students' && (
              <StudentsTab 
                students={filteredStudents} 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            )}

            {activeTab === 'content' && <ContentTab />}

            {activeTab === 'analytics' && <AnalyticsTab />}

            {activeTab === 'fl' && (
              <FLNetworkTab flMetrics={flMetrics} />
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

// Tab Components
const OverviewTab = ({ stats, recentActivity }: any) => (
  <div className="space-y-8">
    {/* Stats Grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatsCard
        title="Total Students"
        value={stats.totalStudents}
        icon={<Users className="w-5 h-5" />}
        trend="+12 this month"
      />
      <StatsCard
        title="Active Today"
        value={stats.activeToday}
        icon={<CheckCircle className="w-5 h-5" />}
        trend="76% engagement"
      />
      <StatsCard
        title="Avg Progress"
        value={stats.avgProgress}
        suffix="%"
        icon={<TrendingUp className="w-5 h-5" />}
        trend="+5% this week"
      />
      <StatsCard
        title="Completion Rate"
        value={stats.completionRate}
        suffix="%"
        icon={<Target className="w-5 h-5" />}
        trend="Above average"
        urgent={stats.strugglingStudents > 10}
      />
    </div>

    <div className="grid lg:grid-cols-3 gap-8">
      {/* Class Performance Overview */}
      <div className="lg:col-span-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Class Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Excellent Performers</span>
                  <span className="text-sm text-muted-foreground">{stats.excellentPerformers} students</span>
                </div>
                <Progress value={(stats.excellentPerformers / stats.totalStudents) * 100} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Average Performers</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.totalStudents - stats.excellentPerformers - stats.strugglingStudents} students
                  </span>
                </div>
                <Progress 
                  value={((stats.totalStudents - stats.excellentPerformers - stats.strugglingStudents) / stats.totalStudents) * 100} 
                  className="h-2" 
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Need Attention</span>
                  <span className="text-sm text-muted-foreground">{stats.strugglingStudents} students</span>
                </div>
                <Progress value={(stats.strugglingStudents / stats.totalStudents) * 100} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity: any, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.type === 'success' ? 'bg-fl-success' :
                  activity.type === 'warning' ? 'bg-fl-warning' :
                  'bg-fl-accent'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.student}</p>
                  <p className="text-xs text-muted-foreground">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

const StudentsTab = ({ students, searchTerm, setSearchTerm }: any) => (
  <div className="space-y-6">
    {/* Search and Filters */}
    <Card className="glass-card">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </CardContent>
    </Card>

    {/* Students List */}
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Student Management</CardTitle>
        <CardDescription>Monitor and support your students' learning journey</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {students.map((student: any) => (
            <div key={student.id} className="flex items-center justify-between p-4 glass-card rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-fl-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-fl-primary" />
                </div>
                <div>
                  <div className="font-medium">{student.name}</div>
                  <div className="text-sm text-muted-foreground">{student.email}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant={
                        student.status === 'excellent' ? 'default' :
                        student.status === 'struggling' ? 'destructive' :
                        'secondary'
                      }
                      className="text-xs"
                    >
                      {student.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Last active: {student.lastActive}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right space-y-2">
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <div className="font-medium">Progress: {student.progress}%</div>
                    <Progress value={student.progress} className="w-24 h-2 mt-1" />
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">Accuracy: {student.accuracy}%</div>
                    <div className="text-xs text-muted-foreground">FL: {student.flContribution}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Message
                  </Button>
                  <Button variant="outline" size="sm">
                    View Profile
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

const ContentTab = () => (
  <div className="space-y-6">
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Content Management</CardTitle>
        <CardDescription>Create and manage your course content</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mb-2">Content Management Coming Soon</h3>
          <p className="text-muted-foreground mb-4">
            Advanced content creation and management tools are being developed.
          </p>
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" />
            Create New Course
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

const AnalyticsTab = () => {
  const performanceData = [
    { day: 'Mon', excellent: 12, good: 25, struggling: 5 },
    { day: 'Tue', excellent: 15, good: 23, struggling: 4 },
    { day: 'Wed', excellent: 18, good: 22, struggling: 2 },
    { day: 'Thu', excellent: 16, good: 24, struggling: 3 },
    { day: 'Fri', excellent: 20, good: 20, struggling: 2 },
    { day: 'Sat', excellent: 14, good: 15, struggling: 1 },
    { day: 'Sun', excellent: 10, good: 18, struggling: 2 }
  ];

  const engagementData = [
    { day: 'Mon', hours: 85, lessons: 45 },
    { day: 'Tue', hours: 92, lessons: 52 },
    { day: 'Wed', hours: 88, lessons: 48 },
    { day: 'Thu', hours: 95, lessons: 55 },
    { day: 'Fri', hours: 78, lessons: 42 },
    { day: 'Sat', hours: 45, lessons: 28 },
    { day: 'Sun', hours: 38, lessons: 22 }
  ];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <ProgressChart
          data={performanceData}
          type="bar"
          title="Student Performance Breakdown"
          dataKey="excellent"
          color="hsl(var(--fl-success))"
        />
        <ProgressChart
          data={engagementData}
          type="line"
          title="Class Engagement Over Time"
          dataKey="hours"
          color="hsl(var(--fl-primary))"
        />
      </div>
      
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Learning Outcomes</CardTitle>
          <CardDescription>Track student performance trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 glass-card rounded-lg">
              <div className="text-3xl font-bold text-fl-success mb-2">87%</div>
              <div className="text-sm text-muted-foreground">Avg Pass Rate</div>
            </div>
            <div className="text-center p-4 glass-card rounded-lg">
              <div className="text-3xl font-bold text-fl-primary mb-2">92%</div>
              <div className="text-sm text-muted-foreground">Engagement Rate</div>
            </div>
            <div className="text-center p-4 glass-card rounded-lg">
              <div className="text-3xl font-bold text-fl-accent mb-2">4.2</div>
              <div className="text-sm text-muted-foreground">Avg Hours/Week</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const FLNetworkTab = ({ flMetrics }: any) => (
  <div className="space-y-6">
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Federated Learning Network</CardTitle>
        <CardDescription>Monitor the collective intelligence of your classroom</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <FLVisualization 
            roundNumber={flMetrics?.round || 0}
            globalAccuracy={flMetrics?.globalAccuracy || 0}
            isTraining={false}
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      </CardContent>
    </Card>
  </div>
);

const StatsCard = ({ title, value, suffix = '', icon, trend, urgent = false }: any) => (
  <Card className={`glass-card ${urgent ? 'border-fl-warning' : ''}`}>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        <div className={urgent ? "text-fl-warning" : "text-fl-secondary"}>{icon}</div>
      </div>
      <div className="text-2xl font-bold">
        {value}{suffix}
      </div>
      <div className={`text-xs mt-1 ${urgent ? 'text-fl-warning' : 'text-muted-foreground'}`}>
        {trend}
      </div>
    </CardContent>
  </Card>
);

export default InstructorDashboard;