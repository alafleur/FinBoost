
import React from "react";
import { motion } from "framer-motion";
import {
  Ticket,
  Wallet,
  PiggyBank,
  TrendingUp,
  CreditCard,
  ShieldCheck,
} from "lucide-react";

/**
 * Pixel‑perfect hero with frameless phone screenshot, vertical subject tags,
 * a ticket pill, and mobile-first ordering (headline before screenshot).
 * Uses fixed CSS widths (240px mobile, 304px desktop) with width-based srcSet
 * so the browser always chooses exact-size images (or 2× for retina).
 *
 * Drop-in replacement. No external deps. Matches existing color system.
 */

type PhoneSources = {
  m240: string; // 240x431
  m480: string; // 480x862
  s304: string; // 304x547
  s608: string; // 608x1094
  alt: string;
};

interface Props {
  phone: PhoneSources;
}

const PHONE_CSS_WIDTHS = { mobile: 240, desktop: 304 } as const;

const SubjectTag: React.FC<{ icon: React.ReactNode; label: string; delay?: number }> = ({
  icon,
  label,
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, x: 10, y: 6 }}
    whileInView={{ opacity: 1, x: 0, y: 0 }}
    transition={{ duration: 0.35, delay }}
    viewport={{ once: true, amount: 0.5 }}
    className="flex items-center gap-2 rounded-full bg-white/85 backdrop-blur border border-slate-200 shadow-md px-3 py-2 text-slate-700 text-sm"
    aria-hidden="true"
  >
    <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center">
      {icon}
    </div>
    <span className="font-medium">{label}</span>
  </motion.div>
);

const HeroLearnToEarn: React.FC<Props> = ({ phone }) => {
  return (
    <section id="hero" className="relative overflow-hidden pt-8 md:pt-10 lg:pt-16 pb-6 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
        {/* LEFT: Headline & CTA (always first on mobile) */}
        <div className="order-1">
          <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50/60 text-blue-700 font-semibold px-4 py-2 mb-6">
            Learn to earn
          </div>

          {/* Single h1 for the page */}
          <h1 className="text-[40px] leading-[0.95] md:text-[64px] md:leading-[0.95] font-black tracking-tight mb-6">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Learn Real
            </span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Finance Tools
            </span>
            <span className="block text-slate-900 mt-3">Earn Real Cash</span>
          </h1>

          <p className="text-lg text-slate-600 max-w-xl mb-5">
            Complete short lessons and real‑world actions to collect <span className="font-semibold text-slate-800">tickets</span> for cash drawings — free to join.
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-slate-700">
              <Ticket className="w-4 h-4 text-blue-600" /> Ticket entries
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-slate-700">
              <Wallet className="w-4 h-4 text-purple-600" /> Real money tools
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/auth?mode=signup"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-6 py-3 shadow-lg hover:shadow-xl transition"
            >
              Start Free
            </a>
            <a
              href="#preview"
              className="rounded-xl border border-slate-200 bg-white/80 text-slate-800 font-semibold px-6 py-3 hover:bg-white transition"
            >
              How it works
            </a>
          </div>

          {/* Micro legal */}
          <div className="text-sm text-slate-500 mt-6">
            No purchase necessary. 18+. Odds vary by number of tickets. Terms apply.
          </div>
        </div>

        {/* RIGHT: Frameless phone + subject tags + ticket pill */}
        <div className="order-2 lg:order-2 relative flex items-start justify-center lg:justify-start">
          {/* Decorative angled band behind phone (kept subtle) */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute -top-10 left-6 w-[360px] h-16 rounded-xl bg-gradient-to-r from-blue-700 to-purple-600 rotate-10 blur-[1px] opacity-90"
          />

          {/* Subject tags stack (left of phone on desktop) */}
          <div className="hidden lg:flex flex-col gap-4 mr-6 mt-12">
            <SubjectTag icon={<ShieldCheck className='w-3.5 h-3.5' />} label="Budget" delay={0.0} />
            <SubjectTag icon={<CreditCard className='w-3.5 h-3.5' />} label="Credit" delay={0.05} />
            <SubjectTag icon={<PiggyBank className='w-3.5 h-3.5' />} label="Savings" delay={0.1} />
            <SubjectTag icon={<TrendingUp className='w-3.5 h-3.5' />} label="Investing" delay={0.15} />
            <SubjectTag icon={<ShieldCheck className='w-3.5 h-3.5' />} label="Debt" delay={0.2} />
          </div>

          {/* Screenshot container (no phone frame) */}
          <div className="relative">
            <div
              className="w-[240px] lg:w-[304px] rounded-2xl overflow-hidden shadow-[0_30px_80px_-20px_rgba(15,23,42,0.35)] bg-white/80"
              style={{ /* Height auto via image aspect, explicit width for pixel perfection */ }}
            >
              <img
                src={phone.m240}
                srcSet={[
                  `${phone.m240} ${PHONE_CSS_WIDTHS.mobile}w`,
                  `${phone.m480} ${PHONE_CSS_WIDTHS.mobile * 2}w`,
                  `${phone.s304} ${PHONE_CSS_WIDTHS.desktop}w`,
                  `${phone.s608} ${PHONE_CSS_WIDTHS.desktop * 2}w`,
                ].join(", ")}
                sizes={`(min-width:1024px) ${PHONE_CSS_WIDTHS.desktop}px, ${PHONE_CSS_WIDTHS.mobile}px`}
                alt={phone.alt}
                className="w-full h-auto block select-none"
                loading="eager"
                decoding="async"
                fetchpriority="high"
                draggable={false}
                style={{ imageRendering: "auto", backfaceVisibility: "hidden", transform: "translateZ(0)" }}
              />
            </div>

            {/* Ticket pill bottom-right (desktop only) */}
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              viewport={{ once: true }}
              className="hidden lg:flex absolute -bottom-6 right-0 items-center gap-3 rounded-2xl bg-white/90 backdrop-blur border border-slate-200 shadow-xl px-4 py-3"
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center">
                <Ticket className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
                  Tickets
                </div>
                <div className="text-sm font-semibold text-slate-800">Earn entries</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroLearnToEarn;
