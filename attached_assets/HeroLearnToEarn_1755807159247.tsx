import React from "react";
import { motion } from "framer-motion";
import { Ticket, PiggyBank, CreditCard, TrendingUp, Hammer, Wallet } from "lucide-react";

/**
 * Pixel-perfect hero right-side with:
 * - no phone frame (frameless screenshot)
 * - subject tags along the left rail
 * - ticket bubble at bottom-right
 * - crisp images via width-based srcSet (240/480 & 304/608) and fixed CSS widths
 * Also enforces mobile order: text first, screenshot second.
 */

type PhoneImgs = {
  m240: string; // 240×431
  m480?: string; // 480×862 (retina)
  s304: string; // 304×547
  s608?: string; // 608×1094 (retina)
  alt?: string;
};

interface Props {
  phone: PhoneImgs;
}

const TAGS = [
  { label: "Budget", icon: PiggyBank },
  { label: "Credit", icon: CreditCard },
  { label: "Savings", icon: Wallet },
  { label: "Investing", icon: TrendingUp },
  { label: "Debt", icon: Hammer },
];

const HeroLearnToEarn: React.FC<Props> = ({ phone }) => {
  const srcSet = [
    phone.m240 && `${phone.m240} 240w`,
    phone.m480 && `${phone.m480} 480w`,
    phone.s304 && `${phone.s304} 304w`,
    phone.s608 && `${phone.s608} 608w`,
  ].filter(Boolean).join(", ");

  return (
    <section id="hero" className="bg-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-8 lg:pt-16">
        <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-10 items-center">
          {/* LEFT SIDE IS RENDERED BY YOUR EXISTING MARKUP IN HomeV3 */}

          {/* RIGHT: Frameless screenshot + tags + ticket bubble */}
          <div className="order-2 lg:order-2 w-full mt-8 lg:mt-0 flex lg:justify-end">
            <div className="relative">
              {/* angled accent behind screenshot (like earlier iteration) */}
              <div
                aria-hidden="true"
                className="hidden md:block absolute -top-8 -left-8 w-72 h-14 rotate-[-10deg] rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 shadow-2xl"
              />

              {/* the screenshot */}
              <motion.img
                src={phone.m240}
                srcSet={srcSet}
                sizes="(min-width:1024px) 304px, 240px"
                alt={phone.alt || "FinBoost app screenshot"}
                className="w-[240px] lg:w-[304px] h-auto rounded-xl shadow-[0_30px_60px_-15px_rgba(2,6,23,0.35)]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                decoding="async"
                loading="eager"
                draggable={false}
                style={{ imageRendering: "auto", backfaceVisibility: "hidden", transform: "translateZ(0)" }}
              />

              {/* subject tags to the left of the screenshot */}
              <div className="hidden md:flex flex-col gap-3 absolute -left-28 top-8" aria-hidden="true">
                {TAGS.map(({ label, icon: Icon }) => (
                  <div
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-sm border border-slate-200 px-4 py-2 shadow-lg"
                  >
                    <Icon className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">{label}</span>
                  </div>
                ))}
              </div>

              {/* ticket bubble */}
              <div className="hidden md:flex items-center gap-3 absolute -right-10 bottom-4 rounded-2xl bg-white/95 backdrop-blur-sm border border-slate-200 shadow-xl px-4 py-3" aria-hidden="true">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                  <Ticket className="w-4 h-4 text-white" />
                </div>
                <div className="text-slate-700">
                  <div className="text-[10px] font-bold tracking-wide text-slate-500">TICKETS</div>
                  <div className="text-sm font-semibold -mt-0.5">Earn entries</div>
                </div>
              </div>

              {/* soft glow */}
              <div className="pointer-events-none absolute inset-0 rounded-xl blur-3xl bg-gradient-to-br from-blue-400/20 to-purple-400/20 -z-10" aria-hidden="true"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroLearnToEarn;
