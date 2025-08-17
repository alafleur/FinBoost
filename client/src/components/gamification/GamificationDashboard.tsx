import React from "react";
import { registry, type UserSummary } from "./registry";
import TicketMeterLite from "./lite/TicketMeterLite";
import TierTrackerLite from "./lite/TierTrackerLite";
import CycleCountdownLite from "./lite/CycleCountdownLite";

type Props = {
  summary: UserSummary;
  cycleId?: number;
  className?: string;
};

/**
 * A thin composer that renders the top three gamification blocks.
 * - If you register your own widgets in `registry`, those are used.
 * - Otherwise it falls back to the lite components included here.
 */
export default function GamificationDashboard({ summary, cycleId, className }: Props) {
  const TicketSummary = registry.TicketSummary;
  const TierWidget = registry.TierWidget;
  const PredictionCard = registry.PredictionCard;
  const QuestsPanel = registry.QuestsPanel;
  const DebtBoostCard = registry.DebtBoostCard;
  const ReferralPanel = registry.ReferralPanel;
  const RewardsDrawer = registry.RewardsDrawer;

  return (
    <div className={`space-y-4 ${className || ""}`}>
      {/* Top row: Tickets / Tier / Countdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TicketSummary ? (
          <TicketSummary summary={summary} />
        ) : (
          <TicketMeterLite tickets={summary.cycleTickets} />
        )}
        {TierWidget ? (
          <TierWidget tier={summary.tier} progressToNextTier={summary.progressToNextTier} hintTicketsToNext={summary.hintTicketsToNext ?? null} />
        ) : (
          <TierTrackerLite tier={summary.tier} progressToNextTier={summary.progressToNextTier} hintTicketsToNext={summary.hintTicketsToNext ?? null} />
        )}
        <CycleCountdownLite cycleEndsAtISO={summary.cycleEndsAtISO} />
      </div>

      {/* Middle row: Prediction + Quests */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PredictionCard && cycleId && <PredictionCard cycleId={cycleId} />}
        {QuestsPanel && <QuestsPanel />}
      </div>

      {/* Bottom row: Debt Boost + Referrals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DebtBoostCard && cycleId && <DebtBoostCard cycleId={cycleId} />}
        {ReferralPanel && <ReferralPanel />}
      </div>

      {/* Optional rewards drawer trigger if provided */}
      {RewardsDrawer && (
        <details className="rounded-2xl p-3 border bg-white">
          <summary className="cursor-pointer font-medium">My Rewards</summary>
          <div className="pt-3">
            <RewardsDrawer onClose={() => { /* no-op for details */ }} />
          </div>
        </details>
      )}
    </div>
  );
}