// client/src/components/HeroLearnToEarn.tsx
import React from "react";

type PhoneSources = {
  m240: string;  // 240×431
  m480: string;  // 480×862
  s304: string;  // 304×547
  s608: string;  // 608×1094
  alt?: string;
};

const PHONE_CSS_WIDTHS = { mobile: 240, desktop: 304 } as const;

export default function HeroLearnToEarn({ phone }: { phone: PhoneSources }) {
  return (
    <section className="relative overflow-hidden bg-white pt-20 sm:pt-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Centered hero layout - clean and competition focused */}
        <div className="text-center py-20 lg:py-32 px-4">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight md:leading-[1.15] lg:leading-[1.1] tracking-tight max-w-4xl mx-auto">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 pb-1">
              Learn Finance,
            </span>
            <span className="block text-slate-900">Win Real Cash</span>
          </h1>

          <p className="mt-6 max-w-2xl mx-auto text-base text-slate-600 leading-relaxed">
            Master real financial skills while competing for cash prizes. Every lesson completed earns tickets for upcoming drawings.
          </p>
          
          <p className="mt-3 max-w-2xl mx-auto text-sm text-slate-500 leading-relaxed">
            Build lasting financial knowledge that pays dividends beyond any prize.
          </p>

          {/* Professional competition visual */}
          <div className="relative flex justify-center mt-8 lg:mt-12 mb-8 lg:mb-12">
            <div className="relative bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 lg:p-12 border border-blue-100 shadow-lg">
              <div className="flex items-center justify-center space-x-6">
                {/* Trophy icon */}
                <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 lg:w-10 lg:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                
                {/* Arrow */}
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                
                {/* Cash symbol */}
                <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 lg:w-10 lg:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              
              <p className="text-center mt-4 text-sm text-slate-600 font-medium">
                Learn → Earn Tickets → Win Cash Prizes
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/auth?mode=signup"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-3 text-white text-base font-semibold shadow-xl shadow-blue-500/25 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/40"
            >
              Start Learning & Competing
            </a>
            <a
              href="#preview"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-6 py-3 text-base font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
            >
              How it works
            </a>
          </div>

          <div className="mt-8 text-sm text-slate-500">
            Learn, earn tickets, compete for cash prizes
          </div>
          <div className="mt-2 text-[11px] text-slate-400 max-w-lg mx-auto">
            No purchase necessary. 18+. Odds vary by number of tickets. Educational value regardless of winning. Terms apply.
          </div>
        </div>
      </div>

      {/* Reduced motion: keep things still if user prefers */}
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .icon-float { animation: none !important; transform: none !important; }
        }
        @keyframes floatY { from { transform: translateY(0); } to { transform: translateY(-6px); } }
      `}</style>
    </section>
  );
}

/* --- Small icon bubble component (no extra deps) --- */
function IconBubble({
  label, Icon, delay = 0,
}: { label: string; Icon: (p: any) => JSX.Element; delay?: number }) {
  return (
    <div
      className="icon-float flex items-center gap-2 bg-white/90 backdrop-blur rounded-full px-3 py-2 shadow"
      style={{ animation: `floatY 4s ease-in-out ${delay}s infinite alternate` }}
    >
      <Icon className="w-4 h-4 text-slate-700" />
      <span className="text-xs font-medium text-slate-700">{label}</span>
    </div>
  );
}

/* --- Minimal inline icons --- */
function Piggy(props: any) { return (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path strokeWidth="1.8" d="M4 12a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1a3 3 0 0 1-3 3h-1l-1.5 2h-2l-1-2H9a5 5 0 0 1-5-5Z"/>
    <circle cx="14" cy="10" r="1.2" fill="currentColor"/>
  </svg>
); }
function Card(props: any) { return (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="1.8"/>
    <path d="M3 10h18" strokeWidth="1.8"/>
    <rect x="6" y="13" width="5" height="2" rx="1" strokeWidth="1.8"/>
  </svg>
); }
function Target(props: any) { return (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <circle cx="12" cy="12" r="8" strokeWidth="1.8"/>
    <circle cx="12" cy="12" r="4" strokeWidth="1.8"/>
    <circle cx="12" cy="12" r="1.4" fill="currentColor"/>
  </svg>
); }
function TrendUp(props: any) { return (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" strokeWidth="1.8"/>
    <polyline points="16,7 22,7 22,13" strokeWidth="1.8"/>
  </svg>
); }
function Shield(props: any) { return (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path d="M12,22s8-4 8-10V5l-8-3L4,5v7c0,6 8,10 8,10z" strokeWidth="1.8"/>
  </svg>
); }
function Calculator(props: any) { return (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <rect x="4" y="2" width="16" height="20" rx="2" strokeWidth="1.8"/>
    <line x1="8" y1="6" x2="16" y2="6" strokeWidth="1.8"/>
    <line x1="16" y1="10" x2="16" y2="10" strokeWidth="1.8"/>
    <line x1="12" y1="10" x2="12" y2="10" strokeWidth="1.8"/>
    <line x1="8" y1="10" x2="8" y2="10" strokeWidth="1.8"/>
    <line x1="16" y1="14" x2="16" y2="14" strokeWidth="1.8"/>
    <line x1="12" y1="14" x2="12" y2="14" strokeWidth="1.8"/>
    <line x1="8" y1="14" x2="8" y2="14" strokeWidth="1.8"/>
  </svg>
); }
function Dollar(props: any) { return (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <line x1="12" y1="1" x2="12" y2="23" strokeWidth="1.8"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeWidth="1.8"/>
  </svg>
); }