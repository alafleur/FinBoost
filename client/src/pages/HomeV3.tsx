import React, { useState } from 'react';
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
  Sparkles
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
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 mb-8 leading-[0.95] tracking-tight">
              Take Control of 
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"> Your Money</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 mb-12 max-w-3xl mx-auto font-normal leading-relaxed">
              Learn real financial skills. Take real action. Earn real rewards.
              <span className="block mt-2 text-blue-600 font-semibold">Prize pools are company-boosted during Early Access.</span>
            </p>
            
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
                <span className="font-semibold">Limited to 500 founding members</span>
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
      <section className="py-24 px-4 bg-gradient-to-b from-slate-50 to-white">
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
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight tracking-tight">
              See What Progress
              <span className="block text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text"> Looks Like</span>
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

      {/* How It Works - Modern Process Flow */}
      <section className="py-24 px-4 bg-slate-900 relative overflow-hidden">
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
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight tracking-tight">
              Earn Points and
              <span className="block text-transparent bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text"> Compete for Rewards</span>
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto font-light">
              Four streamlined steps to financial progress and real rewards
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            {[
              {
                icon: <BookOpen className="w-8 h-8" />,
                title: "Learn Modules",
                description: "5–10 mins, earn 10–20 points",
                details: "Complete bite-sized financial lessons on budgeting, debt, investing, and more",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: <Target className="w-8 h-8" />,
                title: "Take Action", 
                description: "Upload proof, earn 50–100 points",
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
                title: "Compete in Cycles",
                description: "Every 2 weeks, reset + win",
                details: "Point totals determine tier placement. Top performers win from the prize pool",
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
                    {/* Step number */}
                    <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-br from-white to-gray-200 rounded-full flex items-center justify-center text-slate-900 font-bold text-sm shadow-lg">
                      {index + 1}
                    </div>
                    
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-6 shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-300`}>
                      <div className="text-white">
                        {step.icon}
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300">
                      {step.title}
                    </h3>
                    
                    <p className="text-blue-300 font-semibold mb-4 text-sm">
                      {step.description}
                    </p>
                    
                    <p className="text-white/70 text-sm leading-relaxed">
                      {step.details}
                    </p>
                  </div>
                </div>
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

      {/* What Makes FinBoost Different - Simplified */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              What Makes FinBoost <span className="text-blue-600">Different</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real rewards for real progress—no gimmicks, just effort-based competition
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="bg-blue-100 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Skill-Based Learning</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Earn points through education and real financial actions, not luck
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="bg-green-100 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Community-Funded Rewards</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Prize pools transparently funded by members and company backing
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="bg-purple-100 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Legally Compliant</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                AMOE structure with free entry options and transparent rules
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonial Placeholder Section */}
      <section className="py-24 px-4 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="bg-white rounded-3xl p-12 shadow-lg border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Real Stories Coming Soon
              </h3>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Join our founding members and be among the first to share your success story. 
                Early Access members will have exclusive opportunities to provide feedback and shape the platform.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto mb-3"></div>
                  <div className="text-xs text-gray-500">Member #001</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto mb-3"></div>
                  <div className="text-xs text-gray-500">Member #002</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mx-auto mb-3"></div>
                  <div className="text-xs text-gray-500">Member #003</div>
                </div>
              </div>
              <Badge className="mt-8 bg-blue-100 text-blue-800 px-4 py-2">
                Be part of our founding story
              </Badge>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA - Ultra Modern Dark Section */}
      <section className="relative py-32 px-4 bg-gradient-to-br from-slate-900 via-blue-900/90 to-indigo-900 overflow-hidden">
        {/* Animated background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-500/5 to-transparent rounded-full"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            {/* Main heading */}
            <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight tracking-tight">
              Join the Movement
              <br />
              <span className="text-transparent bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 bg-clip-text">
                That Rewards Progress
              </span>
            </h2>
            
            <p className="text-lg md:text-xl text-white/70 mb-16 max-w-3xl mx-auto font-normal leading-relaxed">
              FinBoost is where financial education meets real competition. 
              With boosted reward pools and limited Early Access slots, 
              <span className="text-blue-200 font-semibold"> now's the time to join.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 1 }}
                whileTap={{ scale: 0.95 }}
                className="group"
              >
                <Button 
                  size="lg" 
                  className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-12 py-6 text-xl font-bold rounded-2xl shadow-2xl shadow-purple-500/30 border-0 h-auto overflow-hidden group-hover:shadow-purple-500/50 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center">
                    <Zap className="mr-3 h-6 w-6 group-hover:animate-pulse" />
                    Start Earning With FinBoost
                    <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Button>
              </motion.div>
              
              {/* Countdown timer */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4"
              >
                <Clock className="mr-3 h-5 w-5 text-blue-300" />
                <div className="text-left">
                  <div className="text-white font-semibold">Next cycle starts in</div>
                  <div className="text-blue-300 text-lg font-bold">12 days</div>
                </div>
              </motion.div>
            </div>

            {/* Trust indicators */}
            <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
              {[
                { icon: <CheckCircle className="w-5 h-5" />, text: "No credit card required" },
                { icon: <Shield className="w-5 h-5" />, text: "AMOE compliant" },
                { icon: <Users className="w-5 h-5" />, text: "Limited to 500 founding members" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center justify-center text-white/80 bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10"
                >
                  <div className="text-blue-300 mr-3">{item.icon}</div>
                  <span className="font-medium">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}