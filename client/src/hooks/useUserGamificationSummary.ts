import { useEffect, useState } from "react";
import type { UserSummary, Tier } from "@/components/gamification/registry";

export function useUserGamificationSummary() {
  const [data, setData] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    
    // Fetch user data and cycle distribution in parallel
    Promise.all([
      fetch('/api/auth/me', { 
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
      }),
      fetch('/api/pool/next-distribution', { 
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
      })
    ])
      .then(async ([userRes, cycleRes]) => {
        if (!userRes.ok) throw new Error(`User API error: ${userRes.status}`);
        if (!cycleRes.ok) throw new Error(`Cycle API error: ${cycleRes.status}`);
        
        const userData = await userRes.json();
        const cycleData = await cycleRes.json();
        
        if (!alive) return;
        
        // Map tier from API format to component format
        const mapTier = (apiTier: string): Tier => {
          switch (apiTier?.toLowerCase()) {
            case 'tier1': return 'top';
            case 'tier2': return 'mid';
            case 'tier3':
            default: return 'bottom';
          }
        };
        
        const summary: UserSummary = {
          cycleTickets: userData.user?.currentCyclePoints || 0,
          tier: mapTier(userData.user?.tier),
          progressToNextTier: 0, // Set to 0 for now - will be calculated later
          hintTicketsToNext: null, // Set to null for now
          cycleEndsAtISO: cycleData.distribution?.distributionDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        
        setData(summary);
        setError(null);
      })
      .catch((e) => { 
        if (alive) setError(String(e?.message || e)); 
      })
      .finally(() => { 
        if (alive) setLoading(false); 
      });
    
    return () => { alive = false; };
  }, []);

  return { data, loading, error };
}