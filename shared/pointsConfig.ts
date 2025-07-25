export interface PointsAction {
  id: string;
  name: string;
  basePoints: number;
  maxDaily?: number; // Maximum times per day this action can earn points
  maxTotal?: number; // Maximum lifetime times this action can earn points
  maxMonthly?: number; // Maximum times per monthly rewards cycle (admin configurable)
  requiresProof: boolean;
  category: 'education' | 'action' | 'social' | 'achievement';
  description: string;
}

export const POINTS_CONFIG: Record<string, PointsAction> = {
  // Daily Actions
  'daily-login': {
    id: 'daily-login',
    name: 'Daily Login',
    basePoints: 5,
    maxDaily: 1, // Can only earn once per day
    requiresProof: false,
    category: 'action',
    description: 'Daily login bonus for maintaining streak'
  },
  'share-progress': {
    id: 'share-progress',
    name: 'Share Progress',
    basePoints: 10,
    maxDaily: 3, // Can share up to 3 times per day
    requiresProof: false,
    category: 'social',
    description: 'Share learning progress on social media'
  },
  
  // Education Actions
  lesson_complete: {
    id: 'lesson_complete',
    name: 'Complete Lesson',
    basePoints: 10,
    requiresProof: false,
    category: 'education',
    description: 'Complete a financial education lesson'
  },
  'lesson-budgeting-basics': {
    id: 'lesson-budgeting-basics',
    name: 'Budgeting Basics',
    basePoints: 25,
    maxTotal: 1, // Can only complete once
    requiresProof: false,
    category: 'education',
    description: 'Complete the Budgeting Basics lesson'
  },
  'lesson-emergency-fund': {
    id: 'lesson-emergency-fund',
    name: 'Emergency Fund',
    basePoints: 30,
    maxTotal: 1,
    requiresProof: false,
    category: 'education',
    description: 'Complete the Emergency Fund lesson'
  },
  'lesson-investment-basics': {
    id: 'lesson-investment-basics',
    name: 'Investment Basics',
    basePoints: 35,
    maxTotal: 1,
    requiresProof: false,
    category: 'education',
    description: 'Complete the Investment Basics lesson'
  },
  'lesson-credit-management': {
    id: 'lesson-credit-management',
    name: 'Credit Management',
    basePoints: 30,
    maxTotal: 1,
    requiresProof: false,
    category: 'education',
    description: 'Complete the Credit Management lesson'
  },
  'lesson-retirement-planning': {
    id: 'lesson-retirement-planning',
    name: 'Retirement Planning',
    basePoints: 40,
    maxTotal: 1,
    requiresProof: false,
    category: 'education',
    description: 'Complete the Retirement Planning lesson'
  },
  'lesson-tax-optimization': {
    id: 'lesson-tax-optimization',
    name: 'Tax Optimization',
    basePoints: 35,
    maxTotal: 1,
    requiresProof: false,
    category: 'education',
    description: 'Complete the Tax Optimization lesson'
  },
  'challenge-budget-tracker': {
    id: 'challenge-budget-tracker',
    name: 'Budget Tracker Challenge',
    basePoints: 50,
    requiresProof: false,
    category: 'achievement',
    description: 'Complete the weekly budget tracking challenge'
  },
  'challenge-savings-goal': {
    id: 'challenge-savings-goal',
    name: 'Savings Goal Challenge',
    basePoints: 75,
    requiresProof: false,
    category: 'achievement',
    description: 'Complete the weekly savings goal challenge'
  },
  quiz_complete: {
    id: 'quiz_complete',
    name: 'Complete Quiz',
    basePoints: 15,
    requiresProof: false,
    category: 'education',
    description: 'Successfully complete a financial quiz'
  },

  // Financial Action Proofs
  debt_payment: {
    id: 'debt_payment',
    name: 'Debt Payment',
    basePoints: 25,
    maxDaily: 1,
    maxMonthly: 10, // Admin configurable monthly limit
    requiresProof: true,
    category: 'action',
    description: 'Upload proof of debt payment (credit card, loan, etc.)'
  },
  investment: {
    id: 'investment',
    name: 'Investment Contribution',
    basePoints: 30,
    maxDaily: 1,
    maxMonthly: 8, // Admin configurable monthly limit
    requiresProof: true,
    category: 'action',
    description: 'Upload proof of investment contribution (401k, IRA, brokerage)'
  },
  savings_upload: {
    id: 'savings_upload',
    name: 'Savings Deposit',
    basePoints: 20,
    maxDaily: 1,
    maxMonthly: 15, // Admin configurable monthly limit
    requiresProof: true,
    category: 'action',
    description: 'Upload proof of savings account deposit'
  },
  budget_creation: {
    id: 'budget_creation',
    name: 'Budget Creation',
    basePoints: 35,
    maxTotal: 1,
    requiresProof: true,
    category: 'action',
    description: 'Upload your first monthly budget'
  },
  emergency_fund: {
    id: 'emergency_fund',
    name: 'Emergency Fund Contribution',
    basePoints: 40,
    maxDaily: 1,
    requiresProof: true,
    category: 'action',
    description: 'Upload proof of emergency fund contribution'
  },
  credit_score_improvement: {
    id: 'credit_score_improvement',
    name: 'Credit Score Improvement',
    basePoints: 50,
    maxTotal: 12, // Once per month max
    requiresProof: true,
    category: 'achievement',
    description: 'Upload proof of credit score improvement'
  },

  // Social Actions
  referral_signup: {
    id: 'referral_signup',
    name: 'Successful Referral',
    basePoints: 20,
    requiresProof: false,
    category: 'social',
    description: 'Referred user completes signup and first lesson'
  },

  // Future expandable actions
  financial_goal_achieved: {
    id: 'financial_goal_achieved',
    name: 'Financial Goal Achievement',
    basePoints: 75,
    requiresProof: true,
    category: 'achievement',
    description: 'Upload proof of achieving a set financial goal'
  },

  // Streak bonuses
  streak_bonus: {
    days_2_4: 5,    // Days 2-4: +5 XP
    days_5_6: 10,   // Days 5-6: +10 XP
    days_7_plus: 15 // Day 7+: +15 XP
  },
};

// Helper function to get points for an action
export function getPointsForAction(actionId: string, multiplier: number = 1): number {
  const action = POINTS_CONFIG[actionId];
  return action ? Math.floor(action.basePoints * multiplier) : 0;
}

// Helper function to check if action requires proof
export function actionRequiresProof(actionId: string): boolean {
  const action = POINTS_CONFIG[actionId];
  return action?.requiresProof || false;
}

export function calculateStreakBonus(streakDays: number): number {
  if (streakDays < 2) return 0;
  if (streakDays >= 2 && streakDays <= 4) return POINTS_CONFIG.streak_bonus.days_2_4;
  if (streakDays >= 5 && streakDays <= 6) return POINTS_CONFIG.streak_bonus.days_5_6;
  return POINTS_CONFIG.streak_bonus.days_7_plus; // 7+ days
}