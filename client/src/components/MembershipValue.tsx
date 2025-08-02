import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Gift, Users, TrendingUp } from "lucide-react";
import { Slider } from "@/components/ui/slider";

export default function MembershipValue() {
  const [memberCount, setMemberCount] = useState([5000]);
  const [rewardsPercentage, setRewardsPercentage] = useState(50);
  const [rewardPoolSize, setRewardPoolSize] = useState(0);

  // Calculate scaling percentage based on member count
  useEffect(() => {
    const count = memberCount[0];
    let percentage;

    if (count <= 1000) {
      percentage = 50;
    } else if (count <= 10000) {
      // Scale from 50% to 60% between 1k-10k members
      percentage = 50 + ((count - 1000) / 9000) * 10;
    } else if (count <= 25000) {
      // Scale from 60% to 70% between 10k-25k members
      percentage = 60 + ((count - 10000) / 15000) * 10;
    } else if (count <= 50000) {
      // Scale from 70% to 75% between 25k-50k members
      percentage = 70 + ((count - 25000) / 25000) * 5;
    } else if (count <= 100000) {
      // Scale from 75% to 80% between 50k-100k members
      percentage = 75 + ((count - 50000) / 50000) * 5;
    } else {
      // 80%+ for 100k+ members
      percentage = 80 + Math.min(((count - 100000) / 100000) * 5, 5);
    }

    setRewardsPercentage(Math.round(percentage));

    // Calculate reward pool size ($20 monthly fee per member)
    const totalRevenue = count * 20;
    const poolSize = Math.round(totalRevenue * (percentage / 100));
    setRewardPoolSize(poolSize);
  }, [memberCount]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyMobile = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-blue-50/30" id="membership-value">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">
            Strength in Numbers
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto mb-6">
            Every membership dollar, 50¢ goes directly back to members as rewards.
            <br />
            <span className="font-medium text-primary-600">Real people. Real money. Real financial progress.</span>
          </p>
          
          {/* Membership Fee Breakdown - Integrated with Descriptions */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-4xl mx-auto">
            <div className="text-center mb-4">
              <span className="text-gray-600 font-medium">Your $20/month membership delivers:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 bg-blue-500 rounded mt-1"></div>
                <div>
                  <span className="font-medium text-blue-700 block mb-1">Learn</span>
                  <p className="text-sm text-blue-600">Access to high-quality, bite-sized financial education that fits into your busy life.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 bg-green-500 rounded mt-1"></div>
                <div>
                  <span className="font-medium text-green-700 block mb-1">Earn</span>
                  <p className="text-sm text-green-600">Monthly chance to receive real cash rewards, with top rewards reaching thousands of dollars.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-8">
          {/* Centered heading */}
        <div className="text-center mb-8">
          <h3 className="text-lg font-bold text-gray-700">Toggle the dial to see the power of the collective</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Interactive Controls */}
            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary-600" />
                    Community Size
                  </label>
                  <span className="text-2xl font-bold text-primary-600">
                    {formatNumber(memberCount[0])} members
                  </span>
                </div>
                <Slider
                  value={memberCount}
                  onValueChange={setMemberCount}
                  max={150000}
                  min={1000}
                  step={1000}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>1K</span>
                  <span>75K</span>
                  <span>150K+</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg p-4 sm:p-6 text-center">
                  <div className="text-sm text-primary-600 font-medium mb-1">Member Rewards</div>
                  <div className="text-2xl sm:text-3xl font-bold text-primary-700 mb-1">
                    {rewardsPercentage}% Guarantee
                  </div>
                  <div className="text-xs text-primary-500">back to members</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 sm:p-6 text-center">
                  <div className="text-sm text-green-600 font-medium mb-1">Monthly Pool Size</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-700 mb-1">
                    <span className="hidden sm:inline">{formatCurrency(rewardPoolSize)}</span>
                    <span className="sm:hidden">{formatCurrencyMobile(rewardPoolSize)}</span>
                  </div>
                  <div className="text-xs text-green-500">available for rewards</div>
                </div>
              </div>
            </div>

            {/* Dynamic Donut Chart */}
            <div className="flex flex-col items-center">
              <div className="relative w-64 h-64 mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="10"
                  />
                  {/* Rewards percentage */}
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="10"
                    strokeDasharray={`${rewardsPercentage * 2.199} ${(100 - rewardsPercentage) * 2.199}`}
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "109.95 109.95" }}
                    animate={{ strokeDasharray: `${rewardsPercentage * 2.199} ${(100 - rewardsPercentage) * 2.199}` }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                  {/* Operations percentage */}
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="35"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="10"
                    strokeDasharray={`${(100 - rewardsPercentage) * 2.199} ${rewardsPercentage * 2.199}`}
                    strokeDashoffset={`-${rewardsPercentage * 2.199}`}
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "109.95 109.95" }}
                    animate={{ 
                      strokeDasharray: `${(100 - rewardsPercentage) * 2.199} ${rewardsPercentage * 2.199}`,
                      strokeDashoffset: `-${rewardsPercentage * 2.199}`
                    }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold text-gray-800">$20</div>
                  <div className="text-sm text-gray-500">monthly membership</div>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>{rewardsPercentage}% → Member Rewards Guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>{100 - rewardsPercentage}% → Education & Platform Operations</span>
                </div>
              </div>
            </div>
          </div>
        </div>



        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            <em>* Figures shown are illustrative projections based on community growth scenarios</em>
          </p>
        </div>
      </div>
    </section>
  );
}