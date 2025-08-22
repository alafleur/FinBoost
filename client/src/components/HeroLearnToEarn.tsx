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
        {/* Minimal, confident hero */}
        <div className="text-center py-32 lg:py-48 px-4">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight tracking-tight max-w-6xl mx-auto mb-8">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 pb-2">
              Learn Finance,
            </span>
            <span className="block text-slate-900">
              Win Real Cash
            </span>
          </h1>

          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed">
            Master money skills while competing for cash prizes
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/auth?mode=signup"
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-5 py-2.5 text-white text-base font-medium shadow-sm transition-colors"
            >
              Start Competing
            </a>
            <a
              href="#preview"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 hover:border-slate-400 px-5 py-2.5 text-base font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              How it works
            </a>
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