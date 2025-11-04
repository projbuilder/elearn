// Feature Toggle Hook with Runtime Support
// React hook for checking if features are enabled with runtime updates

import { useState, useEffect } from 'react';
import { featureManager } from '@/core/plugins';
import type { FeatureName } from '@/config/features.config';

/**
 * Hook to check if a feature is enabled (with runtime updates)
 * @param featureName - Name of the feature to check
 * @returns boolean indicating if the feature is enabled
 */
export const useFeature = (featureName: FeatureName): boolean => {
  const [isEnabled, setIsEnabled] = useState(() => featureManager.isEnabled(featureName));

  useEffect(() => {
    // Update state when feature changes
    const handleFeatureChange = (changedFeature: FeatureName, enabled: boolean) => {
      if (changedFeature === featureName) {
        setIsEnabled(enabled);
      }
    };

    featureManager.addListener(handleFeatureChange);

    // Sync with current state
    setIsEnabled(featureManager.isEnabled(featureName));

    return () => {
      featureManager.removeListener(handleFeatureChange);
    };
  }, [featureName]);

  return isEnabled;
};

/**
 * Hook to get multiple feature flags at once
 * @param featureNames - Array of feature names
 * @returns Object with feature names as keys and boolean values
 */
export const useFeatures = (featureNames: FeatureName[]): Record<FeatureName, boolean> => {
  const [features, setFeatures] = useState<Record<FeatureName, boolean>>(() => {
    return featureNames.reduce((acc, name) => {
      acc[name] = featureManager.isEnabled(name);
      return acc;
    }, {} as Record<FeatureName, boolean>);
  });

  useEffect(() => {
    const handleFeatureChange = (changedFeature: FeatureName, enabled: boolean) => {
      if (featureNames.includes(changedFeature)) {
        setFeatures(prev => ({ ...prev, [changedFeature]: enabled }));
      }
    };

    featureManager.addListener(handleFeatureChange);

    // Sync with current state
    const currentStates = featureNames.reduce((acc, name) => {
      acc[name] = featureManager.isEnabled(name);
      return acc;
    }, {} as Record<FeatureName, boolean>);
    setFeatures(currentStates);

    return () => {
      featureManager.removeListener(handleFeatureChange);
    };
  }, [featureNames.join(',')]);

  return features;
};
