import React, { useEffect, useState } from "react";

function fmt(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { d, h, m, s };
}

export default function CycleCountdownLite({ cycleEndsAtISO }: { cycleEndsAtISO: string }) {
  const ends = new Date(cycleEndsAtISO).getTime();
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const { d, h, m, s } = fmt(ends - now);
  const urgent = ends - now < 24 * 3600 * 1000;
  return (
    <div className="rounded-2xl p-4 shadow-sm border bg-white">
      <div className="text-xs uppercase tracking-wide text-gray-500">Cycle ends in</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${urgent ? "text-red-600" : ""}`}>
        {d}d {h}h {m}m {s}s
      </div>
    </div>
  );
}