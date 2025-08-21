// client/src/components/EarlyAccessGuarantee.tsx
import React from "react";

export default function EarlyAccessGuarantee() {
  return (
    <section className="relative bg-white">
      <div className="mx-auto max-w-6xl px-6 py-14 lg:py-20 text-center">
        {/* pill badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 shadow-sm ring-1 ring-slate-100">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-sm font-semibold tracking-wide text-slate-700">
            EARLY ACCESS GUARANTEE
          </span>
        </div>

        {/* headline */}
        <p className="mt-7 text-xl text-slate-600">
          Here's what we guarantee every early access member:
        </p>

        {/* down arrow */}
        <div className="mx-auto mt-6 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 shadow ring-1 ring-slate-200" aria-hidden="true">
          <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
        
        {/* guarantees grid */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <GuaranteeTile label="$5,000+ Minimum Pool Size" />
          <GuaranteeTile label="50% Member Fees To Rewards Pool" />
          <GuaranteeTile label="40%+ Minimum Member Win Rate" />
          <GuaranteeTile label="$250+ Minimum Top Reward" />
        </div>
      </div>
    </section>
  );
}

function GuaranteeTile({ label }: { label: string }) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-0.5 shadow-lg">
      <div className="rounded-[10px] bg-gradient-to-br from-blue-600/90 to-indigo-700/90">
        <div className="rounded-[10px] px-6 py-4 text-center text-white font-semibold">
          {label}
        </div>
      </div>
    </div>
  );
}