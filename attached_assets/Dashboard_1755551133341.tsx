// client/src/pages/Dashboard.tsx
// Tabbed dashboard with query-param switching (?tab=rewards|overview).
// Overview shows summary; Rewards shows summary + payout setup + history.

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import RewardsSummary from "@/components/RewardsSummary";
import RewardsHistory from "@/components/RewardsHistory";
import PayoutSetupCard from "@/components/PayoutSetupCard";

function getTabFromSearch(search: string): "overview" | "rewards" {
  const params = new URLSearchParams(search || window.location.search);
  const t = (params.get("tab") || "").toLowerCase();
  return t === "rewards" ? "rewards" : "overview";
}

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  const [active, setActive] = useState<"overview" | "rewards">(getTabFromSearch(location.split("?")[1] ? "?" + location.split("?")[1] : window.location.search));

  // keep active tab in sync with location changes
  useEffect(() => {
    const search = location.includes("?") ? "?" + location.split("?")[1] : window.location.search;
    setActive(getTabFromSearch(search));
  }, [location]);

  const selectTab = (tab: "overview" | "rewards") => {
    const base = location.split("?")[0] || "/dashboard";
    setLocation(`${base}?tab=${tab}`, { replace: true });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Tabs */}
        <div className="mb-6 flex border-b border-gray-200">
          <button
            className={`px-4 py-2 -mb-px border-b-2 ${active === "overview" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600"}`}
            onClick={() => selectTab("overview")}
          >
            Overview
          </button>
          <button
            className={`ml-4 px-4 py-2 -mb-px border-b-2 ${active === "rewards" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600"}`}
            onClick={() => selectTab("rewards")}
          >
            Rewards
          </button>
        </div>

        {/* Panels */}
        {active === "overview" ? (
          <div className="space-y-6">
            <RewardsSummary />
          </div>
        ) : (
          <div className="space-y-6">
            <RewardsSummary />
            <PayoutSetupCard />
            <RewardsHistory />
          </div>
        )}
      </div>
    </div>
  );
}
