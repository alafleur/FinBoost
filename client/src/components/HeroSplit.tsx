import React from "react";
import step4_m240 from '../assets/screenshots/step4_m240.png';
import step4_m480 from '../assets/screenshots/step4_m480.png';
import step4_s304 from '../assets/screenshots/step4_s304.png';
import step4_s608 from '../assets/screenshots/step4_s608.png';

export default function HeroSplit() {
  return (
    <section className="bg-white relative overflow-hidden">
      {/* Radial gradient backdrop - positioned behind phone screenshot */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Desktop gradient - emanates from center where phone sits */}
        <div className="hidden lg:block absolute inset-0 bg-gradient-radial from-blue-500/8 via-purple-500/4 to-transparent opacity-60" 
             style={{
               background: 'radial-gradient(ellipse 800px 600px at 50% 45%, rgba(59, 130, 246, 0.08) 0%, rgba(147, 51, 234, 0.04) 35%, transparent 70%)'
             }}>
        </div>
        
        {/* Mobile gradient - emanates from bottom-right where phone sits */}
        <div className="lg:hidden absolute inset-0 opacity-60"
             style={{
               background: 'radial-gradient(ellipse 600px 500px at 85% 75%, rgba(59, 130, 246, 0.08) 0%, rgba(147, 51, 234, 0.04) 35%, transparent 70%)'
             }}>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 relative z-10">
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
              
              <div className="relative z-10 rotate-[8deg]">
                <img
                  className="w-auto h-[320px] xl:h-[360px] 2xl:h-[400px] 
                             rounded-[28px] shadow-xl shadow-slate-900/15
                             ring-1 ring-gray-200/50"
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


          {/* Mobile: Stacked layout with proper copy structure */}
          <div className="lg:hidden relative px-4 pt-2 pb-36 min-h-[520px]">
            {/* Copy top-left (same copy, not all caps) */}
            <div className="max-w-[22rem] text-left space-y-4 relative z-10">
              <h1 className="font-extrabold tracking-tight leading-[1.05] text-[clamp(1.75rem,6vw,4.5rem)]">
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Learn Real Finance
                </span>
                <span className="block text-slate-900 mt-1">
                  Earn Real Cash
                </span>
              </h1>
            </div>

            {/* Screenshot bottom-right with slight angle; uses existing step4_* assets */}
            <div className="pointer-events-none absolute bottom-0 right-0 w-[76%] max-w-[340px] rotate-[8deg] drop-shadow-2xl z-0">
              <img
                className="w-full h-auto rounded-[24px] shadow-xl shadow-slate-900/15 ring-1 ring-gray-200/50"
                srcSet={`${step4_m240} 240w, ${step4_m480} 480w, ${step4_s304} 304w, ${step4_s608} 608w`}
                sizes="(max-width: 640px) 76vw, 304px"
                src={step4_m480}
                alt="FinBoost winner notification - $325 cash reward"
                loading="eager"
                decoding="async"
                draggable={false}
                width="240"
                height="431"
              />
              {/* subtle gloss */}
              <div className="absolute inset-0 rounded-[24px] bg-gradient-to-tr from-transparent via-white/5 to-white/20"></div>
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