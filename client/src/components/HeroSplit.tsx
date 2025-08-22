import React from "react";

export default function HeroSplit() {
  return (
    <section className="relative bg-white overflow-hidden">
      {/* Subtle background enhancement */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20" />
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-slate-50/40 to-transparent" />
      
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="pt-20 md:pt-24 lg:pt-32 pb-16 md:pb-20">

          {/* Split headlines - enhanced for impact */}
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_auto_1fr]">
            {/* Left — gradient brand side */}
            <div className="text-left">
              <h1
                className="font-black tracking-tighter leading-[0.95]
                           text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl
                           text-transparent bg-clip-text
                           bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600
                           drop-shadow-sm"
              >
                Learn Real
              </h1>
              <h1
                className="-mt-2 font-black tracking-tighter leading-[0.95]
                           text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl
                           text-transparent bg-clip-text
                           bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600
                           drop-shadow-sm"
              >
                Finance
              </h1>
            </div>

            {/* Enhanced divider with gradient */}
            <div className="hidden lg:flex items-center">
              <div className="h-32 w-0.5 rounded-full bg-gradient-to-b from-blue-400/60 via-slate-400/80 to-purple-400/60" />
            </div>

            {/* Right — earn side in commanding black */}
            <div className="text-right">
              <h2
                className="font-black tracking-tighter leading-[0.95]
                           text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl
                           text-slate-900 drop-shadow-sm"
              >
                Earn Real
              </h2>
              <h2
                className="-mt-2 font-black tracking-tighter leading-[0.95]
                           text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl
                           text-slate-900 drop-shadow-sm"
              >
                Cash
              </h2>
            </div>
          </div>

          {/* Enhanced subhead */}
          <p className="mx-auto mt-8 md:mt-10 max-w-4xl text-center text-lg sm:text-xl md:text-2xl leading-relaxed text-slate-700 font-medium">
            Complete financial lessons and real-world actions to earn <span className="font-bold text-slate-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">tickets</span> for weekly cash drawings
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base sm:text-lg text-slate-600">
            Free to join • Educational value guaranteed
          </p>

          {/* Enhanced CTAs */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="/auth?mode=signup"
              className="group inline-flex h-14 items-center justify-center rounded-2xl px-8 
                         font-bold text-lg text-white shadow-xl shadow-blue-500/25
                         bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600
                         hover:from-blue-700 hover:via-blue-800 hover:to-purple-700
                         hover:shadow-2xl hover:shadow-blue-500/40 hover:scale-105
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                         transition-all duration-300 ease-out"
            >
              <span>Join Free & Win</span>
              <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>

            <a
              href="#how-it-works"
              className="inline-flex h-14 items-center justify-center rounded-2xl px-6
                         font-semibold text-lg text-slate-900 bg-white
                         border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50
                         hover:shadow-lg transition-all duration-200
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              See How It Works
            </a>
          </div>

          {/* Legal disclaimer */}
          <p className="mt-6 pb-16 text-center text-sm text-slate-500 max-w-3xl mx-auto leading-relaxed">
            No purchase necessary. 18+. Odds vary by number of tickets earned. Educational value regardless of winning. 
            <a href="/terms" className="underline hover:text-slate-700 transition-colors">Terms apply</a>.
          </p>
        </div>
      </div>
    </section>
  );
}