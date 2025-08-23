import React from "react";
import step4_m240 from '../assets/screenshots/step4_m240.png';
import step4_m480 from '../assets/screenshots/step4_m480.png';
import step4_s304 from '../assets/screenshots/step4_s304.png';
import step4_s608 from '../assets/screenshots/step4_s608.png';

export default function HeroSplit() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="pt-24 md:pt-28 lg:pt-32 pb-8 md:pb-10">

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
                  className="w-auto h-[320px] xl:h-[360px] 2xl:h-[400px] 
                             rounded-[28px] shadow-xl shadow-slate-900/15
                             ring-1 ring-gray-200/50 rotate-[3deg]"
                  srcSet={`${step4_m240} 240w, ${step4_m480} 480w, ${step4_s304} 304w, ${step4_s608} 608w`}
                  sizes="304px"
                  src={step4_s304}
                  alt="FinBoost winner notification - $325 cash reward"
                  loading="eager"
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

          {/* Mobile: Large impact layout like Underdog example */}
          <div className="lg:hidden relative min-h-[75vh] flex flex-col justify-between py-4">
            {/* Top: Learn Real Finance - Much larger */}
            <div className="text-center px-4">
              <h1 className="font-extrabold tracking-tight leading-[0.95]
                             text-[clamp(2.5rem,12vw,4rem)]
                             text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                LEARN<br />
                REAL<br />
                FINANCE
              </h1>
            </div>
            
            {/* Center: Large mobile phone screenshot */}
            <div className="flex-1 flex items-center justify-center px-4">
              <img
                className="w-auto h-[50vh] max-h-[420px] min-h-[350px]
                           rounded-[28px] shadow-2xl shadow-slate-900/20
                           ring-1 ring-gray-200/50 rotate-[3deg]"
                srcSet={`${step4_m240} 240w, ${step4_m480} 480w, ${step4_s304} 304w, ${step4_s608} 608w`}
                sizes="(max-width: 640px) 240px, 304px"
                src={step4_m480}
                alt="FinBoost winner notification - $325 cash reward"
                loading="eager"
                width="240"
                height="431"
              />
            </div>
            
            {/* Bottom: Earn Real Cash - Much larger */}
            <div className="text-center px-4">
              <h2 className="font-extrabold tracking-tight leading-[0.95]
                             text-[clamp(2.5rem,12vw,4rem)]
                             text-slate-900">
                EARN<br />
                REAL<br />
                CASH
              </h2>
            </div>
          </div>

          {/* Clean subhead with improved spacing */}
          <p className="mx-auto mt-6 md:mt-8 max-w-3xl text-center text-lg leading-relaxed text-slate-600">
            Complete financial lessons and real-world actions to earn <span className="font-semibold text-slate-800">tickets</span> for weekly cash drawings — free to join.
          </p>

          {/* Single CTA */}
          <div className="mt-6 flex justify-center">
            <a
              href="/auth?mode=signup"
              className="inline-flex h-12 items-center justify-center rounded-lg px-8
                         font-semibold text-white shadow-sm
                         bg-gradient-to-r from-blue-600 to-purple-600
                         hover:from-blue-700 hover:to-purple-700
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                         transition-all duration-200"
              aria-label="Join early access with FinBoost"
            >
              Join Early Access
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