import { LearningModule } from "./schema";

export interface UserAccessInfo {
  isActive: boolean;
  isPremium: boolean;
  canAccessRewardsPool: boolean;
  canClaimPoints: boolean;
  theoreticalPoints: number;
  totalClaimablePoints: number;
}

export interface UserForAccess {
  subscriptionStatus?: string;
  theoreticalPoints?: number;
  totalPoints?: number;
  currentMonthPoints?: number;
  currentCyclePoints?: number;
}

export function getUserAccessInfo(user: UserForAccess): UserAccessInfo {
  const isPremium = user.subscriptionStatus === 'active';
  
  return {
    isActive: true,
    isPremium,
    canAccessRewardsPool: isPremium,
    canClaimPoints: isPremium,
    theoreticalPoints: user.theoreticalPoints || 0,
    totalClaimablePoints: isPremium ? (user.theoreticalPoints || 0) + (user.totalPoints || 0) : 0,
  };
}

export function canAccessModule(user: UserForAccess, module: LearningModule): boolean {
  const isPremium = user.subscriptionStatus === 'active';
  
  // Premium users can access all published modules
  if (isPremium && module.isPublished) {
    return true;
  }
  
  // Free users can only access free modules that are published
  return module.accessType === 'free' && module.isPublished;
}

export function getUpgradeMessage(theoreticalPoints: number): string {
  if (theoreticalPoints > 0) {
    return `Upgrade to claim your ${theoreticalPoints} points and compete for monthly rewards!`;
  }
  return "Upgrade to start earning real points and compete for monthly rewards!";
}

export function shouldShowUpgradePrompt(user: UserForAccess, currentPath: string): boolean {
  const isPremium = user.subscriptionStatus === 'active';
  
  // Don't show on upgrade/payment pages
  if (currentPath.includes('/subscribe') || currentPath.includes('/checkout')) {
    return false;
  }
  
  // Show for non-premium users
  return !isPremium;
}