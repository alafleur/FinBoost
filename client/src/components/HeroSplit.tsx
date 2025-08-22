import React from "react";

export default function HeroSplit() {
  return (
    <section className="relative bg-white overflow-hidden">
      {/* Subtle background enhancement */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20" />
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-slate-50/40 to-transparent" />
      
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="pt-24 md:pt-28 pb-16 md:pb-20">

          {/* Split headlines - refined composition */}
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-14">
            {/* Left — gradient brand side */}
            <div className="text-left sm:text-center lg:text-left">
              <h1
                className="font-extrabold tracking-tight leading-[1.02]
                           text-[clamp(44px,7.2vw,96px)]
                           text-transparent bg-clip-text
                           bg-gradient-to-r from-blue-600 to-purple-600"
              >
                Learn Real
              </h1>
              <h1
                className="-mt-1 font-extrabold tracking-tight leading-[1.02]
                           text-[clamp(44px,7.2vw,96px)]
                           text-transparent bg-clip-text
                           bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"
              >
                Finance
              </h1>
            </div>

            {/* Refined divider */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="h-32 w-[2px] rounded-full self-center
                              bg-gradient-to-b from-blue-600/40 via-purple-500/40 to-transparent" />
            </div>

            {/* Right — earn side in commanding black */}
            <div className="text-right sm:text-center lg:text-right">
              <h2
                className="font-extrabold leading-[1.02] tracking-[-0.01em]
                           text-[clamp(44px,7.2vw,96px)] text-slate-900"
              >
                Earn Real
              </h2>
              <h2
                className="-mt-1 font-extrabold leading-[1.02] tracking-[-0.01em]
                           text-[clamp(44px,7.2vw,96px)] text-slate-900"
              >
                Cash
              </h2>
            </div>
          </div>

          {/* Refined subhead */}
          <p className="mx-auto mt-7 max-w-3xl text-center text-lg leading-relaxed text-slate-600">
            Complete financial lessons and real-world actions to earn <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">tickets</span> for weekly cash drawings — free to join.
          </p>

          {/* Refined CTAs */}
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="/auth?mode=signup"
              className="inline-flex h-12 lg:h-14 items-center justify-center rounded-xl px-6 lg:px-7
                         font-semibold text-white shadow-sm
                         bg-gradient-to-r from-blue-600 to-purple-600
                         hover:from-blue-700 hover:to-purple-700
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Start Free
            </a>

            <a
              href="#how-it-works"
              className="inline-flex h-12 lg:h-14 items-center justify-center rounded-xl px-5 lg:px-6
                         font-semibold text-slate-900 
                         border border-slate-300 hover:bg-slate-50
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              How it works
            </a>
          </div>

          {/* Legal disclaimer */}
          <p className="mt-4 pb-16 text-center text-sm text-slate-500 max-w-3xl mx-auto leading-relaxed">
            No purchase necessary. 18+. Odds vary by number of tickets earned. Educational value regardless of winning. 
            <a href="/terms" className="underline hover:text-slate-700 transition-colors">Terms apply</a>.
          </p>
        </div>
      </div>
    </section>
  );
}