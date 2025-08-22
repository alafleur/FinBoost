import React, { useState, useEffect } from "react";

export default function HeroSplit() {
  const [showWinnerNotification, setShowWinnerNotification] = useState(false);

  useEffect(() => {
    // Show winner notification after a brief delay
    const timer = setTimeout(() => {
      setShowWinnerNotification(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative bg-white">
      {/* Winner Notification */}
      {showWinnerNotification && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right duration-500">
          <div className="bg-white border border-blue-200 rounded-lg shadow-lg p-4 max-w-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">🎉 Recent Winner!</p>
                <p className="text-sm text-slate-600">Tier 1 Winner earned <span className="font-semibold text-green-600">$325.00</span></p>
                <p className="text-xs text-slate-500 mt-1">From $7,500 pool • 750 participants</p>
              </div>
              <button 
                onClick={() => setShowWinnerNotification(false)}
                className="flex-shrink-0 text-slate-400 hover:text-slate-500"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

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

          {/* Recent Winners Ticker */}
          <div className="mt-8 flex justify-center">
            <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-800">Recent payout: $325 winner from $7,500 pool</span>
            </div>
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