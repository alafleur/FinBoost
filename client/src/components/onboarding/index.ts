/**
 * Onboarding components exports
 */

// Core onboarding components
export { default as WelcomeModal } from './WelcomeModal';
export { default as Tour } from './Tour';
export { default as GettingStartedCard } from './GettingStartedCard';

// Tour configuration
export { dashboardTourSteps, desktopTourSteps } from './tourSteps';

// Export types
export type { 
  OnboardingState, 
  OnboardingProgress, 
  TourStep, 
  WelcomeModalProps, 
  TourProps, 
  GettingStartedCardProps 
} from './types';