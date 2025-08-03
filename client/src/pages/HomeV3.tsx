import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause
} from "lucide-react";

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
function useCarouselState(totalSteps: number, autoAdvanceInterval: number = 5000) {
  const [state, setState] = useState<CarouselState>({
    currentStep: 0,
    isAutoPlaying: false,
    isPaused: false,
    hasUserInteracted: false
  });

  // Navigation functions with comprehensive error handling, analytics, and bounds checking
  const goToStep = useCallback((stepIndex: number) => {
    // Input validation
    if (typeof stepIndex !== 'number' || isNaN(stepIndex)) {
      console.error(`Invalid step index type: ${typeof stepIndex}. Expected number.`);
      return;
    }
    
    if (stepIndex < 0 || stepIndex >= totalSteps) {
      console.warn(`Invalid step index: ${stepIndex}. Must be between 0 and ${totalSteps - 1}`);
      return;
    }
    
    try {
      setState(prev => {
        // Analytics tracking
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'carousel_navigate', {
            event_category: 'engagement',
            from_step: prev.currentStep,
            to_step: stepIndex,
            navigation_type: 'direct',
            total_steps: totalSteps
          });
        }
        
        return {
          ...prev,
          currentStep: stepIndex,
          hasUserInteracted: true,
          isPaused: true // Pause auto-advance when user interacts
        };
      });
    } catch (error) {
      console.error('Error navigating to step:', error);
    }
  }, [totalSteps]);

  const nextStep = useCallback(() => {
    try {
      setState(prev => {
        const nextStepIndex = (prev.currentStep + 1) % totalSteps;
        
        // Analytics tracking
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'carousel_navigate', {
            event_category: 'engagement',
            from_step: prev.currentStep,
            to_step: nextStepIndex,
            navigation_type: 'next',
            total_steps: totalSteps
          });
        }
        
        return {
          ...prev,
          currentStep: nextStepIndex,
          hasUserInteracted: true,
          isPaused: true
        };
      });
    } catch (error) {
      console.error('Error navigating to next step:', error);
    }
  }, [totalSteps]);

  const prevStep = useCallback(() => {
    try {
      setState(prev => {
        const prevStepIndex = prev.currentStep === 0 ? totalSteps - 1 : prev.currentStep - 1;
        
        // Analytics tracking
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'carousel_navigate', {
            event_category: 'engagement',
            from_step: prev.currentStep,
            to_step: prevStepIndex,
            navigation_type: 'previous',
            total_steps: totalSteps
          });
        }
        
        return {
          ...prev,
          currentStep: prevStepIndex,
          hasUserInteracted: true,
          isPaused: true
        };
      });
    } catch (error) {
      console.error('Error navigating to previous step:', error);
    }
  }, [totalSteps]);

  const toggleAutoPlay = useCallback(() => {
    setState(prev => ({
      ...prev,
      isAutoPlaying: !prev.isAutoPlaying,
      isPaused: false
    }));
  }, []);

  const pauseAutoPlay = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPaused: true
    }));
  }, []);

  const resumeAutoPlay = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPaused: false
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
        setState(prev => {
          const nextStep = (prev.currentStep + 1) % totalSteps;
          
          // Analytics tracking for auto-advance
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'carousel_auto_advance', {
              event_category: 'engagement',
              current_step: prev.currentStep,
              next_step: nextStep,
              total_steps: totalSteps
            });
          }
          
          return {
            ...prev,
            currentStep: nextStep
          };
        });
      }, autoAdvanceInterval);
    } catch (error) {
      console.error('Error setting up carousel auto-advance:', error);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [state.isAutoPlaying, state.isPaused, state.hasUserInteracted, totalSteps, autoAdvanceInterval]);

  // Performance monitoring for state changes
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Log performance metrics for optimization
      if (duration > 100) { // Only log if state update took longer than 100ms
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
    resumeAutoPlay
  };
}

export default function HomeV3() {
  const [location, navigate] = useLocation();
  const [communitySize, setCommunitySize] = useState(5000);
  const [rewardsPercentage, setRewardsPercentage] = useState(79);
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  
  // Interactive app screenshots data for the phone mockup
  const screenshots = useMemo(() => [
    {
      title: "Learning Progress Dashboard",
      description: "Track your progress through financial modules with clear point totals and completion rates",
      mockContent: "Dashboard showing 4 of 8 lessons complete, 285 total points, Tier 2 status",
      icon: <BookOpen className="w-7 h-7 lg:w-10 lg:h-10 text-white" />
    },
    {
      title: "Quiz Completion & Points",
      description: "Earn immediate points for completing quizzes and demonstrating knowledge",
      mockContent: "Quiz complete screen: +15 points earned, streak bonus +5, total: 20 points",
      icon: <CheckCircle className="w-7 h-7 lg:w-10 lg:h-10 text-white" />
    },
    {
      title: "Reward Tiers & Cycle Progress",
      description: "See your tier placement and cycle progress with clear reward potential",
      mockContent: "Tier 2 status, 67 points this cycle, 14 days remaining, $118 tier pool",
      icon: <Trophy className="w-7 h-7 lg:w-10 lg:h-10 text-white" />
    },
    {
      title: "Daily Streak Tracker",
      description: "Build momentum with daily learning streaks and bonus point multipliers",
      mockContent: "7-day streak active, 2x point multiplier, next lesson worth 20 points",
      icon: <Sparkles className="w-7 h-7 lg:w-10 lg:h-10 text-white" />
    }
  ], []);

  // Memoized steps data for performance (keeping original structure for other sections)
  const stepsData = useMemo(() => [
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
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Track Your Leaderboard Position",
      description: "Your points determine your spot on the leaderboard — and your shot at real cash rewards. Watch your ranking rise as you learn and take action.",
      screenshot: "leaderboard-screenshot.png",
      caption: "Your point total determines your leaderboard position and reward odds.",
      gradient: "from-accent to-accent-light"
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: "Compete for Cash Rewards",
      description: "Winners are selected using a point-weighted system — the more you learn and take action, the better your chances. Real cash rewards distributed monthly.",
      screenshot: "tier-dashboard.png",
      caption: "Top contributors win real cash through our point-weighted reward system.",
      gradient: "from-accent to-accent-light"
    }
  ], []);

  // Initialize carousel state management
  const carousel = useCarouselState(stepsData.length, 5000);

  const handleJoinEarlyAccess = useCallback(() => {
    // Set URL search params and navigate
    const url = new URL('/auth', window.location.origin);
    url.searchParams.set('mode', 'signup');
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
  const calculateRewardsPool = useCallback((members: number) => {
    const totalRevenue = members * 20; // Total monthly revenue
    const rewardsAllocation = totalRevenue * (rewardsPercentage / 100); // Dynamic percentage
    return rewardsAllocation;
  }, [rewardsPercentage]);

  const formatCurrency = useCallback((amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {
      return `$${amount}`;
    }
  }, []);

  const formatMembers = useCallback((count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(0)}K`;
    }
    return count.toString();
  }, []);

  // Comprehensive touch/swipe gesture handling for mobile
  const [touchState, setTouchState] = useState({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isDragging: false,
    threshold: 50 // Minimum swipe distance in pixels
  });

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    if (!touch) return;
    
    setTouchState(prev => ({
      ...prev,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isDragging: true
    }));
    
    // Pause auto-advance during touch interaction
    carousel.pauseAutoPlay();
  }, [carousel]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!touchState.isDragging) return;
    
    const touch = event.touches[0];
    if (!touch) return;
    
    setTouchState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY
    }));
    
    // Prevent default scroll behavior during horizontal swipes
    const deltaX = Math.abs(touch.clientX - touchState.startX);
    const deltaY = Math.abs(touch.clientY - touchState.startY);
    
    if (deltaX > deltaY && deltaX > 10) {
      event.preventDefault();
    }
  }, [touchState]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (!touchState.isDragging) return;
    
    const deltaX = touchState.currentX - touchState.startX;
    const deltaY = touchState.currentY - touchState.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    // Only process horizontal swipes that exceed threshold
    if (absX > touchState.threshold && absX > absY) {
      try {
        if (deltaX > 0) {
          // Swipe right - go to previous step
          carousel.prevStep();
          
          // Analytics tracking
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'carousel_swipe', {
              event_category: 'engagement',
              direction: 'right',
              current_step: carousel.currentStep,
              swipe_distance: absX
            });
          }
        } else {
          // Swipe left - go to next step
          carousel.nextStep();
          
          // Analytics tracking
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'carousel_swipe', {
              event_category: 'engagement',
              direction: 'left',
              current_step: carousel.currentStep,
              swipe_distance: absX
            });
          }
        }
      } catch (error) {
        console.error('Error handling swipe gesture:', error);
      }
    }
    
    // Reset touch state
    setTouchState(prev => ({
      ...prev,
      isDragging: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0
    }));
    
    // Resume auto-advance after touch interaction
    setTimeout(() => carousel.resumeAutoPlay(), 100);
  }, [touchState, carousel]);

  // Legacy swipe handler for compatibility
  const handleSwipeGesture = useCallback((direction: 'left' | 'right') => {
    if (direction === 'left') {
      carousel.nextStep();
    } else if (direction === 'right') {
      carousel.prevStep();
    }
  }, [carousel]);

  // Comprehensive keyboard navigation for accessibility
  const handleKeyNavigation = useCallback((event: React.KeyboardEvent) => {
    try {
      let handled = false;
      
      switch (event.key) {
        case 'ArrowLeft':
        case 'h': // Vim-style navigation
          event.preventDefault();
          carousel.prevStep();
          handled = true;
          break;
          
        case 'ArrowRight':
        case 'l': // Vim-style navigation
          event.preventDefault();
          carousel.nextStep();
          handled = true;
          break;
          
        case 'Home':
        case 'g': // Vim-style "go to beginning"
          event.preventDefault();
          carousel.goToStep(0);
          handled = true;
          break;
          
        case 'End':
        case 'G': // Vim-style "go to end"
          event.preventDefault();
          carousel.goToStep(stepsData.length - 1);
          handled = true;
          break;
          
        case ' ':
        case 'p': // Pause/play
          event.preventDefault();
          carousel.toggleAutoPlay();
          handled = true;
          break;
          
        case 'Escape':
          event.preventDefault();
          carousel.pauseAutoPlay();
          handled = true;
          break;
          
        default:
          // Handle number keys (1-4) for direct navigation
          const stepNumber = parseInt(event.key);
          if (stepNumber >= 1 && stepNumber <= stepsData.length) {
            event.preventDefault();
            carousel.goToStep(stepNumber - 1);
            handled = true;
          }
          break;
      }
      
      // Analytics tracking for keyboard navigation
      if (handled && typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'carousel_keyboard_nav', {
          event_category: 'engagement',
          key_pressed: event.key,
          current_step: carousel.currentStep,
          total_steps: stepsData.length
        });
      }
    } catch (error) {
      console.error('Error handling keyboard navigation:', error);
    }
  }, [carousel, stepsData.length]);

  // Intersection Observer for performance optimization
  const [sectionRef, setSectionRef] = useState<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!sectionRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const inView = entry.isIntersecting;
        
        setIsInView(inView);
        
        // Pause/resume auto-advance based on visibility
        if (inView && !carousel.hasUserInteracted) {
          carousel.resumeAutoPlay();
        } else {
          carousel.pauseAutoPlay();
        }
        
        // Analytics tracking for viewport visibility
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'carousel_visibility', {
            event_category: 'engagement',
            is_visible: inView,
            current_step: carousel.currentStep
          });
        }
      },
      {
        threshold: 0.5, // Trigger when 50% of element is visible
        rootMargin: '0px'
      }
    );

    observer.observe(sectionRef);

    return () => {
      observer.disconnect();
    };
  }, [sectionRef, carousel]);

  // Accessibility: Announce step changes to screen readers
  const [announceText, setAnnounceText] = useState('');
  
  useEffect(() => {
    const currentStepData = stepsData[carousel.currentStep];
    if (currentStepData) {
      setAnnounceText(`Step ${carousel.currentStep + 1} of ${stepsData.length}: ${currentStepData.title}`);
    }
  }, [carousel.currentStep, stepsData]);

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
                className="relative btn-primary btn-hero-gloss btn-enhanced-hover interactive-glow px-6 md:px-10 py-4 md:py-5 text-lg md:text-xl font-bold rounded-xl shadow-xl border-0 h-auto"
                onClick={handleJoinEarlyAccess}
              >
                <Trophy className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6 icon-bounce" />
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

      {/* App Preview - Interactive Phone Mockup */}
      <section id="preview" className="py-20 px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block bg-accent/10 backdrop-blur-sm border border-accent/20 rounded-full px-6 py-2 mb-6">
              <span className="text-accent font-semibold text-sm">PLATFORM PREVIEW</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">
              See What Progress
              <span className="block text-slate-900"> Looks Like</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
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
                          {screenshots[activeScreenshot].icon}
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
                          ? 'dashboard-card-primary' 
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
                          {React.cloneElement(screenshot.icon, {
                            className: `w-5 h-5 lg:w-6 lg:h-6 ${activeScreenshot === index ? 'text-white' : 'text-slate-600'}`
                          })}
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
            <div className="inline-block bg-accent-light/20 backdrop-blur-sm border border-accent-light/30 rounded-full px-6 py-2 mb-6 badge-premium-gloss magnetic-hover">
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
                className={`dashboard-card-primary rounded-xl ${item.borderColor} border-l-4 p-6 space-y-2`}
              >
                <div className="flex items-start space-x-4 relative z-10">
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
            <div className="inline-block bg-accent-light/20 backdrop-blur-sm border border-accent-light/30 rounded-full px-6 py-2 mb-6 badge-premium-gloss magnetic-hover">
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
              className="card-premium card-section-gloss card-floating rounded-2xl p-8 text-white"
            >
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6 magnetic-hover">
                <GraduationCap className="w-8 h-8 text-white icon-bounce" />
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
              className="card-premium card-section-gloss card-floating rounded-2xl p-8 text-white"
            >
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6 magnetic-hover">
                <Users className="w-8 h-8 text-white icon-bounce" />
              </div>
              <h4 className="text-xl font-bold text-white mb-4">Rewards Pool</h4>
              <p className="text-white/90 leading-relaxed">
                Part of every membership funds the rewards pool — meaning your progress helps build rewards for everyone. The bigger the community, the bigger the rewards.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bridge Section - Connect Trust to Action */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-semibold text-slate-900 mb-4">
              See the Collective Power in Action
            </h3>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
              The rewards pool described above isn't just theory. Move the slider below to see how community growth translates to real reward potential for every member.
            </p>
            
            {/* Subtle Arrow */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-accent/20 to-accent/30 flex items-center justify-center shadow-sm"
              >
                <ChevronDown className="w-4 h-4 text-accent" />
              </motion.div>
            </motion.div>
          </motion.div>
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
            <div className="inline-block bg-accent-light/20 backdrop-blur-sm border border-accent-light/30 rounded-full px-6 py-2 mb-6 badge-premium-gloss magnetic-hover">
              <span className="text-accent font-semibold text-sm">STRENGTH IN NUMBERS</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Toggle the Dial to See the Power of the Collective
            </h2>
          </motion.div>

          {/* Top Row: Interactive Controls */}
          <div className="mb-12">
            {/* Dial Control */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <label className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Users className="h-5 w-5 text-accent" />
                  Community Size
                </label>
                <span className="text-2xl font-bold text-accent">
                  {formatMembers(communitySize)} members
                </span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  value={communitySize}
                  onChange={(e) => setCommunitySize(parseInt(e.target.value))}
                  max={10000}
                  min={250}
                  step={250}
                  className="w-full h-3 bg-gradient-to-r from-slate-300 via-accent-light/60 to-accent rounded-lg appearance-none cursor-pointer slider-enhanced"
                />
                <div className="flex justify-between text-sm font-medium text-slate-600 mt-3">
                  <span>250 members</span>
                  <span className="text-accent">5K members</span>
                  <span>10K+ members</span>
                </div>
              </div>
            </motion.div>

            {/* Stats Cards Row */}
            <div className="flex flex-wrap justify-center gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="dashboard-card-primary stats-card-gloss card-floating rounded-xl p-4 text-center relative z-10 min-w-[200px] max-w-[240px]"
              >
                <div className="text-sm font-medium text-slate-600 mb-1">Rewards Allocation</div>
                <div className="text-2xl font-bold text-accent mb-1 stats-counter">
                  {rewardsPercentage}%
                </div>
                <div className="text-xs text-slate-500">of membership fees</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
                className="dashboard-card-primary stats-card-gloss card-floating rounded-xl p-4 text-center relative z-10 min-w-[200px] max-w-[240px]"
              >
                <div className="text-sm font-medium text-slate-600 mb-1">Monthly Pool Size</div>
                <div className="text-2xl font-bold text-accent mb-1 stats-counter">
                  {formatCurrency(calculateRewardsPool(communitySize))}
                </div>
                <div className="text-xs text-slate-500">available for rewards</div>
              </motion.div>
            </div>
          </div>

          {/* Bottom Row: Visual Results */}
          <div className="flex flex-wrap justify-center gap-8 items-start">
            {/* Dynamic Donut Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="flex flex-col items-center"
            >
              <div className="relative w-52 h-52 mb-4">
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
                    stroke="#1e3a8a"
                    strokeWidth="10"
                    strokeDasharray={`${rewardsPercentage * 2.199} ${(100 - rewardsPercentage) * 2.199}`}
                    strokeLinecap="round"
                    className="progress-pulse"
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
                    stroke="#64748b"
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
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-accent rounded"></div>
                  <span className="text-slate-700">{rewardsPercentage}% → Collective Rewards Pool</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-slate-500 rounded"></div>
                  <span className="text-slate-700">{100 - rewardsPercentage}% → Education & Platform Operations</span>
                </div>
              </div>
            </motion.div>

            {/* Top Reward Callout */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <div className="dashboard-card-primary stats-card-gloss card-floating rounded-xl p-4 w-full max-w-[240px] relative z-10">
                <div className="text-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent/80 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <Trophy className="w-5 h-5 text-white icon-bounce" />
                  </div>
                  <h4 className="text-base font-semibold text-slate-800 mb-1">Top Reward</h4>
                  <div className="text-xl font-bold text-accent mb-1 stats-counter">
                    {formatCurrency(Math.round(calculateRewardsPool(communitySize) * 0.05))}
                  </div>
                  <p className="text-xs text-slate-600">
                    5% of rewards pool goes to top performer
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Disclaimer */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <p className="text-sm text-slate-500 max-w-2xl mx-auto">
              * Rewards pool statistics shown are illustrative and based on projected membership levels. Actual rewards may vary based on community growth and platform performance.
            </p>
          </motion.div>
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
                      <CardContent className="p-6 text-center bg-gradient-to-r from-blue-700 to-blue-900 relative tier-badge-gloss tier-badge-enhanced">
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
                className="card-premium-button btn-hero-gloss btn-enhanced-hover interactive-glow text-white px-8 py-3 text-lg font-bold rounded-xl shadow-lg border-0 h-auto transition-all duration-300"
                onClick={handleJoinEarlyAccess}
              >
                <Trophy className="mr-2 h-5 w-5 icon-bounce" />
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
            <div className="inline-block bg-gradient-to-r from-blue-600/10 to-blue-800/10 backdrop-blur-sm border border-blue-200 rounded-full px-6 py-2 mb-6 badge-premium-gloss magnetic-hover">
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
                <Trophy className="mr-2 h-5 w-5 icon-bounce" />
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