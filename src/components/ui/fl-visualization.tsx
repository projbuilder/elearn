import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Users, 
  Network, 
  Shield, 
  Zap,
  Activity,
  TrendingUp
} from 'lucide-react';

interface FLNode {
  id: string;
  status: 'active' | 'training' | 'idle';
  accuracy: number;
  contribution: number;
}

interface FLVisualizationProps {
  nodes?: FLNode[];
  globalAccuracy?: number;
  roundNumber?: number;
  isTraining?: boolean;
}

export const FLVisualization: React.FC<FLVisualizationProps> = ({
  nodes = [],
  globalAccuracy = 85.6,
  roundNumber = 42,
  isTraining = false
}) => {
  const [animationNodes, setAnimationNodes] = useState<FLNode[]>([]);

  // Generate demo nodes if none provided
  useEffect(() => {
    if (nodes.length === 0) {
      const demoNodes: FLNode[] = Array.from({ length: 8 }, (_, i) => ({
        id: `node-${i}`,
        status: ['active', 'training', 'idle'][Math.floor(Math.random() * 3)] as any,
        accuracy: 70 + Math.random() * 25,
        contribution: Math.random() * 100
      }));
      setAnimationNodes(demoNodes);
    } else {
      setAnimationNodes(nodes);
    }
  }, [nodes.length]); // Only depend on length to avoid infinite loop

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'fl-success';
      case 'training': return 'fl-primary';
      case 'idle': return 'muted';
      default: return 'muted';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-fl-primary/10 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-fl-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-fl-primary">{globalAccuracy}%</div>
                <div className="text-sm text-muted-foreground">Global Accuracy</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-fl-secondary/10 rounded-lg flex items-center justify-center">
                <Network className="w-5 h-5 text-fl-secondary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-fl-secondary">#{roundNumber}</div>
                <div className="text-sm text-muted-foreground">Training Round</div>
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
                <div className="text-2xl font-bold text-fl-success">{animationNodes.length}</div>
                <div className="text-sm text-muted-foreground">Active Nodes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Network Visualization */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5 text-fl-primary" />
            Federated Learning Network
            {isTraining && (
              <Badge className="bg-fl-primary/10 text-fl-primary">
                <Activity className="w-3 h-3 mr-1" />
                Training in Progress
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Central Node (Global Model) */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <motion.div
                animate={isTraining ? { scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 bg-gradient-to-r from-fl-primary to-fl-secondary rounded-full flex items-center justify-center shadow-glow"
              >
                <Brain className="w-8 h-8 text-white" />
              </motion.div>
              <div className="text-center mt-2">
                <div className="text-sm font-medium">Global Model</div>
                <div className="text-xs text-muted-foreground">{globalAccuracy}% accuracy</div>
              </div>
            </div>

            {/* Peripheral Nodes */}
            <div className="relative w-full h-80 overflow-hidden">
              {animationNodes.map((node, index) => {
                const angle = (index / animationNodes.length) * 2 * Math.PI;
                const radius = 120;
                const x = Math.cos(angle) * radius + 150;
                const y = Math.sin(angle) * radius + 150;

                return (
                  <motion.div
                    key={node.id}
                    className="absolute"
                    style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {/* Connection Line */}
                    <svg
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                      style={{
                        width: Math.abs(150 - x) + 50,
                        height: Math.abs(150 - y) + 50,
                        left: x < 150 ? -Math.abs(150 - x) - 25 : -25,
                        top: y < 150 ? -Math.abs(150 - y) - 25 : -25,
                      }}
                    >
                      <motion.line
                        x1={x < 150 ? Math.abs(150 - x) + 25 : 25}
                        y1={y < 150 ? Math.abs(150 - y) + 25 : 25}
                        x2={x < 150 ? 25 : Math.abs(150 - x) + 25}
                        y2={y < 150 ? 25 : Math.abs(150 - y) + 25}
                        stroke="hsl(var(--fl-primary))"
                        strokeWidth="2"
                        opacity="0.3"
                        animate={isTraining ? { opacity: [0.3, 0.7, 0.3] } : {}}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
                      />
                    </svg>

                    {/* Node */}
                    <motion.div
                      animate={node.status === 'training' ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className={`w-10 h-10 bg-${getStatusColor(node.status)}/20 border-2 border-${getStatusColor(node.status)} rounded-full flex items-center justify-center`}
                    >
                      <div className={`w-3 h-3 bg-${getStatusColor(node.status)} rounded-full`} />
                    </motion.div>

                    {/* Node Info */}
                    <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-center whitespace-nowrap">
                      <div className="text-xs font-medium">Node {index + 1}</div>
                      <div className="text-xs text-muted-foreground">
                        {node.accuracy.toFixed(1)}%
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-6 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-fl-success rounded-full" />
              <span className="text-sm">Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-fl-primary rounded-full" />
              <span className="text-sm">Training</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-muted-foreground rounded-full" />
              <span className="text-sm">Idle</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-fl-success" />
              Learning Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Model Accuracy</span>
                  <span className="font-medium">{globalAccuracy}%</span>
                </div>
                <Progress value={globalAccuracy} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Training Completion</span>
                  <span className="font-medium">78%</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Node Participation</span>
                  <span className="font-medium">92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-fl-success" />
              Privacy Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Data Locality</span>
                <Badge className="bg-fl-success/10 text-fl-success">100% Local</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Encryption Level</span>
                <Badge className="bg-fl-success/10 text-fl-success">AES-256</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Privacy Budget</span>
                <Badge className="bg-fl-primary/10 text-fl-primary">ε=1.0</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Differential Privacy</span>
                <Badge className="bg-fl-success/10 text-fl-success">Enabled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FLVisualization;