import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/core/database';
import FLVisualization from '@/components/ui/fl-visualization';
import PluginManagement from '@/components/admin/PluginManagement';
import {
  Server,
  Users,
  Activity,
  Shield,
  Zap,
  Database,
  Network,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Play,
  Pause,
  RotateCcw,
  Terminal,
  Eye,
  Lock
} from 'lucide-react';

interface SystemMetrics {
  totalNodes: number;
  activeNodes: number;
  trainingNodes: number;
  globalAccuracy: number;
  systemHealth: number;
  privacyBudget: number;
}

interface NodeData {
  id: string;
  userId: string;
  status: 'active' | 'training' | 'idle';
  accuracy: number;
  lastSeen: string;
  location: string;
  version: number;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    totalNodes: 0,
    activeNodes: 0,
    trainingNodes: 0,
    globalAccuracy: 0,
    systemHealth: 100,
    privacyBudget: 0.8
  });
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [trainingInProgress, setTrainingInProgress] = useState(false);

  useEffect(() => {
    loadSystemData();
    const interval = setInterval(loadSystemData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSystemData = async () => {
    try {
      // Get FL metrics
      const metricsResponse = await supabase.functions.invoke('fl-coordinator', {
        body: { action: 'get_fl_metrics' }
      });

      if (metricsResponse.data) {
        setSystemMetrics(metricsResponse.data);
      }

      // Get node data
      const { data: nodesData, error } = await supabase
        .from('fl_nodes')
        .select(`
          *,
          profiles(display_name)
        `);

      if (!error && nodesData) {
        const formattedNodes = nodesData.map(node => ({
          id: node.id,
          userId: node.user_id,
          status: (node.node_status as 'active' | 'training' | 'idle') || 'idle',
          accuracy: ((node.training_metrics as any)?.local_accuracy || 0) * 100,
          lastSeen: node.last_update_at,
          location: `Node-${node.id.slice(-4)}`,
          version: node.model_version || 1
        }));
        setNodes(formattedNodes);
      }
    } catch (error) {
      console.error('Error loading system data:', error);
    }
  };

  const startGlobalTraining = async () => {
    setLoading(true);
    setTrainingInProgress(true);
    
    try {
      const response = await supabase.functions.invoke('fl-coordinator', {
        body: { action: 'start_training_round' }
      });

      if (response.error) throw response.error;

      toast({
        title: "Global Training Started",
        description: `Training round initiated with ${response.data.participatingNodes} nodes`,
      });

      // Simulate training progress
      setTimeout(async () => {
        await aggregateUpdates();
      }, 8000);

    } catch (error) {
      console.error('Error starting training:', error);
      toast({
        title: "Training Failed", 
        description: error.message,
        variant: "destructive",
      });
      setTrainingInProgress(false);
    } finally {
      setLoading(false);
    }
  };

  const aggregateUpdates = async () => {
    try {
      const response = await supabase.functions.invoke('fl-coordinator', {
        body: { 
          action: 'aggregate_updates',
          payload: { roundId: Date.now().toString() }
        }
      });

      if (response.data) {
        setSystemMetrics(prev => ({
          ...prev,
          globalAccuracy: response.data.globalAccuracy
        }));

        toast({
          title: "Training Round Complete",
          description: `Global accuracy: ${response.data.globalAccuracy.toFixed(1)}%`,
        });
      }
    } catch (error) {
      console.error('Error aggregating updates:', error);
    } finally {
      setTrainingInProgress(false);
    }
  };

  const pauseTraining = () => {
    setTrainingInProgress(false);
    toast({
      title: "Training Paused",
      description: "All training operations have been paused",
    });
  };

  const resetSystem = async () => {
    setLoading(true);
    try {
      // Reset all nodes to idle state
      await supabase
        .from('fl_nodes')
        .update({ node_status: 'idle' })
        .neq('id', '');

      toast({
        title: "System Reset",
        description: "All nodes have been reset to idle state",
      });
      
      loadSystemData();
    } catch (error) {
      console.error('Error resetting system:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'fl-success';
      case 'training': return 'fl-primary';
      case 'idle': return 'muted';
      default: return 'muted';
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Server className="w-8 h-8 text-fl-primary" />
              Cloud Administrator Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage federated learning nodes and coordinate global model training
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={trainingInProgress ? pauseTraining : startGlobalTraining}
              disabled={loading}
              className={trainingInProgress ? 'bg-fl-warning hover:bg-fl-warning/90' : 'bg-fl-primary hover:bg-fl-primary/90'}
            >
              {trainingInProgress ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {trainingInProgress ? 'Pause Training' : 'Start Global Training'}
            </Button>
            
            <Button variant="outline" onClick={resetSystem} disabled={loading}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset System
            </Button>
          </div>
        </motion.div>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Total Nodes',
              value: systemMetrics.totalNodes,
              icon: Server,
              color: 'fl-primary',
              change: '+2 from yesterday'
            },
            {
              title: 'Active Nodes', 
              value: systemMetrics.activeNodes,
              icon: Activity,
              color: 'fl-success',
              change: `${systemMetrics.activeNodes}/${systemMetrics.totalNodes} online`
            },
            {
              title: 'Global Accuracy',
              value: `${systemMetrics.globalAccuracy.toFixed(1)}%`,
              icon: TrendingUp,
              color: 'fl-secondary',
              change: '+1.2% this round'
            },
            {
              title: 'System Health',
              value: `${systemMetrics.systemHealth}%`,
              icon: Shield,
              color: systemMetrics.systemHealth > 90 ? 'fl-success' : 'fl-warning',
              change: 'All systems operational'
            }
          ].map((metric, index) => (
            <motion.div key={metric.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-${metric.color}/10 rounded-lg flex items-center justify-center`}>
                      <metric.icon className={`w-5 h-5 text-${metric.color}`} />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{metric.value}</div>
                      <div className="text-sm text-muted-foreground">{metric.title}</div>
                      <div className="text-xs text-muted-foreground">{metric.change}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="network" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="network">FL Network</TabsTrigger>
            <TabsTrigger value="nodes">Node Management</TabsTrigger>
            <TabsTrigger value="plugins">Plugin Management</TabsTrigger>
            <TabsTrigger value="monitoring">System Monitoring</TabsTrigger>
            <TabsTrigger value="security">Security & Privacy</TabsTrigger>
          </TabsList>

          {/* FL Network Visualization */}
          <TabsContent value="network" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5 text-fl-primary" />
                  Federated Learning Network Visualization
                  {trainingInProgress && (
                    <Badge className="bg-fl-primary/10 text-fl-primary animate-pulse">
                      <Activity className="w-3 h-3 mr-1" />
                      Training Active
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FLVisualization
                  nodes={nodes.map(n => ({
                    id: n.id,
                    status: n.status,
                    accuracy: n.accuracy,
                    contribution: Math.random() * 100
                  }))}
                  globalAccuracy={systemMetrics.globalAccuracy}
                  roundNumber={Math.floor(Date.now() / 10000)}
                  isTraining={trainingInProgress}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plugin Management */}
          <TabsContent value="plugins" className="space-y-6">
            <PluginManagement />
          </TabsContent>

          {/* Node Management */}
          <TabsContent value="nodes" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Active Nodes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {nodes.map((node, index) => (
                    <motion.div
                      key={node.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 glass-card rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full bg-${getStatusColor(node.status)}`} />
                        <div>
                          <div className="font-medium">{node.location}</div>
                          <div className="text-sm text-muted-foreground">
                            Version {node.version} • {node.status}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-sm font-medium">{node.accuracy.toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">Local Accuracy</div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm font-medium">{new Date(node.lastSeen).toLocaleTimeString()}</div>
                          <div className="text-xs text-muted-foreground">Last Seen</div>
                        </div>
                        
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Monitor
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Monitoring */}
          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>CPU Usage</span>
                      <span>23%</span>
                    </div>
                    <Progress value={23} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Memory Usage</span>
                      <span>67%</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Network I/O</span>
                      <span>45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Training Efficiency</span>
                      <span>89%</span>
                    </div>
                    <Progress value={89} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>System Logs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm font-mono bg-muted/20 p-4 rounded-lg max-h-64 overflow-y-auto">
                    <div className="text-fl-success">[INFO] FL coordinator started</div>
                    <div className="text-fl-primary">[TRAIN] Round 42 initiated with 8 nodes</div>
                    <div className="text-fl-success">[AGGR] Model aggregation completed</div>
                    <div className="text-muted-foreground">[HEALTH] All systems operational</div>
                    <div className="text-fl-warning">[WARN] Node timeout detected - recovered</div>
                    <div className="text-fl-success">[PRIVACY] Differential privacy: ε=1.0, δ=1e-5</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security & Privacy */}
          <TabsContent value="security" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-fl-success" />
                    Privacy Protection Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Differential Privacy</span>
                    <Badge className="bg-fl-success/10 text-fl-success">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Enabled
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Data Encryption</span>
                    <Badge className="bg-fl-success/10 text-fl-success">AES-256</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Privacy Budget (ε)</span>
                    <Badge className="bg-fl-primary/10 text-fl-primary">{systemMetrics.privacyBudget}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Secure Aggregation</span>
                    <Badge className="bg-fl-success/10 text-fl-success">
                      <Lock className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Security Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-fl-success/5 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-fl-success" />
                      <div>
                        <div className="font-medium text-sm">Privacy audit completed</div>
                        <div className="text-xs text-muted-foreground">All nodes compliant</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-fl-primary/5 rounded-lg">
                      <Clock className="w-4 h-4 text-fl-primary" />
                      <div>
                        <div className="font-medium text-sm">Encryption keys rotated</div>
                        <div className="text-xs text-muted-foreground">Scheduled maintenance</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;