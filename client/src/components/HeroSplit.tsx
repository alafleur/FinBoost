import React from "react";

export default function HeroSplit() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="pt-20 md:pt-24 lg:pt-28">

          {/* Split headlines */}
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_auto_1fr]">
            {/* Left — gradient brand side */}
            <div className="text-left">
              <h1
                className="font-extrabold tracking-tight leading-[1.04]
                           text-4xl sm:text-5xl md:text-6xl lg:text-7xl
                           text-transparent bg-clip-text
                           bg-gradient-to-r from-blue-600 to-purple-600"
              >
                Learn Real
              </h1>
              <h1
                className="-mt-1 font-extrabold tracking-tight leading-[1.04]
                           text-4xl sm:text-5xl md:text-6xl lg:text-7xl
                           text-transparent bg-clip-text
                           bg-gradient-to-r from-blue-600 to-purple-600"
              >
                Finance
              </h1>
            </div>

            {/* Divider (only on desktop, short & subtle) */}
            <div className="hidden lg:flex items-center">
              <div className="h-28 w-px rounded-full bg-slate-300/70" />
            </div>

            {/* Right — earn side in near-black */}
            <div className="text-right">
              <h2
                className="font-extrabold tracking-tight leading-[1.04]
                           text-4xl sm:text-5xl md:text-6xl lg:text-7xl
                           text-slate-900"
              >
                Earn Real
              </h2>
              <h2
                className="-mt-1 font-extrabold tracking-tight leading-[1.04]
                           text-4xl sm:text-5xl md:text-6xl lg:text-7xl
                           text-slate-900"
              >
                Cash
              </h2>
            </div>
          </div>

          {/* Subhead */}
          <p className="mx-auto mt-6 md:mt-7 max-w-3xl text-center text-base sm:text-lg leading-relaxed text-slate-600">
            Short lessons and real-world actions earn <span className="font-semibold text-slate-800">tickets</span> for cash drawings — free to join.
          </p>

          {/* CTAs */}
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="/auth?mode=signup"
              className="inline-flex h-12 items-center justify-center rounded-xl px-6
                         font-semibold text-white shadow-sm
                         bg-gradient-to-r from-blue-600 to-purple-600
                         hover:from-blue-700 hover:to-purple-700
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Start Free
            </a>

            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-xl px-5
                         font-semibold text-slate-900
                         border border-slate-300 hover:bg-slate-50
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              How it works
            </a>
          </div>

          {/* Legal */}
          <p className="mt-4 pb-14 text-center text-xs sm:text-sm text-slate-500">
            No purchase necessary. 18+. Odds vary by number of tickets. Terms apply.
          </p>
        </div>
      </div>
    </section>
  );
}