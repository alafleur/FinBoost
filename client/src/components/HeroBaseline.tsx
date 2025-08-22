import React from "react";

export default function HeroBaseline() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6">
        {/* Give the hero real breathing room without looking empty */}
        <div className="py-20 sm:py-24 md:py-28 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            {/* Headline */}
            <h1 className="font-extrabold leading-[1.1] tracking-tight text-slate-900
                           text-4xl sm:text-5xl md:text-6xl">
              <span className="block text-slate-900">Learn Finance,</span>
              <span className="block text-slate-900">Win Real Cash</span>
            </h1>

            {/* Subhead */}
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-600">
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
            <p className="mt-5 text-xs sm:text-sm text-slate-500">
              No purchase necessary. 18+. Odds vary by number of tickets. Terms apply.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}