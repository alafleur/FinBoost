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
  
  // Text Colors - Unified Professional Typography System
  text: {
    primary: 'text-gray-900 font-semibold',       // Main headings and values
    secondary: 'text-gray-600 font-medium',      // Subheadings and labels  
    muted: 'text-gray-500 font-normal',          // Descriptions and helper text
    success: 'text-emerald-800 font-medium',     // Success states (kept for compatibility)
    accent: 'text-accent font-semibold',         // Brand accent values (monetary amounts)
    accentLight: 'text-accent-light font-medium', // Lighter brand accent
    gradient: 'gradient-text'                    // Special gradient text
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
 * Professional Color Strategy - Updated for Blue→Purple Brand Consistency:
 * 
 * 1. PRIMARY (Blue) - Brand accent for key financial metrics and highlights  
 *    - Pool Size, Current Tier, Monetary values
 * 
 * 2. NEUTRAL (Gray) - Everything else for clean, professional look
 *    - Cycle Points, Lessons, General stats
 * 
 * 3. SUCCESS (Green) - Reserved for completion states and positive outcomes only
 *    - Achievement badges, completion status
 * 
 * This creates a sophisticated, unified blue→purple gradient aesthetic while maintaining
 * visual hierarchy through typography weight rather than color chaos.
 */

export type ColorTheme = 'neutral' | 'primary' | 'success';

/**
 * Dashboard Stat Card Color Assignments
 * Maps each stat card to its appropriate color theme
 */
export const StatCardColors = {
  poolSize: 'primary' as ColorTheme,    // Blue - aligns with brand gradient
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