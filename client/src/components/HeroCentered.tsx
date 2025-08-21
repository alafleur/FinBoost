import React from "react";

/**
 * HeroCentered
 * ------------------------------------------------------------------
 * A drop‑in, screenshot‑free hero section that centers the headline,
 * subheadline, badges and CTAs. Pure Tailwind classes — no dynamic
 * class generation — so it works with Tailwind's JIT/purge.
 *
 * Usage (in HomeV3.tsx or any page):
 *   import HeroCentered from "@/components/HeroCentered";
 *   ...
 *   <HeroCentered onStart={() => navigate("/signup")} onHowItWorks={() => scrollToId("how-it-works")} />
 *
 * If you don't need callbacks, you can omit the props and use anchors.
 */

type Props = {
  onStart?: () => void;
  onHowItWorks?: () => void;
};

const TicketIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 9a2 2 0 0 1 2-2h3v10H5a2 2 0 0 1-2-2v-2a2 2 0 1 0 0-4V9Z" stroke="currentColor" strokeWidth="1.6" />
    <path d="M21 9a2 2 0 0 0-2-2h-6v10h6a2 2 0 0 0 2-2v-2a2 2 0 1 1 0-4V9Z" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const ToolsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M14.7 6.3a4 4 0 1 1-5.66 5.66l-4.04 4.04a1.5 1.5 0 0 1-2.12-2.12l4.04-4.04A4 4 0 0 1 14.7 6.3Z" stroke="currentColor" strokeWidth="1.6" />
    <path d="M19 7l-2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const HeroCentered: React.FC<Props> = ({ onStart, onHowItWorks }) => {
  return (
    <section className="relative bg-white">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Vertical spacing */}
        <div className="pt-16 pb-14 sm:pt-20 sm:pb-16 lg:pt-28 lg:pb-24" />

        {/* Headline */}
        <h1 className="text-center font-extrabold leading-[1.05] tracking-tight">
          <span className="block text-[40px] sm:text-6xl lg:text-7xl bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
            Learn Real Finance Tools
          </span>
          <span className="mt-3 block text-[40px] sm:text-6xl lg:text-7xl text-slate-900">
            Earn Real Cash
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-6 max-w-3xl text-center text-lg sm:text-xl text-slate-600">
          Complete short lessons and real‑world actions to collect{" "}
          <span className="font-semibold text-slate-800">tickets</span> for cash drawings — free to join.
        </p>

        {/* Badges */}
        <div className="mt-6 flex items-center justify-center gap-3 sm:gap-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm">
            <TicketIcon />
            Ticket entries
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm">
            <ToolsIcon />
            Real money tools
          </span>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <button
            type="button"
            onClick={onStart}
            className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:brightness-[1.05] focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          >
            Start Free
          </button>

          <button
            type="button"
            onClick={onHowItWorks}
            className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
          >
            How it works
          </button>
        </div>

        {/* Micro‑disclaimer */}
        <p className="mx-auto mt-6 max-w-3xl text-center text-sm text-slate-500">
          No purchase necessary. 18+. Odds vary by number of tickets. Terms apply.
        </p>

        {/* Bottom spacing */}
        <div className="pb-6 lg:pb-10" />
      </div>
    </section>
  );
};

export default HeroCentered;