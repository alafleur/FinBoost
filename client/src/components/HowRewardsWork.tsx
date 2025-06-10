import { DollarSign, BarChart3, TrendingUp, Users } from "lucide-react";
import MembershipGrowthChart from "./MembershipGrowthChart";

export default function HowRewardsWork() {
  return (
    <section className="py-16 px-4 bg-gradient-to-b from-blue-50/70 to-white" id="how-rewards-work">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-10">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">
            How Rewards Work
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Learn how our point system and monthly reward distribution creates value for everyone.
          </p>
        </div>

        

        <MembershipGrowthChart />
      </div>
    </section>
  );
}