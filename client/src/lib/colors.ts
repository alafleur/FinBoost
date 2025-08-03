/**
 * Professional Dashboard Color System
 * Designed for modern fintech applications with consistent branding
 */

export const DashboardColors = {
  // Card Background Classes
  card: {
    neutral: 'dashboard-card-neutral',
    primary: 'dashboard-card-primary', 
    success: 'dashboard-card-success'
  },
  
  // Accent Bar Classes (top borders)
  accent: {
    neutral: 'dashboard-accent-neutral',
    primary: 'dashboard-accent-primary',
    success: 'dashboard-accent-success'
  },
  
  // Icon Container Classes
  icon: {
    neutral: 'dashboard-icon-neutral',
    primary: 'dashboard-icon-primary',
    success: 'dashboard-icon-success'
  },
  
  // Text Colors - Unified Dark Blue System
  text: {
    primary: 'text-gray-900',
    secondary: 'text-gray-600', 
    muted: 'text-gray-500',
    success: 'text-emerald-800',
    accent: 'text-accent',
    accentLight: 'text-accent-light',
    gradient: 'gradient-text'
  },
  
  // Icon Colors - Enhanced with Dark Blue
  iconColor: {
    neutral: 'text-gray-600',
    primary: 'text-accent',
    success: 'text-emerald-600'
  },
  
  // Badge Colors (for tier display) - Unified Dark Blue
  badge: {
    primary: 'bg-accent text-white hover:shadow-lg transition-all duration-200',
    neutral: 'bg-gray-600 hover:bg-gray-700 text-white'
  },
  
  // Premium Button Classes
  button: {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    accent: 'bg-accent text-white hover:shadow-lg transition-all duration-300'
  }
} as const;

/**
 * Professional Color Strategy:
 * 
 * 1. SUCCESS (Green) - Only for monetary values and positive financial outcomes
 *    - Pool Size, Rewards, Earnings
 * 
 * 2. PRIMARY (Blue) - Brand accent for key actions and highlights  
 *    - Current Tier (user's standing)
 * 
 * 3. NEUTRAL (Gray) - Everything else for clean, professional look
 *    - Cycle Points, Lessons, General stats
 * 
 * This creates a sophisticated, banking-grade aesthetic while maintaining
 * visual hierarchy through typography weight rather than color chaos.
 */

export type ColorTheme = 'neutral' | 'primary' | 'success';

/**
 * Dashboard Stat Card Color Assignments
 * Maps each stat card to its appropriate color theme
 */
export const StatCardColors = {
  poolSize: 'success' as ColorTheme,    // Green - monetary value
  currentTier: 'primary' as ColorTheme, // Blue - brand accent for user status
  cyclePoints: 'neutral' as ColorTheme, // Gray - neutral stat
  lessons: 'neutral' as ColorTheme      // Gray - neutral stat
} as const;

/**
 * Utility Functions for Consistent Color Application
 */
export function getCardClasses(theme: ColorTheme): string {
  return DashboardColors.card[theme];
}

export function getAccentClasses(theme: ColorTheme): string {
  return DashboardColors.accent[theme];
}

export function getIconContainerClasses(theme: ColorTheme): string {
  return DashboardColors.icon[theme];
}

export function getIconColorClasses(theme: ColorTheme): string {
  return DashboardColors.iconColor[theme];
}

export function getTextClasses(theme: ColorTheme): string {
  switch (theme) {
    case 'success':
      return DashboardColors.text.success;
    case 'primary':
      return DashboardColors.text.accent;
    case 'neutral':
    default:
      return DashboardColors.text.primary;
  }
}