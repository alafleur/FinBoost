import React from "react";

type Tier = "top" | "mid" | "bottom";

export default function TierTrackerLite({ 
  tier, 
  progressToNextTier, 
  hintTicketsToNext 
}: { 
  tier: Tier; 
  progressToNextTier: number; 
  hintTicketsToNext?: number | null 
}) {
  const getTierDisplay = (tier: Tier) => {
    switch (tier) {
      case "top": return { name: "Top Tier", color: "text-yellow-600" };
      case "mid": return { name: "Mid Tier", color: "text-blue-600" };
      case "bottom": return { name: "Bottom Tier", color: "text-gray-600" };
      default: return { name: "Bottom Tier", color: "text-gray-600" };
    }
  };

  const { name, color } = getTierDisplay(tier);
  const progressPercent = Math.round(progressToNextTier * 100);

  return (
    <div className="rounded-2xl p-4 shadow-sm border bg-white">
      <div className="text-xs uppercase tracking-wide text-gray-500">Current Tier</div>
      <div className={`text-lg font-semibold ${color}`}>{name}</div>
      {tier !== "top" && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress to next tier</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {hintTicketsToNext && (
            <div className="text-xs text-gray-500 mt-1">
              ~{hintTicketsToNext} more tickets needed
            </div>
          )}
        </div>
      )}
    </div>
  );
}