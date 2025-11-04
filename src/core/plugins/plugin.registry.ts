// Plugin Registry System
// Manages plugin metadata, dependencies, and lifecycle

import { FEATURES, FeatureName } from '@/config/features.config';

export interface PluginMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: 'core' | 'feature' | 'integration' | 'analytics';
  featureFlag: FeatureName;
  dependencies: string[];
  requiredPermissions: string[];
  azureServices?: string[];
  status: 'active' | 'inactive' | 'error' | 'loading';
  healthStatus?: {
    isHealthy: boolean;
    lastCheck: Date;
    errors?: string[];
  };
}

export interface PluginManifest {
  plugins: PluginMetadata[];
}

// Plugin Registry
export class PluginRegistry {
  private static instance: PluginRegistry;
  private plugins: Map<string, PluginMetadata> = new Map();
  private loadedModules: Map<string, any> = new Map();

  private constructor() {
    this.initializePlugins();
  }

  static getInstance(): PluginRegistry {
    if (!PluginRegistry.instance) {
      PluginRegistry.instance = new PluginRegistry();
    }
    return PluginRegistry.instance;
  }

  private initializePlugins() {
    const pluginDefinitions: PluginMetadata[] = [
      {
        id: 'ai-tutor',
        name: 'AI Tutor',
        description: 'Intelligent AI-powered personalized tutoring system with adaptive learning',
        version: '1.0.0',
        author: 'FedLearn Team',
        category: 'feature',
        featureFlag: 'AI_TUTOR',
        dependencies: [],
        requiredPermissions: ['student', 'instructor'],
        azureServices: ['Azure OpenAI'],
        status: FEATURES.AI_TUTOR ? 'active' : 'inactive',
        healthStatus: {
          isHealthy: true,
          lastCheck: new Date(),
        }
      },
      {
        id: 'federated-learning',
        name: 'Federated Learning',
        description: 'Privacy-preserving distributed machine learning with differential privacy',
        version: '1.0.0',
        author: 'FedLearn Team',
        category: 'core',
        featureFlag: 'FEDERATED_LEARNING',
        dependencies: [],
        requiredPermissions: ['student', 'instructor', 'admin'],
        azureServices: ['Azure Functions', 'Azure Monitor'],
        status: FEATURES.FEDERATED_LEARNING ? 'active' : 'inactive',
        healthStatus: {
          isHealthy: true,
          lastCheck: new Date(),
        }
      },
      {
        id: 'adaptive-learning',
        name: 'Adaptive Learning Engine',
        description: 'Dynamic learning path generation based on student performance and preferences',
        version: '1.0.0',
        author: 'FedLearn Team',
        category: 'feature',
        featureFlag: 'ADAPTIVE_LEARNING',
        dependencies: ['ai-tutor'],
        requiredPermissions: ['student', 'instructor'],
        azureServices: [],
        status: FEATURES.ADAPTIVE_LEARNING ? 'active' : 'inactive',
        healthStatus: {
          isHealthy: true,
          lastCheck: new Date(),
        }
      },
      {
        id: 'analytics-dashboard',
        name: 'Analytics Dashboard',
        description: 'Real-time analytics and insights for students and instructors',
        version: '1.0.0',
        author: 'FedLearn Team',
        category: 'analytics',
        featureFlag: 'ANALYTICS_DASHBOARD',
        dependencies: [],
        requiredPermissions: ['instructor', 'admin'],
        azureServices: ['Azure Monitor'],
        status: FEATURES.ANALYTICS_DASHBOARD ? 'active' : 'inactive',
        healthStatus: {
          isHealthy: true,
          lastCheck: new Date(),
        }
      },
      {
        id: 'real-time-metrics',
        name: 'Real-Time Metrics',
        description: 'Live performance monitoring and real-time data visualization',
        version: '1.0.0',
        author: 'FedLearn Team',
        category: 'analytics',
        featureFlag: 'REAL_TIME_METRICS',
        dependencies: ['analytics-dashboard'],
        requiredPermissions: ['instructor', 'admin'],
        azureServices: [],
        status: FEATURES.REAL_TIME_METRICS ? 'active' : 'inactive',
        healthStatus: {
          isHealthy: true,
          lastCheck: new Date(),
        }
      },
      {
        id: 'azure-integration',
        name: 'Azure Cloud Integration',
        description: 'Full Azure cloud services integration (Functions, Blob Storage, OpenAI, Monitor)',
        version: '0.1.0',
        author: 'FedLearn Team',
        category: 'integration',
        featureFlag: 'AZURE_INTEGRATION',
        dependencies: [],
        requiredPermissions: ['admin'],
        azureServices: ['Azure Functions', 'Azure Blob Storage', 'Azure OpenAI', 'Azure Monitor'],
        status: FEATURES.AZURE_INTEGRATION ? 'active' : 'inactive',
        healthStatus: {
          isHealthy: false,
          lastCheck: new Date(),
          errors: ['Not yet configured - Phase 4']
        }
      },
      {
        id: 'real-time-notifications',
        name: 'Real-Time Notifications',
        description: 'Push notifications and real-time event updates',
        version: '0.1.0',
        author: 'FedLearn Team',
        category: 'feature',
        featureFlag: 'REAL_TIME_NOTIFICATIONS',
        dependencies: [],
        requiredPermissions: ['student', 'instructor'],
        azureServices: [],
        status: FEATURES.REAL_TIME_NOTIFICATIONS ? 'active' : 'inactive',
        healthStatus: {
          isHealthy: false,
          lastCheck: new Date(),
          errors: ['Coming soon - Phase 3']
        }
      },
      {
        id: 'advanced-analytics',
        name: 'Advanced Analytics',
        description: 'ML-powered insights, predictive analytics, and trend analysis',
        version: '0.1.0',
        author: 'FedLearn Team',
        category: 'analytics',
        featureFlag: 'ADVANCED_ANALYTICS',
        dependencies: ['analytics-dashboard', 'azure-integration'],
        requiredPermissions: ['instructor', 'admin'],
        azureServices: ['Azure Machine Learning'],
        status: FEATURES.ADVANCED_ANALYTICS ? 'active' : 'inactive',
        healthStatus: {
          isHealthy: false,
          lastCheck: new Date(),
          errors: ['Coming soon - Phase 3']
        }
      }
    ];

    pluginDefinitions.forEach(plugin => {
      this.plugins.set(plugin.id, plugin);
    });
  }

  getPlugin(id: string): PluginMetadata | undefined {
    return this.plugins.get(id);
  }

  getAllPlugins(): PluginMetadata[] {
    return Array.from(this.plugins.values());
  }

  getPluginsByCategory(category: PluginMetadata['category']): PluginMetadata[] {
    return Array.from(this.plugins.values()).filter(p => p.category === category);
  }

  getActivePlugins(): PluginMetadata[] {
    return Array.from(this.plugins.values()).filter(p => p.status === 'active');
  }

  updatePluginStatus(id: string, status: PluginMetadata['status']) {
    const plugin = this.plugins.get(id);
    if (plugin) {
      plugin.status = status;
      this.plugins.set(id, plugin);
    }
  }

  updatePluginHealth(id: string, isHealthy: boolean, errors?: string[]) {
    const plugin = this.plugins.get(id);
    if (plugin) {
      plugin.healthStatus = {
        isHealthy,
        lastCheck: new Date(),
        errors
      };
      this.plugins.set(id, plugin);
    }
  }

  checkDependencies(pluginId: string): { satisfied: boolean; missing: string[] } {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return { satisfied: false, missing: [] };
    }

    const missing: string[] = [];
    for (const depId of plugin.dependencies) {
      const dep = this.plugins.get(depId);
      if (!dep || dep.status !== 'active') {
        missing.push(depId);
      }
    }

    return {
      satisfied: missing.length === 0,
      missing
    };
  }

  async loadModule(pluginId: string): Promise<any> {
    if (this.loadedModules.has(pluginId)) {
      return this.loadedModules.get(pluginId);
    }

    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    // Check dependencies
    const { satisfied, missing } = this.checkDependencies(pluginId);
    if (!satisfied) {
      throw new Error(`Missing dependencies: ${missing.join(', ')}`);
    }

    try {
      this.updatePluginStatus(pluginId, 'loading');

      // Dynamic import based on plugin ID
      let module;
      switch (pluginId) {
        case 'ai-tutor':
          module = await import('@/modules/ai-tutor');
          break;
        case 'federated-learning':
          module = await import('@/modules/federated-learning');
          break;
        case 'adaptive-learning':
          module = await import('@/modules/adaptive-learning');
          break;
        case 'analytics-dashboard':
          // Already loaded in dashboards
          module = { loaded: true };
          break;
        default:
          throw new Error(`No loader defined for plugin ${pluginId}`);
      }

      this.loadedModules.set(pluginId, module);
      this.updatePluginStatus(pluginId, 'active');
      this.updatePluginHealth(pluginId, true);

      return module;
    } catch (error) {
      this.updatePluginStatus(pluginId, 'error');
      this.updatePluginHealth(pluginId, false, [error.message]);
      throw error;
    }
  }

  unloadModule(pluginId: string) {
    this.loadedModules.delete(pluginId);
    this.updatePluginStatus(pluginId, 'inactive');
  }
}

export const pluginRegistry = PluginRegistry.getInstance();
