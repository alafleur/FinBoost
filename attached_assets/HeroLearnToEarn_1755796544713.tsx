
import React from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Shield,
  Ticket,
} from "lucide-react";

/**
 * Pixel-perfect phone sources (same shape HomeV3 passes today)
 */
type PhoneSources = {
  m240: string; // mobile 1x (240×431)
  m480: string; // mobile 2x (480×862)
  s304: string; // desktop 1x (304×547)
  s608: string; // desktop 2x (608×1094)
  alt: string;
};

type Props = {
  phone: PhoneSources;
};

/**
 * Small badge chip used for the subject tags at the side of the phone.
 * Matches the previous look but with more subjects.
 */
const SubjectChip: React.FC<{ icon: React.ReactNode; label: string; delay?: number }> = ({
  icon,
  label,
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, x: -10, y: 10 }}
    whileInView={{ opacity: 1, x: 0, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.35, delay }}
    className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-white/90 shadow-lg border border-slate-200 backdrop-blur-sm"
    aria-hidden="true"
  >
    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center">
      <div className="scale-75">{icon}</div>
    </div>
    <span className="text-xs font-semibold text-slate-700">{label}</span>
  </motion.div>
);

/**
 * Ticket overlay — compact badge that sits near the phone,
 * echoing the "ticket entries" concept without needing a static asset.
 */
const TicketBadge: React.FC = () => (
  <motion.div
    initial={{ opacity: 0, y: 10, rotate: 2 }}
    whileInView={{ opacity: 1, y: 0, rotate: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.4, delay: 0.15 }}
    className="absolute -bottom-6 -right-6 md:-right-10 md:-bottom-8 rotate-1"
    aria-hidden="true"
  >
    <div className="rounded-xl border border-blue-200 bg-white/95 shadow-xl px-3 py-2 flex items-center gap-2 backdrop-blur-sm">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-md">
        <Ticket className="w-4 h-4" />
      </div>
      <div className="leading-tight">
        <div className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
          Tickets
        </div>
        <div className="text-sm font-bold text-slate-900">Earn entries</div>
      </div>
    </div>
  </motion.div>
);

/**
 * Accent banner behind the phone (the angled blue strip you liked).
 * It's lightweight and purely CSS.
 */
const AngledAccent: React.FC = () => (
  <div
    aria-hidden="true"
    className="hidden md:block absolute -top-10 -left-6 w-72 h-14 rotate-[-10deg] rounded-xl
               bg-gradient-to-r from-blue-600 to-indigo-700 shadow-2xl"
  />
);

/**
 * HeroLearnToEarn — single component for desktop & mobile.
 * - Text (headline + CTAs) is first on mobile, second on desktop (order utilities).
 * - Phone is frameless with a soft shadow for crisp screenshots (no blur).
 * - Subject chips & ticket badge match your earlier iteration.
 */
const HeroLearnToEarn: React.FC<Props> = ({ phone }) => {
  return (
    <section id="hero" className="relative overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-12 items-center px-4 pt-8 md:pt-12 lg:pt-16 pb-8">
        {/* TEXT SIDE — mobile first */}
        <div className="order-1 lg:order-none">
          <div className="inline-block bg-gradient-to-r from-blue-600/10 to-blue-800/10 backdrop-blur-sm border border-blue-200 rounded-full px-4 py-1.5 mb-5">
            <span className="text-blue-700 font-semibold text-xs md:text-sm">Learn to earn</span>
          </div>

          <h1 className="text-[38px] leading-[0.95] sm:text-[44px] md:text-[56px] lg:text-[64px] font-black tracking-tight mb-4">
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Learn Real Finance Tools
            </span>
            <span className="block text-slate-900">Earn Real Cash</span>
          </h1>

          <p className="text-base md:text-lg text-slate-600 max-w-2xl mb-5">
            Complete short lessons and real-world actions to collect{" "}
            <span className="font-semibold text-slate-800">tickets</span> for cash drawings — free to join.
          </p>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-full px-3 py-1.5">
              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                <Ticket className="w-3.5 h-3.5" />
              </div>
              Ticket entries
            </span>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-full px-3 py-1.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              Real money tools
            </span>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <a
              href="/auth?mode=signup"
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Start Free
            </a>
            <a
              href="#preview"
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 border border-slate-300 text-slate-800 font-semibold bg-white hover:bg-slate-50 transition"
            >
              How it works
            </a>
          </div>

          <p className="text-xs text-slate-500">
            No purchase necessary. 18+. Odds vary by number of tickets. Terms apply.
          </p>
        </div>

        {/* IMAGE SIDE */}
        <div className="order-2 lg:order-none relative">
          <div className="relative w-[240px] lg:w-[304px] mx-auto">
            <AngledAccent />

            {/* SUBJECT CHIPS — more items than before */}
            <div className="hidden md:flex flex-col gap-3 absolute left-[-100px] top-8">
              <SubjectChip icon={<Shield className="w-3.5 h-3.5" />} label="Budget" delay={0.0} />
              <SubjectChip icon={<CreditCard className="w-3.5 h-3.5" />} label="Credit" delay={0.05} />
              <SubjectChip icon={<PiggyBank className="w-3.5 h-3.5" />} label="Savings" delay={0.1} />
              <SubjectChip icon={<TrendingUp className="w-3.5 h-3.5" />} label="Investing" delay={0.15} />
              <SubjectChip icon={<BookOpen className="w-3.5 h-3.5" />} label="Debt" delay={0.2} />
            </div>

            {/* PHONE IMAGE — frameless, soft shadow, crisp via srcSet/sizes */}
            <motion.img
              src={phone.m240}
              srcSet={[
                `${phone.m240} 240w`,
                `${phone.m480} 480w`,
                `${phone.s304} 304w`,
                `${phone.s608} 608w`,
              ].join(", ")}
              sizes="(min-width:1024px) 304px, 240px"
              alt={phone.alt}
              className="w-full h-auto rounded-xl shadow-[0_25px_60px_rgba(2,6,23,0.25)]"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              draggable={false}
              decoding="async"
              loading="eager"
              style={{ imageRendering: "auto", backfaceVisibility: "hidden", transform: "translateZ(0)" }}
            />

            <TicketBadge />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroLearnToEarn;
