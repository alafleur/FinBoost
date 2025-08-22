import React from "react";
import step4_m240 from '../assets/screenshots/step4_m240.png';
import step4_m480 from '../assets/screenshots/step4_m480.png';
import step4_s304 from '../assets/screenshots/step4_s304.png';
import step4_s608 from '../assets/screenshots/step4_s608.png';

export default function HeroSplit() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="pt-20 md:pt-24 lg:pt-28 pb-16">

          {/* Three-column split layout - Hidden on mobile */}
          <div className="hidden lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-12 items-center">
            {/* Left — Learn Real Finance (3 lines) */}
            <div className="text-right">
              <h1 className="font-extrabold tracking-tight leading-[0.9]
                             text-5xl xl:text-6xl 2xl:text-7xl
                             text-transparent bg-clip-text
                             bg-gradient-to-r from-blue-600 to-purple-600">
                Learn<br />
                Real<br />
                Finance
              </h1>
            </div>

            {/* Center — Frameless phone with winner notification */}
            <div className="flex justify-center mx-8">
              <div className="relative">
                {/* Frameless screenshot with premium effects */}
                <div className="relative">
                  <img
                    className="w-auto h-[380px] xl:h-[420px] 2xl:h-[460px] 
                               rounded-[28px] shadow-2xl
                               ring-1 ring-gray-200/50
                               [box-shadow:0_25px_50px_-12px_rgba(0,0,0,0.25),0_0_0_1px_rgba(0,0,0,0.05),0_0_20px_rgba(59,130,246,0.15)]"
                    srcSet={`${step4_m240} 240w, ${step4_m480} 480w, ${step4_s304} 304w, ${step4_s608} 608w`}
                    sizes="304px"
                    src={step4_s304}
                    alt="FinBoost winner notification - $325 cash reward"
                    loading="eager"
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
            </div>

            {/* Right — Earn Real Cash (3 lines) */}
            <div className="text-left">
              <h2 className="font-extrabold tracking-tight leading-[0.9]
                             text-5xl xl:text-6xl 2xl:text-7xl
                             text-slate-900">
                Earn<br />
                Real<br />
                Cash
              </h2>
            </div>
          </div>

          {/* Mobile-only simplified content */}
          <div className="lg:hidden text-center">
            <h1 className="font-extrabold tracking-tight leading-tight
                           text-4xl sm:text-5xl
                           text-transparent bg-clip-text
                           bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
              Learn Finance.<br />Earn Cash.
            </h1>
          </div>

          {/* Clean subhead */}
          <p className="mx-auto mt-8 max-w-3xl text-center text-lg leading-relaxed text-slate-600">
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

          {/* Legal */}
          <p className="mt-6 pb-16 text-center text-sm text-slate-500 max-w-2xl mx-auto">
            No purchase necessary. 18+. Odds vary by number of tickets earned. <a href="/terms" className="underline hover:text-slate-700">Terms apply</a>.
          </p>
        </div>
      </div>
    </section>
  );
}