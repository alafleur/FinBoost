import { motion } from "framer-motion";

type Shot = {
  title: string;
  screenshotPath: string;
  // Optional pixel-perfect variants (recommended)
  m240?: string; // 240×431
  m480?: string; // 480×862 (retina)
  s304?: string; // 304×547
  s608?: string; // 608×1094 (retina)
};

export default function HeroPhone({ shot }: { shot: Shot }) {
  return (
    <div className="shrink-0 lg:mr-[-16px] relative select-none"> {/* Make sure the phone block never shrinks, slight negative margin for that off-edge look */}
      {/* OUTER FRAME (no fixed width so padding doesn't reduce inner screen area) */}
      <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-[2.5rem] lg:rounded-[3rem] p-2 shadow-xl lg:shadow-2xl shadow-slate-900/50">
        {/* EXACT SCREEN SIZE — this guarantees pixel-perfect rendering */}
        <div className="w-[240px] h-[431px] lg:w-[304px] lg:h-[547px] bg-white rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden">
          <motion.img
            src={shot.m240 || shot.screenshotPath}
            srcSet={[
              shot.m240 ? `${shot.m240} 240w` : null,
              shot.m480 ? `${shot.m480} 480w` : null,
              shot.s304 ? `${shot.s304} 304w` : null,
              shot.s608 ? `${shot.s608} 608w` : null,
            ]
              .filter(Boolean)
              .join(", ")}
            sizes="(min-width: 1024px) 304px, 240px"
            alt={shot.title}
            className="w-full h-full object-contain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            loading="eager"
            decoding="async"
            draggable={false}
            style={{
              imageRendering: "auto",
              backfaceVisibility: "hidden",
              transform: "translateZ(0)",
            }}
          />
        </div>
      </div>

      {/* SUBJECT CHIPS — keep them outside normal flow, desktop only */}
      <ul className="hidden lg:flex flex-col gap-6 absolute left-[-140px] top-10">
        {["Budget", "Credit", "Savings", "Investing", "Debt"].map((label) => (
          <li
            key={label}
            className="flex items-center gap-3 rounded-full pl-4 pr-5 py-2.5 bg-white shadow-md ring-1 ring-slate-200 text-slate-700"
          >
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600/10 text-indigo-600">
              {/* ticket-like glyph */}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v3a2 2 0 1 0 0 4v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a2 2 0 1 0 0-4V7z"/>
              </svg>
            </span>
            <span className="font-medium">{label}</span>
          </li>
        ))}
      </ul>

      {/* TICKET BADGE — desktop only */}
      <div className="hidden lg:flex items-center gap-3 absolute bottom-[-20px] right-[-6px] rounded-xl bg-white/90 backdrop-blur px-4 py-3 shadow-md">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600/10 text-indigo-600">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 7a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v3a2 2 0 1 0 0 4v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a2 2 0 1 0 0-4V7z"/>
          </svg>
        </span>
        <div className="text-sm">
          <div className="font-semibold text-slate-800">Tickets</div>
          <div className="text-slate-500 -mt-0.5">Earn entries</div>
        </div>
      </div>
    </div>
  );
}