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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-y-12 lg:gap-8 items-center py-16 lg:py-24">
          {/* Left: Headline + copy */}
          <div className="lg:col-span-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight md:leading-[1.15] lg:leading-[1.1] tracking-tight">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 pb-1">
                Learn Real Finance Tools
              </span>
              <span className="block text-slate-900">Earn Real Cash</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-slate-600 leading-relaxed">
              Complete short lessons and actions to collect tickets for cash drawings.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
              <a
                href="/auth?mode=signup"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 text-white text-lg font-semibold shadow-xl shadow-blue-500/25 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/40"
              >
                Join Early Access
              </a>
              <a
                href="#preview"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-8 py-4 text-lg font-semibold text-slate-900 hover:bg-slate-50 transition-colors"
              >
                How it works
              </a>
            </div>

            <div className="mt-6 text-sm text-slate-500">
              Learn, act, earn tickets for cash drawings
            </div>
            <div className="mt-2 text-[12px] text-slate-400">
              No purchase necessary. 18+. Odds vary by number of tickets. Terms apply.
            </div>
          </div>

          {/* Right: Phone + prominent ticket + tool icons */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="relative flex justify-center lg:justify-end w-full max-w-[400px] lg:max-w-none">
              {/* Phone image (crisp, width-based srcSet) - centered on mobile */}
              <div className="relative flex justify-center lg:justify-start">
                {/* Ticket stub - behind phone */}
                <div className="absolute top-8 -right-2 lg:top-12 lg:right-8 z-0">
                  <svg
                    viewBox="0 0 640 360"
                    className="w-32 sm:w-36 lg:w-40 drop-shadow-lg rotate-12 opacity-90"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <defs>
                      <linearGradient id="tix" x1="0" x2="1">
                        <stop offset="0" stopColor="#2563EB" />
                        <stop offset="1" stopColor="#9333EA" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M40 40h520c6 0 10 4 10 10v40a30 30 0 1 0 0 60v100c0 6-4 10-10 10H40c-6 0-10-4-10-10v-40a30 30 0 1 0 0-60V50c0-6 4-10 10-10z"
                      fill="url(#tix)"
                    />
                    <path d="M320 40v280" stroke="rgba(255,255,255,0.3)" strokeWidth="8" strokeDasharray="10 14"/>
                    <text x="320" y="140" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold">TICKET</text>
                    <text x="320" y="180" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="18">CASH DRAWING</text>
                  </svg>
                </div>

                {/* Financial category icons - tethered to phone left side */}
                <div className="absolute -left-20 lg:-left-24 top-12 lg:top-16 flex flex-col gap-3 opacity-95 hidden sm:flex" aria-hidden="true">
                  <IconBubble label="Budget"     Icon={Piggy}     delay={0} />
                  <IconBubble label="Credit"     Icon={Card}      delay={0.08} />
                  <IconBubble label="Investing"  Icon={TrendUp}   delay={0.16} />
                  <IconBubble label="Savings"    Icon={Target}    delay={0.24} />
                  <IconBubble label="Insurance"  Icon={Shield}    delay={0.32} />
                  <IconBubble label="Taxes"      Icon={Calculator} delay={0.40} />
                  <IconBubble label="Emergency"  Icon={Dollar}    delay={0.48} />
                </div>

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
                  className="w-[240px] lg:w-[304px] h-auto rounded-[2rem] shadow-2xl z-10 lg:ml-10"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  style={{ backfaceVisibility: "hidden", transform: "translateZ(0)" }}
                />
              </div>
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