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
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-12 lg:gap-8 items-center py-16 lg:py-24">
          {/* Left: Headline + copy */}
          <div className="lg:col-span-6">
            <h1 className="font-extrabold tracking-tight leading-[0.9] text-5xl sm:text-6xl lg:text-7xl">
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                LEARN REAL FINANCE TOOLS
              </span>
              <span className="block text-slate-900">EARN REAL CASH</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-slate-600">
              Complete short lessons and actions to collect tickets for cash drawings—free to join.
            </p>

            <div className="mt-8 flex items-center gap-4">
              <a
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-white text-base font-semibold hover:bg-blue-700"
              >
                Start Free
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-6 py-3 text-base font-semibold text-slate-900 hover:bg-slate-50"
              >
                How it works
              </a>
            </div>

            <div className="mt-5 text-sm text-slate-500">
              $3,750 prize pool • 750 winners • Tickets unlock entries
            </div>
            <div className="mt-2 text-[12px] text-slate-400">
              No purchase necessary. 18+. Odds vary by number of tickets. Terms apply.
            </div>
          </div>

          {/* Right: Ticket + tool icons + phone */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="relative w-[260px] lg:w-[340px]">
              {/* Ticket stub (decorative) */}
              <svg
                viewBox="0 0 640 360"
                className="absolute -left-10 -top-8 rotate-[-10deg] w-44 sm:w-52 lg:w-64 drop-shadow-xl"
                aria-hidden="true"
                focusable="false"
              >
                <defs>
                  <linearGradient id="tix" x1="0" x2="1">
                    <stop offset="0" stopColor="#2563EB" /> {/* blue-600 */}
                    <stop offset="1" stopColor="#4F46E5" /> {/* indigo-600 */}
                  </linearGradient>
                </defs>
                <path
                  d="M40 40h520c6 0 10 4 10 10v40a30 30 0 1 0 0 60v100c0 6-4 10-10 10H40c-6 0-10-4-10-10v-40a30 30 0 1 0 0-60V50c0-6 4-10 10-10z"
                  fill="url(#tix)"
                />
                <path d="M320 40v280" stroke="rgba(0,0,0,0.08)" strokeWidth="8" strokeDasharray="10 14"/>
              </svg>

              {/* Tool icons flowing into the ticket (decorative) */}
              <div className="absolute -left-16 top-12 flex flex-col gap-3 opacity-95" aria-hidden="true">
                <IconBubble label="Budget"   Icon={Piggy}   delay={0} />
                <IconBubble label="Credit"    Icon={Card}    delay={0.12} />
                <IconBubble label="Savings"   Icon={Target}  delay={0.24} />
              </div>

              {/* Phone image (crisp, width-based srcSet) */}
              <img
                src={phone.m240}
                srcSet={[
                  `${phone.m240} 240w`,
                  `${phone.m480} 480w`,
                  `${phone.s304} 304w`,
                  `${phone.s608} 608w`,
                ].join(", ")}
                sizes={`(min-width:1024px) ${PHONE_CSS_WIDTHS.desktop}px, ${PHONE_CSS_WIDTHS.mobile}px`}
                alt={phone.alt ?? "FinBoost app"}
                className="relative ml-6 lg:ml-10 w-[240px] lg:w-[304px] h-auto rounded-[2rem] shadow-2xl"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                style={{ backfaceVisibility: "hidden", transform: "translateZ(0)" }}
              />
            </div>
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