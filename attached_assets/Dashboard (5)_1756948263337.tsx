
import React, { useEffect, useMemo, useState } from "react";
import WelcomeModal from "@/components/onboarding/WelcomeModal";
import ReactJoyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { tourSteps } from "@/components/onboarding/tourSteps";

function getCurrentUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const DASHBOARD_SELECTOR_FALLBACKS = [
  "#nav-dashboard",
  "#dashboard-root",
  "[data-el='dashboard-root']"
];

export default function Dashboard() {
  const user = getCurrentUser();
  const username = user?.username || user?.firstName || "there";

  const [showWelcome, setShowWelcome] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  const seenKey = useMemo(() => {
    const id = user?.id || user?.email || "anon";
    return `fb.tour.seen:${id}`;
  }, [user?.id, user?.email]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const fromQuery = url.searchParams.get("onboard") === "1";
    const fromFlag = localStorage.getItem("fb.onboard.start") === "1";
    const alreadySeen = localStorage.getItem(seenKey) === "1" || user?.hasSeenTour;

    if (!alreadySeen && (fromQuery || fromFlag)) {
      setShowWelcome(true);
    }

    const realSteps: Step[] = tourSteps.map((s) => {
      const target = document.querySelector(s.target as string) ? s.target : DASHBOARD_SELECTOR_FALLBACKS.find(sel => !!document.querySelector(sel)) || "body";
      return { ...s, target };
    });
    setSteps(realSteps);
  }, [seenKey, user?.hasSeenTour]);

  const startTour = () => {
    setShowWelcome(false);
    setRunTour(true);
    localStorage.removeItem("fb.onboard.start");
  };

  const skipTour = () => {
    setShowWelcome(false);
    localStorage.setItem(seenKey, "1");
    localStorage.removeItem("fb.onboard.start");
    fetch("/api/users/me/seen-tour", { method: "POST" }).catch(() => {});
  };

  const handleJoyride = (data: CallBackProps) => {
    const { status } = data;
    const finished = [STATUS.FINISHED, STATUS.SKIPPED].includes(status);
    if (finished) {
      localStorage.setItem(seenKey, "1");
      localStorage.removeItem("fb.onboard.start");
      fetch("/api/users/me/seen-tour", { method: "POST" }).catch(() => {});
      setRunTour(false);
    }
  };

  return (
    <div id="dashboard-root" className="p-4">
      {/* ... your existing dashboard UI ... */}

      <WelcomeModal
        isOpen={showWelcome}
        onStartTour={startTour}
        onSkip={skipTour}
        username={username}
      />

      <ReactJoyride
        steps={steps}
        run={runTour}
        continuous
        showSkipButton
        showProgress
        scrollToFirstStep
        callback={handleJoyride}
        styles={{ options: { primaryColor: "#5b6cf9", zIndex: 10000 } }}
      />
    </div>
  );
}
