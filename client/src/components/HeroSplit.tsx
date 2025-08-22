import React from "react";
import step1_m240 from '../assets/screenshots/step1_m240.png';
import step1_m480 from '../assets/screenshots/step1_m480.png';
import step1_s304 from '../assets/screenshots/step1_s304.png';
import step1_s608 from '../assets/screenshots/step1_s608.png';

export default function HeroSplit() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="pt-20 md:pt-24 lg:pt-28 pb-16">

          {/* Three-column split layout */}
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1fr_auto_1fr] lg:gap-12">
            {/* Left — gradient brand side */}
            <div className="text-left lg:text-right">
              <h1 className="font-extrabold tracking-tight leading-tight
                             text-4xl sm:text-5xl md:text-6xl lg:text-7xl
                             text-transparent bg-clip-text
                             bg-gradient-to-r from-blue-600 to-purple-600">
                Learn Real Finance
              </h1>
            </div>

            {/* Center — Phone mockup */}
            <div className="flex justify-center lg:mx-8">
              <div className="relative max-w-sm mx-auto">
                {/* Phone frame with subtle styling */}
                <div className="relative bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
                  {/* Status bar simulation */}
                  <div className="bg-black rounded-t-[2rem] px-4 py-2 flex justify-between items-center text-white text-sm">
                    <div className="flex items-center space-x-1">
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                    </div>
                    <div className="font-medium">12:34</div>
                    <div className="flex space-x-1">
                      <div className="w-4 h-2 border border-white rounded-sm"></div>
                      <div className="w-1 h-1 bg-white rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Phone screen with responsive image */}
                  <div className="bg-white rounded-b-[2rem] overflow-hidden">
                    <img
                      className="w-full h-auto block"
                      srcSet={`${step1_m240} 240w, ${step1_m480} 480w, ${step1_s304} 304w, ${step1_s608} 608w`}
                      sizes="(max-width: 768px) 240px, 304px"
                      src={step1_m480}
                      alt="FinBoost app showing winner notification"
                      loading="eager"
                    />
                  </div>
                  
                  {/* Subtle reflection effect */}
                  <div className="absolute inset-x-2 top-2 h-1/3 bg-gradient-to-b from-white/10 to-transparent rounded-t-[2rem] pointer-events-none"></div>
                </div>
              </div>
            </div>

            {/* Right — earn side */}
            <div className="text-right lg:text-left">
              <h2 className="font-extrabold tracking-tight leading-tight
                             text-4xl sm:text-5xl md:text-6xl lg:text-7xl
                             text-slate-900">
                Earn Real Cash
              </h2>
            </div>
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