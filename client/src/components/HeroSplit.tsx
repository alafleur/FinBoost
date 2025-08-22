import React from "react";
import step4_m240 from '../assets/screenshots/step4_m240.png';
import step4_m480 from '../assets/screenshots/step4_m480.png';
import step4_s304 from '../assets/screenshots/step4_s304.png';
import step4_s608 from '../assets/screenshots/step4_s608.png';

export default function HeroSplit() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="pt-20 md:pt-24 lg:pt-28 pb-10 md:pb-12">

          {/* Desktop: Three-column split layout */}
          <div className="hidden lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-12 xl:gap-16 items-center">
            {/* Left — Learn Real Finance (3 lines) */}
            <div className="text-right">
              <h1 className="font-extrabold tracking-tight leading-[1.02] max-w-[13ch] ml-auto
                             text-5xl xl:text-6xl 2xl:text-7xl
                             text-transparent bg-clip-text
                             bg-gradient-to-r from-blue-600 to-purple-600">
                Learn<br />
                Real<br />
                Finance
              </h1>
            </div>

            {/* Center — Frameless phone with winner notification */}
            <div className="flex justify-center self-center relative">
              {/* Subtle vertical divider hint */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-slate-200/8 to-transparent -translate-x-1/2 pointer-events-none"></div>
              
              <div className="relative z-10">
                <img
                  className="w-auto h-[380px] xl:h-[420px] 2xl:h-[460px] 
                             rounded-[28px] shadow-xl shadow-slate-900/15
                             ring-1 ring-gray-200/50"
                  srcSet={`${step4_m240} 240w, ${step4_m480} 480w, ${step4_s304} 304w, ${step4_s608} 608w`}
                  sizes="304px"
                  src={step4_s304}
                  alt="FinBoost winner notification - $325 cash reward"
                  loading="eager"
                  fetchPriority="high"
                  width="304"
                  height="547"
                />
                
                {/* Premium gloss overlay */}
                <div className="absolute inset-0 rounded-[28px] 
                                bg-gradient-to-tr from-transparent via-white/5 to-white/20 
                                pointer-events-none"></div>
                
                {/* Subtle blue glow effect */}
                <div className="absolute inset-0 rounded-[28px] 
                                [box-shadow:0_0_40px_rgba(59,130,246,0.1)]
                                pointer-events-none"></div>
              </div>
            </div>

            {/* Right — Earn Real Cash (3 lines) */}
            <div className="text-left">
              <h2 className="font-extrabold tracking-tight leading-[1.02] max-w-[13ch]
                             text-5xl xl:text-6xl 2xl:text-7xl
                             text-slate-900">
                Earn<br />
                Real<br />
                Cash
              </h2>
            </div>
          </div>

          {/* Mobile: Stacked layout with proper copy structure */}
          <div className="lg:hidden text-center space-y-6">
            <h1 className="font-extrabold tracking-tight leading-[1.05]
                           text-[clamp(2rem,7vw,5.25rem)]">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Learn Real Finance
              </span>
              <span className="block text-slate-900 mt-2">
                Earn Real Cash
              </span>
            </h1>
            
            {/* Mobile phone screenshot */}
            <div className="flex justify-center">
              <img
                className="w-auto h-[300px] sm:h-[340px]
                           rounded-[24px] shadow-xl shadow-slate-900/15
                           ring-1 ring-gray-200/50"
                srcSet={`${step4_m240} 240w, ${step4_m480} 480w, ${step4_s304} 304w, ${step4_s608} 608w`}
                sizes="(max-width: 640px) 240px, 304px"
                src={step4_m480}
                alt="FinBoost winner notification - $325 cash reward"
                loading="eager"
                width="240"
                height="431"
              />
            </div>
          </div>

          {/* Clean subhead with improved spacing */}
          <p className="mx-auto mt-10 md:mt-12 max-w-3xl text-center text-lg leading-relaxed text-slate-600">
            Complete financial lessons and real-world actions to earn <span className="font-semibold text-slate-800">tickets</span> for weekly cash drawings — free to join.
          </p>

          {/* CTAs brought up into hero */}
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
            <a
              href="/auth?mode=signup"
              className="inline-flex h-12 items-center justify-center rounded-lg px-6
                         font-semibold text-white shadow-sm
                         bg-gradient-to-r from-blue-600 to-purple-600
                         hover:from-blue-700 hover:to-purple-700
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                         transition-all duration-200"
              aria-label="Start free with FinBoost"
            >
              Start Free
            </a>

            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-lg px-6
                         font-semibold text-slate-700 
                         border border-slate-300 hover:bg-slate-50
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300
                         transition-all duration-200"
              aria-label="Learn how FinBoost works"
            >
              How it works
            </a>
          </div>

          {/* Legal with tighter spacing */}
          <p className="mt-4 text-center text-sm text-slate-500 max-w-2xl mx-auto">
            No purchase necessary. 18+. Odds vary by number of tickets earned. <a href="/terms" className="underline hover:text-slate-700">Terms apply</a>.
          </p>
        </div>
      </div>
    </section>
  );
}