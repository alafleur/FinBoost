
import * as React from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Ticket, Wrench, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type PhoneSources = {
  m240: string;   // 240×431 (mobile 1x)
  m480: string;   // 480×862 (mobile 2x / retina)
  s304: string;   // 304×547 (desktop 1x)
  s608: string;   // 608×1094 (desktop 2x / retina)
  alt: string;
};

interface HeroLearnToEarnProps {
  phone: PhoneSources;
}

const PHONE_CSS_WIDTHS = { mobile: 240, desktop: 304 } as const;

/**
 * Drop‑in hero component used by HomeV3.
 * - No phone frame; just the screenshot with a soft shadow (prevents scaling blur)
 * - Floating "ticket" chip restored
 * - Mobile layout shows screenshot first, then headline
 * - Uses width‑based srcSet; sizes match exact CSS widths (240px / 304px)
 * - No scale() animations applied to the <img>, only opacity
 */
export default function HeroLearnToEarn({ phone }: HeroLearnToEarnProps) {
  const [, navigate] = useLocation();

  const sizes = `(min-width:1024px) ${PHONE_CSS_WIDTHS.desktop}px, ${PHONE_CSS_WIDTHS.mobile}px`;

  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-white pt-8 sm:pt-12 lg:pt-16 pb-12 sm:pb-16 lg:pb-20"
      aria-label="Learn to earn hero section"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Layout: mobile column with image first, desktop two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Right column on desktop, first on mobile: phone screenshot-only card */}
          <div className="order-1 lg:order-2 lg:col-span-6 flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              {/* Screenshot only — exact CSS widths to avoid browser resampling */}
              <img
                src={phone.m240}
                srcSet={[
                  `${phone.m240} ${PHONE_CSS_WIDTHS.mobile}w`,
                  `${phone.m480} ${PHONE_CSS_WIDTHS.mobile * 2}w`,
                  `${phone.s304} ${PHONE_CSS_WIDTHS.desktop}w`,
                  `${phone.s608} ${PHONE_CSS_WIDTHS.desktop * 2}w`,
                ].join(", ")}
                sizes={sizes}
                alt={phone.alt}
                className="block w-[240px] lg:w-[304px] h-auto rounded-3xl shadow-[0_24px_70px_rgba(2,6,23,0.18)]"
                loading="eager"
                decoding="async"
                draggable={false}
                style={{
                  imageRendering: "auto",
                  backfaceVisibility: "hidden",
                  transform: "translateZ(0)",
                }}
              />

              {/* Floating ticket chip */}
              <div
                className="hidden md:flex items-center gap-2 absolute -left-10 top-8 rotate-[-6deg] px-3 py-2 rounded-xl
                           bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-xl"
                aria-hidden="true"
              >
                <Ticket className="w-5 h-5" />
                <span className="text-sm font-semibold tracking-wide">Tickets</span>
              </div>

              {/* Subtle spotlight behind image for depth */}
              <div
                className="pointer-events-none absolute -z-10 inset-0 blur-3xl"
                aria-hidden="true"
                style={{
                  background:
                    "radial-gradient(60% 60% at 70% 20%, rgba(59,130,246,0.20) 0%, rgba(139,92,246,0.16) 30%, rgba(255,255,255,0) 70%)",
                }}
              />
            </motion.div>
          </div>

          {/* Left column on desktop (second on mobile): headline + CTAs */}
          <div className="order-2 lg:order-1 lg:col-span-6">
            <div className="mb-5">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/50 px-4 py-1.5 text-xs font-semibold text-blue-700">
                Learn to earn
              </span>
            </div>

            <h1 className="text-[40px] leading-[1.03] sm:text-[56px] lg:text-[68px] font-extrabold tracking-tight">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                LEARN REAL
                <br className="hidden sm:block" />
                FINANCE TOOLS
              </span>
              <span className="mt-2 block text-slate-900">EARN REAL CASH</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg text-slate-700">
              Complete short lessons and real‑world actions to collect{" "}
              <span className="font-semibold text-slate-900">tickets</span> for cash drawings—free to join.
            </p>

            {/* Feature chips */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 text-slate-800 px-3 py-1.5 text-sm font-semibold">
                <Ticket className="w-4 h-4 text-blue-600" />
                Ticket entries
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 text-slate-800 px-3 py-1.5 text-sm font-semibold">
                <Wrench className="w-4 h-4 text-purple-600" />
                Real money tools
              </span>
            </div>

            {/* CTAs */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="px-6 py-6 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-95"
                onClick={() => navigate("/auth?mode=signup")}
              >
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="px-6 py-6 rounded-xl border-slate-300 text-slate-800 hover:bg-white"
                onClick={() => {
                  const el = document.getElementById("preview");
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                How it works
              </Button>
            </div>

            {/* Micro legal copy */}
            <p className="mt-6 text-sm text-slate-500">
              No purchase necessary. 18+. Odds vary by number of tickets. Terms apply.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
