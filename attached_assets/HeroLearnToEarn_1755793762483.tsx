import React from "react";
import { motion } from "framer-motion";
import { Ticket, Wrench } from "lucide-react";

type PhoneSources = {
  m240: string; // 240×431
  m480: string; // 480×862
  s304: string; // 304×547
  s608: string; // 608×1094
  alt: string;
};

interface Props {
  phone: PhoneSources;
}

const PHONE_CSS_WIDTHS = { mobile: 240, desktop: 304 } as const;

/**
 * HeroLearnToEarn
 * - Single, responsive hero used for both mobile and desktop
 * - No scale animations to avoid image resampling blur
 * - Uses width-based srcSet to deliver pixel-perfect screenshots
 * - Keeps styling aligned with the rest of HomeV3 (blue → indigo system)
 */
export default function HeroLearnToEarn({ phone }: Props) {
  return (
    <section
      id="hero"
      className="bg-white pt-8 md:pt-14 lg:pt-16 pb-10 md:pb-14 border-b border-slate-100"
      aria-labelledby="hero-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Left: Content */}
          <div className="order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1
                id="hero-heading"
                className="text-[40px] leading-[0.95] xs:text-5xl md:text-6xl font-black tracking-tight mb-6"
              >
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  LEARN REAL
                </span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  FINANCE TOOLS
                </span>
                <span className="block text-slate-900 mt-2">EARN REAL CASH</span>
              </h1>

              <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-6 md:mb-8">
                Complete short lessons and real-world actions to collect{" "}
                <span className="font-semibold text-slate-800">tickets</span>{" "}
                for cash drawings—free to join.
              </p>

              {/* Badges: Ticket + Tools (decorative) */}
              <div className="flex items-center gap-3 mb-6 md:mb-8" aria-hidden="true">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 bg-blue-50 rounded-full px-3 py-1">
                  <Ticket className="w-4 h-4" /> Ticket entries
                </span>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 bg-indigo-50 rounded-full px-3 py-1">
                  <Wrench className="w-4 h-4" /> Real money tools
                </span>
              </div>

              {/* CTAs */}
              <div className="flex items-center gap-3">
                <a
                  href="/auth?mode=signup"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg hover:shadow-xl hover:brightness-110 transition-all"
                >
                  Start Free
                </a>
                <a
                  href="#preview"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-slate-300 text-slate-800 hover:bg-white shadow-sm hover:shadow transition-all"
                >
                  How it works
                </a>
              </div>

              {/* Micro disclaimer */}
              <p className="text-xs text-slate-500 mt-4">
                No purchase necessary. 18+. Odds vary by number of tickets. Terms apply.
              </p>
            </motion.div>
          </div>

          {/* Right: Phone mockup */}
          <div className="order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative mx-auto lg:ml-auto w-[256px] md:w-[280px] lg:w-80"
            >
              {/* Frame */}
              <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-[2.5rem] lg:rounded-[3rem] p-2 shadow-xl lg:shadow-2xl shadow-slate-900/50">
                <div className="w-full h-full bg-white rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden flex flex-col">
                  {/* Faux status bar */}
                  <div className="h-8 lg:h-12 flex items-center justify-between px-4 lg:px-6 text-xs font-medium text-slate-600 flex-shrink-0">
                    <span>9:41</span>
                    <div className="flex space-x-1">
                      <div className="w-3 h-1 lg:w-4 lg:h-2 bg-slate-300 rounded-sm" />
                      <div className="w-3 h-1 lg:w-4 lg:h-2 bg-slate-300 rounded-sm" />
                      <div className="w-4 h-1 lg:w-6 lg:h-2 bg-green-500 rounded-sm" />
                    </div>
                  </div>

                  {/* Exact screen area (no scale animations) */}
                  <div className="flex-1 overflow-hidden flex items-start justify-center">
                    <img
                      src={phone.m240}
                      srcSet={[
                        `${phone.m240} 240w`,
                        `${phone.m480} 480w`,
                        `${phone.s304} 304w`,
                        `${phone.s608} 608w`
                      ].join(", ")}
                      sizes={`(min-width: 1024px) ${PHONE_CSS_WIDTHS.desktop}px, ${PHONE_CSS_WIDTHS.mobile}px`}
                      alt={phone.alt}
                      className="w-full h-full object-contain"
                      loading="eager"
                      decoding="async"
                      // Browser hint for LCP
                      fetchPriority="high"
                      draggable={false}
                      style={{ imageRendering: "auto", backfaceVisibility: "hidden", transform: "translateZ(0)" }}
                    />
                  </div>
                </div>
                {/* Home indicator */}
                <div className="absolute bottom-1 lg:bottom-2 left-1/2 transform -translate-x-1/2 w-24 lg:w-32 h-1 bg-white/30 rounded-full" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
