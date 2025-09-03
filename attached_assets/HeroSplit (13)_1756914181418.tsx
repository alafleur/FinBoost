
import React from "react";
import step4_m240 from "../assets/screenshots/step4_m240.png";
import step4_m480 from "../assets/screenshots/step4_m480.png";
import step4_s304 from "../assets/screenshots/step4_s304.png";
import step4_s608 from "../assets/screenshots/step4_s608.png";

/**
 * HeroSplit.tsx — Mobile crisp + no-truncation
 *
 * Fixes delivered:
 * 1) Headline truncation: allow wrapping, tighten clamp values, and constrain line length with ch-based max width.
 * 2) Mobile blur: remove rotation on mobile to avoid transform antialiasing; keep rotation on >= lg screens.
 * 3) Exact image widths on mobile (240px / 304px) with aligned srcSet + sizes to prevent resampling.
 * 4) Keeps your desktop three-column, angled phone layout.
 */
export default function HeroSplit() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="pt-24 md:pt-28 lg:pt-32 pb-8 md:pb-10">

          {/* Desktop: Three-column split layout (unchanged style, angled phone) */}
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

            {/* Center — Phone with winner notification (angled) */}
            <div className="flex justify-center self-center relative">
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
                {/* Gloss & glow */}
                <div className="absolute inset-0 rounded-[28px] bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" aria-hidden="true"></div>
                <div className="absolute inset-0 rounded-[28px] [box-shadow:0_0_40px_rgba(59,130,246,0.10)] pointer-events-none" aria-hidden="true"></div>
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

          {/* Mobile: Stacked headlines + crisp phone (no rotation) */}
          <div className="lg:hidden px-4 pt-2 pb-8">
            {/* Headline (wrap enabled, balanced width) */}
            <div className="text-center mb-6">
              <h1 className="font-extrabold tracking-tight leading-[1.06]">
                <span
                  className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600
                             text-[clamp(1.9rem,7.2vw,2.6rem)] max-w-[20ch] mx-auto"
                >
                  Learn Real Finance
                </span>
                <span
                  className="block text-slate-900 mt-1
                             text-[clamp(1.6rem,6.2vw,2.25rem)] max-w-[20ch] mx-auto"
                >
                  Earn Real Cash
                </span>
              </h1>
            </div>

            {/* Phone screenshot centered below (no rotation on mobile for crispness) */}
            <div className="flex justify-center">
              <div className="relative pointer-events-none lg:rotate-[8deg]">
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
                {/* Gloss overlay */}
                <div
                  className="absolute inset-0 rounded-[24px] bg-gradient-to-tr from-transparent via-white/5 to-white/20"
                  aria-hidden="true"
                />
              </div>
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
