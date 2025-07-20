import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  TrendingUp, 
  Users, 
  Trophy,
  Clock,
  DollarSign,
  Star,
  CheckCircle,
  ArrowRight,
  Target,
  Zap,
  Shield
} from "lucide-react";

export default function HomeV3() {
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  const [prizePoolUsers, setPrizePoolUsers] = useState(500);

  // Mock app screenshots data
  const screenshots = [
    {
      title: "Learning Progress Dashboard",
      description: "Track your progress through financial modules with clear point totals and completion rates",
      mockContent: "Dashboard showing 4 of 8 lessons complete, 285 total points, Tier 2 status"
    },
    {
      title: "Quiz Completion & Points",
      description: "Earn immediate points for completing quizzes and demonstrating knowledge",
      mockContent: "Quiz complete screen: +15 points earned, streak bonus +5, total: 20 points"
    },
    {
      title: "Reward Tiers & Cycle Progress",
      description: "See your tier placement and cycle progress with clear reward potential",
      mockContent: "Tier 2 status, 67 points this cycle, 14 days remaining, $118 tier pool"
    },
    {
      title: "Daily Streak Tracker",
      description: "Build momentum with daily learning streaks and bonus point multipliers",
      mockContent: "7-day streak active, 2x point multiplier, next lesson worth 20 points"
    }
  ];

  const calculatePrizePool = (users: number) => {
    const basePool = users * 20 * 0.55; // $20 subscription * 55% pool allocation
    return basePool;
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section - Emotional + Aspirational Hook */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pt-20 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Take Control of Your Money.
              <span className="text-blue-600"> Get Rewarded For It.</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Learn real financial skills. Take real action. Earn real rewards. 
              <span className="font-semibold text-blue-600"> Early Access is limited and prize pools are company-boosted.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg">
                <Trophy className="mr-2 h-5 w-5" />
                Join Early Access
              </Button>
              <Badge variant="secondary" className="text-sm px-4 py-2">
                <Users className="mr-1 h-4 w-4" />
                First 500 members shape the platform
              </Badge>
            </div>
            <p className="text-sm text-gray-500 italic">
              No purchase necessary. Alternative entry available.
            </p>
          </motion.div>
        </div>
      </section>

      {/* App Preview - Show It, Don't Just Say It */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              See What Progress Looks Like
            </h2>
            <p className="text-xl text-gray-600">
              Real screenshots from the FinBoost platform showing your path to rewards
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Screenshot Navigation */}
            <div className="space-y-4">
              {screenshots.map((screenshot, index) => (
                <motion.div
                  key={index}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    activeScreenshot === index 
                      ? 'bg-blue-50 border-2 border-blue-200' 
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                  onClick={() => setActiveScreenshot(index)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">
                    {screenshot.title}
                  </h3>
                  <p className="text-gray-600">
                    {screenshot.description}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Mock Screenshot Display */}
            <div className="relative">
              <motion.div
                key={activeScreenshot}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-gradient-to-br from-blue-500 to-purple-600 p-8 rounded-2xl shadow-2xl"
              >
                <div className="bg-white rounded-lg p-6 min-h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      {activeScreenshot === 0 && <BookOpen className="w-8 h-8 text-blue-600" />}
                      {activeScreenshot === 1 && <CheckCircle className="w-8 h-8 text-green-600" />}
                      {activeScreenshot === 2 && <Trophy className="w-8 h-8 text-yellow-600" />}
                      {activeScreenshot === 3 && <Zap className="w-8 h-8 text-orange-600" />}
                    </div>
                    <p className="text-lg font-medium text-gray-800">
                      {screenshots[activeScreenshot].mockContent}
                    </p>
                    <Badge className="mt-4">
                      Live Preview Coming Soon
                    </Badge>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Interactive Process Explainer */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How You Earn Points and Compete for Rewards
            </h2>
            <p className="text-xl text-gray-600">
              Four simple steps to financial progress and real rewards
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <BookOpen className="w-8 h-8" />,
                title: "Learn Modules",
                description: "5–10 mins, earn 10–20 points",
                details: "Complete bite-sized financial lessons on budgeting, debt, investing, and more",
                color: "blue"
              },
              {
                icon: <Target className="w-8 h-8" />,
                title: "Take Action", 
                description: "Upload proof, earn 50–100 points",
                details: "Submit proof of debt payments, savings, or other financial actions for bonus points",
                color: "green"
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: "Predict Markets",
                description: "Bonus points for accuracy",
                details: "Mid-cycle prediction questions test your financial knowledge for extra points",
                color: "purple"
              },
              {
                icon: <Trophy className="w-8 h-8" />,
                title: "Compete in Cycles",
                description: "Every 2 weeks, reset + win",
                details: "Point totals determine tier placement. Top performers win from the prize pool",
                color: "orange"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 group">
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 rounded-full bg-${step.color}-100 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      <div className={`text-${step.color}-600`}>
                        {step.icon}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">
                      {step.title}
                    </h3>
                    <p className={`text-${step.color}-600 font-medium mb-3`}>
                      {step.description}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {step.details}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reward Pool Mechanics - Show Real Impact */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Your Effort Builds the Community Prize Pool
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every member contributes to both their own progress and the prize pool. 
              During Early Access, FinBoost guarantees a minimum prize pool amount—even before user growth.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Dynamic Calculator */}
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-xl font-semibold mb-4">Prize Pool Calculator</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Members</label>
                    <input
                      type="range"
                      min="100"
                      max="1000"
                      step="100"
                      value={prizePoolUsers}
                      onChange={(e) => setPrizePoolUsers(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>100</span>
                      <span className="font-medium">{prizePoolUsers} users</span>
                      <span>1,000</span>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      ${calculatePrizePool(prizePoolUsers).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      Monthly prize pool ({prizePoolUsers} × $20 × 55%)
                    </div>
                  </div>
                </div>
              </div>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center mb-3">
                    <Shield className="w-6 h-6 text-green-600 mr-2" />
                    <h4 className="font-semibold text-green-800">Early Access Boost</h4>
                  </div>
                  <p className="text-green-700 mb-2">
                    <strong>This cycle's boosted pool: $3,000</strong>
                  </p>
                  <p className="text-sm text-green-600">
                    (normally $1,440) – FinBoost covers the difference during Early Access
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Visual Examples */}
            <div className="space-y-4">
              {[
                { users: 100, pool: 1100, boost: 1900 },
                { users: 500, pool: 5500, boost: 0 },
                { users: 1000, pool: 11000, boost: 0 }
              ].map((example, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="p-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {example.users} users
                        </div>
                        <div className="text-sm text-gray-600">
                          Community size
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">
                          ${(example.pool + example.boost).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          {example.boost > 0 && (
                            <span className="text-green-600">
                              +${example.boost.toLocaleString()} boost
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Trust Section */}
      <section className="py-16 px-4 bg-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              You're Not Alone — This Is Just the Beginning
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              FinBoost is launching with a founding group of a few hundred users ready to take control of their money. 
              Be part of shaping the future of financial progress.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  icon: <CheckCircle className="w-6 h-6 text-green-600" />,
                  text: "Real financial education, not gimmicks"
                },
                {
                  icon: <Shield className="w-6 h-6 text-blue-600" />,
                  text: "Built for compliance (AMOE + skill-based rewards)"
                },
                {
                  icon: <DollarSign className="w-6 h-6 text-green-600" />,
                  text: "Prize pool boosted by FinBoost during Early Access"
                },
                {
                  icon: <Star className="w-6 h-6 text-yellow-600" />,
                  text: "Transparent and fair tier-based system"
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center space-x-3 text-left"
                >
                  {item.icon}
                  <span className="text-gray-700 font-medium">{item.text}</span>
                </motion.div>
              ))}
            </div>

            <Card className="mt-12 bg-white border-2 border-blue-200">
              <CardContent className="p-6">
                <Badge className="mb-4 bg-blue-600">
                  <Users className="w-4 h-4 mr-1" />
                  Founding Member Benefits
                </Badge>
                <p className="text-lg font-medium text-gray-900">
                  First 500 members shape the platform + earn early rewards
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Reward Tiers Explainer */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              More Than Half of Members Earn Rewards Each Cycle
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Users are placed in tiers based on points. Each tier has a portion of the prize pool 
              and winners are selected based on point-weighted random draws.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                tier: "Tier 1",
                subtitle: "Top Third",
                poolShare: "50%",
                description: "Highest point earners with best odds",
                color: "yellow",
                textColor: "yellow-800"
              },
              {
                tier: "Tier 2", 
                subtitle: "Middle Third",
                poolShare: "35%",
                description: "Consistent performers with solid chances",
                color: "gray",
                textColor: "gray-800"
              },
              {
                tier: "Tier 3",
                subtitle: "Lower Third", 
                poolShare: "15%",
                description: "Early learners still earning rewards",
                color: "orange",
                textColor: "orange-800"
              }
            ].map((tier, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className={`h-full border-2 border-${tier.color}-200 hover:shadow-lg transition-shadow`}>
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 rounded-full bg-${tier.color}-100 flex items-center justify-center mx-auto mb-4`}>
                      <Trophy className={`w-8 h-8 text-${tier.color}-600`} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">
                      {tier.tier}
                    </h3>
                    <p className="text-gray-600 mb-3">{tier.subtitle}</p>
                    <div className={`text-3xl font-bold text-${tier.textColor} mb-2`}>
                      {tier.poolShare}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">of prize pool</p>
                    <p className="text-sm text-gray-700">
                      {tier.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6 text-center">
              <h4 className="text-lg font-semibold text-blue-800 mb-2">
                Point-Weighted Selection
              </h4>
              <p className="text-blue-700">
                More points = better odds, but everyone in a tier has a shot. 
                It's skill-based competition, not pure luck.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA - Scarcity & Movement */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Join the Movement That Rewards Financial Progress
            </h2>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-2xl mx-auto">
              FinBoost is where financial education meets real competition. 
              With boosted reward pools and limited Early Access slots, now's the time to join.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl">
                <Zap className="mr-2 h-5 w-5" />
                Start Earning With FinBoost
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <div className="flex items-center text-white/80">
                <Clock className="mr-2 h-5 w-5" />
                <span>Next cycle starts in 12 days</span>
              </div>
            </div>

            <div className="flex justify-center items-center space-x-8 text-sm opacity-75">
              <div className="flex items-center">
                <CheckCircle className="mr-1 h-4 w-4" />
                No credit card required
              </div>
              <div className="flex items-center">
                <Shield className="mr-1 h-4 w-4" />
                AMOE compliant
              </div>
              <div className="flex items-center">
                <Users className="mr-1 h-4 w-4" />
                Limited to 500 founding members
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}