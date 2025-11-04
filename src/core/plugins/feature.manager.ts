// Feature Management Service
// Runtime feature toggling with persistence

import { FEATURES, FeatureName } from '@/config/features.config';
import { logger } from '@/shared/utils/logger';

export type FeatureChangeListener = (featureName: FeatureName, enabled: boolean) => void;

class FeatureManager {
  private static instance: FeatureManager;
  private featureStates: Map<FeatureName, boolean> = new Map();
  private listeners: Set<FeatureChangeListener> = new Set();
  private readonly STORAGE_KEY = 'fedlearn_feature_flags';

  private constructor() {
    this.loadFeatureStates();
  }

  static getInstance(): FeatureManager {
    if (!FeatureManager.instance) {
      FeatureManager.instance = new FeatureManager();
    }
    return FeatureManager.instance;
  }

  private loadFeatureStates() {
    // Load from localStorage (persisted admin changes)
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsedStates = JSON.parse(stored);
        Object.entries(parsedStates).forEach(([key, value]) => {
          this.featureStates.set(key as FeatureName, value as boolean);
        });
        logger.info('Loaded persisted feature states', parsedStates);
      } else {
        // Initialize with default config
        Object.entries(FEATURES).forEach(([key, value]) => {
          this.featureStates.set(key as FeatureName, value as boolean);
        });
      }
    } catch (error) {
      logger.error('Error loading feature states', error);
      // Fallback to config defaults
      Object.entries(FEATURES).forEach(([key, value]) => {
        this.featureStates.set(key as FeatureName, value as boolean);
      });
    }
  }

  private saveFeatureStates() {
    try {
      const states = Object.fromEntries(this.featureStates);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(states));
      logger.info('Saved feature states', states);
    } catch (error) {
      logger.error('Error saving feature states', error);
    }
  }

  isEnabled(featureName: FeatureName): boolean {
    return this.featureStates.get(featureName) ?? false;
  }

  enable(featureName: FeatureName) {
    const wasEnabled = this.isEnabled(featureName);
    this.featureStates.set(featureName, true);
    this.saveFeatureStates();
    
    if (!wasEnabled) {
      logger.info(`Feature enabled: ${featureName}`);
      this.notifyListeners(featureName, true);
    }
  }

  disable(featureName: FeatureName) {
    const wasEnabled = this.isEnabled(featureName);
    this.featureStates.set(featureName, false);
    this.saveFeatureStates();
    
    if (wasEnabled) {
      logger.info(`Feature disabled: ${featureName}`);
      this.notifyListeners(featureName, false);
    }
  }

  toggle(featureName: FeatureName) {
    const currentState = this.isEnabled(featureName);
    if (currentState) {
      this.disable(featureName);
    } else {
      this.enable(featureName);
    }
  }

  getAllFeatures(): Map<FeatureName, boolean> {
    return new Map(this.featureStates);
  }

  resetToDefaults() {
    Object.entries(FEATURES).forEach(([key, value]) => {
      this.featureStates.set(key as FeatureName, value as boolean);
    });
    this.saveFeatureStates();
    logger.info('Reset all features to defaults');
    
    // Notify all listeners
    this.featureStates.forEach((enabled, featureName) => {
      this.notifyListeners(featureName, enabled);
    });
  }

  addListener(listener: FeatureChangeListener) {
    this.listeners.add(listener);
  }

  removeListener(listener: FeatureChangeListener) {
    this.listeners.delete(listener);
  }

  private notifyListeners(featureName: FeatureName, enabled: boolean) {
    this.listeners.forEach(listener => {
      try {
        listener(featureName, enabled);
      } catch (error) {
        logger.error('Error in feature change listener', error);
      }
    });
  }

  // Bulk operations
  enableMultiple(featureNames: FeatureName[]) {
    featureNames.forEach(name => this.enable(name));
  }

  disableMultiple(featureNames: FeatureName[]) {
    featureNames.forEach(name => this.disable(name));
  }

  // Export/Import for admin backup
  exportConfig(): string {
    return JSON.stringify(Object.fromEntries(this.featureStates), null, 2);
  }

  importConfig(configJson: string) {
    try {
      const config = JSON.parse(configJson);
      Object.entries(config).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          this.featureStates.set(key as FeatureName, value);
        }
      });
      this.saveFeatureStates();
      logger.info('Imported feature configuration');
      
      // Notify all listeners
      this.featureStates.forEach((enabled, featureName) => {
        this.notifyListeners(featureName, enabled);
      });
    } catch (error) {
      logger.error('Error importing feature config', error);
      throw new Error('Invalid configuration format');
    }
  }
}

export const featureManager = FeatureManager.getInstance();
