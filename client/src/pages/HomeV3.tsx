import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
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

function HomeV3() {
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
      <section id="hero" className="relative min-h-screen flex items-center pt-20 sm:pt-16 pb-12 px-6 overflow-hidden">
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

      {/* Simple social proof section */}
      <section id="social-proof" className="py-16 px-4 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <p className="text-lg font-semibold text-green-600 mb-6">
              "More than half of active members win something each cycle."
            </p>
            
            <div className="bg-white rounded-xl shadow-lg p-8 border border-green-100">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-green-600 font-bold text-lg">S</span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Sarah K.</p>
                  <p className="text-sm text-gray-600">Won $285 last cycle</p>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "I was skeptical at first, but FinBoost actually motivated me to pay down $2,000 in credit card debt. 
                The lessons were practical and the reward structure kept me accountable. Winning money for improving my finances felt incredible."
              </p>
            </div>
            
            <p className="text-center text-gray-600 mt-6">
              <Link href="/how-it-works" className="text-blue-600 hover:text-blue-700 underline">
                See full details on how the rewards system works →
              </Link>
            </p>
          </motion.div>
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Company-Guaranteed $5,000 Early Access Pool
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
              At least half of members win from our company-guaranteed $5,000 early access reward pool.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Transparent Economics Section */}
      <section id="economics" className="py-20 px-4 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-6 py-2 mb-6">
              <span className="text-blue-700 font-semibold text-sm">TRANSPARENT ECONOMICS</span>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How Our Collective Fund Works
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed">
              Your $20 monthly membership combines with others to create meaningful rewards for everyone.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id="final-cta" className="py-20 px-4 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6">
              Ready to Turn Learning Into Earning?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of members already building better financial futures together.
            </p>
            <Link
              href="/auth?mode=signup"
              className="inline-block bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-green-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
            >
              Join Early Access - $20/month
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomeV3;
