
# FinBoost Gamification — Consolidation Kit

You already have most gamification features. This kit **organizes** them under `client/src/components/gamification/` and provides a simple **dashboard composer** with **fallback** widgets so nothing breaks during migration.

## Files
- `client/src/components/gamification/registry.ts` — Map your existing components here.
- `client/src/components/gamification/GamificationDashboard.tsx` — Composes the dashboard from the registry.
- `client/src/components/gamification/lite/*` — Lightweight fallback components.
- `client/src/hooks/useUserSummary.ts` — Minimal hook that calls `/api/me/summary?cycleId=`.

## How to use
1. **Add files** to the repo preserving paths.
2. **Register your existing components** in `registry.ts`, e.g.:
   ```ts
   import StreakWidget from "@/components/StreakNotification";
   import ReferralPanel from "@/components/ReferralSystem";
   export const registry = { StreakWidget, ReferralPanel };
   ```
3. **Use the composer** in your dashboard page:
   ```tsx
   import { useUserSummary } from "@/hooks/useUserSummary";
   import GamificationDashboard from "@/components/gamification/GamificationDashboard";

   const CYCLE_ID = 18; // or from context/router
   const { data } = useUserSummary(CYCLE_ID);
   if (!data) return null;

   <GamificationDashboard summary={data} cycleId={CYCLE_ID} />
   ```

This lets you integrate everything immediately and migrate pieces into `gamification/` over time without a big refactor.
