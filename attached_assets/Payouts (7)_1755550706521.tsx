// client/src/pages/Payouts.tsx
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function PayoutsRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/dashboard?tab=rewards", { replace: true });
  }, [setLocation]);
  return null;
}
