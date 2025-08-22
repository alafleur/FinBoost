import { ArrowRight, Play } from "lucide-react";

export default function HeroSplitVideo() {
  return (
    <section className="relative bg-white">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Text */}
        <div className="lg:col-span-7">
          <h1 className="font-extrabold tracking-tight leading-[1.05]">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 text-[clamp(2.25rem,5.5vw,3.75rem)]">
              Learn Finance
            </span>
            <span className="block text-slate-900 text-[clamp(2.25rem,5.5vw,3.75rem)]">
              Win Real Cash
            </span>
          </h1>

          <p className="mt-5 text-slate-600 text-[clamp(1rem,2.2vw,1.125rem)] leading-relaxed max-w-xl">
            Master real financial skills while competing for cash prizes. Every lesson
            completed earns tickets for upcoming drawings—free to join.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
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

          <p className="mt-4 text-sm text-slate-500">
            No purchase necessary. 18+. Odds vary by number of tickets. Terms apply.
          </p>
        </div>

        {/* Media (video poster placeholder) */}
        <div className="lg:col-span-5">
          <div
            className="relative aspect-video w-full rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden"
            aria-label="Explainer video placeholder"
          >
            {/* Poster image goes here when you have it; for now a subtle gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
            <button
              className="absolute inset-0 m-auto h-14 w-14 rounded-full bg-white shadow-lg ring-1 ring-slate-200
                         flex items-center justify-center hover:scale-105 transition-transform"
              aria-label="Play explainer"
            >
              <Play className="h-6 w-6 text-slate-900" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}