import React from "react";

export default function HeroMinimal() {
  return (
    <section className="relative bg-white">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-28 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          {/* Headline */}
          <h1 className="font-extrabold tracking-tight leading-[1.08]">
            <span
              className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600
                         text-[clamp(2.2rem,6vw,3.6rem)]"
            >
              Learn Finance
            </span>
            <span className="block text-slate-900 text-[clamp(2.2rem,6vw,3.6rem)]">
              Win Real Cash
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="mx-auto mt-6 max-w-2xl text-[clamp(1rem,2.2vw,1.125rem)] leading-relaxed
                       text-slate-600"
          >
            Short lessons and real-world actions earn{" "}
            <span className="font-semibold text-slate-800">tickets</span> for cash
            drawings — free to join.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="/auth?mode=signup"
              className="inline-flex h-12 items-center justify-center rounded-lg px-6
                         font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600
                         hover:from-blue-700 hover:to-purple-700
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

          {/* Legal line */}
          <p className="mt-5 text-xs sm:text-sm text-slate-500">
            No purchase necessary. 18+. Odds vary by number of tickets. Terms apply.
          </p>
        </div>
      </div>
    </section>
  );
}