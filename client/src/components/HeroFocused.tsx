import { ArrowRight, Ticket } from "lucide-react";

export default function HeroFocused() {
  return (
    <section className="relative bg-white">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          {/* Headline */}
          <h1 className="font-extrabold tracking-tight leading-[1.05]">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-[clamp(2.25rem,6vw,3.75rem)]">
              Learn Finance
            </span>
            <span className="block text-slate-900 text-[clamp(2.25rem,6vw,3.75rem)]">
              Win Real Cash
            </span>
          </h1>

          {/* Subhead */}
          <p className="mt-5 text-slate-600 text-[clamp(1rem,2.2vw,1.125rem)] leading-relaxed">
            Short lessons and real-world actions earn{" "}
            <span className="font-semibold text-slate-800">tickets</span> for cash
            drawings — free to join.
          </p>

          {/* Trust chips (optional) */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700">
              <Ticket className="mr-1.5 h-4 w-4 text-purple-600" /> Tickets unlock entries
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700">
              $3,750 prize pool
            </span>
            <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700">
              750 winners
            </span>
          </div>

          {/* CTAs */}
          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="/auth?mode=signup"
              className="inline-flex h-12 items-center justify-center rounded-lg px-6 font-semibold text-white
                         bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Start Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>

            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-lg px-5 font-semibold
                         text-slate-900 border border-slate-300 hover:bg-slate-50"
            >
              How it works
            </a>
          </div>

          {/* Legal line */}
          <p className="mt-4 text-sm text-slate-500">
            No purchase necessary. 18+. Odds vary by number of tickets. Terms apply.
          </p>
        </div>
      </div>
    </section>
  );
}