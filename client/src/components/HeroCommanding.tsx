import React from "react";

export default function HeroCommanding() {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Subtle brand accent on the far right so the layout doesn't feel empty,
         but with NO device mockups/placeholders. Remove this <div> to go pure white. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-[-12%] w-[48%]
                   bg-[radial-gradient(60%_60%_at_30%_50%,rgba(59,130,246,0.10),rgba(147,51,234,0.08)_45%,transparent_70%)]"
      />

      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32 lg:py-36">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          {/* Left: copy */}
          <div className="lg:col-span-7">
            {/* Headline */}
            <h1 className="font-extrabold tracking-tight lg:tracking-tighter leading-[1.08]">
              <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Learn Finance
              </span>
              <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-slate-900">
                Win Real Cash
              </span>
            </h1>

            {/* Subhead */}
            <p className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600">
              Short lessons and real-world actions earn{" "}
              <span className="font-semibold text-slate-800">tickets</span> for cash drawings — free to join.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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

            {/* Legal */}
            <p className="mt-5 text-xs sm:text-sm text-slate-500">
              No purchase necessary. 18+. Odds vary by number of tickets. Terms apply.
            </p>
          </div>

          {/* Right: reserved negative space (keeps the hero feeling premium and balanced).
             Nothing interactive here—no placeholders. */}
          <div className="mt-12 lg:mt-0 lg:col-span-5" />
        </div>
      </div>
    </section>
  );
}