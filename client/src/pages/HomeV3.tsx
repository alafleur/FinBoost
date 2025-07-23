import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
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
  const [location, navigate] = useLocation();
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  const [communitySize, setCommunitySize] = useState(5000);
  const [rewardsPercentage, setRewardsPercentage] = useState(79);
  
  const handleJoinEarlyAccess = () => {
    // Set URL search params and navigate
    const url = new URL('/auth', window.location.origin);
    url.searchParams.set('mode', 'signup');
    navigate(url.pathname + url.search);
  };

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
      
      {/* Hero Section - Enhanced with Animated Gradient */}
      <section id="hero" className="relative min-h-screen flex items-center pt-16 pb-12 px-6 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-50/20 to-purple-50/20 animate-pulse" style={{ animationDuration: '4s' }}></div>
        </div>
        
        {/* Enhanced floating background elements */}
        <div className="absolute inset-0">
          <motion.div 
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-100/40 to-cyan-100/30 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          ></motion.div>
          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-100/40 to-pink-100/30 rounded-full blur-3xl"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          ></motion.div>
          <motion.div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-green-100/20 to-blue-100/20 rounded-full blur-2xl"
            animate={{ 
              rotate: [0, 180, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 12,
              repeat: Infinity,
              ease: "linear"
            }}
          ></motion.div>
        </div>
        
        <div className="relative max-w-7xl mx-auto text-center z-10">

          
          {/* Staggered headline animation */}
          <div className="mb-8 md:mb-10 pb-2">
            <motion.h1 
              className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-tight md:leading-[1.15] lg:leading-[1.1] tracking-tight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <motion.span
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                className="inline-block"
              >
                Turn Financial Stress into
              </motion.span>
              <motion.span 
                className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 pb-1"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
              >
                Financial Progress – Together
              </motion.span>
            </motion.h1>
          </div>
          
          <motion.p 
            className="text-base md:text-xl text-slate-600 mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0, ease: "easeOut" }}
          >
            Earn real cash rewards for building real financial habits. Your progress isn't just tracked — it's rewarded.
          </motion.p>
          

          
          {/* Enhanced CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-6 md:gap-8 justify-center items-center mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4, ease: "easeOut" }}
          >
            <motion.div 
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(59, 130, 246, 0.4)"
              }} 
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              {/* Enhanced glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
              <Button 
                size="lg" 
                className="relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 md:px-10 py-4 md:py-5 text-lg md:text-xl font-bold rounded-xl shadow-xl shadow-blue-500/25 border-0 h-auto transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/40"
                onClick={handleJoinEarlyAccess}
              >
                <Trophy className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6" />
                Join Early Access
                <ArrowRight className="ml-2 md:ml-3 h-5 w-5 md:h-6 md:w-6" />
              </Button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1.6, ease: "easeOut" }}
              className="flex items-center text-slate-600 bg-white/80 backdrop-blur-sm rounded-full px-4 md:px-6 py-2 md:py-3 border border-slate-200 shadow-lg"
            >
              <Users className="mr-2 h-4 w-4 md:h-5 md:w-5" />
              <span className="font-semibold text-sm md:text-base">Early access membership is limited</span>
            </motion.div>
          </motion.div>
          
          {/* Winning Stats */}
          <motion.div
            className="text-center mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.8, ease: "easeOut" }}
          >
            <p className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 px-4">
              At least half of members win from our company-guaranteed $5,000 early access reward pool.
            </p>
          </motion.div>
          

        </div>
        

      </section>

      {/* Why FinBoost Exists - Card Format */}
      <section id="why" className="py-20 px-4 bg-slate-900 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
        </div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-white/10 rounded-full px-6 py-2 mb-6">
              <span className="text-blue-300 font-semibold text-sm">OUR PURPOSE</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Why FinBoost Exists
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 border-l-4 border-l-red-400 hover:bg-white/15 transition-all duration-300"
            >
              <h3 className="text-xl font-semibold text-white mb-3">The Gap Others Miss</h3>
              <p className="text-white/70">
                Budgeting apps track spending. Financial courses teach theory. But neither motivates real action. Most people know what to do with money—they just need accountability to actually do it.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 border-l-4 border-l-green-400 hover:bg-white/15 transition-all duration-300"
            >
              <h3 className="text-xl font-semibold text-white mb-3">The FinBoost Difference</h3>
              <p className="text-white/70">
                We're not another app or course. We're a community competition where your learning funds rewards pool providing you with an opportunity to take home significant cash rewards.
              </p>
            </motion.div>
          </div>
          
          {/* Legal disclaimer */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-sm text-white/50 font-normal">
              No purchase necessary • Alternative entry available • AMOE compliant
            </p>
          </motion.div>
        </div>
      </section>

      {/* App Preview - Modern Sleek Design */}
      <section id="preview" className="py-20 px-4 bg-gradient-to-b from-slate-50 to-white">
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
                

              </motion.div>
            </div>

            {/* Interactive Cards - Mobile Below Phone, Desktop Left */}
            <div className="order-2 lg:order-1">
              {/* Mobile instruction hint */}
              <div className="lg:hidden text-center mb-4">
                <div className="inline-flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium border border-blue-200">
                  <span className="mr-2">👆</span>
                  Tap cards to preview different features
                </div>
              </div>
              
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
                          <div className="flex items-center justify-between mb-1 lg:mb-2">
                            <h3 className="font-semibold text-base lg:text-lg text-slate-900">
                              {screenshot.title}
                            </h3>
                            {/* Mobile chevron indicator */}
                            <div className={`lg:hidden w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                              activeScreenshot === index 
                                ? 'bg-blue-100' 
                                : 'bg-slate-100 group-hover:bg-slate-200'
                            }`}>
                              <ArrowRight className={`w-3 h-3 transition-colors ${
                                activeScreenshot === index ? 'text-blue-600' : 'text-slate-400'
                              }`} />
                            </div>
                          </div>
                          <p className="text-slate-600 text-sm leading-relaxed">
                            {screenshot.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Mobile navigation dots */}
                <div className="lg:hidden flex justify-center space-x-2 mt-6">
                  {screenshots.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveScreenshot(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        activeScreenshot === index 
                          ? 'bg-blue-600 w-8' 
                          : 'bg-slate-300 hover:bg-slate-400'
                      }`}
                      aria-label={`View ${screenshots[index].title}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* How Real People Win Real Rewards - Dedicated Section */}
      <section id="rewards" className="py-20 px-4 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block bg-gradient-to-r from-green-100 to-emerald-100 rounded-full px-6 py-2 mb-6">
              <span className="text-green-700 font-semibold text-sm">REWARDS BREAKDOWN</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How You Learn, Earn, and Win
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Compete. Win. Get paid. Every cycle, real money rewards go to the top performers and active members.
            </p>
          </motion.div>

          {/* Learn → Earn → Win Visual Progression */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">📘 Learn</h3>
              <p className="text-gray-600">Complete lessons, take quizzes, and upload proof of real financial actions</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-10 h-10 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">📈 Earn Points</h3>
              <p className="text-gray-600">Points determine your tier and odds of winning. More points = better chances</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">🏆 Win Rewards</h3>
              <p className="text-gray-600">Cash prizes distributed every 2 weeks. Top prizes can reach into the thousands</p>
            </motion.div>
          </div>

          {/* Rewards Details */}
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Card className="h-full bg-white border-2 border-green-200 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <Trophy className="w-8 h-8 text-green-600 mr-3" />
                    <h3 className="text-2xl font-bold text-gray-900">Reward Structure</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span className="text-gray-700">Earn points from lessons, actions, and predictions</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span className="text-gray-700">Compete every 2 weeks</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span className="text-gray-700">Points = your odds</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span className="text-gray-700">Top prizes reach into the thousands per cycle</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span className="text-gray-700">Company-boosted rewards pools during Early Access</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <Users className="w-8 h-8 text-blue-600 mr-3" />
                    <h3 className="text-2xl font-bold text-gray-900">Sample Leaderboard</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-yellow-100 rounded-lg p-4 border-l-4 border-yellow-500">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-800">Sarah: 240 pts → Tier 1</span>
                        <span className="font-bold text-green-600">Wins $500</span>
                      </div>
                    </div>
                    <div className="bg-blue-100 rounded-lg p-4 border-l-4 border-blue-500">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-800">Alex: 110 pts → Tier 2</span>
                        <span className="font-bold text-green-600">Wins $75</span>
                      </div>
                    </div>
                    <div className="bg-green-100 rounded-lg p-4 border-l-4 border-green-500">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-800">Mike: 10 pts → Tier 3</span>
                        <span className="font-bold text-green-600">Wins $10</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-4 text-center font-medium">
                    More than half of active members receive rewards every cycle
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Early Access Winner Guarantees Section */}
      <section id="guarantees" className="py-20 px-4 bg-white relative overflow-hidden">
        {/* Subtle background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-green-50 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-40"></div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block bg-gradient-to-r from-green-100 to-yellow-100 rounded-full px-6 py-2 mb-6">
              <span className="text-green-700 font-semibold text-sm">🚀 EARLY ACCESS EXCLUSIVE</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Guaranteed Minimums for Top Rewards
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
              To kick things off, FinBoost is guaranteeing <span className="font-semibold text-green-600">$5,000</span> in total rewards during the first cycle. 
              That includes minimum guaranteed payouts for the top 5 performers—selected through our hybrid point-weighted draw system.
            </p>
          </motion.div>

          {/* Guaranteed Winners Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-12">
            {[
              { position: "1st", amount: "$500+" },
              { position: "2nd", amount: "$300+" },
              { position: "3rd", amount: "$200+" },
              { position: "4th", amount: "$150+" },
              { position: "5th", amount: "$100+" }
            ].map((winner, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="bg-white rounded-xl p-4 md:p-6 shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                  <div className="text-center">
                    <p className="font-semibold text-gray-800 text-sm md:text-base mb-2">
                      {winner.position}
                    </p>
                    <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                      {winner.amount}
                    </div>
                    <div className="w-8 h-1 bg-gradient-to-r from-gray-200 to-gray-300 rounded mx-auto"></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Key Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="flex justify-center mb-8"
          >
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 max-w-2xl">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Top Guaranteed Minimums</h3>
                  <p className="text-gray-700">These amounts are locked in regardless of pool size. You could win more, but not less.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Member Win Rate Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex justify-center mb-12"
          >
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200 max-w-2xl">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">High Win Rate</h3>
                  <p className="text-gray-700">
                    At least half of all active members will receive rewards every cycle.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* CTA and Legal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-8 border border-yellow-200 mb-6">
              <p className="text-lg font-semibold text-gray-900 mb-4">
                <span className="text-yellow-600">⚡ Limited Time:</span> Minimum reward guarantees are exclusive to Early Access members
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-4 text-base md:text-lg font-bold rounded-xl shadow-lg border-0 h-auto transition-all duration-300 leading-tight"
                  onClick={() => window.location.href = '/auth?mode=signup'}
                >
                  <Trophy className="mr-2 h-5 w-5 md:h-6 md:w-6 flex-shrink-0" />
                  <span className="text-center">
                    Join Now While Rewards<br className="md:hidden" /> Are Guaranteed
                  </span>
                  <ArrowRight className="ml-2 h-5 w-5 md:h-6 md:w-6 flex-shrink-0" />
                </Button>
              </motion.div>
            </div>
            
            <p className="text-sm text-gray-500">
              Minimum guarantees currently apply to the first cycle only.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How It Works - Modern Process Flow */}
      <section id="how-it-works" className="py-20 px-4 bg-slate-900 relative overflow-hidden">
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
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
              Compete for Cash While
              <span className="block text-white"> Learning Finance</span>
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
              Earn points through financial education. Half of members win real money every 2 weeks.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            {[
              {
                icon: <BookOpen className="w-8 h-8" />,
                title: "Lesson Modules",
                description: "3–5 minutes, earn points",
                details: "Complete bite-sized financial lessons on budgeting, debt, investing, and more",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: <Target className="w-8 h-8" />,
                title: "Take Financial Action", 
                description: "Upload proof, earn points",
                details: "Submit proof of debt payments, savings, or other financial actions for bonus points",
                gradient: "from-green-500 to-emerald-500"
              },
              {
                icon: <TrendingUp className="w-8 h-8" />,
                title: "Real World Bonus Questions",
                description: "Bonus points for accuracy",
                details: "Mid-cycle prediction questions test your financial knowledge for extra points",
                gradient: "from-purple-500 to-violet-500"
              },
              {
                icon: <Trophy className="w-8 h-8" />,
                title: "Win Cash Rewards",
                description: "Point-weighted winner selection",
                details: "Every 2 weeks, half of members win real money from the rewards pool with top rewards into the hundreds or even thousands",
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
      <section id="membership" className="w-full bg-gray-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-block bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-6 py-2 mb-6">
              <span className="text-blue-700 font-semibold text-sm">MEMBERSHIP VALUE</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-6">
              How Your Membership Fuels the Movement
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your membership isn't just a transaction — it's a contribution to a collective effort that drives real financial outcomes.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-white mb-4">Financial Modules</h4>
              <p className="text-white/90 leading-relaxed">
                You unlock full access to our growing library of financial lessons, quizzes, and real-world action incentives that build genuine financial skills.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-white mb-4">Rewards Pool</h4>
              <p className="text-white/90 leading-relaxed">
                Part of every membership funds the rewards pool — meaning your progress helps build rewards for everyone. The bigger the community, the bigger the rewards.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Reward Pool Mechanics - Show Real Impact */}
      <section id="pool-mechanics" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-block bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-6 py-2 mb-6">
              <span className="text-blue-700 font-semibold text-sm">STRENGTH IN NUMBERS</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Toggle the Dial to See the Power of the Collective
            </h2>
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
          
          {/* Disclaimer */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              * Rewards pool statistics shown are illustrative and based on projected membership levels.
            </p>
          </div>
        </div>
      </section>

      {/* Reward Tiers Explainer */}
      <section id="tiers" className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-block bg-gradient-to-r from-green-100 to-yellow-100 rounded-full px-6 py-2 mb-6">
              <span className="text-green-700 font-semibold text-sm">TIER SYSTEM</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Half of Members Earn Rewards Each Cycle
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Users are placed in tiers based on points. The more you learn, the more you earn. Points aren't just for progress — they increase your chances at real cash rewards. At the end of each cycle, members with more points are eligible for larger potential payouts. Winners are selected based on point-weighted random draws.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {[
              {
                tier: "Tier 1",
                subtitle: "Top Third",
                rewardLevel: "Premium rewards"
              },
              {
                tier: "Tier 2", 
                subtitle: "Middle Third",
                rewardLevel: "Standard rewards"
              },
              {
                tier: "Tier 3",
                subtitle: "Lower Third", 
                rewardLevel: "Base rewards"
              }
            ].map((tier, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-2 border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <CardContent className="p-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 relative">
                    <div className="relative z-10">
                      <h3 className="text-2xl font-semibold text-white mb-1">
                        {tier.tier}
                      </h3>
                      <p className="text-white/90 mb-3">{tier.subtitle} = {tier.rewardLevel}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Caption below tier boxes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <p className="text-lg font-semibold text-gray-700">
              Higher effort → Higher tier → Larger rewards
            </p>
          </motion.div>

          <div className="text-center mt-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-bold rounded-xl shadow-lg border-0 h-auto transition-all duration-300"
                onClick={handleJoinEarlyAccess}
              >
                <Trophy className="mr-2 h-5 w-5" />
                Join Early Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Learning Module Section - Enhanced Design */}
      <section id="learn" className="py-20 px-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-200/20 rounded-full blur-xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-blue-100/10 to-purple-100/10 rounded-full blur-2xl"></div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block bg-gradient-to-r from-blue-600/10 to-purple-600/10 backdrop-blur-sm border border-blue-200 rounded-full px-6 py-2 mb-6">
              <span className="text-blue-700 font-semibold text-sm">FINANCIAL EDUCATION</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Build Better Money Habits That Actually Stick
            </h2>
            <p className="text-lg leading-relaxed text-gray-700 max-w-3xl mx-auto">
              Learn practical financial skills through bite-sized lessons designed to fit into your daily routine.
            </p>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {/* Left Column - What You'll Master */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="mb-8"
              >
                <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center lg:text-left">
                  What You'll Master:
                </h3>
              </motion.div>
              
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  {
                    icon: <CreditCard className="h-6 w-6" />,
                    title: "Improve Your Credit Score with Smart Strategies",
                    description: "Learn the tactics that have helped thousands boost their scores",
                    gradient: "from-blue-500 to-cyan-500",
                    bgGradient: "from-blue-50 to-cyan-50"
                  },
                  {
                    icon: <Calculator className="h-6 w-6" />,
                    title: "Create a Budget That Actually Fits Your Life", 
                    description: "Practical approaches that work even on tight budgets",
                    gradient: "from-green-500 to-emerald-500",
                    bgGradient: "from-green-50 to-emerald-50"
                  },
                  {
                    icon: <DollarSign className="h-6 w-6" />,
                    title: "Accelerate Your Debt Payoff with Smart Planning",
                    description: "Strategic methods to save on interest and get debt-free sooner",
                    gradient: "from-orange-500 to-red-500",
                    bgGradient: "from-orange-50 to-red-50"
                  },
                  {
                    icon: <TrendingUp className="h-6 w-6" />,
                    title: "Start Investing Even with Small Amounts",
                    description: "Simple, low-risk ways to begin building wealth",
                    gradient: "from-purple-500 to-violet-500", 
                    bgGradient: "from-purple-50 to-violet-50"
                  }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className={`bg-gradient-to-br ${item.bgGradient} border border-white/60 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 backdrop-blur-sm`}
                  >
                    <div className={`bg-gradient-to-r ${item.gradient} rounded-xl w-12 h-12 flex items-center justify-center mb-4 shadow-lg`}>
                      <div className="text-white">
                        {item.icon}
                      </div>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-3 leading-tight">
                      {item.title}
                    </h4>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {item.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right Column - Learning Features & Preview */}
            <div className="space-y-8">
              {/* Learning Features Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl p-6 shadow-lg"
              >
                <h4 className="text-lg font-bold text-gray-900 mb-6 text-center">
                  Learning Experience
                </h4>
                <div className="space-y-4">
                  {[
                    { icon: "⏱️", text: "3-5 minute lessons", color: "bg-green-100 text-green-700" },
                    { icon: "🧩", text: "Interactive quizzes", color: "bg-blue-100 text-blue-700" },
                    { icon: "🎯", text: "Real-world applications", color: "bg-purple-100 text-purple-700" }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${feature.color} rounded-lg flex items-center justify-center text-lg font-medium`}>
                        {feature.icon}
                      </div>
                      <span className="text-gray-700 font-medium">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Preview CTA Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl"
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-bold mb-3">Try Before You Join</h4>
                  <p className="text-white/90 mb-6 text-sm leading-relaxed">
                    Experience our interactive lesson format with a free preview
                  </p>
                  <Button
                    className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-2 px-6 rounded-xl transition-all duration-300 border-0 h-auto shadow-lg w-full"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Preview a Lesson
                  </Button>
                </div>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl p-6 shadow-lg"
              >
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 mb-1">25+</div>
                    <div className="text-xs text-gray-600 font-medium">Learning Modules</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600 mb-1">5min</div>
                    <div className="text-xs text-gray-600 font-medium">Average Lesson</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>


      {/* Final CTA - Strong Blue Background */}
      <section id="cta" className="bg-blue-600 text-white py-20 px-6 text-center">
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
                onClick={() => window.location.href = '/auth?mode=signup'}
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