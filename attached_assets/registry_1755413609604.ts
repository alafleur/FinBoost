
import type React from "react";

export type Tier = "top" | "mid" | "bottom";

export type UserSummary = {
  cycleTickets: number;
  tier: Tier;
  progressToNextTier: number; // 0..1
  hintTicketsToNext?: number | null;
  cycleEndsAtISO: string;
};

export type StreakInfo = { count: number; hasGrace: boolean };

export interface GamificationRegistry {
  /** Optional: your existing composite summary widget */
  TicketSummary?: React.ComponentType<{ summary: UserSummary }>;
  /** Optional: your existing streak widget */
  StreakWidget?: React.ComponentType<{ streak: StreakInfo }>;
  /** Optional: your existing tier widget */
  TierWidget?: React.ComponentType<{ tier: Tier; progressToNextTier: number; hintTicketsToNext?: number | null }>;
  /** Optional: your existing quests panel */
  QuestsPanel?: React.ComponentType;
  /** Optional: your existing prediction card */
  PredictionCard?: React.ComponentType<{ cycleId: number }>;
  /** Optional: your existing debt proof card */
  DebtBoostCard?: React.ComponentType<{ cycleId: number }>;
  /** Optional: your existing referral panel */
  ReferralPanel?: React.ComponentType;
  /** Optional: your existing rewards drawer */
  RewardsDrawer?: React.ComponentType<{ onClose: () => void }>;
}

/**
 * Fill this registry with your real components by importing them and assigning here.
 * Example:
 *   import ExistingStreak from "@/components/StreakNotification";
 *   export const registry: GamificationRegistry = { StreakWidget: ExistingStreak };
 */
export const registry: GamificationRegistry = {
  // StreakWidget: require("../StreakNotification").default,  // example
};
