import React from 'react';

/**
 * Feature flags for enabling/disabling experimental features
 */

export const FEATURE_FLAGS = {
  // Onboarding system feature flag
  ONBOARDING_V1: import.meta.env.VITE_ONBOARDING_V1 === 'true' || true, // Default to true for development
} as const;

/**
 * Check if a feature flag is enabled
 */
export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag];
}

/**
 * HOC to conditionally render components based on feature flags
 */
export function withFeatureFlag<T extends object>(
  Component: React.ComponentType<T>,
  flag: keyof typeof FEATURE_FLAGS
) {
  return function FeatureFlaggedComponent(props: T) {
    if (!isFeatureEnabled(flag)) {
      return null;
    }
    return React.createElement(Component, props);
  };
}