// client/src/components/EarlyAccessGuarantee.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function EarlyAccessGuarantee() {
  return (
    <section className="relative bg-gradient-to-b from-white via-slate-50 to-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          {/* Match "How It Works" section header format */}
          <div className="inline-block bg-gradient-to-r from-blue-600/10 to-blue-800/10 backdrop-blur-sm border border-blue-200 rounded-full px-6 py-2 mb-6 badge-premium-gloss magnetic-hover">
            <span className="text-blue-700 font-semibold text-sm">
              EARLY ACCESS GUARANTEE
            </span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            Here's what we guarantee every early access member:
          </h2>

          {/* down arrow */}
          <div className="mx-auto mt-6 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 shadow ring-1 ring-slate-200" aria-hidden="true">
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
        
        {/* guarantees grid - match "Why FinBoost" box style */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto items-stretch">
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
    <Card className="h-full border-2 border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden">
      <CardContent className="p-4 text-center bg-gradient-to-r from-blue-700 to-blue-900 relative tier-badge-gloss tier-badge-enhanced">
        <div className="relative z-10">
          <h3 className="text-base font-semibold text-white mb-1">
            {label}
          </h3>
        </div>
      </CardContent>
    </Card>
  );
}