import React from "react";

// NOTE: If your alias differs, change "@assets" to "@/assets" or a relative path.
import step1_m240 from "@assets/screenshots/step1_m240.png";
import step1_m480 from "@assets/screenshots/step1_m480.png";
import step1_s304 from "@assets/screenshots/step1_s304.png";
import step1_s608 from "@assets/screenshots/step1_s608.png";

/**
 * Split hero:
 * - Desktop: gradient "Learn Real Finance" (left) • phone (center) • "Earn Real Cash" (right)
 * - Mobile: stacked headline above phone
 * - Pixel-perfect phone widths: 240px (mobile) / 304px (desktop) with 2× assets via srcSet
 * - Pure Tailwind static classes (safe for JIT/purge). No scale animations.
 */
export default function HeroSplit() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-14 lg:pt-24 lg:pb-20">
        {/* MOBILE: stacked */}
        <div className="mb-10 text-center lg:hidden">
          <h1 className="text-4xl font-extrabold leading-[1.04] tracking-tight sm:text-5xl">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Learn Real Finance
            </span>
          </h1>
          <h2 className="mt-2 text-4xl font-extrabold leading-[1.04] tracking-tight text-slate-900 sm:text-5xl">
            Earn Real Cash
          </h2>
        </div>

        {/* DESKTOP: split */}
        <div className="hidden items-center gap-10 lg:grid lg:grid-cols-[1fr_auto_1fr]">
          {/* Left headline */}
          <div className="text-left">
            <h1 className="font-extrabold tracking-tight leading-[1.02] text-[3rem] xl:text-[4.5rem] 2xl:text-[5.5rem]">
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Learn Real
              </span>
              <span className="block -mt-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Finance
              </span>
            </h1>
          </div>

          {/* Phone (frameless, exact widths) */}
          <div className="relative mx-auto">
            {/* VERY soft vertical hairline to tie sides together */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-[-16%] hidden h-[132%] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-slate-300/30 to-transparent lg:block"
            />
            <img
              src={step1_m240}
              srcSet={`${step1_m240} 240w, ${step1_m480} 480w, ${step1_s304} 304w, ${step1_s608} 608w`}
              sizes="(min-width:1024px) 304px, 240px"
              alt="FinBoost app — rewards view"
              className="block h-auto w-[240px] rounded-[2rem] shadow-xl shadow-slate-900/10 ring-1 ring-black/5 lg:w-[304px]"
              decoding="async"
              loading="eager"
              draggable={false}
              style={{ imageRendering: "auto", backfaceVisibility: "hidden" }}
            />
          </div>

          {/* Right headline */}
          <div className="text-right">
            <h2 className="font-extrabold tracking-tight leading-[1.02] text-slate-900 text-[3rem] xl:text-[4.5rem] 2xl:text-[5.5rem]">
              <span className="block">Earn Real</span>
              <span className="block -mt-1">Cash</span>
            </h2>
          </div>
        </div>

        {/* MOBILE phone */}
        <div className="lg:hidden mb-8 flex justify-center">
          <img
            src={step1_m240}
            srcSet={`${step1_m240} 240w, ${step1_m480} 480w, ${step1_s304} 304w, ${step1_s608} 608w`}
            sizes="(min-width:1024px) 304px, 240px"
            alt="FinBoost app — rewards view"
            className="block h-auto w-[240px] rounded-[1.75rem] shadow-xl shadow-slate-900/10 ring-1 ring-black/5"
            decoding="async"
            loading="eager"
            draggable={false}
            style={{ imageRendering: "auto" }}
          />
        </div>

        {/* Subhead */}
        <p className="mx-auto max-w-3xl text-center text-lg leading-relaxed text-slate-700">
          Complete financial lessons and real‑world actions to earn{" "}
          <span className="font-semibold text-slate-900">tickets</span> for weekly cash drawings — free to join.
        </p>

        {/* CTAs */}
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <a
            href="/signup"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
          >
            Start Free
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-900 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60"
          >
            How it works
          </a>
        </div>

        {/* Legal */}
        <p className="mt-4 text-center text-sm text-slate-500">
          No purchase necessary. 18+. Odds vary by number of tickets. Terms apply.
        </p>
      </div>
    </section>
  );
}
