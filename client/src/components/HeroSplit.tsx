import React from "react";
import step4_m240 from "../assets/screenshots/step4_m240.png";
import step4_m480 from "../assets/screenshots/step4_m480.png";
import step4_s304 from "../assets/screenshots/step4_s304.png";
import step4_s608 from "../assets/screenshots/step4_s608.png";

/**
 * HeroSplit.tsx
 *
 * Mobile:
 * - Pixel-perfect phone image (no blur) using exact CSS widths that match source assets:
 *   240px on very small phones, 304px at >=390px viewport width.
 * - srcSet + sizes are aligned to those exact rendered widths so the browser never resamples.
 * - Dual-corner headline layout (top-left / bottom-right) with the phone bridging them.
 * - Clear typographic hierarchy: "Learn Real Finance" is primary, "Earn Real Cash" secondary.
 *
 * Desktop:
 * - Keeps your three-column split with angled phone and gradient headline.
 */
export default function HeroSplit() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="pt-24 md:pt-28 lg:pt-32 pb-8 md:pb-10">

          {/* Desktop: Three-column split layout */}
          <div className="hidden lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-12 xl:gap-16 items-center">
            {/* Left — Learn Real Finance (3 lines) */}
            <div className="text-right">
              <h1
                className="font-extrabold tracking-tight leading-[1.02] max-w-[13ch] ml-auto
                           text-5xl xl:text-6xl 2xl:text-7xl
                           text-transparent bg-clip-text
                           bg-gradient-to-r from-blue-600 to-purple-600"
              >
                Learn<br />
                Real<br />
                Finance
              </h1>
            </div>

            {/* Center — Frameless phone with winner notification */}
            <div className="flex justify-center self-center relative">
              {/* Subtle vertical divider hint */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-slate-200/80 to-transparent -translate-x-1/2 pointer-events-none"></div>

              <div className="relative z-10 rotate-[8deg]">
                <img
                  className="w-auto h-[320px] xl:h-[360px] 2xl:h-[400px]
                             rounded-[28px] shadow-xl shadow-slate-900/15
                             ring-1 ring-gray-200/50"
                  srcSet={`${step4_m240} 240w, ${step4_m480} 480w, ${step4_s304} 304w, ${step4_s608} 608w`}
                  sizes="304px"
                  src={step4_s304}
                  alt="FinBoost winner notification - $325 cash reward"
                  loading="eager"
                  width={304}
                  height={547}
                  fetchPriority="high"
                  decoding="async"
                />

                {/* Premium gloss overlay */}
                <div className="absolute inset-0 rounded-[28px]
                                bg-gradient-to-tr from-transparent via-white/5 to-white/20
                                pointer-events-none" aria-hidden="true"></div>

                {/* Subtle blue glow effect */}
                <div className="absolute inset-0 rounded-[28px]
                                [box-shadow:0_0_40px_rgba(59,130,246,0.10)]
                                pointer-events-none" aria-hidden="true"></div>
              </div>
            </div>

            {/* Right — Earn Real Cash (3 lines) */}
            <div className="text-left">
              <h2
                className="font-extrabold tracking-tight leading-[1.02] max-w-[13ch]
                           text-5xl xl:text-6xl 2xl:text-7xl
                           text-slate-900"
              >
                Earn<br />
                Real<br />
                Cash
              </h2>
            </div>
          </div>

          {/* Mobile: Dual-corner hero with pixel-perfect phone */}
          <div className="lg:hidden relative min-h-[500px] px-4 pt-6 pb-8 overflow-hidden">
            {/* Top-left primary headline */}
            <div className="absolute left-4 top-6 z-20">
              <h1 className="font-extrabold tracking-tight leading-[1.06] text-[clamp(1.75rem,6.6vw,2.6rem)] max-w-[16ch]">
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Learn Real Finance
                </span>
              </h1>
            </div>

            {/* Phone image (bridging element) */}
            <div className="absolute bottom-8 right-4 z-10 pointer-events-none rotate-[8deg]">
              {/* NOTE: Exact widths to prevent resampling (and thus blur) */}
              <img
                className="rounded-[24px] shadow-xl shadow-slate-900/15 ring-1 ring-gray-200/50
                           w-[240px] min-[390px]:w-[304px] h-auto"
                srcSet={`${step4_m240} 240w, ${step4_m480} 480w, ${step4_s304} 304w, ${step4_s608} 608w`}
                sizes="(max-width: 389px) 240px, 304px"
                src={step4_m240}
                alt="FinBoost winner notification - $325 cash reward"
                loading="eager"
                width={240}
                height={431}
                fetchPriority="high"
                decoding="async"
              />
              {/* Subtle gloss overlay */}
              <div
                className="absolute inset-0 rounded-[24px]
                           bg-gradient-to-tr from-transparent via-white/5 to-white/20"
                aria-hidden="true"
              />
            </div>

            {/* Bottom-right secondary headline (kept readable above phone) */}
            <div className="absolute right-4 bottom-[calc(120px+1rem)] min-[390px]:bottom-[calc(160px+1rem)] z-20 text-right">
              <h2 className="font-extrabold tracking-tight leading-[1.06] text-[clamp(1.5rem,5.6vw,2.25rem)] text-slate-900">
                Earn Real Cash
              </h2>
            </div>
          </div>

          {/* Subhead */}
          <p className="mx-auto mt-6 md:mt-8 max-w-3xl text-center text-lg leading-relaxed text-slate-600">
            Complete financial lessons and real-world actions to earn{" "}
            <span className="font-semibold text-slate-800">tickets</span> for weekly cash drawings — free to join.
          </p>

          {/* CTA */}
          <div className="mt-6 flex justify-center">
            <a
              href="/auth?mode=signup"
              className="inline-flex h-12 items-center justify-center rounded-lg px-8
                         font-semibold text-white shadow-sm
                         bg-gradient-to-r from-blue-600 to-purple-600
                         hover:from-blue-700 hover:to-purple-700
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                         transition-all duration-200"
              aria-label="Join early access with FinBoost"
            >
              Join Early Access
            </a>
          </div>

          {/* Legal */}
          <p className="mt-4 text-center text-sm text-slate-500 max-w-2xl mx-auto">
            No purchase necessary. 18+. Odds vary by number of tickets earned.{" "}
            <a href="/terms" className="underline hover:text-slate-700">Terms apply</a>.
          </p>
        </div>
      </div>
    </section>
  );
}