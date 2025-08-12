/**
 * Type definitions for onboarding system
 */

export interface OnboardingState {
  welcomeModalSeen: boolean;
  tourCompleted: boolean;
  firstLessonStarted: boolean;
  rewardsViewed: boolean;
  referralAdded: boolean;
}

export interface OnboardingProgress {
  firstLesson: boolean;
  viewedRewards: boolean;
  referralAdded: boolean;
}

export interface TourStep {
  target: string;
  content: string;
  title?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  disableBeacon?: boolean;
}

export interface WelcomeModalProps {
  isOpen: boolean;
  onStartTour: () => void;
  onSkip: () => void;
  username?: string;
}

export interface TourProps {
  isOpen: boolean;
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
}

export interface GettingStartedCardProps {
  progress: OnboardingProgress;
  onTaskComplete?: (task: keyof OnboardingProgress) => void;
}