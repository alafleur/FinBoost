import React from "react";
import DeviceScreenshot from "./DeviceScreenshot";

// Updated imports to use the correct screenshot filenames
import step4_m240 from "../assets/screenshots/step4_m240_new.png";
import step4_m480 from "../assets/screenshots/step4_m480_new.png";
import step4_m720 from "../assets/screenshots/step4_m720_new.png";
import step4_s304 from "../assets/screenshots/step4_s304.png";
import step4_s608 from "../assets/screenshots/step4_s608.png";

export default function HeroSplit() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="pt-24 md:pt-28 lg:pt-32 pb-8 md:pb-12">

          {/* Desktop layout */}
          <div className="hidden lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-12 xl:gap-16 items-center">
            <div className="text-right">
              <h1
                className="font-extrabold tracking-tight leading-[1.02] max-w-[13ch] ml-auto
                           text-5xl xl:text-6xl 2xl:text-7xl
                           text-transparent bg-clip-text
                           bg-gradient-to-r from-blue-600 to-purple-600"
              >
                Learn<br />Real<br />Finance
              </h1>
            </div>

            <div className="flex justify-center self-center">
              <DeviceScreenshot
                alt="FinBoost — Rewards screen"
                mobile={{
                  x1: step4_m240,
                  x2: step4_m480,
                  x3: step4_m720,
                  width: 240,
                  height: 431
                }}
                showFrame
                frameClassName="rounded-[2rem] border border-slate-200 bg-white p-2 shadow-xl"
                className=""
                priority
                mode="force3x"
              />
            </div>

            <div className="text-left">
              <h2
                className="font-extrabold tracking-tight leading-[1.02] max-w-[13ch]
                           text-5xl xl:text-6xl 2xl:text-7xl text-slate-900"
              >
                Earn<br />Real<br />Cash
              </h2>
            </div>
          </div>

          {/* Mobile layout */}
          <div className="lg:hidden px-4 pt-2 pb-8">
            <div className="text-center mb-6">
              <h1 className="font-extrabold tracking-tight leading-[1.06]">
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600
                                 text-[clamp(1.9rem,7.2vw,2.6rem)] max-w-[20ch] mx-auto">
                  Learn Real Finance
                </span>
                <span className="block text-slate-900 mt-1
                                 text-[clamp(1.9rem,7.2vw,2.6rem)] max-w-[20ch] mx-auto">
                  Earn Real Cash
                </span>
              </h1>
            </div>

            <div className="flex justify-center">
              <DeviceScreenshot
                alt="FinBoost — Rewards screen"
                mobile={{
                  x1: step4_m240,
                  x2: step4_m480,
                  x3: step4_m720,
                  width: 240,
                  height: 431
                }}
                showFrame
                frameClassName="rounded-[2rem] border border-slate-200 bg-white p-2 shadow-xl"
                className=""
                priority
                mode="force3x"
              />
            </div>
          </div>

          {/* Tagline / subhead */}
          <p className="mx-auto mt-6 md:mt-8 max-w-3xl text-center text-lg leading-relaxed text-slate-600">
            Complete financial lessons and real‑world actions to earn{" "}
            <span className="font-semibold text-slate-800">tickets</span> for weekly cash drawings — free to join.
          </p>

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

          <p className="mt-4 text-center text-sm text-slate-500 max-w-2xl mx-auto">
            No purchase necessary. 18+. Odds vary by number of tickets earned.{" "}
            <a href="/terms" className="underline hover:text-slate-700">Terms apply</a>.
          </p>
        </div>
      </div>
    </section>
  );
}