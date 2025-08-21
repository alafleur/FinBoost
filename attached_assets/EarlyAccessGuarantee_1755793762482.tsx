import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, ChevronDown } from "lucide-react";

/**
 * EarlyAccessGuarantee
 * - Kept as a dedicated section just under the hero
 * - Matches existing gradient/rounded card style from the rest of HomeV3
 */
export default function EarlyAccessGuarantee() {
  return (
    <section className="bg-white py-12 md:py-16" aria-labelledby="early-access-heading">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-blue-200 bg-blue-50/60 text-blue-800 font-semibold mb-4">
          <ShieldCheck className="w-4 h-4" />
          EARLY ACCESS GUARANTEE
        </div>
        <h2 id="early-access-heading" className="text-xl md:text-2xl text-slate-700">
          Here's what we guarantee every early access member:
        </h2>

        <div className="mt-6 md:mt-8">
          <ChevronDown className="w-6 h-6 text-slate-400 mx-auto" aria-hidden="true" />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            "$5,000+ Minimum Pool Size",
            "50% Member Fees To Rewards Pool",
            "40%+ Minimum Member Win Rate",
            "$250+ Minimum Top Reward"
          ].map((label, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-xl px-4 py-4 bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow"
            >
              <div className="font-semibold">{label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
