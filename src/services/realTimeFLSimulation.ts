import { supabase } from '@/integrations/supabase/client';
import { federatedLearningService, FLTrainingMetrics } from './federatedLearning';

interface SimulationNode {
  id: string;
  userId: string;
  status: 'active' | 'training' | 'idle';
  localAccuracy: number;
  dataSize: number;
  lastUpdate: Date;
}

export class RealTimeFLSimulation {
  private nodes: Map<string, SimulationNode> = new Map();
  private trainingInterval: number | null = null;
  private isRunning: boolean = false;
  private listeners: Set<(metrics: FLTrainingMetrics) => void> = new Set();

  constructor() {
    this.initializeSimulation();
  }

  private async initializeSimulation() {
    // Load existing FL nodes from database
    const { data: existingNodes } = await supabase
      .from('fl_nodes')
      .select('*')
      .limit(50);

    if (existingNodes && existingNodes.length > 0) {
      existingNodes.forEach((dbNode: any) => {
        const node: SimulationNode = {
          id: `node-${dbNode.user_id}`,
          userId: dbNode.user_id,
          status: dbNode.node_status as any || 'active',
          localAccuracy: dbNode.training_metrics?.local_accuracy || 0.8,
          dataSize: dbNode.training_metrics?.data_contribution || 100,
          lastUpdate: new Date(dbNode.last_update_at || new Date())
        };
        this.nodes.set(node.id, node);
      });
    }
  }

  addListener(callback: (metrics: FLTrainingMetrics) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(metrics: FLTrainingMetrics) {
    this.listeners.forEach(callback => callback(metrics));
  }

  async startSimulation() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Start periodic training rounds
    this.trainingInterval = window.setInterval(async () => {
      await this.simulateTrainingRound();
    }, 10000); // Every 10 seconds
  }

  stopSimulation() {
    this.isRunning = false;
    if (this.trainingInterval) {
      clearInterval(this.trainingInterval);
      this.trainingInterval = null;
    }
  }

  private async simulateTrainingRound() {
    // Select random participating nodes (30-70% participation)
    const participationRate = 0.3 + Math.random() * 0.4;
    const participatingNodes = Array.from(this.nodes.values())
      .filter(() => Math.random() < participationRate);

    if (participatingNodes.length === 0) return;

    // Simulate local training
    for (const node of participatingNodes) {
      node.status = 'training';
      
      // Simulate accuracy improvement with some noise
      node.localAccuracy = Math.min(0.98, node.localAccuracy + Math.random() * 0.02 - 0.005);
      node.lastUpdate = new Date();

      // Update database - only for real user UUIDs
      if (node.userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        await supabase.from('fl_nodes')
          .update({
            node_status: 'training',
            training_metrics: {
              local_accuracy: node.localAccuracy,
              data_contribution: node.dataSize,
              last_training_step: Math.floor(Math.random() * 10) + 1
            },
            last_update_at: new Date().toISOString()
          })
          .eq('user_id', node.userId);
      }
    }

    // Simulate aggregation delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Calculate global metrics
    const globalAccuracy = participatingNodes.reduce((sum, node) => sum + node.localAccuracy, 0) / participatingNodes.length;
    
    // Create FL metrics
    const metrics: FLTrainingMetrics = {
      round: Math.floor(Date.now() / 10000),
      localAccuracy: globalAccuracy,
      globalAccuracy: globalAccuracy + Math.random() * 0.02, // Global model slightly better
      participatingNodes: participatingNodes.length,
      privacyBudget: Math.max(0.1, 1.0 - (Math.floor(Date.now() / 10000) * 0.01)),
      trainingTime: 5 + Math.random() * 10
    };

    // Update node status back to active
    for (const node of participatingNodes) {
      node.status = 'active';
      if (node.userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        await supabase.from('fl_nodes')
          .update({ node_status: 'active' })
          .eq('user_id', node.userId);
      }
    }

    // Notify listeners
    this.notifyListeners(metrics);
  }

  async addUserNode(userId: string, courseId?: string) {
    // Check if node already exists
    const existingNode = Array.from(this.nodes.values()).find(n => n.userId === userId);
    if (existingNode) return existingNode;

    const node: SimulationNode = {
      id: `node-${userId}`,
      userId,
      status: 'active',
      localAccuracy: 0.7 + Math.random() * 0.2, // 70-90% initial accuracy
      dataSize: Math.floor(50 + Math.random() * 150), // 50-200 samples
      lastUpdate: new Date()
    };

    this.nodes.set(node.id, node);

    // Get a real course ID if available
    if (!courseId) {
      const { data: courses } = await supabase
        .from('courses')
        .select('id')
        .limit(1)
        .maybeSingle();
      courseId = courses?.id;
    }

    // Store in database only if we have a valid course ID
    if (courseId) {
      await supabase.from('fl_nodes').upsert({
        user_id: userId,
        course_id: courseId,
        node_status: 'active',
        training_metrics: {
          local_accuracy: node.localAccuracy,
          data_contribution: node.dataSize,
          last_training_step: 0
        },
        model_version: 1,
        last_update_at: new Date().toISOString()
      });
    }

    return node;
  }

  getNodes(): SimulationNode[] {
    return Array.from(this.nodes.values());
  }

  getCurrentMetrics(): FLTrainingMetrics {
    const activeNodes = Array.from(this.nodes.values()).filter(n => n.status === 'active');
    const avgAccuracy = activeNodes.length > 0 
      ? activeNodes.reduce((sum, node) => sum + node.localAccuracy, 0) / activeNodes.length
      : 0.8;

    return {
      round: Math.floor(Date.now() / 10000),
      localAccuracy: avgAccuracy,
      globalAccuracy: avgAccuracy + 0.02,
      participatingNodes: activeNodes.length,
      privacyBudget: Math.max(0.1, 1.0 - (Math.floor(Date.now() / 10000) * 0.01)),
      trainingTime: 8
    };
  }

  async simulateUserTraining(userId: string): Promise<FLTrainingMetrics> {
    const node = Array.from(this.nodes.values()).find(n => n.userId === userId);
    
    if (!node) {
      await this.addUserNode(userId);
      return this.getCurrentMetrics();
    }

    // Simulate training steps with progress updates
    const steps = 5;
    for (let i = 0; i < steps; i++) {
      node.status = 'training';
      node.localAccuracy = Math.min(0.95, node.localAccuracy + Math.random() * 0.01);
      
      if (userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        await supabase.from('fl_nodes')
          .update({
            node_status: 'training',
            training_metrics: {
              local_accuracy: node.localAccuracy,
              data_contribution: node.dataSize,
              last_training_step: i + 1
            },
            last_update_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }

      // Simulate step delay
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    node.status = 'active';
    if (userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      await supabase.from('fl_nodes')
        .update({ node_status: 'active' })
        .eq('user_id', userId);
    }

    return this.getCurrentMetrics();
  }
}

export const flSimulation = new RealTimeFLSimulation();