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
import HeroSplit from "@/components/HeroSplit";
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

  // Debug state logging
  useEffect(() => {
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
  }, [activeScreenshot, imgRatio, communitySize, rewardsPercentage, carousel]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Navbar />

      {/* Hero Section - Enhanced HeroSplit Integration */}
      <section className="relative min-h-screen flex flex-col">
        <HeroSplit />
        <EarlyAccessGuarantee />
      </section>

      {/* App Preview - Interactive Phone Mockup */}
      <section
        id="preview"
        className="py-20 px-4 bg-gradient-to-b from-slate-50 to-white"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block bg-gradient-to-r from-blue-600/10 to-blue-800/10 backdrop-blur-sm border border-blue-200 rounded-full px-6 py-2 mb-6 badge-premium-gloss magnetic-hover">
              <span className="text-blue-700 font-semibold text-sm">
                HOW IT WORKS
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">
              How FinBoost Works
              <span className="block text-slate-900">(and How You Win)</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Four simple steps to turn your financial learning into real cash
              rewards
            </p>
          </motion.div>

          {/* Unified Responsive Layout */}
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-16 lg:items-center">
            {/* Phone Preview - Mobile Bottom, Desktop Right */}
            <div className="order-2 lg:order-2 flex flex-col items-center lg:items-start">
              <motion.div
                key={activeScreenshot}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative"
              >
                {/* Frameless screenshot with shadow/glow (same styling as hero section) */}
                <div className="relative">
                  <motion.img
                    src={screenshots[activeScreenshot].screenshotPath}
                    alt={screenshots[activeScreenshot].title}
                    className="w-64 h-auto rounded-[28px] shadow-xl shadow-slate-900/15
                               ring-1 ring-gray-200/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.35 }}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                  
                  {/* Premium gloss overlay (same as hero) */}
                  <div className="absolute inset-0 rounded-[28px] 
                                  bg-gradient-to-tr from-transparent via-white/5 to-white/20 
                                  pointer-events-none"></div>
                  
                  {/* Subtle blue glow effect (same as hero) */}
                  <div className="absolute inset-0 rounded-[28px] 
                                  [box-shadow:0_0_40px_rgba(59,130,246,0.1)]
                                  pointer-events-none"></div>
                </div>
              </motion.div>

              {/* Mobile navigation with arrows and dots - positioned below phone */}
              <div className="lg:hidden flex items-center justify-center space-x-4 mt-4">
                {/* Left Arrow */}
                <button
                  onClick={() => {
                    const prevIndex =
                      activeScreenshot === 0
                        ? screenshots.length - 1
                        : activeScreenshot - 1;
                    setActiveScreenshot(prevIndex);
                  }}
                  className="p-2 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white hover:scale-105"
                  aria-label="Previous screenshot"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600" />
                </button>

                {/* Dots */}
                <div className="flex space-x-2">
                  {screenshots.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        console.log(
                          "Dot clicked:",
                          index,
                          "Previous state:",
                          activeScreenshot,
                        );
                        setActiveScreenshot(index);
                      }}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        activeScreenshot === index
                          ? "bg-blue-600 w-8"
                          : "bg-slate-300 hover:bg-slate-400"
                      }`}
                      aria-label={`View ${screenshots[index].title}`}
                    />
                  ))}
                </div>

                {/* Right Arrow */}
                <button
                  onClick={() => {
                    const nextIndex =
                      activeScreenshot === screenshots.length - 1
                        ? 0
                        : activeScreenshot + 1;
                    setActiveScreenshot(nextIndex);
                  }}
                  className="p-2 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white hover:scale-105"
                  aria-label="Next screenshot"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Interactive Cards - Responsive: Single flipping card on mobile, 4 cards on desktop */}
            <div className="order-1 lg:order-1">
              {/* Mobile: Single Flipping Card */}
              <div className="lg:hidden px-4">
                <motion.div
                  key={`mobile-card-${activeScreenshot}`}
                  className="dashboard-card-primary p-5 rounded-xl cursor-pointer"
                  onClick={() => {
                    const nextIndex =
                      (activeScreenshot + 1) % screenshots.length;
                    console.log(
                      "Card flipped to:",
                      nextIndex,
                      "Previous state:",
                      activeScreenshot,
                    );
                    setActiveScreenshot(nextIndex);
                  }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-start space-x-3">
                    <motion.div
                      key={`mobile-icon-${activeScreenshot}`}
                      className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {React.cloneElement(screenshots[activeScreenshot].icon, {
                        className: "w-6 h-6 text-white",
                      })}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <motion.h3
                          key={`mobile-title-${activeScreenshot}`}
                          className="font-semibold text-lg text-slate-900"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                        >
                          {screenshots[activeScreenshot].title}
                        </motion.h3>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100">
                          <ArrowRight className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                      <motion.p
                        key={`mobile-desc-${activeScreenshot}`}
                        className="text-slate-600 text-sm leading-relaxed mb-4"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                      >
                        {screenshots[activeScreenshot].description}
                      </motion.p>

                      {/* Step indicator */}
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          {screenshots.map((_, index) => (
                            <div
                              key={index}
                              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                activeScreenshot === index
                                  ? "bg-blue-600 w-6"
                                  : "bg-slate-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-500 font-medium">
                          {activeScreenshot + 1} of {screenshots.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Desktop: Four Individual Cards */}
              <div className="hidden lg:block space-y-3">
                {screenshots.map((screenshot, index) => (
                  <motion.div
                    key={`desktop-card-${index}-${activeScreenshot}`}
                    className={`group p-6 rounded-xl cursor-pointer transition-all duration-300 ${
                      activeScreenshot === index
                        ? "dashboard-card-primary"
                        : "bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-md border border-slate-200 hover:border-slate-300"
                    }`}
                    onClick={() => {
                      console.log(
                        "Desktop card clicked:",
                        index,
                        "Previous state:",
                        activeScreenshot,
                      );
                      setActiveScreenshot(index);
                    }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    animate={{
                      scale: 1, // REMOVED: activeScreenshot === index ? 1.02 : 1, (causes blur)
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-start space-x-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                          activeScreenshot === index
                            ? "bg-gradient-to-br from-blue-500 to-purple-600"
                            : "bg-slate-100 group-hover:bg-slate-200"
                        }`}
                      >
                        {React.cloneElement(screenshot.icon, {
                          className: `w-6 h-6 ${activeScreenshot === index ? "text-white" : "text-slate-600"}`,
                        })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg text-slate-900">
                            {screenshot.title}
                          </h3>
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
                              activeScreenshot === index
                                ? "bg-blue-100"
                                : "bg-slate-100 group-hover:bg-slate-200"
                            }`}
                          >
                            <ArrowRight
                              className={`w-3 h-3 transition-colors ${
                                activeScreenshot === index
                                  ? "text-blue-600"
                                  : "text-slate-400"
                              }`}
                            />
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
            </div>
          </div>
        </div>
      </section>

      {/* Learning Module Section - Enhanced Design */}
      <section
        id="learn"
        className="py-20 px-4 bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20 relative overflow-hidden"
      >
        {/* Enhanced Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-purple-400/10 to-blue-400/10 rounded-full blur-xl"></div>
          <div className="absolute top-1/3 left-1/4 w-20 h-20 bg-blue-300/5 rounded-full blur-lg"></div>
          <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-purple-300/5 rounded-full blur-lg"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-200/5 to-purple-200/5 rounded-full blur-3xl"></div>
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
            <div className="inline-block bg-gradient-to-r from-blue-600/10 to-blue-800/10 backdrop-blur-sm border border-blue-200 rounded-full px-6 py-2 mb-6 badge-premium-gloss magnetic-hover">
              <span className="text-blue-700 font-semibold text-sm">
                FINANCIAL EDUCATION
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">
              Some Examples of Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                FinBoost Lessons
              </span>
            </h2>
            <p className="text-lg leading-relaxed text-slate-600 max-w-3xl mx-auto">
              Real financial education via 3-5 minute lessons and interactive
              quizzes based on proven strategies for common real-life scenarios
            </p>
          </motion.div>

          {/* Single Column Layout - What You'll Master */}
          <div className="mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            ></motion.div>

            {/* Mobile Single Card with Navigation + Desktop Grid */}
            <MasterTopicsSection
              topics={[
                {
                  icon: <Shield className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Navigate Auto Loans and Refinancing",
                },
                {
                  icon: <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Harness Compound Growth Power",
                },
                {
                  icon: <BookOpen className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Strategic Student Loan Repayment Plans",
                },

                {
                  icon: <Calculator className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Do Small Daily Purchases Really Add Up?",
                },
                {
                  icon: <CreditCard className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Master Credit Utilization and Borrowing Power",
                },
                {
                  icon: <AlertTriangle className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Navigate Buy Now, Pay Later Risks",
                },
                {
                  icon: <PiggyBank className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Build Smart Emergency Fund Strategy",
                },
                {
                  icon: <Target className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Rethink the 30% Rent Rule",
                },
                {
                  icon: <DollarSign className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Master Debt Payoff Strategies",
                },
                {
                  icon: <Calculator className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Decode APR vs APY Differences",
                },
                {
                  icon: <Home className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "When Renting Actually Beats Buying",
                },
                {
                  icon: <Zap className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Stop Lifestyle Inflation Before It Starts",
                },
                {
                  icon: <Eye className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Hidden Fees That Drain Your Bank Account",
                },
                {
                  icon: <Smartphone className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Why Your Phone Bill Is Probably Too High",
                },
                {
                  icon: <BadgeDollarSign className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title:
                    "The 50/30/20 Budget Rule: Finding Your Perfect Balance",
                },
                {
                  icon: <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title:
                    "Side Hustle Income: Tax Implications You Need to Know",
                },
                {
                  icon: <CheckCircle className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Building Credit from Zero: Your First Steps",
                },
                {
                  icon: <Shield className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title:
                    "Insurance That Actually Matters vs. Overpriced Coverage",
                },
                {
                  icon: <Calculator className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "401(k) vs. Roth IRA: Which Should You Choose First?",
                },
                {
                  icon: <Target className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title:
                    "Setting Realistic Financial Goals That Actually Stick",
                },
                {
                  icon: <PiggyBank className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "High-Yield Savings: Where to Park Your Money",
                },
                {
                  icon: <AlertTriangle className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Red Flags in Investment Offers and Financial Scams",
                },
                {
                  icon: <BookOpen className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Personal Finance Books Worth Your Time (and Money)",
                },
                {
                  icon: <DollarSign className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Negotiating Your Salary: Scripts That Actually Work",
                },
              ]}
            />
          </div>
        </div>
      </section>

      {/* Why FinBoost Isn't Just Another Finance App - Refined Platform Overview Format */}
      <section
        id="trust"
        className="bg-gradient-to-b from-white via-slate-50 to-white py-16 px-4 sm:px-6 lg:px-8 relative"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block bg-gradient-to-r from-blue-600/10 to-blue-800/10 backdrop-blur-sm border border-blue-200 rounded-full px-6 py-2 mb-6 badge-premium-gloss magnetic-hover">
              <span className="text-blue-700 font-semibold text-sm">
                WHY FINBOOST
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Why FinBoost Isn't Just Another Finance App
            </h2>
          </motion.div>

          {/* Clean Tier Card Format - Responsive 2x2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto items-stretch">
            {[
              {
                title: "Debt Progress Pays",
                subtitle:
                  "Student loans, credit cards, buy now pay later — every payment forward can earn you money back.",
              },
              {
                title: "Rising Costs Reality",
                subtitle:
                  "Everything costs more, saving feels impossible. Small wins add up to real rewards.",
              },
              {
                title: "Addressing Beyond Just Next Month",
                subtitle:
                  "FinBoost is about freedom from near-term stress and building momentum toward long-term goals.",
              },
              {
                title: "A Better Approach",
                subtitle:
                  "Most apps focus on today's spending. We reward steps toward tomorrow's security.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full border-2 border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <CardContent className="p-4 text-center bg-gradient-to-r from-blue-700 to-blue-900 relative tier-badge-gloss tier-badge-enhanced">
                    <div className="relative z-10">
                      <h3 className="text-xl font-semibold text-white mb-1">
                        {item.title}
                      </h3>
                      <p className="text-white/90 text-sm">{item.subtitle}</p>
                    </div>
                  </CardContent>
                </Card>
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
              Whether you're just starting out or already budgeting, FinBoost
              meets you where you are — and helps you level up.
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
            <div className="inline-block bg-gradient-to-r from-blue-600/10 to-blue-800/10 backdrop-blur-sm border border-blue-200 rounded-full px-6 py-2 mb-6 badge-premium-gloss magnetic-hover">
              <span className="text-blue-700 font-semibold text-sm">
                MEMBERSHIP VALUE
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-6">
              How Your Membership Fuels the Movement
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your membership isn't just a transaction — it's your access to
              financial growth and real cash rewards funded by the community.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6 magnetic-hover">
                <GraduationCap className="w-8 h-8 text-white icon-bounce" />
              </div>
              <h4 className="text-xl font-bold text-white mb-4">
                Financial Modules
              </h4>
              <p className="text-white/90 leading-relaxed">
                A portion of your membership supports full access to our growing
                library of financial lessons, quizzes, and real-world action
                incentives — all designed to build genuine financial skills.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6 magnetic-hover">
                <Users className="w-8 h-8 text-white icon-bounce" />
              </div>
              <h4 className="text-xl font-bold text-white mb-4">
                Collective Rewards Pool
              </h4>
              <p className="text-white/90 leading-relaxed">
                Most of your membership goes directly toward the monthly rewards
                pool — cash prizes that get distributed to community members who
                actively engage and make financial progress.
              </p>
            </motion.div>
          </div>

          {/* Interactive Community Size Simulator */}
          <div className="mt-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="dashboard-card-primary rounded-2xl p-8"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  Real-Time Community Impact
                </h3>
                <p className="text-slate-600 max-w-2xl mx-auto">
                  See how the rewards pool grows as more members join. Your
                  monthly membership directly funds real cash prizes for the
                  community.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mb-1">
                    {communitySize.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-600">Community Members</div>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mb-1">
                    {formatCurrency(calculateRewardsPool(communitySize))}
                  </div>
                  <div className="text-sm text-slate-600">
                    Monthly Rewards Pool
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Trophy className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mb-1">
                    {rewardsPercentage}%
                  </div>
                  <div className="text-sm text-slate-600">Goes to Rewards</div>
                </div>
              </div>

              {/* Interactive Slider */}
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-slate-200">
                <div className="flex items-center space-x-4 mb-4">
                  <label className="flex items-center space-x-2 text-sm font-medium text-slate-700">
                    <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    Community Size
                  </label>
                </div>
                <input
                  type="range"
                  min="250"
                  max="15000"
                  step="250"
                  value={communitySize}
                  onChange={(e) => setCommunitySize(parseInt(e.target.value))}
                  className="w-full h-2 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>250 Members</span>
                  <span>15,000+ Members</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">
                    Current projection:
                  </span>{" "}
                  With {communitySize.toLocaleString()} members, we distribute{" "}
                  <span className="font-semibold text-green-600">
                    {formatCurrency(calculateRewardsPool(communitySize))}
                  </span>{" "}
                  in monthly rewards ({rewardsPercentage}% of revenue goes
                  directly to community prizes)
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Success Stories / Social Proof */}
      <section className="bg-gradient-to-b from-white to-slate-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-block bg-gradient-to-r from-blue-600/10 to-blue-800/10 backdrop-blur-sm border border-blue-200 rounded-full px-6 py-2 mb-6 badge-premium-gloss magnetic-hover">
              <span className="text-blue-700 font-semibold text-sm">
                SUCCESS STORIES
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Real Progress, Real Results
            </h2>
            <p className="text-lg text-slate-600">
              Members are already seeing the power of incentivized financial
              education
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah Chen",
                role: "Marketing Professional",
                achievement: "Paid off $12K credit card debt",
                quote:
                  "The debt payment challenges kept me motivated. Earning points for every payment made it feel like a game I was winning.",
                tickets: "1,847 tickets earned",
                reward: "$240 won in March",
              },
              {
                name: "Marcus Rodriguez",
                role: "Recent Graduate",
                achievement: "Built 6-month emergency fund",
                quote:
                  "FinBoost taught me emergency fund strategies that actually work with my salary. The lessons are short but really practical.",
                tickets: "932 tickets earned",
                reward: "Won $180 in April",
              },
              {
                name: "Jessica Park",
                role: "Teacher",
                achievement: "Negotiated 15% salary increase",
                quote:
                  "The salary negotiation module gave me scripts that actually worked. I earned back my membership fee 60x over.",
                tickets: "2,156 tickets earned",
                reward: "$420 won in May",
              },
            ].map((story, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full dashboard-card-primary hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {story.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">
                          {story.name}
                        </div>
                        <div className="text-sm text-slate-600">
                          {story.role}
                        </div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 mb-2">
                        <Trophy className="w-3 h-3 mr-1" />
                        {story.achievement}
                      </div>
                    </div>
                    <blockquote className="text-slate-600 text-sm italic mb-4">
                      "{story.quote}"
                    </blockquote>
                    <div className="text-xs text-slate-500 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>{story.tickets}</span>
                        <Badge variant="secondary" className="text-xs">
                          {story.reward}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section - Enhanced */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 overflow-hidden">
        {/* Enhanced background effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 animate-gradient-x"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-purple-400/20 to-blue-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/3 left-1/3 w-20 h-20 bg-white/10 rounded-full blur-lg animate-pulse delay-500"></div>
          <div className="absolute bottom-1/3 right-1/3 w-24 h-24 bg-white/5 rounded-full blur-lg animate-pulse delay-700"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="inline-block bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-6 py-2 mb-6 magnetic-hover">
              <span className="text-white font-semibold text-sm">
                READY TO START?
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
              Turn Your Financial Journey Into
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
                Real Rewards
              </span>
            </h2>
            <p className="text-lg leading-relaxed text-white/90 mb-8 max-w-3xl mx-auto">
              Join FinBoost today and turn your effort into rewards — with real
              stakes, real skills, and collective power behind you.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                className="btn-secondary py-3 px-8 text-lg rounded-xl border-0 h-auto shadow-lg"
                onClick={() => (window.location.href = "/auth?mode=signup")}
              >
                <Trophy className="mr-2 h-5 w-5 icon-bounce" />
                Get Early Access Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <FAQ />
      
      <Footer />
    </div>
  );
}