
import React from "react";

/**
 * HeroSplit
 * Clean split hero: gradient left headline, crisp phone in center, dark right headline.
 * - Pixel-perfect phone widths (240 mobile / 304 desktop) with 2× assets via srcSet
 * - No fake numbers, no placeholders
 * - Calm, premium spacing + subtle divider glow behind the phone
 *
 * Expected assets (already in your project):
 *   client/src/assets/screenshots/step1_m240.png  (240×431)
 *   client/src/assets/screenshots/step1_m480.png  (480×862)  // 2×
 *   client/src/assets/screenshots/step1_s304.png  (304×547)
 *   client/src/assets/screenshots/step1_s608.png  (608×1094) // 2×
 */
import step1_m240 from "@assets/screenshots/step1_m240.png";
import step1_m480 from "@assets/screenshots/step1_m480.png";
import step1_s304 from "@assets/screenshots/step1_s304.png";
import step1_s608 from "@assets/screenshots/step1_s608.png";

const HeroSplit: React.FC = () => {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        {/* GRID: left headline • phone • right headline */}
        <div className="relative grid grid-cols-1 items-center gap-y-12 py-14 sm:py-16 lg:grid-cols-[1fr_auto_1fr] lg:gap-x-16 lg:py-20 xl:gap-x-24 xl:py-24">
          {/* Decorative vertical glow behind phone (desktop only) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-slate-200 to-transparent lg:block"
          />

          {/* LEFT HEADLINE */}
          <div className="text-center lg:text-left">
            <h1 className="text-[clamp(40px,6vw,96px)] font-extrabold leading-[1.05] tracking-tight">
              <span className="bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                <span className="block">Learn Real</span>
                <span className="block">Finance</span>
              </span>
            </h1>
          </div>

          {/* PHONE MOCKUP (center) */}
          <div className="relative flex items-center justify-center">
            {/* Soft glow */}
            <div className="absolute inset-0 -z-10 blur-2xl sm:blur-3xl">
              <div className="mx-auto h-40 w-40 rounded-full bg-blue-500/10 sm:h-56 sm:w-56" />
            </div>

            {/* Screenshot card (frameless, crisp) */}
            <div className="rounded-[28px] ring-1 ring-slate-200/70 shadow-2xl shadow-slate-900/10">
              <img
                src={step1_m240}
                srcSet={`${step1_m240} 240w, ${step1_m480} 480w, ${step1_s304} 304w, ${step1_s608} 608w`}
                sizes="(max-width: 1023px) 240px, 304px"
                alt="FinBoost rewards screen"
                className="block h-auto w-[240px] rounded-[24px] lg:w-[304px]"
                style={{
                  imageRendering: "auto",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
                draggable={false}
                decoding="async"
                loading="eager"
              />
            </div>
          </div>

          {/* RIGHT HEADLINE */}
          <div className="text-center lg:text-right">
            <h1 className="text-[clamp(40px,6vw,96px)] font-extrabold leading-[1.05] tracking-tight text-slate-900">
              <span className="block">Earn Real</span>
              <span className="block">Cash</span>
            </h1>
          </div>
        </div>

        {/* SUBHEAD */}
        <p className="mx-auto max-w-3xl text-center text-lg/8 text-slate-600 sm:text-xl/8">
          Complete financial lessons and real‑world actions to earn{" "}
          <span className="font-semibold text-slate-900">tickets</span> for weekly cash drawings — free to join.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex items-center justify-center gap-3 sm:gap-4">
          <a
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 px-5 py-3 text-base font-semibold text-white shadow-sm transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] sm:px-6 sm:py-3.5 sm:text-lg"
          >
            Start Free
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-800 shadow-sm transition-colors duration-150 hover:bg-slate-50 sm:px-6 sm:py-3.5 sm:text-lg"
          >
            How it works
          </a>
        </div>

        {/* LEGAL */}
        <p className="mx-auto mt-6 max-w-4xl text-center text-sm text-slate-500">
          No purchase necessary. 18+. Odds vary by number of tickets. Educational value regardless of winning. Terms apply.
        </p>
      </div>
    </section>
  );
};

export default HeroSplit;
