// Feature Toggle Configuration
// Control which modules are enabled/disabled

export const FEATURES = {
    // Core features
    AI_TUTOR: true,
    FEDERATED_LEARNING: true,
    ADAPTIVE_LEARNING: true,
    
    // Dashboard features
    ANALYTICS_DASHBOARD: true,
    REAL_TIME_METRICS: true,
    PROGRESS_TRACKING: true,
    
    // Future features (Phase 2-4)
    REAL_TIME_NOTIFICATIONS: false,
    AZURE_INTEGRATION: false,
    ADVANCED_ANALYTICS: false,
    IDS_MONITORING: false,
    
    // Development features
    DEBUG_MODE: import.meta.env.DEV,
    CONSOLE_LOGGING: import.meta.env.DEV
  } as const;
  
  export type FeatureFlags = typeof FEATURES;
  export type FeatureName = keyof FeatureFlags;
  
  // Helper function to check if a feature is enabled
  export const isFeatureEnabled = (featureName: FeatureName): boolean => {
    return FEATURES[featureName] === true;
  };
  