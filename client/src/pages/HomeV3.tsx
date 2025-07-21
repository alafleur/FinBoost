import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
  Shield,
  BarChart3,
  Lock,
  GraduationCap,
  Timer,
  Award,
  Sparkles,
  CreditCard,
  Calculator,
  ExternalLink,
  AlertTriangle
} from "lucide-react";

export default function HomeV3() {
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  const [communitySize, setCommunitySize] = useState(5000);
  const [rewardsPercentage, setRewardsPercentage] = useState(79);

  // Calculate scaling percentage based on member count (250-10,000+ range)
  useEffect(() => {
    const count = communitySize;
    let percentage;

    if (count <= 250) {
      percentage = 50;
    } else if (count <= 1000) {
      // Scale from 50% to 55% between 250-1k members
      percentage = 50 + ((count - 250) / 750) * 5;
    } else if (count <= 3000) {
      // Scale from 55% to 65% between 1k-3k members
      percentage = 55 + ((count - 1000) / 2000) * 10;
    } else if (count <= 6000) {
      // Scale from 65% to 75% between 3k-6k members
      percentage = 65 + ((count - 3000) / 3000) * 10;
    } else if (count <= 10000) {
      // Scale from 75% to 85% between 6k-10k members
      percentage = 75 + ((count - 6000) / 4000) * 10;
    } else {
      // 85%+ for 10k+ members
      percentage = 85;
    }

    setRewardsPercentage(Math.round(percentage));
  }, [communitySize]);

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

  const calculateRewardsPool = (members: number) => {
    const totalRevenue = members * 20; // Total monthly revenue
    const rewardsAllocation = totalRevenue * (rewardsPercentage / 100); // Dynamic percentage
    return rewardsAllocation;
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {
      return `$${amount}`;
    }
  };

  const formatMembers = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    return count.toString();
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Hero Section - Clean White Design */}
      <section className="relative min-h-screen flex items-center bg-white pt-20 pb-16 px-4">
        {/* Subtle background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-50 rounded-full blur-3xl opacity-40"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center bg-green-50 border border-green-200 rounded-full px-6 py-3 mb-8">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></span>
              <span className="text-green-700 font-semibold">Early Access Now Open</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 mb-8 leading-[0.95] tracking-tight">
              Learn Finance,
              <span className="block text-slate-900"> Win Real Money</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 mb-6 max-w-3xl mx-auto leading-relaxed">
              The only financial education platform where your progress competes for cash rewards.
            </p>
            
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mb-8 max-w-2xl mx-auto border border-green-200">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="w-6 h-6 text-yellow-600 mr-2" />
                <span className="text-lg font-bold text-slate-800">This Cycle's Rewards Pool</span>
              </div>
              <div className="text-3xl font-bold text-green-700 text-center mb-2">$3,000</div>
              <p className="text-sm text-slate-600 text-center">
                <span className="font-semibold text-green-600">Company-boosted</span> during Early Access • Distributed to top performers every 2 weeks
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-5 text-xl font-bold rounded-xl shadow-xl shadow-blue-500/25 border-0 h-auto transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/30"
                >
                  <Trophy className="mr-3 h-6 w-6" />
                  Join Early Access
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </motion.div>
              
              <div className="flex items-center text-slate-600 bg-slate-50 rounded-full px-6 py-3 border border-slate-200 shadow-sm">
                <Users className="mr-2 h-5 w-5" />
                <span className="font-semibold">Early access founding membership is limited</span>
              </div>
            </div>
            
            <p className="text-sm text-white/50 font-normal">
              No purchase necessary • Alternative entry available • AMOE compliant
            </p>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2"></div>
          </div>
        </motion.div>
      </section>

      {/* App Preview - Modern Sleek Design */}
      <section className="py-16 px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-6 py-2 mb-6">
              <span className="text-blue-700 font-semibold text-sm">PLATFORM PREVIEW</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6 leading-tight">
              See What Progress
              <span className="block text-slate-900"> Looks Like</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
              Interactive previews from the FinBoost platform showing your journey to financial rewards
            </p>
          </motion.div>

          {/* Unified Responsive Layout */}
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-16 lg:items-center">
            {/* Phone Preview - Mobile Centered, Desktop Right */}
            <div className="order-1 lg:order-2 flex justify-center lg:justify-start">
              <motion.div
                key={activeScreenshot}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="relative"
              >
                {/* Responsive Phone mockup */}
                <div className="relative w-64 h-[480px] lg:w-80 lg:h-[600px] bg-gradient-to-b from-slate-800 to-slate-900 rounded-[2.5rem] lg:rounded-[3rem] p-2 shadow-xl lg:shadow-2xl shadow-slate-900/50">
                  <div className="w-full h-full bg-white rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden">
                    {/* Status bar */}
                    <div className="bg-slate-50 h-8 lg:h-12 flex items-center justify-between px-4 lg:px-6 text-xs font-medium text-slate-600">
                      <span>9:41</span>
                      <div className="flex space-x-1">
                        <div className="w-3 h-1 lg:w-4 lg:h-2 bg-slate-300 rounded-sm"></div>
                        <div className="w-3 h-1 lg:w-4 lg:h-2 bg-slate-300 rounded-sm"></div>
                        <div className="w-4 h-1 lg:w-6 lg:h-2 bg-green-500 rounded-sm"></div>
                      </div>
                    </div>
                    
                    {/* App content */}
                    <div className="p-4 lg:p-6 bg-gradient-to-br from-blue-50/80 via-white to-purple-50/80 min-h-[calc(100%-2rem)] lg:min-h-[calc(100%-3rem)]">
                      <div className="text-center h-full flex flex-col justify-center">
                        <motion.div
                          key={`icon-${activeScreenshot}`}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="w-14 h-14 lg:w-20 lg:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl lg:rounded-2xl flex items-center justify-center mx-auto mb-4 lg:mb-6 shadow-lg"
                        >
                          {activeScreenshot === 0 && <BookOpen className="w-7 h-7 lg:w-10 lg:h-10 text-white" />}
                          {activeScreenshot === 1 && <CheckCircle className="w-7 h-7 lg:w-10 lg:h-10 text-white" />}
                          {activeScreenshot === 2 && <Trophy className="w-7 h-7 lg:w-10 lg:h-10 text-white" />}
                          {activeScreenshot === 3 && <Zap className="w-7 h-7 lg:w-10 lg:h-10 text-white" />}
                        </motion.div>
                        
                        <motion.div
                          key={`text-${activeScreenshot}`}
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                        >
                          <p className="text-xs lg:text-sm font-semibold text-slate-800 leading-relaxed mb-3 lg:mb-4">
                            {screenshots[activeScreenshot].mockContent}
                          </p>
                          <div className="inline-block bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 lg:px-4 lg:py-2 border border-blue-200/50">
                            <span className="text-xs font-medium text-blue-700">Live Preview Coming Soon</span>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-1 lg:bottom-2 left-1/2 transform -translate-x-1/2 w-24 lg:w-32 h-1 bg-white/30 rounded-full"></div>
                </div>
                
                {/* Floating elements - desktop only */}
                <motion.div
                  className="hidden lg:block absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl shadow-lg"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                  className="hidden lg:block absolute -bottom-4 -left-4 w-8 h-8 bg-gradient-to-br from-pink-400 to-purple-500 rounded-lg shadow-lg"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
            </div>

            {/* Interactive Cards - Mobile Below Phone, Desktop Left */}
            <div className="order-2 lg:order-1">
              {/* Mobile: Horizontal scroll, Desktop: Vertical stack */}
              <div className="lg:space-y-3">
                <div className="flex lg:flex-col space-x-4 lg:space-x-0 lg:space-y-3 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 px-4 lg:px-0">
                  {screenshots.map((screenshot, index) => (
                    <motion.div
                      key={index}
                      className={`flex-shrink-0 w-72 lg:w-full group p-5 lg:p-6 rounded-xl cursor-pointer transition-all duration-300 ${
                        activeScreenshot === index 
                          ? 'bg-white border-2 border-blue-200 shadow-lg shadow-blue-100/50' 
                          : 'bg-white/90 lg:bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-md border border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => setActiveScreenshot(index)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start space-x-3 lg:space-x-4">
                        <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl flex items-center justify-center transition-colors ${
                          activeScreenshot === index 
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                            : 'bg-slate-100 group-hover:bg-slate-200'
                        }`}>
                          {index === 0 && <BookOpen className={`w-5 h-5 lg:w-6 lg:h-6 ${activeScreenshot === index ? 'text-white' : 'text-slate-600'}`} />}
                          {index === 1 && <CheckCircle className={`w-5 h-5 lg:w-6 lg:h-6 ${activeScreenshot === index ? 'text-white' : 'text-slate-600'}`} />}
                          {index === 2 && <Trophy className={`w-5 h-5 lg:w-6 lg:h-6 ${activeScreenshot === index ? 'text-white' : 'text-slate-600'}`} />}
                          {index === 3 && <Zap className={`w-5 h-5 lg:w-6 lg:h-6 ${activeScreenshot === index ? 'text-white' : 'text-slate-600'}`} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base lg:text-lg text-slate-900 mb-1 lg:mb-2">
                            {screenshot.title}
                          </h3>
                          <p className="text-slate-600 text-sm leading-relaxed">
                            {screenshot.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Separator */}
      <div className="h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>

      {/* How It Works - Modern Process Flow */}
      <section className="py-16 px-4 bg-slate-900 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-block bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-white/10 rounded-full px-6 py-2 mb-6">
              <span className="text-blue-300 font-semibold text-sm">HOW IT WORKS</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-6 leading-tight">
              Compete for Cash While
              <span className="block text-white"> Learning Finance</span>
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
              Earn points through financial education. Top performers win real money every 2 weeks.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            {[
              {
                icon: <BookOpen className="w-8 h-8" />,
                title: "Learn Modules",
                description: "3–5 minutes, earn points",
                details: "Complete bite-sized financial lessons on budgeting, debt, investing, and more",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: <Target className="w-8 h-8" />,
                title: "Take Action", 
                description: "Upload proof, earn points",
                details: "Submit proof of debt payments, savings, or other financial actions for bonus points",
                gradient: "from-green-500 to-emerald-500"
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: "Predict Markets",
                description: "Bonus points for accuracy",
                details: "Mid-cycle prediction questions test your financial knowledge for extra points",
                gradient: "from-purple-500 to-violet-500"
              },
              {
                icon: <Trophy className="w-8 h-8" />,
                title: "Win Cash Rewards",
                description: "Top performers split $3,000+",
                details: "Every 2 weeks, highest-scoring members win real money from the collective rewards pool",
                gradient: "from-orange-500 to-red-500"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="relative h-full">
                  {/* Connection line */}
                  {index < 3 && (
                    <div className="hidden lg:block absolute top-20 -right-4 w-8 h-px bg-gradient-to-r from-white/30 to-transparent z-10"></div>
                  )}
                  
                  {/* Card */}
                  <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 h-full transition-all duration-500 group-hover:bg-white/10 group-hover:border-white/20 group-hover:-translate-y-2">                    
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-4 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-300`}>
                          <div className="text-white">
                            {step.icon}
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                        <p className="text-blue-300 font-semibold mb-3 text-sm">{step.description}</p>
                        <p className="text-white/70 text-sm leading-relaxed">{step.details}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual divider */}
      <div className="border-t border-gray-200 my-10" />

      {/* Membership Value Breakdown */}
      <section className="w-full bg-gray-50 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">
              How Your Membership Fuels the Movement
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your membership isn't just a transaction — it's a contribution to a collective effort that drives real financial outcomes.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-4">Education Access</h4>
              <p className="text-gray-600 leading-relaxed">
                You unlock full access to our growing library of financial lessons, quizzes, and real-world action incentives that build genuine financial skills.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-4">Community Rewards Pool</h4>
              <p className="text-gray-600 leading-relaxed">
                Part of every membership funds the rewards pool — meaning your progress helps build rewards for everyone. The bigger the community, the bigger the rewards.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white"
          >
            <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-4">
              <Sparkles className="w-5 h-5 mr-2" />
              <span className="font-semibold">The Investment Effect</span>
            </div>
            <p className="text-lg font-medium leading-relaxed">
              You're not just buying access — you're investing in a system where collective effort drives real financial outcomes.
            </p>
            <p className="text-gray-700 text-center italic mt-6">
              When you invest in yourself, you help reward others doing the same — and they help reward you.
            </p>
          </motion.div>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Your Effort Builds the Community Rewards Pool
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Every member contributes to both their own progress and the rewards pool. 
              During Early Access, FinBoost guarantees a minimum rewards pool amount—even before user growth.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Interactive Controls */}
            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Community Size
                  </label>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatMembers(communitySize)} members
                  </span>
                </div>
                <input
                  type="range"
                  value={communitySize}
                  onChange={(e) => setCommunitySize(parseInt(e.target.value))}
                  max={10000}
                  min={250}
                  step={250}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>250</span>
                  <span>5K</span>
                  <span>10K+</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 sm:p-6 text-center">
                  <div className="text-sm text-blue-600 font-medium mb-1">Rewards Allocation</div>
                  <div className="text-2xl sm:text-3xl font-bold text-blue-700 mb-1">
                    {rewardsPercentage}%
                  </div>
                  <div className="text-xs text-blue-500">of membership fees</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 sm:p-6 text-center">
                  <div className="text-sm text-green-600 font-medium mb-1">Monthly Pool Size</div>
                  <div className="text-xl sm:text-2xl font-bold text-green-700 mb-1">
                    {formatCurrency(calculateRewardsPool(communitySize))}
                  </div>
                  <div className="text-xs text-green-500">available for rewards</div>
                </div>
              </div>

              {/* Early Access Boost */}
              <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                <div className="flex items-center mb-3">
                  <Shield className="w-6 h-6 text-green-600 mr-2" />
                  <h4 className="font-semibold text-green-800">Early Access Boost</h4>
                </div>
                <p className="text-green-700 mb-2">
                  <strong>This cycle's boosted pool: $3,000</strong>
                </p>
                <p className="text-sm text-green-600">
                  (normally {formatCurrency(calculateRewardsPool(500))}) – FinBoost covers the difference during Early Access
                </p>
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
              <div className="space-y-2 text-sm mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>{rewardsPercentage}% → Collective Rewards Pool</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>{100 - rewardsPercentage}% → Education & Platform Operations</span>
                </div>
              </div>

              {/* Top Reward Callout */}
              <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 w-full max-w-sm">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-yellow-800 mb-2">Top Reward</h4>
                  <div className="text-2xl font-bold text-yellow-700 mb-2">
                    {formatCurrency(Math.round(calculateRewardsPool(communitySize) * 0.05))}
                  </div>
                  <p className="text-xs text-yellow-700">
                    5% of rewards pool goes to top performer
                  </p>
                </div>
              </div>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              You're Not Alone — This Is Just the Beginning
            </h2>
            <p className="text-lg leading-relaxed text-gray-700 mb-12 max-w-3xl mx-auto">
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
                  text: "Secure platform with transparent fair play"
                },
                {
                  icon: <DollarSign className="w-6 h-6 text-green-600" />,
                  text: "Rewards pool boosted by FinBoost during Early Access"
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

      {/* Collective Strength Section */}
      <section className="w-full bg-white py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight text-center">
              Collective Strength.
              <span className="block text-gray-900"> Shared Rewards.</span>
            </h2>
            <p className="text-lg leading-relaxed text-gray-700 max-w-3xl mx-auto">
              Individual progress meets collective power. When we grow together, everyone wins bigger.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: <Users className="w-8 h-8 text-blue-600" />,
                title: "Build Together",
                description: "Every member helps grow the rewards pool. More people = bigger rewards for everyone.",
                gradient: "from-blue-500 to-blue-600"
              },
              {
                icon: <BarChart3 className="w-8 h-8 text-purple-600" />,
                title: "Scale Impact",
                description: "Small individual actions create large shared outcomes through collective momentum.",
                gradient: "from-purple-500 to-purple-600"
              },
              {
                icon: <Target className="w-8 h-8 text-pink-600" />,
                title: "Win More Often",
                description: "Every cycle gives more people a shot at rewards. The collective creates more opportunities.",
                gradient: "from-pink-500 to-pink-600"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 group hover:-translate-y-2"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${item.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-gray-900 to-blue-900 rounded-3xl p-8 text-center text-white relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
            <div className="relative z-10">
              <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-6">
                <Sparkles className="w-5 h-5 mr-2" />
                <span className="font-semibold">The FinBoost Effect</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-semibold mb-4">
                Small individual efforts → Large shared outcomes
              </h3>
              <p className="text-lg text-white/80 max-w-2xl mx-auto">
                It's financial momentum, powered by the collective. Join the movement that turns personal progress into community rewards.
              </p>
            </div>
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              More Than Half of Members Earn Rewards Each Cycle
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Users are placed in tiers based on points. Each tier has a portion of the rewards pool 
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
                    <h3 className="text-2xl font-semibold text-gray-900 mb-1">
                      {tier.tier}
                    </h3>
                    <p className="text-gray-600 mb-3">{tier.subtitle}</p>
                    <div className={`text-3xl font-bold text-${tier.textColor} mb-2`}>
                      {tier.poolShare}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">of rewards pool</p>
                    <p className="text-sm text-gray-700">
                      {tier.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="space-y-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6 text-center">
                <h4 className="text-lg font-semibold text-blue-800 mb-3">
                  How Tier Distribution Works
                </h4>
                <div className="text-left text-blue-700 space-y-3 max-w-2xl mx-auto">
                  <p>• Top third of point earners receive ~50% of the pool</p>
                  <p>• Middle third share ~35% of the pool</p>
                  <p>• Bottom third share ~15% — yes, even new learners can win</p>
                </div>
                <p className="mt-4 font-medium text-blue-800">
                  At least half of active members receive rewards every cycle.
                </p>
              </CardContent>
            </Card>
            
            <div className="bg-yellow-100 border-l-4 border-yellow-400 p-6 rounded-md text-yellow-900 text-center">
              <p className="mb-4"><strong>Founding Member Advantage:</strong> For a limited time, FinBoost is boosting every rewards pool with company contributions. Smaller competition + guaranteed rewards = your best shot at early wins.</p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-bold rounded-xl shadow-lg border-0 h-auto transition-all duration-300"
                >
                  <Trophy className="mr-2 h-5 w-5" />
                  Sign Up for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Why FinBoost Exists - Card Format */}
      <section className="w-full bg-gray-50 py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why FinBoost Exists
            </h2>
            <p className="text-lg leading-relaxed text-gray-700 max-w-3xl mx-auto">
              Bridging the gap between financial knowledge and real action
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-red-400"
            >
              <div className="bg-red-50 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">The Problem</h3>
              <p className="text-gray-600">
                Most people know what they should do with money—but stress, debt, and daily pressures make it hard to follow through.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-yellow-400"
            >
              <div className="bg-yellow-50 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">The Reality</h3>
              <p className="text-gray-600">
                Millions are buried in debt. Many worry they'll never be ready for retirement. Financial advice is everywhere, but it rarely leads to action.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-blue-400"
            >
              <div className="bg-blue-50 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Our Solution</h3>
              <p className="text-gray-600">
                FinBoost was built for that gap—the space between knowing and doing. We reward real actions: paying down debt, building savings, showing up consistently.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-green-400"
            >
              <div className="bg-green-50 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Our Mission</h3>
              <p className="text-gray-600">
                Make financial progress not just possible, but motivating. When you grow, you earn. When the community grows, we all win.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Learning Module Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Build Better Money Habits That Actually Stick
            </h2>
            <p className="text-lg leading-relaxed text-gray-700 max-w-3xl mx-auto mb-8">
              Learn practical financial skills through bite-sized lessons designed to fit into your daily routine.
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium">
              Most members start seeing progress in their first month
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h3 className="text-2xl font-semibold text-gray-900 text-center mb-12">
              What You'll Master:
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="bg-blue-50 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-800 mb-3">
                  Improve Your Credit Score with Smart Strategies
                </h4>
                <p className="text-gray-600 text-sm">
                  Learn the tactics that have helped thousands boost their scores
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="bg-blue-50 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                  <Calculator className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-800 mb-3">
                  Create a Budget That Actually Fits Your Life
                </h4>
                <p className="text-gray-600 text-sm">
                  Practical approaches that work even on tight budgets
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="bg-blue-50 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-800 mb-3">
                  Accelerate Your Debt Payoff with Smart Planning
                </h4>
                <p className="text-gray-600 text-sm">
                  Strategic methods to save on interest and get debt-free sooner
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="bg-blue-50 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold text-gray-800 mb-3">
                  Start Investing Even with Small Amounts
                </h4>
                <p className="text-gray-600 text-sm">
                  Simple, low-risk ways to begin building wealth
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Learning Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-8 mb-12"
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-gray-700 text-sm font-medium">3-5 minute lessons</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <span className="text-gray-700 text-sm font-medium">Interactive quizzes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
              <span className="text-gray-700 text-sm font-medium">Real-world applications</span>
            </div>
          </motion.div>

          {/* Preview Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
              Preview a Lesson
              <ExternalLink className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      </section>


      {/* Final CTA - Strong Blue Background */}
      <section className="bg-blue-600 text-white py-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
              Ready to Take Control of Your Financial Future?
            </h2>
            <p className="text-lg leading-relaxed text-white/90 mb-8 max-w-3xl mx-auto">
              Join FinBoost today and turn your effort into rewards — with real stakes, real skills, and collective power behind you.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                className="bg-white text-blue-600 font-semibold py-3 px-8 text-lg rounded-xl hover:bg-gray-100 transition-all duration-300 border-0 h-auto shadow-lg"
              >
                <Trophy className="mr-2 h-5 w-5" />
                Get Early Access Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}