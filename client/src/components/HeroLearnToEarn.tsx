import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Ticket, PiggyBank, CreditCard, LineChart, Wallet } from "lucide-react";

/**
 * Exact CSS screen sizes we target for pixel-perfect images.
 * Screen (not container) is 240×431 on mobile and 304×547 on desktop.
 */
const SCREEN_W_MOBILE = 240;
const SCREEN_H_MOBILE = 431;
const SCREEN_W_DESKTOP = 304;
const SCREEN_H_DESKTOP = 547;

type PhoneSrc = {
  m240: string; // 240×431
  m480: string; // 480×862 (2x)
  s304: string; // 304×547
  s608: string; // 608×1094 (2x)
  alt: string;
};

interface Props {
  phone: PhoneSrc;
}

const SubjectChip: React.FC<{ icon: React.ReactNode; label: string }> = ({
  icon,
  label,
}) => (
  <div className="flex items-center gap-2 rounded-full bg-white shadow-lg/50 shadow-slate-900/10 border border-slate-200 px-4 py-2 text-slate-700">
    <span className="w-4 h-4 text-indigo-600">{icon}</span>
    <span className="text-sm font-semibold">{label}</span>
  </div>
);

const HeroLearnToEarn: React.FC<Props> = ({ phone }) => {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pt-10 lg:pt-14">
        {/* 2-col on desktop, stacked on mobile; headline first on mobile */}
        <div className="grid lg:grid-cols-2 items-center gap-10 lg:gap-14">
          {/* LEFT: Copy */}
          <div>


            <h1 className="tracking-tight text-slate-900 text-[40px] leading-[1.05] sm:text-[56px] md:text-[64px] font-black">
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Learn Real
                <br className="hidden sm:block" /> Finance Tools
              </span>
              <span className="block text-slate-900 mt-2">Earn Real Cash</span>
            </h1>

            <p className="mt-6 text-lg text-slate-600 max-w-xl">
              Complete short lessons and real-world actions to collect{" "}
              <span className="font-semibold text-slate-800">tickets</span> for
              cash drawings — free to join.
            </p>

            {/* badges row */}
            <div className="mt-5 flex flex-wrap gap-3">
              <Badge className="bg-white text-slate-700 border border-slate-200 hover:bg-white">
                <span className="inline-flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-indigo-600" />
                  Ticket entries
                </span>
              </Badge>
              <Badge className="bg-white text-slate-700 border border-slate-200 hover:bg-white">
                <span className="inline-flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-indigo-600" />
                  Real money tools
                </span>
              </Badge>
            </div>

            {/* CTAs */}
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="/auth?mode=signup"
                className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg hover:shadow-xl transition-all"
              >
                Start Free
              </a>
              <a
                href="#how"
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-base font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-50"
              >
                How it works
              </a>
            </div>

            {/* disclaimer */}
            <p className="mt-6 text-sm text-slate-500">
              No purchase necessary. 18+. Odds vary by number of tickets. Terms
              apply.
            </p>
          </div>

          {/* RIGHT: Phone screenshot with chips and ticket badge */}
          <div className="relative lg:justify-self-end">
            {/* SUBJECT CHIPS — vertically anchored to the left of the screen box */}
            <div className="hidden lg:flex flex-col gap-4 absolute -left-40 top-6">
              <SubjectChip icon={<PiggyBank />} label="Budget" />
              <SubjectChip icon={<CreditCard />} label="Credit" />
              <SubjectChip icon={<Wallet />} label="Savings" />
              <SubjectChip icon={<LineChart />} label="Investing" />
              <SubjectChip icon={<Ticket />} label="Debt" />
            </div>

            {/* Screenshot container: exact screen size (no scaling) */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="relative mx-auto lg:mx-0"
            >
              {/* Desktop: 304×547; Mobile: 240×431 */}
              <img
                src={phone.m240}
                srcSet={[
                  `${phone.m240} 240w`,
                  `${phone.m480} 480w`,
                  `${phone.s304} 304w`,
                  `${phone.s608} 608w`,
                ].join(", ")}
                sizes={`(min-width:1024px) ${SCREEN_W_DESKTOP}px, ${SCREEN_W_MOBILE}px`}
                width={SCREEN_W_DESKTOP}
                height={SCREEN_H_DESKTOP}
                alt={phone.alt}
                className={[
                  `block`,
                  `w-[${SCREEN_W_MOBILE}px] h-[${SCREEN_H_MOBILE}px]`,
                  `lg:w-[${SCREEN_W_DESKTOP}px] lg:h-[${SCREEN_H_DESKTOP}px]`,
                  "rounded-[28px] lg:rounded-[32px] object-cover select-none",
                  "shadow-[0_22px_60px_-10px_rgba(2,6,23,0.35)]",
                ].join(" ")}
                style={{
                  imageRendering: "auto",
                  transform: "translateZ(0)",
                  backfaceVisibility: "hidden",
                }}
                draggable={false}
              />

              {/* Optional blue wedge banner like earlier iteration */}
              <div className="hidden lg:block absolute -top-6 left-1/2 -translate-x-1/2 w-[280px] h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl shadow-lg" />

              {/* TICKETS badge at bottom-right */}
              <div className="hidden lg:flex items-center gap-3 absolute -bottom-6 right-0 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
                <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Ticket className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-slate-500 leading-none">
                    TICKETS
                  </div>
                  <div className="text-sm font-semibold text-slate-800">
                    Earn entries
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroLearnToEarn;