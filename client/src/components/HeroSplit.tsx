import React from "react";

export default function HeroSplit() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6">
        {/* Top area with split headings */}
        <div className="pt-16 sm:pt-20 md:pt-24 lg:pt-28">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_auto_1fr]">
            {/* Left Headline */}
            <h1 className="text-left font-extrabold leading-[1.05] tracking-tight text-slate-900
                           text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
              Learn Real Finance
            </h1>

            {/* Middle divider (kept intentionally minimal & premium) */}
            <div className="hidden lg:flex flex-col items-center">
              <div className="h-48 w-px rounded-full bg-gradient-to-b from-indigo-400/50 via-slate-300 to-blue-400/50" />
            </div>

            {/* Right Headline */}
            <h2 className="text-right font-extrabold leading-[1.05] tracking-tight text-slate-900
                           text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
              Earn Real Cash
            </h2>
          </div>

          {/* Subhead (centered, authentic, no synthetic numbers) */}
          <p className="mx-auto mt-8 max-w-3xl text-center text-base sm:text-lg leading-relaxed text-slate-600">
            Short lessons and real-world actions earn{" "}
            <span className="font-semibold text-slate-800">tickets</span> for cash drawings — free to join.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="/auth?mode=signup"
              className="inline-flex h-12 items-center justify-center rounded-lg px-6
                         font-semibold text-white bg-blue-600 hover:bg-blue-700
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Start Free
            </a>

            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-lg px-5
                         font-semibold text-slate-900 border border-slate-300 hover:bg-slate-50"
            >
              How it works
            </a>
          </div>

          {/* Legal */}
          <p className="mt-5 text-center text-xs sm:text-sm text-slate-500 pb-16">
            No purchase necessary. 18+. Odds vary by number of tickets. Terms apply.
          </p>
        </div>
      </div>
    </section>
  );
}