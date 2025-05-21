import { Users } from "lucide-react";
import { motion } from "framer-motion";
import RewardSteps from "./RewardSteps";

export default function PowerOfCollective() {
  // No tiers needed anymore since we removed the reward pool growth section

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50" id="power-of-collective">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">
            <span className="text-primary-500">💪</span> The Power of the Collective
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            The more members who join, the larger the monthly rewards pool.
            <br />
            <span className="font-medium">Real people. Real money. Real financial progress.</span>
          </p>
        </div>

        <div className="mt-6">
          <h3 className="text-2xl font-semibold text-center mb-8">How Our Reward System Works</h3>
          <RewardSteps />
        </div>
      </div>
    </section>
  );
}