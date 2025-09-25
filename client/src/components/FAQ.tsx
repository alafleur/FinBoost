
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type QA = { q: string; a: React.ReactNode };

const faqs: QA[] = [
  {
    q: "What is FinBoost?",
    a: <>FinBoost is a learn-and-earn platform: complete short finance lessons and real-world actions to earn <strong>tickets</strong> for cash drawings.</>,
  },
  {
    q: "How do tickets work?",
    a: <>Lessons, quizzes, and verified actions award tickets. <strong>More tickets → better odds</strong> in each drawing.</>,
  },
  {
    q: "Do I need to pay to participate?",
    a: <>You can join free. A paid membership unlocks full access and helps fund the <strong>member rewards pool</strong> (see "Membership value").</>,
  },
  {
    q: "Is purchase necessary?",
    a: <><strong>No purchase necessary.</strong> 18+. Odds vary by number of tickets. Terms apply.</>,
  },
  {
    q: "How are winners selected?",
    a: <>Ticket-weighted random drawings at the end of each cycle. Both learning and verified actions contribute because both earn tickets.</>,
  },
  {
    q: "When do drawings happen?",
    a: <>At the end of each cycle (shown in-app). You'll always see your ticket total and cycle timing on your dashboard.</>,
  },
  {
    q: "How do payouts work?",
    a: <>Payouts are disbursed via <strong>PayPal</strong> (configure in your account). Processing time may vary by provider.</>,
  },
  {
    q: "What happens if I cancel membership?",
    a: <>You keep any tickets already earned for the current cycle; future earning pauses until you rejoin.</>,
  },
  {
    q: "How is my data handled?",
    a: <>We follow standard security practices and only request information needed for learning, verification, and payouts.</>,
  },
  {
    q: "Does 'real finance' mean real actions?",
    a: <>Yes. Beyond lessons, you can submit proof of real steps (e.g., a debt payment) to earn <strong>bonus tickets</strong>.</>,
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/10 to-blue-800/10 border border-blue-200 rounded-full px-6 py-2 mb-6">
            <span className="text-blue-700 font-semibold text-sm">FAQ</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Frequently Asked Questions</h2>
        </div>

        {/* Accordion grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {faqs.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="bg-white/80 border border-slate-200/70 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-start justify-between gap-4 text-left"
                >
                  <span className="text-base sm:text-lg font-semibold text-slate-900">{item.q}</span>
                  <svg
                    className={"w-5 h-5 text-slate-500 transition-transform " + (isOpen ? "rotate-180" : "")}
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-panel-${i}`}
                      key="content"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 text-slate-600 leading-relaxed text-sm sm:text-[0.95rem]">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Footer line + secondary CTA */}
        <div className="mt-10 text-center">
          <p className="text-sm text-slate-500">
            Still have questions? Email us at <a href="mailto:support@getfinboost.com" className="text-blue-600 hover:underline">support@getfinboost.com</a>.
          </p>
          <div className="mt-4">
            <a
              href="/signup"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
            >
              Join FinBoost
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
