import { supabase } from '@/integrations/supabase/client';

export interface LearningPath {
  id: string;
  studentId: string;
  currentTopic: string;
  difficulty: number;
  estimatedTime: number;
  completionPercentage: number;
  nextTopics: string[];
  adaptations: LearningAdaptation[];
}

export interface LearningAdaptation {
  type: 'difficulty_increase' | 'difficulty_decrease' | 'pace_adjustment' | 'content_format';
  reason: string;
  timestamp: Date;
  effectiveness?: number;
}

export interface AssessmentResult {
  studentId: string;
  topic: string;
  score: number;
  timeSpent: number;
  hintsUsed: number;
  difficulty: number;
  timestamp: Date;
}

export interface KnowledgeNode {
  id: string;
  name: string;
  prerequisites: string[];
  difficulty: number;
  estimatedTime: number;
  contentTypes: string[];
}

export class AdaptiveLearningEngine {
  private knowledgeGraph: Map<string, KnowledgeNode> = new Map();

  constructor() {
    this.initializeKnowledgeGraph();
  }

  private initializeKnowledgeGraph() {
    const nodes: KnowledgeNode[] = [
      {
        id: 'basic_algebra',
        name: 'Basic Algebra',
        prerequisites: [],
        difficulty: 1,
        estimatedTime: 30,
        contentTypes: ['video', 'practice', 'quiz']
      },
      {
        id: 'linear_equations',
        name: 'Linear Equations',
        prerequisites: ['basic_algebra'],
        difficulty: 2,
        estimatedTime: 45,
        contentTypes: ['explanation', 'examples', 'practice']
      },
      {
        id: 'quadratic_equations',
        name: 'Quadratic Equations',
        prerequisites: ['linear_equations'],
        difficulty: 3,
        estimatedTime: 60,
        contentTypes: ['theory', 'visual', 'practice']
      },
      {
        id: 'basic_calculus',
        name: 'Introduction to Calculus',
        prerequisites: ['quadratic_equations'],
        difficulty: 4,
        estimatedTime: 90,
        contentTypes: ['theory', 'visual', 'interactive']
      },
      {
        id: 'derivatives',
        name: 'Derivatives',
        prerequisites: ['basic_calculus'],
        difficulty: 5,
        estimatedTime: 120,
        contentTypes: ['theory', 'examples', 'practice', 'applications']
      },
      {
        id: 'integrals',
        name: 'Integrals',
        prerequisites: ['derivatives'],
        difficulty: 6,
        estimatedTime: 150,
        contentTypes: ['theory', 'visual', 'practice', 'real_world']
      },
      {
        id: 'statistics_basics',
        name: 'Basic Statistics',
        prerequisites: ['basic_algebra'],
        difficulty: 2,
        estimatedTime: 40,
        contentTypes: ['data', 'visual', 'practice']
      },
      {
        id: 'probability',
        name: 'Probability Theory',
        prerequisites: ['statistics_basics'],
        difficulty: 4,
        estimatedTime: 80,
        contentTypes: ['theory', 'examples', 'simulations']
      },
      {
        id: 'geometry_basics',
        name: 'Basic Geometry',
        prerequisites: [],
        difficulty: 2,
        estimatedTime: 35,
        contentTypes: ['visual', 'interactive', 'practice']
      },
      {
        id: 'trigonometry',
        name: 'Trigonometry',
        prerequisites: ['geometry_basics', 'basic_algebra'],
        difficulty: 4,
        estimatedTime: 75,
        contentTypes: ['visual', 'applications', 'practice']
      }
    ];

    nodes.forEach(node => this.knowledgeGraph.set(node.id, node));
  }

  async generatePersonalizedPath(studentId: string): Promise<LearningPath> {
    try {
      // Assess current knowledge
      const knowledgeState = await this.assessCurrentKnowledge(studentId);
      
      // Get student profile
      const profile = await this.getStudentProfile(studentId);
      
      // Find optimal starting point
      const startingPoint = this.findOptimalStartingPoint(knowledgeState, profile);
      
      // Generate learning sequence
      const sequence = this.generateLearningSequence(startingPoint, profile, knowledgeState);
      
      // Personalize based on learning style and preferences
      const personalizedSequence = this.personalizeSequence(sequence, profile);
      
      // Calculate estimated time
      const estimatedTime = this.calculateEstimatedTime(personalizedSequence, profile);
      
      const learningPath: LearningPath = {
        id: `path-${studentId}-${Date.now()}`,
        studentId,
        currentTopic: personalizedSequence[0] || 'basic_algebra',
        difficulty: this.knowledgeGraph.get(personalizedSequence[0])?.difficulty || 1,
        estimatedTime,
        completionPercentage: 0,
        nextTopics: personalizedSequence.slice(1, 6), // Next 5 topics
        adaptations: []
      };

      // Store learning path
      await this.storeLearningPath(learningPath);
      
      return learningPath;
    } catch (error) {
      console.error('Error generating learning path:', error);
      
      // Return default path
      return {
        id: `path-${studentId}-default`,
        studentId,
        currentTopic: 'basic_algebra',
        difficulty: 1,
        estimatedTime: 240, // 4 hours
        completionPercentage: 0,
        nextTopics: ['linear_equations', 'quadratic_equations', 'basic_calculus'],
        adaptations: []
      };
    }
  }

  private async assessCurrentKnowledge(studentId: string): Promise<Map<string, number>> {
    const knowledgeState = new Map<string, number>();
    
    try {
      // Get recent assessment results
      const { data: progress, error } = await supabase
        .from('student_progress')  
        .select('*')
        .eq('student_id', studentId);

      if (!error && progress) {
        progress.forEach((p: any) => {
          const metrics = p.performance_metrics || {};
          if (metrics.topic && metrics.score) {
            knowledgeState.set(metrics.topic, metrics.score);
          }
        });
      }

      // Initialize with defaults if no data
      if (knowledgeState.size === 0) {
        knowledgeState.set('basic_algebra', 0.3);
        knowledgeState.set('linear_equations', 0.1);
        knowledgeState.set('geometry_basics', 0.4);
      }

    } catch (error) {
      console.error('Error assessing knowledge:', error);
      // Use defaults
      knowledgeState.set('basic_algebra', 0.5);
      knowledgeState.set('geometry_basics', 0.3);
    }

    return knowledgeState;
  }

  private async getStudentProfile(studentId: string): Promise<any> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', studentId)
        .maybeSingle();

      return {
        learningStyle: (profile?.learning_preferences as any)?.learning_style || 'visual',
        pace: (profile?.learning_preferences as any)?.preferred_pace || 'medium',
        difficultyPreference: (profile?.learning_preferences as any)?.difficulty_preference || 'adaptive',
        timeAvailable: (profile?.learning_preferences as any)?.time_available || 60,
        goals: (profile?.learning_preferences as any)?.goals || ['general_improvement'],
        strengths: (profile?.learning_preferences as any)?.strengths || [],
        weaknesses: (profile?.learning_preferences as any)?.weaknesses || []
      };
    } catch (error) {
      return {
        learningStyle: 'visual',
        pace: 'medium',
        difficultyPreference: 'adaptive',
        timeAvailable: 60,
        goals: ['general_improvement'],
        strengths: [],
        weaknesses: []
      };
    }
  }

  private findOptimalStartingPoint(knowledgeState: Map<string, number>, profile: any): string {
    // Find topics where student has some knowledge but room for improvement
    const candidates: Array<{id: string, score: number, readiness: number}> = [];
    
    for (const [nodeId, node] of this.knowledgeGraph.entries()) {
      const currentScore = knowledgeState.get(nodeId) || 0;
      
      // Check if prerequisites are met
      const prerequisitesMet = this.prerequisitesMet(nodeId, knowledgeState);
      
      if (prerequisitesMet) {
        // Calculate readiness score
        const readiness = this.calculateReadiness(currentScore, node.difficulty, profile);
        candidates.push({ id: nodeId, score: currentScore, readiness });
      }
    }

    // Sort by readiness and select best option
    candidates.sort((a, b) => b.readiness - a.readiness);
    
    return candidates.length > 0 ? candidates[0].id : 'basic_algebra';
  }

  private prerequisitesMet(nodeId: string, knowledgeState: Map<string, number>): boolean {
    const node = this.knowledgeGraph.get(nodeId);
    if (!node) return false;

    const threshold = 0.7; // 70% mastery required
    
    return node.prerequisites.every(prereq => 
      (knowledgeState.get(prereq) || 0) >= threshold
    );
  }

  private calculateReadiness(currentScore: number, difficulty: number, profile: any): number {
    let readiness = 0;

    // Factor 1: Knowledge gap (want some challenge but not too much)
    const idealScore = 0.3 + (difficulty - 1) * 0.1; // Ideal starting score increases with difficulty
    const scoreDiff = Math.abs(currentScore - idealScore);
    readiness += Math.max(0, 1 - scoreDiff * 2);

    // Factor 2: Difficulty preference
    if (profile.difficultyPreference === 'challenging' && difficulty >= 4) {
      readiness += 0.3;
    } else if (profile.difficultyPreference === 'easy' && difficulty <= 2) {
      readiness += 0.3;
    } else if (profile.difficultyPreference === 'adaptive') {
      readiness += 0.2; // Neutral bonus
    }

    // Factor 3: Strengths alignment
    const nodeId = Array.from(this.knowledgeGraph.entries())
      .find(([id, node]) => node.difficulty === difficulty)?.[0];
    
    if (nodeId && profile.strengths.includes(nodeId)) {
      readiness += 0.2;
    }

    return Math.max(0, Math.min(1, readiness));
  }

  private generateLearningSequence(startingPoint: string, profile: any, knowledgeState: Map<string, number>): string[] {
    const sequence: string[] = [startingPoint];
    const visited = new Set([startingPoint]);
    const maxLength = 10;

    let current = startingPoint;
    
    while (sequence.length < maxLength) {
      const nextNodes = this.findNextNodes(current, visited, knowledgeState, profile);
      
      if (nextNodes.length === 0) break;
      
      // Select best next node
      const next = this.selectBestNext(nextNodes, profile, knowledgeState);
      sequence.push(next);
      visited.add(next);
      current = next;
    }

    return sequence;
  }

  private findNextNodes(currentNode: string, visited: Set<string>, knowledgeState: Map<string, number>, profile: any): string[] {
    const candidates: string[] = [];
    
    for (const [nodeId, node] of this.knowledgeGraph.entries()) {
      if (visited.has(nodeId)) continue;
      
      // Check if current node is a prerequisite
      if (node.prerequisites.includes(currentNode)) {
        // Check if other prerequisites are met
        const otherPrereqsMet = node.prerequisites
          .filter(p => p !== currentNode)
          .every(prereq => (knowledgeState.get(prereq) || 0) >= 0.7);
          
        if (otherPrereqsMet) {
          candidates.push(nodeId);
        }
      }
    }

    return candidates;
  }

  private selectBestNext(candidates: string[], profile: any, knowledgeState: Map<string, number>): string {
    if (candidates.length === 0) return 'basic_algebra';
    if (candidates.length === 1) return candidates[0];

    // Score each candidate
    const scored = candidates.map(nodeId => {
      const node = this.knowledgeGraph.get(nodeId)!;
      let score = 0;

      // Prefer appropriate difficulty
      const currentLevel = Math.max(...Array.from(knowledgeState.values()));
      const difficultyMatch = 1 - Math.abs(node.difficulty - (currentLevel * 6 + 1)) / 6;
      score += difficultyMatch * 0.4;

      // Consider learning style compatibility
      const styleMatch = this.getStyleCompatibility(node, profile.learningStyle);
      score += styleMatch * 0.3;

      // Consider time constraints
      const timeMatch = node.estimatedTime <= profile.timeAvailable ? 1 : profile.timeAvailable / node.estimatedTime;
      score += timeMatch * 0.3;

      return { nodeId, score };
    });

    // Return highest scoring candidate
    scored.sort((a, b) => b.score - a.score);
    return scored[0].nodeId;
  }

  private getStyleCompatibility(node: KnowledgeNode, learningStyle: string): number {
    const stylePreferences = {
      visual: ['visual', 'interactive', 'theory'],
      auditory: ['explanation', 'examples', 'theory'],
      kinesthetic: ['interactive', 'practice', 'applications'],
      reading: ['theory', 'explanation', 'examples']
    };

    const preferred = stylePreferences[learningStyle as keyof typeof stylePreferences] || [];
    const overlap = node.contentTypes.filter(type => preferred.includes(type)).length;
    
    return overlap / Math.max(preferred.length, node.contentTypes.length);
  }

  private personalizeSequence(sequence: string[], profile: any): string[] {
    // Adjust sequence based on learning style and preferences
    if (profile.learningStyle === 'kinesthetic') {
      // Prioritize practical applications
      return sequence.sort((a, b) => {
        const nodeA = this.knowledgeGraph.get(a)!;
        const nodeB = this.knowledgeGraph.get(b)!;
        const scoreA = nodeA.contentTypes.includes('applications') ? 1 : 0;
        const scoreB = nodeB.contentTypes.includes('applications') ? 1 : 0;
        return scoreB - scoreA;
      });
    }

    if (profile.pace === 'fast') {
      // Remove intermediate steps for fast learners
      return sequence.filter((_, index) => index % 2 === 0 || index === sequence.length - 1);
    }

    if (profile.pace === 'slow') {
      // Add more foundational topics
      const expanded: string[] = [];
      sequence.forEach(nodeId => {
        const node = this.knowledgeGraph.get(nodeId)!;
        expanded.push(nodeId);
        
        // Add review/practice session after difficult topics
        if (node.difficulty >= 4) {
          expanded.push(`${nodeId}_review`);
        }
      });
      return expanded;
    }

    return sequence;
  }

  private calculateEstimatedTime(sequence: string[], profile: any): number {
    let totalTime = 0;
    
    sequence.forEach(nodeId => {
      const node = this.knowledgeGraph.get(nodeId);
      if (node) {
        let nodeTime = node.estimatedTime;
        
        // Adjust based on learning pace
        if (profile.pace === 'slow') nodeTime *= 1.5;
        else if (profile.pace === 'fast') nodeTime *= 0.7;
        
        totalTime += nodeTime;
      }
    });

    return Math.round(totalTime);
  }

  async adaptDifficulty(studentId: string, assessmentResult: AssessmentResult): Promise<LearningAdaptation> {
    const performance = assessmentResult.score;
    const timeRatio = assessmentResult.timeSpent / (this.knowledgeGraph.get(assessmentResult.topic)?.estimatedTime || 60);
    
    let adaptation: LearningAdaptation;
    
    if (performance >= 0.9 && timeRatio < 0.8) {
      // Student is excelling - increase difficulty
      adaptation = {
        type: 'difficulty_increase',
        reason: `High performance (${Math.round(performance * 100)}%) with efficient time use`,
        timestamp: new Date()
      };
    } else if (performance < 0.6 || timeRatio > 1.5) {
      // Student is struggling - provide support
      adaptation = {
        type: 'difficulty_decrease',
        reason: `Lower performance (${Math.round(performance * 100)}%) or extended time needed`,
        timestamp: new Date()
      };
    } else {
      // Performance is in optimal range
      adaptation = {
        type: 'pace_adjustment',
        reason: 'Maintaining optimal challenge level',
        timestamp: new Date()
      };
    }

    // Update learning path
    await this.updateLearningPath(studentId, adaptation);
    
    return adaptation;
  }

  async recommendNextActivity(studentId: string): Promise<{
    type: string;
    topic: string;
    difficulty: number;
    estimatedTime: number;
    reason: string;
  }> {
    const path = await this.getCurrentPath(studentId);
    const recentPerformance = await this.getRecentPerformance(studentId);
    
    // Default recommendation
    let recommendation = {
      type: 'lesson',
      topic: path?.currentTopic || 'basic_algebra',
      difficulty: path?.difficulty || 1,
      estimatedTime: 30,
      reason: 'Continue with your current learning path'
    };

    if (recentPerformance.length > 0) {
      const latest = recentPerformance[0];
      
      if (latest.score < 0.6) {
        recommendation = {
          type: 'review',
          topic: latest.topic,
          difficulty: Math.max(1, latest.difficulty - 1),
          estimatedTime: 20,
          reason: 'Review previous topic to strengthen understanding'
        };
      } else if (latest.score >= 0.8 && recentPerformance.length >= 3) {
        const avgScore = recentPerformance.slice(0, 3).reduce((sum, r) => sum + r.score, 0) / 3;
        if (avgScore >= 0.8) {
          recommendation = {
            type: 'assessment',
            topic: path?.nextTopics[0] || 'linear_equations',
            difficulty: (path?.difficulty || 1) + 1,
            estimatedTime: 15,
            reason: 'Ready for more advanced material'
          };
        }
      }
    }

    return recommendation;
  }

  private async getCurrentPath(studentId: string): Promise<LearningPath | null> {
    try {
      const { data, error } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return null;

      // Convert stored data back to LearningPath format
      const metrics = (data.performance_metrics as Record<string, any>) || {};
      return {
        id: data.id,
        studentId,
        currentTopic: typeof metrics.current_topic === 'string' ? metrics.current_topic : 'basic_algebra',
        difficulty: typeof metrics.difficulty === 'number' ? metrics.difficulty : 1,
        estimatedTime: typeof metrics.estimated_time === 'number' ? metrics.estimated_time : 60,
        completionPercentage: data.progress_percentage || 0,
        nextTopics: Array.isArray(metrics.next_topics) ? metrics.next_topics : [],
        adaptations: Array.isArray(metrics.adaptations) ? metrics.adaptations : []
      };
    } catch (error) {
      console.error('Error getting current path:', error);
      return null;
    }
  }

  private async getRecentPerformance(studentId: string): Promise<AssessmentResult[]> {
    try {
      const { data, error } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error || !data) return [];

      return data.map((d: any) => ({
        studentId,
        topic: d.performance_metrics?.topic || 'unknown',
        score: d.performance_metrics?.accuracy || 0.7,
        timeSpent: d.performance_metrics?.time_spent || 30,
        hintsUsed: d.performance_metrics?.hints_used || 0,
        difficulty: d.performance_metrics?.difficulty || 1,
        timestamp: new Date(d.created_at)
      }));
    } catch (error) {
      console.error('Error getting recent performance:', error);
      return [];
    }
  }

  private async storeLearningPath(path: LearningPath): Promise<void> {
    try {
      await supabase.from('student_progress').upsert({
        student_id: path.studentId,
        course_id: 'adaptive-learning',
        progress_percentage: path.completionPercentage,
        performance_metrics: {
          current_topic: path.currentTopic,
          difficulty: path.difficulty,
          estimated_time: path.estimatedTime,
          next_topics: path.nextTopics,
          adaptations: path.adaptations.map(a => ({
            type: a.type,
            reason: a.reason,
            timestamp: a.timestamp.toISOString(),
            effectiveness: a.effectiveness || 0
          }))
        } as any,
        last_accessed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error storing learning path:', error);
    }
  }

  private async updateLearningPath(studentId: string, adaptation: LearningAdaptation): Promise<void> {
    try {
      const currentPath = await this.getCurrentPath(studentId);
      if (!currentPath) return;

      currentPath.adaptations.push(adaptation);

      await this.storeLearningPath(currentPath);
    } catch (error) {
      console.error('Error updating learning path:', error);
    }
  }

  getKnowledgeGraphVisualization(): any {
    const nodes = Array.from(this.knowledgeGraph.entries()).map(([id, node]) => ({
      id,
      name: node.name,
      difficulty: node.difficulty,
      estimatedTime: node.estimatedTime,
      contentTypes: node.contentTypes
    }));

    const edges = Array.from(this.knowledgeGraph.entries()).flatMap(([id, node]) =>
      node.prerequisites.map(prereq => ({
        from: prereq,
        to: id,
        type: 'prerequisite'
      }))
    );

    return { nodes, edges };
  }
}

export const adaptiveLearningEngine = new AdaptiveLearningEngine();