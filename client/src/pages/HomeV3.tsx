import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQ from "@/components/FAQ";
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
  ShieldCheck,
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
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Upload,
  Home,
  Zap,
  Eye,
  Smartphone,
} from "lucide-react";

// Import high-resolution app screenshots for crisp display
// Original fallback screenshots (341×612)
import step1Screenshot from "@assets/Step 1 Learn & Complete Lessons_v1_1755745601876.png";
import step2Screenshot from "@assets/Step 2 Take Financial Actions_v1_1755745601875.png";
import step3Screenshot from "@assets/Step 3 Climb the Leaderboard_v1_1755745601874.png";
import step4Screenshot from "@assets/Step 4 Win Real Cash Rewards_v1_1755745601873.png";

// Pixel-perfect screenshots for zero blur rendering
// Mobile: 240×431 (1×), 480×862 (2×)
// Desktop: 304×547 (1×), 608×1094 (2×)
import step1_m240 from "@/assets/screenshots/step1_m240.png";
import step1_m480 from "@/assets/screenshots/step1_m480.png";
import step1_s304 from "@/assets/screenshots/step1_s304.png";  
import step1_s608 from "@/assets/screenshots/step1_s608.png";
import step2_m240 from "@/assets/screenshots/step2_m240.png";
import step2_m480 from "@/assets/screenshots/step2_m480.png";
import step2_s304 from "@/assets/screenshots/step2_s304.png";
import step2_s608 from "@/assets/screenshots/step2_s608.png";
import step3_m240 from "@/assets/screenshots/step3_m240.png";
import step3_m480 from "@/assets/screenshots/step3_m480.png";
import step3_s304 from "@/assets/screenshots/step3_s304.png";
import step3_s608 from "@/assets/screenshots/step3_s608.png";
import step4_m240 from "@/assets/screenshots/step4_m240.png";
import step4_m480 from "@/assets/screenshots/step4_m480.png";
import step4_s304 from "@/assets/screenshots/step4_s304.png";
import step4_s608 from "@/assets/screenshots/step4_s608.png";

// Hero Components
import EarlyAccessGuarantee from "@/components/EarlyAccessGuarantee";
import rewardsSystemScreenshot from "@assets/Tiers 1_1755745601872.png";

/**
 * Carousel state management interface
 */
interface CarouselState {
  currentStep: number;
  isAutoPlaying: boolean;
  isPaused: boolean;
  hasUserInteracted: boolean;
}

/**
 * Custom hook for carousel state management with comprehensive controls
 */
function useCarouselState(
  totalSteps: number,
  autoAdvanceInterval: number = 5000,
) {
  const [state, setState] = useState<CarouselState>({
    currentStep: 0,
    isAutoPlaying: false,
    isPaused: false,
    hasUserInteracted: false,
  });

  // Navigation functions with comprehensive error handling, analytics, and bounds checking
  const goToStep = useCallback(
    (stepIndex: number) => {
      // Input validation
      if (typeof stepIndex !== "number" || isNaN(stepIndex)) {
        console.error(
          `Invalid step index type: ${typeof stepIndex}. Expected number.`,
        );
        return;
      }

      if (stepIndex < 0 || stepIndex >= totalSteps) {
        console.warn(
          `Invalid step index: ${stepIndex}. Must be between 0 and ${totalSteps - 1}`,
        );
        return;
      }

      try {
        setState((prev) => {
          // Analytics tracking
          if (typeof window !== "undefined" && window.gtag) {
            window.gtag("event", "carousel_navigate", {
              event_category: "engagement",
              from_step: prev.currentStep,
              to_step: stepIndex,
              navigation_type: "direct",
              total_steps: totalSteps,
            });
          }

          return {
            ...prev,
            currentStep: stepIndex,
            hasUserInteracted: true,
            isPaused: true, // Pause auto-advance when user interacts
          };
        });
      } catch (error) {
        console.error("Error navigating to step:", error);
      }
    },
    [totalSteps],
  );

  const nextStep = useCallback(() => {
    try {
      setState((prev) => {
        const nextStepIndex = (prev.currentStep + 1) % totalSteps;

        // Analytics tracking
        if (typeof window !== "undefined" && window.gtag) {
          window.gtag("event", "carousel_navigate", {
            event_category: "engagement",
            from_step: prev.currentStep,
            to_step: nextStepIndex,
            navigation_type: "next",
            total_steps: totalSteps,
          });
        }

        return {
          ...prev,
          currentStep: nextStepIndex,
          hasUserInteracted: true,
          isPaused: true,
        };
      });
    } catch (error) {
      console.error("Error navigating to next step:", error);
    }
  }, [totalSteps]);

  const prevStep = useCallback(() => {
    try {
      setState((prev) => {
        const prevStepIndex =
          prev.currentStep === 0 ? totalSteps - 1 : prev.currentStep - 1;

        // Analytics tracking
        if (typeof window !== "undefined" && window.gtag) {
          window.gtag("event", "carousel_navigate", {
            event_category: "engagement",
            from_step: prev.currentStep,
            to_step: prevStepIndex,
            navigation_type: "previous",
            total_steps: totalSteps,
          });
        }

        return {
          ...prev,
          currentStep: prevStepIndex,
          hasUserInteracted: true,
          isPaused: true,
        };
      });
    } catch (error) {
      console.error("Error navigating to previous step:", error);
    }
  }, [totalSteps]);

  const toggleAutoPlay = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isAutoPlaying: !prev.isAutoPlaying,
      isPaused: false,
    }));
  }, []);

  const pauseAutoPlay = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPaused: true,
    }));
  }, []);

  const resumeAutoPlay = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPaused: false,
    }));
  }, []);

  // Auto-advance logic with proper cleanup and error handling
  useEffect(() => {
    if (!state.isAutoPlaying || state.isPaused || state.hasUserInteracted) {
      return;
    }

    let interval: NodeJS.Timeout;

    try {
      interval = setInterval(() => {
        setState((prev) => {
          const nextStep = (prev.currentStep + 1) % totalSteps;

          // Analytics tracking for auto-advance
          if (typeof window !== "undefined" && window.gtag) {
            window.gtag("event", "carousel_auto_advance", {
              event_category: "engagement",
              current_step: prev.currentStep,
              next_step: nextStep,
              total_steps: totalSteps,
            });
          }

          return {
            ...prev,
            currentStep: nextStep,
          };
        });
      }, autoAdvanceInterval);
    } catch (error) {
      console.error("Error setting up carousel auto-advance:", error);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [
    state.isAutoPlaying,
    state.isPaused,
    state.hasUserInteracted,
    totalSteps,
    autoAdvanceInterval,
  ]);

  // Performance monitoring for state changes
  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Log performance metrics for optimization
      if (duration > 100) {
        // Only log if state update took longer than 100ms
        console.warn(`Carousel state update took ${duration.toFixed(2)}ms`);
      }
    };
  }, [state.currentStep]);

  return {
    currentStep: state.currentStep,
    isAutoPlaying: state.isAutoPlaying,
    isPaused: state.isPaused,
    hasUserInteracted: state.hasUserInteracted,
    goToStep,
    nextStep,
    prevStep,
    toggleAutoPlay,
    pauseAutoPlay,
    resumeAutoPlay,
  };
}

// Master Topics Component with responsive design
interface Topic {
  icon: React.ReactNode;
  title: string;
}

interface MasterTopicsSectionProps {
  topics: Topic[];
}

const MasterTopicsSection: React.FC<MasterTopicsSectionProps> = ({
  topics,
}) => {
  // Set initial scroll position to show 2.5 rows on desktop
  useEffect(() => {
    const container = document.getElementById("lessons-scroll-container");
    if (container && window.innerWidth >= 768) {
      // Scroll to show half of the third row (2.5 rows) on desktop only
      // Each row is ~140px (120px card + 16px gap + 4px padding)
      container.scrollTop = 70; // Half of third row
    }
  }, []);

  const handleScrollUp = () => {
    const container = document.getElementById("lessons-scroll-container");
    if (container) {
      const scrollAmount = window.innerWidth >= 768 ? 140 : 120;
      container.scrollBy({ top: -scrollAmount, behavior: "smooth" });
    }
  };

  const handleScrollDown = () => {
    const container = document.getElementById("lessons-scroll-container");
    if (container) {
      const scrollAmount = window.innerWidth >= 768 ? 140 : 120;
      container.scrollBy({ top: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="relative">
        {/* Instruction text */}
        <p className="text-sm text-slate-600 text-center mb-4 px-4">
          Scroll up/down to navigate example lessons
        </p>

        {/* Container with enhanced glass morphism */}
        <div className="bg-white/70 backdrop-blur-xl border border-slate-200/80 hover:border-blue-200/60 rounded-2xl p-4 shadow-xl hover:shadow-2xl transition-all duration-500">
          {/* Responsive lesson cards container */}
          <div
            id="lessons-scroll-container"
            className="overflow-y-auto scrollbar-hide relative mx-2 h-80 md:h-96"
          >
            <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-4 md:gap-4 pb-4">
              {topics.map((topic, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.05, // Unified animation delay
                    ease: [0.25, 0.25, 0.25, 1],
                  }}
                  viewport={{ once: true, margin: "-50px" }}
                  whileHover={{ 
                    y: window.innerWidth >= 768 ? -6 : 0, 
                    scale: window.innerWidth >= 768 ? 1.03 : 1.02 
                  }}
                  className="group p-4 rounded-xl bg-gradient-to-br from-white via-white to-blue-50/20 backdrop-blur-lg hover:bg-gradient-to-br hover:from-white hover:to-blue-50/40 hover:shadow-2xl border border-slate-200/60 hover:border-blue-300/80 transition-all duration-500 relative overflow-hidden md:cursor-pointer min-h-[100px] md:min-h-[120px]"
                >
                  {/* Subtle background gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 to-purple-500/3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="relative z-10 flex items-center space-x-3">
                    <motion.div
                      className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 transition-all duration-300 flex-shrink-0 shadow-lg relative group"
                      whileHover={{ scale: window.innerWidth >= 768 ? 1.15 : 1.1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      {/* Enhanced icon glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-purple-500 rounded-lg blur-md opacity-40 md:opacity-50 group-hover:opacity-60 md:group-hover:opacity-70 transition-opacity duration-300"></div>
                      <motion.div
                        className="text-white relative z-10 text-sm"
                        whileHover={{ 
                          rotate: window.innerWidth >= 768 ? 8 : 5, 
                          scale: window.innerWidth >= 768 ? 1.1 : 1 
                        }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        {topic.icon}
                      </motion.div>
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-semibold text-slate-900 leading-tight group-hover:text-slate-800 transition-colors duration-300">
                        {topic.title}
                      </h4>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Top and Bottom fade gradients */}
          <div className="absolute top-4 left-4 right-4 h-6 bg-gradient-to-b from-white/70 to-transparent pointer-events-none z-10"></div>
          <div className="absolute bottom-4 left-4 right-4 h-6 bg-gradient-to-t from-white/70 to-transparent pointer-events-none z-10"></div>

          {/* Responsive Navigation Controls */}
          {/* Mobile: Bottom center buttons */}
          <div className="md:hidden flex items-center justify-center space-x-4 mt-4">
            <motion.button
              onClick={handleScrollUp}
              className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white flex items-center justify-center shadow-lg hover:shadow-2xl transition-all duration-300"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Scroll up through lessons"
            >
              <ChevronUp className="w-4 h-4" />
            </motion.button>
            <motion.button
              onClick={handleScrollDown}
              className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white flex items-center justify-center shadow-lg hover:shadow-2xl transition-all duration-300"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Scroll down through lessons"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Desktop: Right side vertical buttons */}
          <div className="hidden md:flex absolute top-1/2 right-2 transform -translate-y-1/2 flex-col space-y-3">
            <motion.button
              onClick={handleScrollUp}
              className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white flex items-center justify-center shadow-lg hover:shadow-2xl transition-all duration-300"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Scroll up through lessons"
            >
              <ChevronUp className="w-4 h-4" />
            </motion.button>
            <motion.button
              onClick={handleScrollDown}
              className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white flex items-center justify-center shadow-lg hover:shadow-2xl transition-all duration-300"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Scroll down through lessons"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
        {/* Desktop instruction text */}
        <p className="hidden md:block text-sm text-slate-600 text-center mt-4 px-4">
          Scroll up/down to navigate example lessons
        </p>
      </div>
    </div>
  );
};

export default function HomeV3() {
  const [location, navigate] = useLocation();
  const [communitySize, setCommunitySize] = useState(5000);
  const [rewardsPercentage, setRewardsPercentage] = useState(79);
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  
  // Default to your previous frame ratio (320×600 → 600/320)
  const [imgRatio, setImgRatio] = useState(600 / 320); // height / width

  // How It Works step-by-step process data with high-resolution app screenshots
  const screenshots = useMemo(
    () => [
      {
        title: "Step 1: Learn & Complete Lessons",
        description:
          "Complete easily digestible lessons and quizzes to earn pool tickets and build your knowledge",
        screenshotPath: step1Screenshot,  // 341×612 fallback
        // Pixel-perfect assets for zero blur
        m240: step1_m240,  // 240×431 mobile 1×
        m480: step1_m480,  // 480×862 mobile 2×
        s304: step1_s304,  // 304×547 desktop 1×
        s608: step1_s608,  // 608×1094 desktop 2×
        icon: <BookOpen className="w-7 h-7 lg:w-10 lg:h-10 text-white" />,
      },
      {
        title: "Step 2: Take Financial Actions",
        description:
          "Get rewarded for making sound financial decisions. Upload proof of debt payments to earn more tickets",
        screenshotPath: step2Screenshot,
        m240: step2_m240,
        m480: step2_m480,
        s304: step2_s304,
        s608: step2_s608,
        icon: <Upload className="w-7 h-7 lg:w-10 lg:h-10 text-white" />,
      },
      {
        title: "Step 3: Climb the Leaderboard",
        description:
          "Your number of tickets determines your tier placement. Higher tiers get larger shares of the total rewards pool",
        screenshotPath: step3Screenshot,
        m240: step3_m240,
        m480: step3_m480,
        s304: step3_s304,
        s608: step3_s608,
        icon: <Trophy className="w-7 h-7 lg:w-10 lg:h-10 text-white" />,
      },
      {
        title: "Step 4: Win Real Cash Rewards",
        description:
          "At cycle end, winners are drawn on a ticket-weighted basis. The more tickets you have, the better your odds",
        screenshotPath: step4Screenshot,
        m240: step4_m240,
        m480: step4_m480,
        s304: step4_s304,
        s608: step4_s608,
        icon: <Sparkles className="w-7 h-7 lg:w-10 lg:h-10 text-white" />,
      },
    ],
    [],
  );

  // Memoized steps data for performance (keeping original structure for other sections)
  const stepsData = useMemo(
    () => [
      {
        icon: <BookOpen className="w-8 h-8" />,
        title: "Learn Financial Skills",
        description:
          "Complete short lessons and quizzes to build practical knowledge. Topics include budgeting, credit, debt, investing, and more. Earn tickets per module and quiz.",
        screenshot: "lesson-module.png",
        caption: "Complete short lessons like this to earn 20 tickets.",
        gradient: "from-accent to-accent-light",
      },
      {
        icon: <Target className="w-8 h-8" />,
        title: "Take Real Financial Actions",
        description:
          "Submit proof of real-world financial actions — like paying down debt, increasing savings, or building a budget. Earn bonus tickets based on impact.",
        screenshot: "debt-submission.png",
        caption: "Verified debt payments earn big bonus tickets.",
        gradient: "from-accent to-accent-light",
      },
      {
        icon: <BarChart3 className="w-8 h-8" />,
        title: "Track Your Leaderboard Position",
        description:
          "Your tickets determine your spot on the leaderboard — and your shot at real cash rewards. Watch your ranking rise as you learn and take action.",
        screenshot: "leaderboard-screenshot.png",
        caption:
          "Your ticket total determines your leaderboard position and reward odds.",
        gradient: "from-accent to-accent-light",
      },
      {
        icon: <Trophy className="w-8 h-8" />,
        title: "Compete for Cash Rewards",
        description:
          "Winners are selected using a point-weighted system — the more you learn and take action, the better your chances. Real cash rewards distributed monthly.",
        screenshot: "tier-dashboard.png",
        caption:
          "Top contributors win real cash through our point-weighted reward system.",
        gradient: "from-accent to-accent-light",
      },
    ],
    [],
  );

  // Initialize carousel state management
  const carousel = useCarouselState(stepsData.length, 5000);

  const handleJoinEarlyAccess = useCallback(() => {
    // Set URL search params and navigate
    const url = new URL("/auth", window.location.origin);
    url.searchParams.set("mode", "signup");
    navigate(url.pathname + url.search);
  }, [navigate]);

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

  // Utility functions - memoized for performance
  const calculateRewardsPool = useCallback(
    (members: number) => {
      const totalRevenue = members * 20; // Total monthly revenue
      const rewardsAllocation = totalRevenue * (rewardsPercentage / 100); // Dynamic percentage
      return rewardsAllocation;
    },
    [rewardsPercentage],
  );

  const formatCurrency = useCallback((amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {
      return `$${amount}`;
    }
  }, []);

  // Sample financial topics for the lessons preview
  const sampleTopics = useMemo(
    () => [
      { icon: <CreditCard className="w-4 h-4" />, title: "Understanding Credit Scores" },
      { icon: <Home className="w-4 h-4" />, title: "Mortgage & Refinancing" },
      { icon: <Calculator className="w-4 h-4" />, title: "Compound Interest" },
      { icon: <PiggyBank className="w-4 h-4" />, title: "Emergency Fund Basics" },
      { icon: <BarChart3 className="w-4 h-4" />, title: "Investment Portfolio Basics" },
      { icon: <Shield className="w-4 h-4" />, title: "Insurance Fundamentals" },
      { icon: <Target className="w-4 h-4" />, title: "Budget Creation & Tracking" },
      { icon: <DollarSign className="w-4 h-4" />, title: "Debt Payoff Strategies" },
      { icon: <TrendingUp className="w-4 h-4" />, title: "Stock Market Basics" },
      { icon: <Lock className="w-4 h-4" />, title: "Retirement Planning 101" },
      { icon: <BookOpen className="w-4 h-4" />, title: "Personal Finance Fundamentals" },
      { icon: <Timer className="w-4 h-4" />, title: "Side Hustle Strategies" },
      { icon: <Award className="w-4 h-4" />, title: "Financial Goal Setting" },
      { icon: <BadgeDollarSign className="w-4 h-4" />, title: "Passive Income Streams" },
      { icon: <Sparkles className="w-4 h-4" />, title: "Advanced Investment Strategies" },
      { icon: <GraduationCap className="w-4 h-4" />, title: "Student Loan Management" },
      { icon: <Users className="w-4 h-4" />, title: "Family Financial Planning" },
      { icon: <Trophy className="w-4 h-4" />, title: "Wealth Building Mindset" },
      { icon: <AlertTriangle className="w-4 h-4" />, title: "Financial Risk Management" },
      { icon: <CheckCircle className="w-4 h-4" />, title: "Tax Optimization" },
    ],
    [],
  );

  // Debug state for development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("📱 HomeV3 State Debug:", {
        activeScreenshot,
        imgRatio,
        communitySize,
        rewardsPercentage,
        carouselState: {
          currentStep: carousel.currentStep,
          isAutoPlaying: carousel.isAutoPlaying,
          isPaused: carousel.isPaused,
          hasUserInteracted: carousel.hasUserInteracted,
        },
      });
    }
  }, [
    activeScreenshot,
    imgRatio,
    communitySize,
    rewardsPercentage,
    carousel.currentStep,
    carousel.isAutoPlaying,
    carousel.isPaused,
    carousel.hasUserInteracted,
  ]);

  // Pixel-perfect test debugging for zero blur verification
  useEffect(() => {
    const testElement = document.querySelector('[data-step="4"] picture img');
    if (testElement && process.env.NODE_ENV === "development") {
      const computedStyle = window.getComputedStyle(testElement);
      const cssWidth = parseFloat(computedStyle.width);
      const naturalWidth = (testElement as HTMLImageElement).naturalWidth;
      const naturalHeight = (testElement as HTMLImageElement).naturalHeight;
      
      console.log("🔍 PIXEL-PERFECT TEST:");
      console.log("- CSS width:", cssWidth, "px");
      console.log("- Current src:", (testElement as HTMLImageElement).currentSrc);
      console.log("- Natural size:", `${naturalWidth}x${naturalHeight}`);
      console.log("- Expected: 240×431 (mobile) or 304×547 (desktop)");
      console.log("- Perfect match?", 
        (cssWidth === 240 && naturalWidth === 240) || 
        (cssWidth === 304 && naturalWidth === 304)
      );
    }
  }, [activeScreenshot]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <Navbar />

      {/* HERO SECTION - Inlined hero with Step 4 screenshot */}
      <section className="relative pt-16 pb-8 md:pb-12 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[600px]">
            
            {/* Left: Text content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col justify-center space-y-6 lg:space-y-8"
            >
              <div className="space-y-4">
                <motion.h1 
                  className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-900 leading-tight"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  Learn Real Finance
                  <br />
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent">
                    Earn Real Cash
                  </span>
                </motion.h1>
                
                <motion.p 
                  className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  Build financial literacy through interactive lessons and real-world actions. 
                  Compete for monthly cash rewards from a shared pool funded by our community.
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button
                  onClick={handleJoinEarlyAccess}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 group"
                >
                  Join Early Access
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-slate-300 hover:border-blue-300 text-slate-700 hover:text-blue-700 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:bg-blue-50/50"
                  onClick={() => {
                    const howItWorksSection = document.getElementById('how-it-works');
                    if (howItWorksSection) {
                      howItWorksSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  See How It Works
                </Button>
              </motion.div>

              {/* Early Access Guarantee */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                <EarlyAccessGuarantee />
              </motion.div>
            </motion.div>

            {/* Right: Phone mockup with Step 4 screenshot */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="flex justify-center lg:justify-end"
            >
              <div className="relative">
                {/* Phone frame container */}
                <div className="relative transform rotate-2 hover:rotate-1 transition-transform duration-500">
                  {/* Main phone frame */}
                  <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-2 shadow-2xl">
                    {/* Screen bezel */}
                    <div className="bg-black rounded-[2.25rem] p-1">
                      {/* Actual screen content */}
                      <div className="relative bg-white rounded-[2rem] overflow-hidden">
                        {/* Step 4 screenshot with pixel-perfect rendering */}
                        <picture>
                          {/* Desktop: Show larger images */}
                          <source 
                            media="(min-width: 768px)" 
                            srcSet={`${step4_s304} 1x, ${step4_s608} 2x`}
                            width="304"
                            height="547"
                          />
                          {/* Mobile: Show smaller images */}
                          <img
                            src={step4_m240}
                            srcSet={`${step4_m240} 1x, ${step4_m480} 2x`}
                            alt="FinBoost app showing winner celebration screen"
                            width="240"
                            height="431"
                            className="w-full h-auto object-cover"
                            loading="eager"
                            style={{ 
                              width: 'clamp(240px, 50vw, 304px)',
                              height: 'auto',
                              imageRendering: 'crisp-edges'
                            }}
                          />
                        </picture>
                        
                        {/* Subtle glow overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />
                      </div>
                    </div>
                    
                    {/* Phone details */}
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-16 h-1.5 bg-slate-700 rounded-full" />
                    <div className="absolute top-6 right-4 w-2 h-2 bg-slate-700 rounded-full" />
                  </div>
                  
                  {/* Floating elements around phone */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-4 -left-4 w-8 h-8 bg-green-500 rounded-full shadow-lg flex items-center justify-center"
                  >
                    <DollarSign className="w-4 h-4 text-white" />
                  </motion.div>
                  
                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                    className="absolute -bottom-6 -right-6 w-10 h-10 bg-blue-500 rounded-full shadow-lg flex items-center justify-center"
                  >
                    <Trophy className="w-5 h-5 text-white" />
                  </motion.div>
                  
                  <motion.div
                    animate={{ x: [0, 8, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute top-1/3 -left-6 w-6 h-6 bg-purple-500 rounded-full shadow-lg flex items-center justify-center"
                  >
                    <Sparkles className="w-3 h-3 text-white" />
                  </motion.div>
                </div>
                
                {/* Background decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-full blur-3xl scale-150 -z-10" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS - Interactive Carousel Section */}
      <section id="how-it-works" className="py-12 md:py-20 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-100/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              How FinBoost{" "}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent">
                Works
              </span>
            </h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Four simple steps to build financial literacy and compete for real cash rewards
            </p>
          </motion.div>

          {/* Interactive Steps Display */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left Side: Step Information */}
            <motion.div
              key={carousel.currentStep}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="space-y-6"
            >
              {/* Step Badge */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
                  {screenshots[carousel.currentStep].icon}
                </div>
                <Badge 
                  variant="secondary" 
                  className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1 text-sm font-medium"
                >
                  Step {carousel.currentStep + 1} of {screenshots.length}
                </Badge>
              </div>

              {/* Step Content */}
              <div className="space-y-4">
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                  {screenshots[carousel.currentStep].title}
                </h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  {screenshots[carousel.currentStep].description}
                </p>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4">
                <div className="flex space-x-2">
                  {screenshots.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => carousel.goToStep(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === carousel.currentStep
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 w-8"
                          : "bg-slate-300 hover:bg-slate-400"
                      }`}
                      aria-label={`Go to step ${index + 1}`}
                    />
                  ))}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={carousel.prevStep}
                    className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 hover:border-blue-300 flex items-center justify-center transition-all duration-300 hover:shadow-lg group"
                    aria-label="Previous step"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-600 group-hover:text-blue-600" />
                  </button>
                  <button
                    onClick={carousel.nextStep}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 flex items-center justify-center transition-all duration-300 hover:shadow-lg group"
                    aria-label="Next step"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Right Side: Interactive Phone Mockup */}
            <motion.div
              key={carousel.currentStep}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex justify-center lg:justify-end"
              data-step={carousel.currentStep}
            >
              <div className="relative">
                {/* Phone Frame */}
                <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-2 shadow-2xl transform hover:scale-105 transition-transform duration-500">
                  {/* Screen Bezel */}
                  <div className="bg-black rounded-[2.25rem] p-1">
                    {/* Screen Content - Pixel Perfect Screenshots */}
                    <div className="relative bg-white rounded-[2rem] overflow-hidden">
                      <picture>
                        {/* Desktop: Show larger crisp images */}
                        <source 
                          media="(min-width: 768px)" 
                          srcSet={`${screenshots[carousel.currentStep].s304} 1x, ${screenshots[carousel.currentStep].s608} 2x`}
                          width="304"
                          height="547"
                        />
                        {/* Mobile: Show smaller crisp images */}
                        <img
                          src={screenshots[carousel.currentStep].m240}
                          srcSet={`${screenshots[carousel.currentStep].m240} 1x, ${screenshots[carousel.currentStep].m480} 2x`}
                          alt={`${screenshots[carousel.currentStep].title} - FinBoost app screenshot`}
                          width="240"
                          height="431"
                          className="w-full h-auto object-cover"
                          loading="eager"
                          style={{ 
                            width: 'clamp(240px, 50vw, 304px)',
                            height: 'auto',
                            imageRendering: 'crisp-edges'
                          }}
                        />
                      </picture>
                      
                      {/* Subtle screen glow */}
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
                    </div>
                  </div>
                  
                  {/* Phone Details */}
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-16 h-1.5 bg-slate-700 rounded-full"></div>
                  <div className="absolute top-6 right-4 w-2 h-2 bg-slate-700 rounded-full"></div>
                </div>
                
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-3xl scale-150 -z-10"></div>
              </div>
            </motion.div>
          </div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center mt-12 md:mt-16"
          >
            <Button
              onClick={handleJoinEarlyAccess}
              size="lg"
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 group"
            >
              Start Your Financial Journey
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* LESSONS PREVIEW SECTION */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100/30 to-purple-100/30 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-br from-purple-100/30 to-blue-100/30 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Master{" "}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent">
                Financial Topics
              </span>
            </h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Interactive lessons covering everything from basic budgeting to advanced investment strategies
            </p>
          </motion.div>

          {/* Interactive Lessons Preview with Custom Scrolling */}
          <MasterTopicsSection topics={sampleTopics} />

          {/* Value Proposition Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6 mt-16"
          >
            <Card className="group bg-white/80 backdrop-blur-lg border border-slate-200/60 hover:border-blue-200/80 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-6 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Bite-Sized Learning
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Each lesson takes 5-10 minutes. Learn at your own pace without overwhelming complexity.
                </p>
              </CardContent>
            </Card>

            <Card className="group bg-white/80 backdrop-blur-lg border border-slate-200/60 hover:border-blue-200/80 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-6 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Practical Application
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Every lesson connects to real-world actions you can take immediately to improve your finances.
                </p>
              </CardContent>
            </Card>

            <Card className="group bg-white/80 backdrop-blur-lg border border-slate-200/60 hover:border-blue-200/80 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardContent className="p-6 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Rewarded Progress
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  Earn tickets for every completed lesson and quiz, building toward real cash rewards.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* REWARDS SYSTEM SECTION */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-1/4 left-0 w-64 h-64 bg-gradient-to-br from-blue-200/20 to-purple-200/20 rounded-full blur-3xl -translate-x-1/2"></div>
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-gradient-to-br from-purple-200/20 to-blue-200/20 rounded-full blur-3xl translate-x-1/2"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Real{" "}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent">
                Cash Rewards
              </span>
            </h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Our unique reward system distributes real money to active learners every month
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Rewards System Visual */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-slate-200/60">
                <img
                  src={rewardsSystemScreenshot}
                  alt="FinBoost tier-based rewards system showing Bronze, Silver, Gold, and Platinum tiers"
                  className="w-full h-auto rounded-xl shadow-lg"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 via-transparent to-purple-500/5 rounded-2xl pointer-events-none"></div>
              </div>
              
              {/* Floating reward badges */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg flex items-center justify-center"
              >
                <DollarSign className="w-8 h-8 text-white" />
              </motion.div>
              
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -bottom-6 -left-6 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg flex items-center justify-center"
              >
                <Trophy className="w-6 h-6 text-white" />
              </motion.div>
            </motion.div>

            {/* Right: Rewards Explanation */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900">
                  Tier-Based Reward System
                </h3>
                <p className="text-lg text-slate-600 leading-relaxed">
                  The more you learn and take action, the higher your tier placement. 
                  Higher tiers receive proportionally larger shares of the monthly reward pool.
                </p>
              </div>

              {/* Tier Benefits */}
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-1">Bronze Tier</h4>
                    <p className="text-slate-600">Entry level with basic reward eligibility and learning access</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-1">Silver Tier</h4>
                    <p className="text-slate-600">Increased reward share and access to advanced content</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center flex-shrink-0">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-1">Gold Tier</h4>
                    <p className="text-slate-600">Premium rewards and exclusive financial planning tools</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-1">Platinum Tier</h4>
                    <p className="text-slate-600">Highest reward allocation and priority support access</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200/50">
                <h4 className="text-lg font-semibold text-slate-900 mb-2 flex items-center">
                  <BadgeDollarSign className="w-5 h-5 text-blue-600 mr-2" />
                  Monthly Pool Distribution
                </h4>
                <p className="text-slate-700 leading-relaxed">
                  {rewardsPercentage}% of subscription revenue goes directly back to active members. 
                  With {communitySize.toLocaleString()} members, that's approximately{" "}
                  <span className="font-semibold text-blue-700">
                    {formatCurrency(calculateRewardsPool(communitySize))}
                  </span>{" "}
                  in monthly rewards.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* COMMUNITY STATS SECTION */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Join Our{" "}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent">
                Growing Community
              </span>
            </h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Real people building financial literacy and competing for meaningful rewards
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="group bg-white/80 backdrop-blur-lg border border-slate-200/60 hover:border-blue-200/80 hover:shadow-2xl transition-all duration-500 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="p-6 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                    {communitySize.toLocaleString()}+
                  </div>
                  <div className="text-slate-600 font-medium">Active Learners</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="group bg-white/80 backdrop-blur-lg border border-slate-200/60 hover:border-blue-200/80 hover:shadow-2xl transition-all duration-500 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="p-6 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <DollarSign className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                    {formatCurrency(calculateRewardsPool(communitySize))}
                  </div>
                  <div className="text-slate-600 font-medium">Monthly Rewards Pool</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Card className="group bg-white/80 backdrop-blur-lg border border-slate-200/60 hover:border-blue-200/80 hover:shadow-2xl transition-all duration-500 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="p-6 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                    20+
                  </div>
                  <div className="text-slate-600 font-medium">Learning Modules</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <Card className="group bg-white/80 backdrop-blur-lg border border-slate-200/60 hover:border-blue-200/80 hover:shadow-2xl transition-all duration-500 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-yellow-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardContent className="p-6 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                    {rewardsPercentage}%
                  </div>
                  <div className="text-slate-600 font-medium">Revenue to Rewards</div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Community Growth Visualization */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            viewport={{ once: true }}
            className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-slate-200/60"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                Rewards Scale with Community Growth
              </h3>
              <p className="text-lg text-slate-600">
                As our community grows, so does the monthly rewards pool for all members
              </p>
            </div>

            {/* Interactive Community Size Selector */}
            <div className="space-y-6">
              <div className="text-center">
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Community Size: {communitySize.toLocaleString()} members
                </label>
                <input
                  type="range"
                  min="250"
                  max="15000"
                  step="250"
                  value={communitySize}
                  onChange={(e) => setCommunitySize(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>250</span>
                  <span>15,000+</span>
                </div>
              </div>

              {/* Real-time Calculations */}
              <div className="grid md:grid-cols-3 gap-4 text-center">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                  <div className="text-2xl font-bold text-blue-900">
                    {formatCurrency(communitySize * 20)}
                  </div>
                  <div className="text-sm text-blue-700">Monthly Revenue</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                  <div className="text-2xl font-bold text-green-900">
                    {formatCurrency(calculateRewardsPool(communitySize))}
                  </div>
                  <div className="text-sm text-green-700">Rewards Pool ({rewardsPercentage}%)</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                  <div className="text-2xl font-bold text-purple-900">
                    {Math.round(calculateRewardsPool(communitySize) / communitySize)}
                  </div>
                  <div className="text-sm text-purple-700">Avg. per Member</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-16 md:py-24 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Frequently Asked{" "}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 bg-clip-text text-transparent">
                Questions
              </span>
            </h2>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Everything you need to know about FinBoost and how it works
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <FAQ />
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent"></div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              Ready to Start Your{" "}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 bg-clip-text text-transparent">
                Financial Journey?
              </span>
            </h2>

            <p className="text-xl md:text-2xl text-slate-300 leading-relaxed max-w-3xl mx-auto">
              Join thousands of learners building financial literacy while competing for real cash rewards
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                onClick={handleJoinEarlyAccess}
                size="lg"
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600 hover:from-blue-600 hover:via-purple-600 hover:to-blue-700 text-white px-10 py-5 rounded-xl font-semibold text-xl shadow-2xl hover:shadow-3xl transition-all duration-300 group border-0"
              >
                Join Early Access Now
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>

              <div className="flex items-center space-x-2 text-slate-300">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-lg">Free to join</span>
              </div>
            </div>

            {/* Final guarantee */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-center space-x-3 mb-3">
                <ShieldCheck className="w-6 h-6 text-green-400" />
                <span className="text-lg font-semibold text-white">Early Access Guarantee</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Lock in your spot with early access pricing and exclusive founder benefits. 
                Limited to first 10,000 members.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}