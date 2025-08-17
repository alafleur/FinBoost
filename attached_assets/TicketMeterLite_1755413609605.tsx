
import React, { useEffect, useRef, useState } from "react";

export default function TicketMeterLite({ tickets, delta = null }: { tickets: number; delta?: number | null }) {
  const [pop, setPop] = useState<number | null>(null);
  const prev = useRef<number>(tickets);
  useEffect(() => {
    if (typeof delta === "number" && delta !== 0) {
      setPop(delta);
      const t = setTimeout(() => setPop(null), 1400);
      return () => clearTimeout(t);
    }
    if (tickets > prev.current) {
      setPop(tickets - prev.current);
      const t = setTimeout(() => setPop(null), 1400);
      return () => clearTimeout(t);
    }
    prev.current = tickets;
  }, [tickets, delta]);
  return (
    <div className="rounded-2xl p-4 shadow-sm border bg-white">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">Tickets this cycle</div>
          <div className="text-3xl font-semibold tabular-nums">{tickets.toLocaleString()}</div>
        </div>
        {pop !== null && <div className="animate-bounce text-sm font-medium text-green-600">+{pop}</div>}
      </div>
    </div>
  );
}
