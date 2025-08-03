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
  ArrowRight,
  Target,
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
  AlertTriangle,
  BadgeDollarSign,
  PiggyBank,
  CheckCircle
} from "lucide-react";

export default function HomeV3() {
  const [location, navigate] = useLocation();
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
        <div className="absolute inset-0 bg-gradient-to-br from-white via-accent-light/10 to-accent-light/20">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-accent-light/10 to-accent-light/15 animate-pulse" style={{ animationDuration: '4s' }}></div>
        </div>
        
        {/* Enhanced floating background elements */}
        <div className="absolute inset-0">
          <motion.div 
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-accent-light/20 to-accent-light/15 rounded-full blur-3xl"
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
            className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-accent-light/20 to-accent-light/15 rounded-full blur-3xl"
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
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-accent-light/15 to-accent-light/20 rounded-full blur-2xl"
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
                className="block gradient-text pb-1"
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
            Join bi-weekly cycles where you complete short financial lessons and actions to earn points. Compete with other members to win your share of the prize pool — the more points you earn, the better your odds.
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
              <div className="absolute -inset-1 bg-accent rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
              <Button 
                size="lg" 
                className="relative btn-primary px-6 md:px-10 py-4 md:py-5 text-lg md:text-xl font-bold rounded-xl shadow-xl border-0 h-auto"
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
            <p className="text-lg font-semibold gradient-text px-4">
              At least half of members win from our company-guaranteed $5,000 early access reward pool.
            </p>
          </motion.div>
          

        </div>
        

      </section>

      {/* How It Works - Modern Process Flow */}
      <section id="how-it-works" className="py-20 px-4 bg-slate-900 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent-light to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent to-transparent"></div>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-block bg-accent-light/20 backdrop-blur-sm border border-white/10 rounded-full px-6 py-2 mb-6">
              <span className="text-accent-light font-semibold text-sm">HOW IT WORKS</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
              How It Works
              <span className="block text-white">(and How You Win)</span>
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
              Earn points through financial education. Half of members win real money every 2 weeks.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {[
              {
                icon: <BookOpen className="w-8 h-8" />,
                title: "Learn Financial Skills",
                description: "Complete short lessons and quizzes to build practical knowledge. Topics include budgeting, credit, debt, investing, and more. Earn points per module and quiz.",
                screenshot: "lesson-module.png",
                caption: "Complete short lessons like this to earn 20 points.",
                gradient: "from-accent to-accent-light"
              },
              {
                icon: <Target className="w-8 h-8" />,
                title: "Take Real Financial Actions", 
                description: "Submit proof of real-world financial actions — like paying down debt, increasing savings, or building a budget. Earn bonus points based on impact.",
                screenshot: "debt-submission.png",
                caption: "Verified debt payments earn big bonus points.",
                gradient: "from-accent to-accent-light"
              },
              {
                icon: <Trophy className="w-8 h-8" />,
                title: "Compete for Cash Rewards",
                description: "Points determine your reward odds — the more you learn and take action, the better your chances. Winners are selected using a point-weighted system.",
                screenshot: "leaderboard.png",
                caption: "Your point total determines your odds — the top contributors win real cash.",
                gradient: "from-accent to-accent-light"
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
                  {index < 2 && (
                    <div className="hidden lg:block absolute top-20 -right-4 w-8 h-px bg-gradient-to-r from-white/30 to-transparent z-10"></div>
                  )}
                  
                  {/* Card */}
                  <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-6 h-full transition-all duration-500 group-hover:bg-white/10 group-hover:border-white/20 group-hover:shadow-lg hover:-translate-y-1">                    
                    <div className="flex flex-col h-full">
                      <div className="flex items-start space-x-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center font-bold text-lg shadow-lg flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                          <p className="text-white/70 text-sm leading-relaxed">{step.description}</p>
                        </div>
                      </div>
                      
                      {/* Screenshot placeholder - mobile portrait format */}
                      <div className="bg-white/10 border border-white/20 rounded-xl p-4 mb-4 flex-grow">
                        <div className="h-[400px] w-full bg-white/5 rounded-lg flex items-center justify-center text-white/50 text-sm font-medium shadow-sm overflow-hidden">
                          <img 
                            src={`/api/placeholder/${step.screenshot}`} 
                            alt={`FinBoost ${step.title.toLowerCase()} screenshot`}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<span class="text-white/50 text-sm font-medium">${step.screenshot}</span>`;
                              }
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Caption - consistently styled with improved spacing */}
                      <p className="text-blue-300 text-sm text-center font-medium leading-relaxed px-2 mt-6">
                        {step.caption}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Leaderboard Screenshot - Phase 3 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-24"
          >
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/8 backdrop-blur-sm border border-white/15 rounded-2xl p-6 md:p-8 shadow-2xl">
                {/* Screenshot placeholder - mobile portrait format */}
                <div className="bg-white/10 border border-white/20 rounded-xl p-4 mb-6">
                  <div className="h-[400px] max-w-xs mx-auto bg-white/5 rounded-lg flex items-center justify-center text-white/50 text-sm font-medium shadow-sm overflow-hidden">
                    <img 
                      src="/api/placeholder/leaderboard-screenshot.png" 
                      alt="FinBoost leaderboard screenshot showing member rankings and cash rewards"
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<span class="text-white/50 text-sm font-medium">leaderboard-screenshot.png</span>';
                        }
                      }}
                    />
                  </div>
                </div>
                
                {/* Supporting caption with improved spacing */}
                <p className="text-accent-light text-sm text-center font-medium leading-relaxed mb-4 mt-6">
                  Your points determine your spot on the leaderboard — and your shot at real cash rewards.
                </p>
                
                {/* Reward reinforcement line */}
                <p className="text-white/70 text-xs text-center font-medium">
                  More than half of active members receive rewards each cycle.
                </p>
              </div>
            </div>
          </motion.div>
          
        </div>
      </section>

      {/* Why FinBoost Isn't Just Another Finance App - Refined Platform Overview Format */}
      <section id="trust" className="bg-gradient-to-b from-white via-slate-50 to-white py-16 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block bg-accent-light/20 backdrop-blur-sm border border-accent-light/30 rounded-full px-6 py-2 mb-6">
              <span className="text-accent font-semibold text-sm">OUR DIFFERENCE</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Why FinBoost Isn't Just Another Finance App
            </h2>
          </motion.div>

          {/* Grid Layout - Exact Platform Overview structure with hover effects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: <PiggyBank className="w-6 h-6 text-accent" />,
                title: "Debt Progress Pays",
                description: "Student loans, credit cards — every payment forward earns you money back.",
                borderColor: "border-l-accent"
              },
              {
                icon: <BarChart3 className="w-6 h-6 text-accent" />,
                title: "Rising Costs Reality", 
                description: "Everything costs more, saving feels impossible. Small wins add up to real rewards.",
                borderColor: "border-l-accent"
              },
              {
                icon: <Clock className="w-6 h-6 text-accent" />,
                title: "Worrying About Retirement, Not Just Next Month",
                description: "FinBoost isn't just about surviving the month — it's about building momentum toward long-term goals like retirement, homeownership, and freedom from paycheck-to-paycheck stress.",
                borderColor: "border-l-accent"
              },
              {
                icon: <TrendingUp className="w-6 h-6 text-accent" />,
                title: "Beyond Daily Tracking",
                description: "Most apps focus on today's spending. We reward steps toward tomorrow's security.",
                borderColor: "border-l-accent"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`bg-white rounded-xl border-2 border-accent/20 ${item.borderColor} border-l-4 p-6 hover:shadow-md transition-all duration-300 space-y-2`}
              >
                <div className="flex items-start space-x-4">
                  <div className="bg-accent-light/20 p-3 rounded-full">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900">{item.title}</h4>
                    <p className="text-muted-foreground text-sm">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Soft Footer Transition */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-12"
          >
            <p className="text-center text-base text-slate-500 max-w-xl mx-auto">
              Whether you're just starting out or already budgeting, FinBoost meets you where you are — and helps you level up.
            </p>
          </motion.div>
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
            <div className="inline-block bg-accent-light/20 backdrop-blur-sm border border-accent-light/30 rounded-full px-6 py-2 mb-6">
              <span className="text-accent font-semibold text-sm">MEMBERSHIP VALUE</span>
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
              className="card-premium rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-all duration-300"
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
              className="card-premium rounded-2xl p-8 text-white shadow-lg hover:shadow-xl transition-all duration-300"
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
      <section id="pool-mechanics" className="py-20 px-4 bg-gradient-to-br from-accent-light/10 to-accent-light/20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-block bg-accent-light/20 backdrop-blur-sm border border-accent-light/30 rounded-full px-6 py-2 mb-6">
              <span className="text-accent font-semibold text-sm">STRENGTH IN NUMBERS</span>
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
                    <Users className="h-5 w-5 text-accent" />
                    Community Size
                  </label>
                  <span className="text-2xl font-bold text-accent">
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
                  className="w-full h-2 bg-accent-light/30 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>250</span>
                  <span>5K</span>
                  <span>10K+</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-accent-light/20 to-accent-light/30 rounded-lg p-4 sm:p-6 text-center">
                  <div className="text-sm text-accent font-medium mb-1">Rewards Allocation</div>
                  <div className="text-2xl sm:text-3xl font-bold text-accent mb-1">
                    {rewardsPercentage}%
                  </div>
                  <div className="text-xs text-accent-light">of membership fees</div>
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
                    stroke="var(--accent)"
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
                  <div className="w-4 h-4 bg-accent rounded"></div>
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
            <div className="inline-block bg-accent-light/20 backdrop-blur-sm border border-accent-light/30 rounded-full px-6 py-2 mb-6">
              <span className="text-accent font-semibold text-sm">TIER SYSTEM</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Half of Members Earn Rewards Each Cycle
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Users are placed in tiers based on points. The more you learn, the more you earn. Points aren't just for progress — they increase your chances at real cash rewards. At the end of each cycle, members with more points are eligible for larger potential payouts. Winners are selected based on point-weighted random draws.
            </p>
          </motion.div>

          {/* Two-column layout: Tier explanation left, Screenshot right */}
          <div className="flex flex-col lg:flex-row gap-8 mb-12 items-start">
            {/* Left Column - Tier Cards */}
            <div className="flex-1">
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    tier: "Tier 1",
                    subtitle: "Top Third",
                    rewardLevel: "Premium Rewards"
                  },
                  {
                    tier: "Tier 2", 
                    subtitle: "Middle Third",
                    rewardLevel: "Standard Rewards"
                  },
                  {
                    tier: "Tier 3",
                    subtitle: "Lower Third", 
                    rewardLevel: "Base Rewards"
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
                      <CardContent className="p-6 text-center bg-gradient-to-r from-blue-700 to-blue-900 relative">
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
                className="text-center mt-6"
              >
                <p className="text-lg font-semibold text-gray-700">
                  Higher Effort → Higher Tier → Larger Rewards
                </p>
              </motion.div>
            </div>

            {/* Right Column - Screenshot */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="lg:w-80 w-full"
            >
              <div className="bg-white/60 backdrop-blur-sm border border-white/80 rounded-xl p-4 shadow-lg">
                <div className="h-[400px] w-full bg-white/10 rounded-lg flex items-center justify-center text-gray-500 text-sm font-medium shadow-sm overflow-hidden">
                  <img 
                    src="/api/placeholder/tier-dashboard.png" 
                    alt="FinBoost user dashboard showing tier rankings and point boundaries"
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<span class="text-gray-500 text-sm font-medium">tier-dashboard.png</span>';
                      }
                    }}
                  />
                </div>
                <p className="text-center text-sm text-gray-600 mt-4 font-medium leading-relaxed">
                  See where you rank and how your points place you into reward tiers.
                </p>
              </div>
            </motion.div>
          </div>

          <div className="text-center mt-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                className="card-premium-button text-white px-8 py-3 text-lg font-bold rounded-xl shadow-lg border-0 h-auto transition-all duration-300"
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
      <section id="learn" className="py-20 px-4 bg-gradient-to-br from-slate-50 via-accent-light/10 to-accent-light/15 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-accent-light/15 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-accent-light/15 rounded-full blur-xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-accent-light/10 to-accent-light/15 rounded-full blur-2xl"></div>
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
            <div className="inline-block bg-gradient-to-r from-blue-600/10 to-blue-800/10 backdrop-blur-sm border border-blue-200 rounded-full px-6 py-2 mb-6">
              <span className="text-blue-700 font-semibold text-sm">FINANCIAL EDUCATION</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Build Better Money Habits That Actually Stick
            </h2>
            <p className="text-lg leading-relaxed text-gray-700 max-w-3xl mx-auto">
              Learn practical financial skills through bite-sized lessons designed to fit into your daily routine.
            </p>
          </motion.div>

          {/* Two-column layout: Screenshot left, Content right */}
          <div className="flex flex-col lg:flex-row gap-8 mb-16 items-start">
            {/* Left Column - Screenshot */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="lg:w-80 w-full lg:flex-shrink-0"
            >
              <div className="bg-white/60 backdrop-blur-sm border border-white/80 rounded-xl p-4 shadow-lg">
                <div className="h-[400px] w-full max-w-[250px] mx-auto bg-white/10 rounded-lg flex items-center justify-center text-gray-500 text-sm font-medium shadow-sm overflow-hidden">
                  <img 
                    src="/api/placeholder/lesson-quiz.png" 
                    alt="FinBoost lesson module with interactive quiz in progress"
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = '<span class="text-gray-500 text-sm font-medium">lesson-quiz.png</span>';
                      }
                    }}
                  />
                </div>
                <p className="text-center text-sm text-gray-600 mt-4 font-medium leading-relaxed">
                  Complete bite-sized lessons and quizzes like this to earn points and level up.
                </p>
              </div>
            </motion.div>

            {/* Right Column - What You'll Master */}
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
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
                    gradient: "from-accent to-accent-light",
                    bgGradient: "from-accent-light/20 to-accent-light/30"
                  },
                  {
                    icon: <Calculator className="h-6 w-6" />,
                    title: "Create a Budget That Actually Fits Your Life", 
                    description: "Practical approaches that work even on tight budgets",
                    gradient: "from-accent to-accent-light",
                    bgGradient: "from-accent-light/20 to-accent-light/30"
                  },
                  {
                    icon: <DollarSign className="h-6 w-6" />,
                    title: "Accelerate Your Debt Payoff with Smart Planning",
                    description: "Strategic methods to save on interest and get debt-free sooner",
                    gradient: "from-accent to-accent-light",
                    bgGradient: "from-accent-light/20 to-accent-light/30"
                  },
                  {
                    icon: <TrendingUp className="h-6 w-6" />,
                    title: "Start Investing Even with Small Amounts",
                    description: "Simple, low-risk ways to begin building wealth",
                    gradient: "from-accent to-accent-light", 
                    bgGradient: "from-accent-light/20 to-accent-light/30"
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
              
              {/* Learning Features moved inside right column */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="bg-white/60 backdrop-blur-sm border border-white/80 rounded-2xl p-6 shadow-lg mt-8"
              >
                <h4 className="text-lg font-bold text-gray-900 mb-6 text-center lg:text-left">
                  Learning Experience
                </h4>
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { icon: "⏱️", text: "3-5 minute lessons", color: "bg-accent-light/30 text-accent" },
                    { icon: "🧩", text: "Interactive quizzes", color: "bg-accent-light/30 text-accent" },
                    { icon: "🎯", text: "Real-world applications", color: "bg-accent-light/30 text-accent" }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${feature.color} rounded-lg flex items-center justify-center text-lg font-medium flex-shrink-0`}>
                        {feature.icon}
                      </div>
                      <span className="text-gray-700 font-medium text-sm">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>


      {/* Final CTA - Strong Blue Background */}
      <section id="cta" className="bg-accent text-white py-20 px-6 text-center">
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
                className="btn-secondary py-3 px-8 text-lg rounded-xl border-0 h-auto shadow-lg"
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