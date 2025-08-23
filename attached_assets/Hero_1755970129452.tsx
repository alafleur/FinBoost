
import React from "react";

/**
 * Hero.tsx — Mobile-first hero inspired by Underdog's stacked headline + overlapping cards.
 * Single component handles both mobile and desktop with Tailwind breakpoints.
 * No base64 assets; safe gradients used as fallbacks.
 */

export default function Hero({
  ctaHref = "/signup",
  secondaryCtaHref = "#how-it-works",
  screenshotUrl = "",
  frontCardUrl = "",
  backCardUrl = "",
}: {
  ctaHref?: string;
  secondaryCtaHref?: string;
  screenshotUrl?: string;
  frontCardUrl?: string;
  backCardUrl?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Mobile layout */}
      <div className="md:hidden px-5 pt-6 pb-10 max-w-screen-sm mx-auto">
        <div className="mt-2">
          <h1 className="leading-[0.9] font-extrabold tracking-tight text-5xl">
            <span className="block">LEARN &amp; EARN</span>
            <span className="block">TICKETS</span>
          </h1>

          <h2 className="mt-3 leading-[0.9] font-extrabold tracking-tight text-[44px]">
            <span>WIN CASH</span>
          </h2>

          {/* Overlapping cards */}
          <div className="relative h-[320px] mt-4">
            {/* back card */}
            <div className="absolute left-4 top-6 w-[70%] h-[60%] rounded-3xl shadow-xl rotate-[-6deg] overflow-hidden">
              {backCardUrl ? (
                <img
                  src={backCardUrl}
                  alt="Decorative card"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div
                  className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-100"
                  aria-hidden="true"
                />
              )}
            </div>

            {/* front card / phone */}
            <div className="absolute right-1 top-0 w-[78%] h-[88%] rounded-3xl shadow-2xl rotate-[8deg] overflow-hidden">
              {frontCardUrl || screenshotUrl ? (
                <img
                  src={frontCardUrl || screenshotUrl}
                  alt="FinBoost app preview"
                  className="w-full h-full object-cover"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
              ) : (
                <div
                  className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-500"
                  aria-hidden="true"
                />
              )}
            </div>
          </div>

          {/* Subcopy */}
          <p className="mt-4 text-base text-slate-600">
            Complete quick lessons and real‑world actions to earn{" "}
            <span className="font-semibold">tickets</span> for weekly cash
            drawings.
          </p>

          {/* CTAs */}
          <div className="mt-5 flex items-center gap-3">
            <a
              href={ctaHref}
              className="inline-flex items-center justify-center rounded-2xl px-5 py-3 text-base font-semibold shadow-md bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[.98]"
            >
              Join Early Access
            </a>
            <a
              href={secondaryCtaHref}
              className="inline-flex items-center justify-center rounded-2xl px-4 py-3 text-base font-semibold border border-slate-300 text-slate-800 hover:bg-slate-50"
            >
              How it works
            </a>
          </div>

          {/* Compliance blurb */}
          <p className="mt-3 text-xs text-slate-500">
            No purchase necessary. 18+. Odds vary by entrants and tickets. See
            Official Rules.
          </p>
        </div>
      </div>

      {/* Desktop / tablet layout */}
      <div className="hidden md:block">
        <div className="mx-auto max-w-6xl px-8 py-16">
          <div className="grid grid-cols-12 gap-8 items-center">
            <div className="col-span-6">
              <h1 className="leading-[0.9] font-extrabold tracking-tight text-6xl">
                <span className="block">LEARN &amp; EARN</span>
                <span className="block">TICKETS</span>
              </h1>
              <h2 className="mt-5 leading-[0.9] font-extrabold tracking-tight text-5xl">
                WIN CASH
              </h2>
              <p className="mt-6 text-lg text-slate-600 max-w-lg">
                Finish lessons, pass quizzes, and take real steps with your
                money to earn tickets for weekly cash drawings.
              </p>
              <div className="mt-7 flex items-center gap-4">
                <a
                  href={ctaHref}
                  className="inline-flex items-center justify-center rounded-2xl px-6 py-3.5 text-base font-semibold shadow-md bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[.98]"
                >
                  Join Early Access
                </a>
                <a
                  href={secondaryCtaHref}
                  className="inline-flex items-center justify-center rounded-2xl px-5 py-3.5 text-base font-semibold border border-slate-300 text-slate-800 hover:bg-slate-50"
                >
                  How it works
                </a>
              </div>
              <p className="mt-4 text-xs text-slate-500">
                No purchase necessary. 18+. Odds vary by entrants and tickets.
                See Official Rules.
              </p>
            </div>

            {/* Visual stack */}
            <div className="col-span-6 relative h-[520px]">
              {/* back card */}
              <div className="absolute -left-6 top-16 w-[70%] h-[60%] rounded-[28px] shadow-xl rotate-[-6deg] overflow-hidden">
                {backCardUrl ? (
                  <img
                    src={backCardUrl}
                    alt="Decorative card"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div
                    className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-100"
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* front card / phone */}
              <div className="absolute right-0 top-0 w-[78%] h-[88%] rounded-[28px] shadow-2xl rotate-[8deg] overflow-hidden">
                {frontCardUrl || screenshotUrl ? (
                  <img
                    src={frontCardUrl || screenshotUrl}
                    alt="FinBoost app preview"
                    className="w-full h-full object-cover"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                ) : (
                  <div
                    className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-500"
                    aria-hidden="true"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
