import React from "react";

export default function HeroSplit() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="pt-20 md:pt-24 lg:pt-28 pb-16">

          {/* Clean split headlines */}
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_auto_1fr]">
            {/* Left — gradient brand side */}
            <div className="text-left">
              <h1 className="font-extrabold tracking-tight leading-tight
                             text-4xl sm:text-5xl md:text-6xl lg:text-7xl
                             text-transparent bg-clip-text
                             bg-gradient-to-r from-blue-600 to-purple-600">
                Learn Real Finance
              </h1>
            </div>

            {/* Clean divider */}
            <div className="hidden lg:flex items-center">
              <div className="h-20 w-px bg-slate-300" />
            </div>

            {/* Right — earn side */}
            <div className="text-right">
              <h2 className="font-extrabold tracking-tight leading-tight
                             text-4xl sm:text-5xl md:text-6xl lg:text-7xl
                             text-slate-900">
                Earn Real Cash
              </h2>
            </div>
          </div>

          {/* Clean subhead */}
          <p className="mx-auto mt-8 max-w-2xl text-center text-lg leading-relaxed text-slate-600">
            Complete financial lessons and real-world actions to earn <span className="font-semibold text-slate-800">tickets</span> for weekly cash drawings — free to join.
          </p>

          {/* Simple CTAs */}
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="/auth?mode=signup"
              className="inline-flex h-12 items-center justify-center rounded-lg px-6
                         font-semibold text-white shadow-sm
                         bg-gradient-to-r from-blue-600 to-purple-600
                         hover:from-blue-700 hover:to-purple-700
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Start Free
            </a>

            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-lg px-6
                         font-semibold text-slate-700 
                         border border-slate-300 hover:bg-slate-50
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              How it works
            </a>
          </div>

          {/* Legal */}
          <p className="mt-6 pb-16 text-center text-sm text-slate-500 max-w-2xl mx-auto">
            No purchase necessary. 18+. Odds vary by number of tickets earned. <a href="/terms" className="underline hover:text-slate-700">Terms apply</a>.
          </p>
        </div>
      </div>
    </section>
  );
}