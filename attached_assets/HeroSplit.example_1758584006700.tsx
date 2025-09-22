import React from "react";
import DeviceScreenshot from "@/components/DeviceScreenshot";

import step4_m240 from "@/assets/screenshots/step4_m240_new.png";
import step4_m480 from "@/assets/screenshots/step4_m480_new.png";
import step4_m720 from "@/assets/screenshots/step4_m720_new.png";

export default function HeroSplit() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="pt-24 md:pt-28 lg:pt-32 pb-8 md:pb-12">
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
                  height: 431,
                }}
                showFrame
                priority
                // Force the sharpest asset everywhere (helps in desktop emulators)
                mode="force3x"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
