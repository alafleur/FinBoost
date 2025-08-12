/**
 * Local storage utilities for onboarding system with edge case handling
 */

import type { OnboardingState } from '@/components/onboarding/types';

// Onboarding localStorage keys
const STORAGE_KEYS = {
  WELCOME_SEEN: 'fb_onboarding_seen',
  TOUR_COMPLETED: 'fb_tour_done',
  FIRST_LESSON: 'fb_gs_firstLesson',
  REWARDS_VIEWED: 'fb_gs_viewedRewards',
  REFERRAL_ADDED: 'fb_gs_referralAdded',
  LEARN_HINT_SHOWN: 'fb_hint_learn',
  REWARDS_HINT_SHOWN: 'fb_hint_rewards',
} as const;

// Session fallback for when localStorage is unavailable
let sessionFallback: Partial<Record<string, string>> = {};

/**
 * Safely check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe localStorage getter with fallback
 */
function safeGetItem(key: string): string | null {
  try {
    if (isLocalStorageAvailable()) {
      return localStorage.getItem(key);
    }
  } catch (error) {
    console.warn(`Failed to get localStorage item "${key}":`, error);
  }
  
  // Fallback to session storage
  return sessionFallback[key] || null;
}

/**
 * Safe localStorage setter with fallback
 */
function safeSetItem(key: string, value: string): void {
  try {
    if (isLocalStorageAvailable()) {
      localStorage.setItem(key, value);
      return;
    }
  } catch (error) {
    console.warn(`Failed to set localStorage item "${key}":`, error);
  }
  
  // Fallback to session storage
  sessionFallback[key] = value;
}

/**
 * Get boolean flag from storage
 */
function getBooleanFlag(key: string): boolean {
  const value = safeGetItem(key);
  return value === '1' || value === 'true';
}

/**
 * Set boolean flag in storage
 */
function setBooleanFlag(key: string, value: boolean): void {
  safeSetItem(key, value ? '1' : '0');
}

// Public API functions
export const onboardingStorage = {
  // Welcome modal
  hasSeenWelcome(): boolean {
    return getBooleanFlag(STORAGE_KEYS.WELCOME_SEEN);
  },
  setWelcomeSeen(): void {
    setBooleanFlag(STORAGE_KEYS.WELCOME_SEEN, true);
  },

  // Tour completion
  hasTourCompleted(): boolean {
    return getBooleanFlag(STORAGE_KEYS.TOUR_COMPLETED);
  },
  setTourCompleted(): void {
    setBooleanFlag(STORAGE_KEYS.TOUR_COMPLETED, true);
  },

  // Getting started tasks
  hasStartedFirstLesson(): boolean {
    return getBooleanFlag(STORAGE_KEYS.FIRST_LESSON);
  },
  setFirstLessonStarted(): void {
    setBooleanFlag(STORAGE_KEYS.FIRST_LESSON, true);
  },

  hasViewedRewards(): boolean {
    return getBooleanFlag(STORAGE_KEYS.REWARDS_VIEWED);
  },
  setRewardsViewed(): void {
    setBooleanFlag(STORAGE_KEYS.REWARDS_VIEWED, true);
  },

  hasAddedReferral(): boolean {
    return getBooleanFlag(STORAGE_KEYS.REFERRAL_ADDED);
  },
  setReferralAdded(): void {
    setBooleanFlag(STORAGE_KEYS.REFERRAL_ADDED, true);
  },

  // Hint tooltips
  hasSeenLearnHint(): boolean {
    return getBooleanFlag(STORAGE_KEYS.LEARN_HINT_SHOWN);
  },
  setLearnHintSeen(): void {
    setBooleanFlag(STORAGE_KEYS.LEARN_HINT_SHOWN, true);
  },

  hasSeenRewardsHint(): boolean {
    return getBooleanFlag(STORAGE_KEYS.REWARDS_HINT_SHOWN);
  },
  setRewardsHintSeen(): void {
    setBooleanFlag(STORAGE_KEYS.REWARDS_HINT_SHOWN, true);
  },

  // Get complete onboarding state
  getOnboardingState(): OnboardingState {
    return {
      welcomeModalSeen: this.hasSeenWelcome(),
      tourCompleted: this.hasTourCompleted(),
      firstLessonStarted: this.hasStartedFirstLesson(),
      rewardsViewed: this.hasViewedRewards(),
      referralAdded: this.hasAddedReferral(),
    };
  },

  // Reset all onboarding data (for testing)
  resetOnboarding(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      try {
        if (isLocalStorageAvailable()) {
          localStorage.removeItem(key);
        }
      } catch (error) {
        console.warn(`Failed to remove localStorage item "${key}":`, error);
      }
      delete sessionFallback[key];
    });
  },

  // Check if user should see onboarding
  shouldShowOnboarding(): boolean {
    return !this.hasSeenWelcome();
  },

  // Check if user should see tour
  shouldShowTour(): boolean {
    return this.hasSeenWelcome() && !this.hasTourCompleted();
  }
};

// Export for testing
export { isLocalStorageAvailable, STORAGE_KEYS };