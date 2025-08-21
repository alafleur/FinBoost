import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
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

// Import app screenshots
import step1Screenshot from "@assets/Step 1 Learn & Complete Lessons_v1_1754287351239.png";
import step2Screenshot from "@assets/Step 2 Take Financial Actions_v1_1754287375585.png";
import step3Screenshot from "@assets/Step 3 Climb the Leaderboard_v1_1754287383280.png";
import step4Screenshot from "@assets/Step 4 Win Real Cash Rewards_v1_1754287391648.png";
import rewardsSystemScreenshot from "@assets/Rewards System (Tiers)_v1_1754288320243.png";

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
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <ChevronUp className="h-5 w-5" />
            </motion.button>
            <motion.button
              onClick={handleScrollDown}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <ChevronDown className="h-5 w-5" />
            </motion.button>
          </div>

          {/* Desktop: Side arrows */}
          <div className="hidden md:block">
            <motion.button
              onClick={handleScrollUp}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.9 }}
              className="absolute -left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 z-20 border-2 border-white"
            >
              <ChevronUp className="h-6 w-6" />
            </motion.button>
            <motion.button
              onClick={handleScrollDown}
              whileHover={{ scale: 1.1, y: 2 }}
              whileTap={{ scale: 0.9 }}
              className="absolute -right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 z-20 border-2 border-white"
            >
              <ChevronDown className="h-6 w-6" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Interactive app preview component with fixed animations
const InteractiveAppPreview: React.FC = () => {
  const screenshots = [
    {
      id: "step1",
      title: "Learn & Complete Lessons",
      description: "Build your financial knowledge with interactive lessons",
      screenshotPath: step1Screenshot,
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      id: "step2", 
      title: "Take Financial Actions",
      description: "Apply lessons with real-world financial actions",
      screenshotPath: step2Screenshot,
      icon: <Target className="h-5 w-5" />,
    },
    {
      id: "step3",
      title: "Climb the Leaderboard", 
      description: "Track your progress and compete with others",
      screenshotPath: step3Screenshot,
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      id: "step4",
      title: "Win Real Cash Rewards",
      description: "Earn money for your financial growth",
      screenshotPath: step4Screenshot,
      icon: <Trophy className="h-5 w-5" />,
    },
    {
      id: "rewards",
      title: "Rewards System",
      description: "Understand the tier-based reward system",
      screenshotPath: rewardsSystemScreenshot,
      icon: <Award className="h-5 w-5" />,
    },
  ];

  const [activeScreenshot, setActiveScreenshot] = useState(0);

  // Auto-advance screenshots
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveScreenshot((prev) => (prev + 1) % screenshots.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [screenshots.length]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Feature cards - Left side on desktop, top on mobile */}
        <div className="space-y-4 order-2 lg:order-1">
          <h3 className="text-2xl font-bold text-slate-900 text-center lg:text-left mb-6">
            See How It Works
          </h3>

          {screenshots.map((screenshot, index) => (
            <motion.div
              key={screenshot.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              onClick={() => setActiveScreenshot(index)}
              className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                index === activeScreenshot
                  ? "bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 shadow-lg"
                  : "bg-white hover:bg-gray-50 border border-gray-200 hover:border-blue-200"
              }`}
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    index === activeScreenshot
                      ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {screenshot.icon}
                </div>
                <div className="flex-1">
                  <h4
                    className={`font-semibold transition-colors duration-300 ${
                      index === activeScreenshot
                        ? "text-blue-900"
                        : "text-gray-900"
                    }`}
                  >
                    {screenshot.title}
                  </h4>
                  <p
                    className={`text-sm transition-colors duration-300 ${
                      index === activeScreenshot
                        ? "text-blue-700"
                        : "text-gray-600"
                    }`}
                  >
                    {screenshot.description}
                  </p>
                </div>
                {index === activeScreenshot && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-3 h-3 bg-blue-500 rounded-full"
                  />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Phone mockup - Right side on desktop, bottom on mobile */}
        <div className="flex justify-center order-1 lg:order-2">
          <div className="relative">
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

                  {/* App screenshot content - FIXED BLUR ISSUE */}
                  <div className="h-full bg-white overflow-hidden flex items-start justify-center">
                    <motion.div
                      key={`screenshot-${activeScreenshot}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.35 }}
                      className="w-full h-full"
                    >
                      <img
                        src={screenshots[activeScreenshot].screenshotPath}
                        alt={screenshots[activeScreenshot].title}
                        className="block max-w-full max-h-full object-contain will-change-transform"
                        loading="lazy"
                        decoding="async"
                        style={{ 
                          imageRendering: 'auto', 
                          backfaceVisibility: 'hidden', 
                          transform: 'translateZ(0)' 
                        }}
                      />
                    </motion.div>
                  </div>
                </div>
                <div className="absolute bottom-1 lg:bottom-2 left-1/2 transform -translate-x-1/2 w-24 lg:w-32 h-1 bg-white/30 rounded-full"></div>
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
                className="p-2 rounded-full bg-white shadow-lg border border-gray-200 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Dots indicator */}
              <div className="flex space-x-2">
                {screenshots.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveScreenshot(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === activeScreenshot ? "bg-blue-500" : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>

              {/* Right Arrow */}
              <button
                onClick={() => {
                  const nextIndex = (activeScreenshot + 1) % screenshots.length;
                  setActiveScreenshot(nextIndex);
                }}
                className="p-2 rounded-full bg-white shadow-lg border border-gray-200 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Example Module Content
const ExampleModule: React.FC = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <CreditCard className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Credit Card Basics</h3>
          <p className="text-sm text-gray-600">7 minutes • Beginner</p>
        </div>
      </div>
      <p className="text-gray-700 text-sm mb-4">
        Learn the fundamentals of credit cards, how interest works, and smart
        usage strategies that can boost your credit score.
      </p>
      <div className="flex items-center justify-between">
        <Badge variant="secondary" className="text-xs">
          +50 points
        </Badge>
        <Button size="sm" variant="outline">
          Start Lesson
        </Button>
      </div>
    </div>
  );
};

// Prize Pool Section
const PrizePoolSection: React.FC = () => {
  return (
    <section className="py-16 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Real Cash Prizes, <span className="gradient-text">Guaranteed</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Every two weeks, we distribute guaranteed cash rewards to our most
            engaged learners. No gimmicks, no fine print.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Current Prize Pool */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-xl border border-blue-100"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Current Prize Pool
              </h3>
              <div className="text-3xl font-bold text-blue-600 mb-2">$2,400</div>
              <p className="text-sm text-gray-600">
                Guaranteed minimum for next distribution
              </p>
            </div>
          </motion.div>

          {/* Next Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-xl border border-green-100"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Next Distribution
              </h3>
              <div className="text-2xl font-bold text-green-600 mb-2">
                6 days left
              </div>
              <p className="text-sm text-gray-600">
                Winners announced every other Friday
              </p>
            </div>
          </motion.div>

          {/* Your Chances */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl p-8 shadow-xl border border-purple-100"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Your Win Rate
              </h3>
              <div className="text-3xl font-bold text-purple-600 mb-2">54%</div>
              <p className="text-sm text-gray-600">
                Based on current early access cohort
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Enhanced Early Access CTA Section
const EarlyAccessCTA: React.FC = () => {
  const [, setLocation] = useLocation();

  const handleJoinClick = () => {
    setLocation("/auth");
  };

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-400/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-400/10 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-indigo-400/5 rounded-full blur-2xl"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <Badge className="mb-6 bg-blue-500/20 text-blue-200 border-blue-400/30">
            <Sparkles className="h-4 w-4 mr-2" />
            Limited Early Access
          </Badge>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to Get Rewarded for{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Smart Financial Choices?
            </span>
          </h2>

          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join our exclusive early access program where every prize pool is
            guaranteed and over half of active members win real money every two
            weeks.
          </p>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mb-8"
          >
            <Button
              onClick={handleJoinClick}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl shadow-2xl border border-blue-500/30 text-lg h-auto"
            >
              Claim Your Early Access Spot
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-gray-400">
            <div className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-green-400" />
              <span>Prize pools guaranteed</span>
            </div>
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-400" />
              <span>Limited spots remaining</span>
            </div>
            <div className="flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-purple-400" />
              <span>54% win rate</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Enhanced Social Proof Section
const SocialProofSection: React.FC = () => {
  const stats = [
    {
      number: "2,400+",
      label: "Active Learners",
      icon: <Users className="h-6 w-6" />,
      color: "from-blue-500 to-blue-600",
    },
    {
      number: "$18,600",
      label: "Total Paid Out",
      icon: <DollarSign className="h-6 w-6" />,
      color: "from-green-500 to-green-600",
    },
    {
      number: "54%",
      label: "Average Win Rate",
      icon: <Trophy className="h-6 w-6" />,
      color: "from-purple-500 to-purple-600",
    },
    {
      number: "96%",
      label: "Satisfaction Rate",
      icon: <Star className="h-6 w-6" />,
      color: "from-yellow-500 to-orange-500",
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Join Thousands of <span className="gradient-text">Smart Learners</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our community is already building better financial habits and
            earning real rewards in the process.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div
                className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}
              >
                <div className="text-white">{stat.icon}</div>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// How It Works Section
const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: "01",
      title: "Learn Smart Money Skills",
      description:
        "Complete bite-sized lessons on budgeting, investing, credit, and more. Each lesson takes 5-10 minutes and includes interactive quizzes.",
      icon: <BookOpen className="h-6 w-6" />,
      color: "from-blue-500 to-blue-600",
    },
    {
      number: "02",
      title: "Take Real Financial Actions",
      description:
        "Apply what you learn by taking actual financial actions like opening a savings account, making your first investment, or paying down debt.",
      icon: <Target className="h-6 w-6" />,
      color: "from-green-500 to-green-600",
    },
    {
      number: "03",
      title: "Earn Points & Climb Tiers",
      description:
        "Earn points for every lesson completed and financial action taken. Climb from Bronze to Platinum tier to increase your reward chances.",
      icon: <TrendingUp className="h-6 w-6" />,
      color: "from-purple-500 to-purple-600",
    },
    {
      number: "04",
      title: "Win Real Cash Rewards",
      description:
        "Every two weeks, we distribute guaranteed cash prizes to active members. The higher your tier, the bigger your potential rewards.",
      icon: <Trophy className="h-6 w-6" />,
      color: "from-yellow-500 to-orange-500",
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How <span className="gradient-text">FinBoost</span> Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A simple 4-step process that turns your financial learning journey
            into a rewarding experience.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 relative"
            >
              {/* Step number */}
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {step.number}
              </div>

              {/* Icon */}
              <div
                className={`w-12 h-12 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center mb-4`}
              >
                <div className="text-white">{step.icon}</div>
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Topics data
const topics = [
  { icon: <CreditCard />, title: "Credit Card Basics" },
  { icon: <PiggyBank />, title: "Emergency Funds" },
  { icon: <TrendingUp />, title: "Stock Market 101" },
  { icon: <Calculator />, title: "Budgeting Strategies" },
  { icon: <Home />, title: "Home Buying Process" },
  { icon: <Shield />, title: "Insurance Essentials" },
  { icon: <DollarSign />, title: "Tax Optimization" },
  { icon: <Award />, title: "Retirement Planning" },
  { icon: <CreditCard />, title: "Debt Management" },
  { icon: <TrendingUp />, title: "Investment Basics" },
  { icon: <Calculator />, title: "Loan Comparisons" },
  { icon: <Shield />, title: "Identity Protection" },
  { icon: <PiggyBank />, title: "Savings Goals" },
  { icon: <Home />, title: "Mortgage Options" },
  { icon: <DollarSign />, title: "Side Hustles" },
  { icon: <Award />, title: "Wealth Building" },
];

// Enhanced FAQ Section
const FAQSection: React.FC = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index)
        ? prev.filter((item) => item !== index)
        : [...prev, index],
    );
  };

  const faqs = [
    {
      question: "How do I earn points and increase my chances of winning?",
      answer:
        "You earn points by completing lessons (50-100 points each) and taking real financial actions like opening a savings account or making investments (100-500 points each). The more points you earn, the higher your tier and the better your chances of winning bi-weekly cash prizes.",
    },
    {
      question: "Are the cash prizes really guaranteed?",
      answer:
        "Yes! Every two weeks we distribute a guaranteed minimum prize pool. Even if fewer people participate in a cycle, we maintain the promised prize amounts. This is what makes our early access program special - you're never competing for uncertain rewards.",
    },
    {
      question: "What makes this different from other financial education apps?",
      answer:
        "Unlike other apps that only offer virtual badges or points, FinBoost rewards you with real money for building genuine financial habits. We combine education with action-taking and reward both, creating stronger motivation to actually improve your financial health.",
    },
    {
      question: "How much can I realistically win?",
      answer:
        "Prizes range from $25-$500+ depending on your tier level and the size of the prize pool. Our current early access cohort has a 54% win rate, meaning over half of active participants receive cash rewards every two weeks. Higher tier members (Silver, Gold, Platinum) have significantly better odds and larger potential prizes.",
    },
    {
      question: "Is there a cost to join FinBoost?",
      answer:
        "Early access is currently free! Once we exit early access, we'll offer both free and premium tiers. Premium members will have access to advanced content, higher point multipliers, and exclusive prize pools. Early access members get grandfathered into premium benefits.",
    },
    {
      question: "How do you verify financial actions for points?",
      answer:
        "We use secure, read-only connections to verify actions like account openings, investments, or debt payments. You can also submit screenshots or documentation for manual verification. We never ask for account passwords or access that could compromise your financial security.",
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get answers to common questions about how FinBoost works and how you
            can start earning rewards for smart financial choices.
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-gray-50 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-100 transition-colors duration-200"
              >
                <h3 className="text-lg font-semibold text-gray-900 pr-4">
                  {faq.question}
                </h3>
                <motion.div
                  animate={{ rotate: openItems.includes(index) ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                </motion.div>
              </button>
              <motion.div
                initial={false}
                animate={{
                  height: openItems.includes(index) ? "auto" : 0,
                  opacity: openItems.includes(index) ? 1 : 0,
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-5">
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Main Component
const HomeV3: React.FC = () => {
  const [, setLocation] = useLocation();

  const handleCTAClick = () => {
    setLocation("/auth");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-24 pb-20 bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/20 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-200/20 rounded-full blur-xl"></div>
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-indigo-200/20 rounded-full blur-lg"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
                <Sparkles className="h-4 w-4 mr-2" />
                Early Access • Limited Spots
              </Badge>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Get Rewarded for{" "}
                <span className="gradient-text">Smart Money Moves</span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Learn financial skills, take real actions, and win guaranteed
                cash prizes. Join 2,400+ people earning money while building
                better financial habits.
              </p>

              <div className="space-y-4 mb-8">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    onClick={handleCTAClick}
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl shadow-lg border border-blue-500/30 text-lg h-auto"
                  >
                    Start Earning Rewards Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-6 text-gray-600">
                  <div className="flex items-center">
                    <ShieldCheck className="h-5 w-5 mr-2 text-green-600" />
                    <span className="font-medium">$2,400 guaranteed pool</span>
                  </div>
                  <div className="flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-blue-600" />
                    <span className="font-medium">54% win rate</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-purple-600" />
                    <span className="font-medium">2,400+ active learners</span>
                  </div>
                </div>
              </div>

              <p className="text-gray-500 text-sm">
                No hidden fees • Real money rewards • Guaranteed prize pools
              </p>
            </motion.div>

            {/* Right Column - Interactive Preview */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <InteractiveAppPreview />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <SocialProofSection />

      {/* How It Works */}
      <HowItWorksSection />

      {/* Prize Pool Section */}
      <PrizePoolSection />

      {/* What You'll Master */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-32 h-32 bg-blue-200/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-10 left-10 w-40 h-40 bg-purple-200/10 rounded-full blur-xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What You'll <span className="gradient-text">Master</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From credit basics to advanced investing, our curriculum covers
              everything you need to build lasting financial wellness.
            </p>
          </motion.div>

          <MasterTopicsSection topics={topics} />
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection />

      {/* Early Access CTA */}
      <EarlyAccessCTA />

      <Footer />
    </div>
  );
};

export default HomeV3;