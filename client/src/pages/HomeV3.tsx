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
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Upload
} from "lucide-react";

// Import app screenshots
import step1Screenshot from '@assets/Step 1 Learn & Complete Lessons_v1_1754287351239.png';
import step2Screenshot from '@assets/Step 2 Take Financial Actions_v1_1754287375585.png';
import step3Screenshot from '@assets/Step 3 Climb the Leaderboard_v1_1754287383280.png';
import step4Screenshot from '@assets/Step 4 Win Real Cash Rewards_v1_1754287391648.png';
import rewardsSystemScreenshot from '@assets/Rewards System (Tiers)_v1_1754288320243.png';

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

// Master Topics Component with responsive design
interface Topic {
  icon: React.ReactNode;
  title: string;
}

interface MasterTopicsSectionProps {
  topics: Topic[];
}

const MasterTopicsSection: React.FC<MasterTopicsSectionProps> = ({ topics }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTopic = () => {
    setCurrentIndex((prev) => (prev + 1) % topics.length);
  };

  const prevTopic = () => {
    setCurrentIndex((prev) => (prev - 1 + topics.length) % topics.length);
  };

  const goToTopic = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Mobile: Single Card with Navigation */}
      <div className="md:hidden">
        <div className="relative">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-6 rounded-xl bg-white/90 backdrop-blur-sm border border-slate-200 shadow-lg"
          >
            <div className="flex items-center justify-center space-x-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0">
                <div className="text-white">
                  {topics[currentIndex].icon}
                </div>
              </div>
              <h4 className="text-lg font-semibold text-slate-900 leading-tight text-center">
                {topics[currentIndex].title}
              </h4>
            </div>
          </motion.div>

          {/* Navigation Arrows */}
          <button
            onClick={prevTopic}
            className="absolute -left-6 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 flex items-center justify-center hover:bg-white hover:shadow-md transition-all duration-200"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <button
            onClick={nextTopic}
            className="absolute -right-6 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 flex items-center justify-center hover:bg-white hover:shadow-md transition-all duration-200"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Navigation Dots */}
        <div className="flex justify-center mt-6 space-x-2">
          {topics.map((_, index) => (
            <button
              key={index}
              onClick={() => goToTopic(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentIndex
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 scale-110'
                  : 'bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Desktop: Horizontal Scroll Layout */}
      <div className="hidden md:block">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex space-x-4 pb-4" style={{ width: 'max-content' }}>
            {topics.map((topic, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="group p-5 rounded-xl bg-white/90 backdrop-blur-sm hover:bg-white hover:shadow-md border border-slate-200 hover:border-slate-300 transition-all duration-300 flex-shrink-0"
                style={{ width: '280px' }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 transition-colors flex-shrink-0">
                    <div className="text-white">
                      {topic.icon}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-slate-900 leading-tight">
                      {topic.title}
                    </h4>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Enhanced Scroll Indicator */}
        <div className="flex justify-center mt-6">
          <div className="flex items-center space-x-2 bg-blue-50/80 backdrop-blur-sm border border-blue-200/50 rounded-full px-4 py-2">
            <ChevronLeft className="w-4 h-4 text-blue-600 animate-pulse" />
            <p className="text-sm font-medium text-blue-700">Scroll to explore more example lessons</p>
            <ChevronRight className="w-4 h-4 text-blue-600 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function HomeV3() {
  const [location, navigate] = useLocation();
  const [communitySize, setCommunitySize] = useState(5000);
  const [rewardsPercentage, setRewardsPercentage] = useState(79);
  const [activeScreenshot, setActiveScreenshot] = useState(0);
  
  // How It Works step-by-step process data with actual app screenshots
  const screenshots = useMemo(() => [
    {
      title: "Step 1: Learn & Complete Lessons",
      description: "Complete easily digestible lessons and quizzes to earn pool tickets and build your knowledge",
      screenshotPath: step1Screenshot,
      icon: <BookOpen className="w-7 h-7 lg:w-10 lg:h-10 text-white" />
    },
    {
      title: "Step 2: Take Financial Actions",
      description: "Get rewarded for making sound financial decisions. Upload proof of debt payments to earn more tickets",
      screenshotPath: step2Screenshot,
      icon: <Upload className="w-7 h-7 lg:w-10 lg:h-10 text-white" />
    },
    {
      title: "Step 3: Climb the Leaderboard",
      description: "Your number of tickets determines your tier placement. Higher tiers get larger shares of the total rewards pool",
      screenshotPath: step3Screenshot,
      icon: <Trophy className="w-7 h-7 lg:w-10 lg:h-10 text-white" />
    },
    {
      title: "Step 4: Win Real Cash Rewards",
      description: "At cycle end, winners are drawn on a ticket-weighted basis. The more tickets you have, the better your odds",
      screenshotPath: step4Screenshot,
      icon: <Sparkles className="w-7 h-7 lg:w-10 lg:h-10 text-white" />
    }
  ], []);

  // Memoized steps data for performance (keeping original structure for other sections)
  const stepsData = useMemo(() => [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Learn Financial Skills",
      description: "Complete short lessons and quizzes to build practical knowledge. Topics include budgeting, credit, debt, investing, and more. Earn tickets per module and quiz.",
      screenshot: "lesson-module.png",
      caption: "Complete short lessons like this to earn 20 tickets.",
      gradient: "from-accent to-accent-light"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Take Real Financial Actions", 
      description: "Submit proof of real-world financial actions — like paying down debt, increasing savings, or building a budget. Earn bonus tickets based on impact.",
      screenshot: "debt-submission.png",
      caption: "Verified debt payments earn big bonus tickets.",
      gradient: "from-accent to-accent-light"
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Track Your Leaderboard Position",
      description: "Your tickets determine your spot on the leaderboard — and your shot at real cash rewards. Watch your ranking rise as you learn and take action.",
      screenshot: "leaderboard-screenshot.png",
      caption: "Your ticket total determines your leaderboard position and reward odds.",
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
            Join bi-weekly cycles where you complete short financial lessons and actions to earn tickets. Compete with other members to win your share of the prize pool — the more tickets you earn, the better your odds.
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
          
          {/* Early Access Guarantees */}
          <motion.div
            className="text-center mt-16 md:mt-20 mb-16 md:mb-20 max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.8, ease: "easeOut" }}
          >
            <div className="inline-block bg-gradient-to-r from-blue-600/10 to-blue-800/10 backdrop-blur-sm border border-blue-200 rounded-full px-6 py-2 mb-6 badge-premium-gloss magnetic-hover">
              <span className="text-blue-700 font-semibold text-sm">EARLY ACCESS GUARANTEES</span>
            </div>
            <p className="text-slate-600 text-base md:text-lg mb-6 md:mb-8 max-w-2xl mx-auto">
              Here's what we guarantee every early access member:
            </p>
            
            {/* Animated Down Arrow */}
            <motion.div
              className="flex justify-center mb-6 md:mb-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 2.0 }}
            >
              <motion.div
                animate={{ 
                  y: [0, 8, 0],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600/10 to-purple-600/10 backdrop-blur-sm rounded-full border border-blue-200/50 shadow-lg"
              >
                <motion.svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 2.2 }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </motion.svg>
              </motion.div>
            </motion.div>
            
            {/* Clean Blue Card Format - Responsive 2x2 Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto items-stretch">
              {[
                {
                  title: "$5,000+ Minimum Pool Size"
                },
                {
                  title: "50% Member Fees To Rewards Pool"
                },
                {
                  title: "40%+ Minimum Member Win Rate"
                },
                {
                  title: "$250+ Minimum Top Reward"
                }
              ].map((guarantee, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 2.0 + (index * 0.1) }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full border-2 border-blue-200 hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <CardContent className="p-4 text-center bg-gradient-to-r from-blue-700 to-blue-900 relative tier-badge-gloss tier-badge-enhanced">
                      <div className="relative z-10">
                        <h3 className="text-base font-semibold text-white">
                          {guarantee.title}
                        </h3>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
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
            <div className="inline-block bg-gradient-to-r from-blue-600/10 to-blue-800/10 backdrop-blur-sm border border-blue-200 rounded-full px-6 py-2 mb-6 badge-premium-gloss magnetic-hover">
              <span className="text-blue-700 font-semibold text-sm">HOW IT WORKS</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">
              How FinBoost Works
              <span className="block text-slate-900">(and How You Win)</span>
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Four simple steps to turn your financial learning into real cash rewards
            </p>
          </motion.div>

          {/* Unified Responsive Layout */}
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-16 lg:items-center">
            {/* Phone Preview - Mobile Bottom, Desktop Right */}
            <div className="order-2 lg:order-2 flex flex-col items-center lg:items-start">
              {/* Mobile navigation with arrows and dots - positioned above phone */}
              <div className="lg:hidden flex items-center justify-center space-x-4 mb-4">
                {/* Left Arrow */}
                <button
                  onClick={() => {
                    const prevIndex = activeScreenshot === 0 ? screenshots.length - 1 : activeScreenshot - 1;
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
                        console.log('Dot clicked:', index, 'Previous state:', activeScreenshot);
                        setActiveScreenshot(index);
                      }}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        activeScreenshot === index 
                          ? 'bg-blue-600 w-8' 
                          : 'bg-slate-300 hover:bg-slate-400'
                      }`}
                      aria-label={`View ${screenshots[index].title}`}
                    />
                  ))}
                </div>

                {/* Right Arrow */}
                <button
                  onClick={() => {
                    const nextIndex = activeScreenshot === screenshots.length - 1 ? 0 : activeScreenshot + 1;
                    setActiveScreenshot(nextIndex);
                  }}
                  className="p-2 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white hover:scale-105"
                  aria-label="Next screenshot"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </button>
              </div>
              
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
                    
                    {/* App screenshot content */}
                    <div className="h-full bg-white overflow-hidden flex items-start justify-center">
                      <motion.img
                        key={`screenshot-${activeScreenshot}`}
                        src={screenshots[activeScreenshot].screenshotPath}
                        alt={screenshots[activeScreenshot].title}
                        className="max-w-full max-h-full object-contain"
                        initial={{ scale: 1.05, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        loading="lazy"
                      />
                    </div>
                  </div>
                  <div className="absolute bottom-1 lg:bottom-2 left-1/2 transform -translate-x-1/2 w-24 lg:w-32 h-1 bg-white/30 rounded-full"></div>
                </div>
              </motion.div>
            </div>

            {/* Interactive Cards - Responsive: Single flipping card on mobile, 4 cards on desktop */}
            <div className="order-1 lg:order-1">


              {/* Mobile: Single Flipping Card */}
              <div className="lg:hidden px-4">
                <motion.div
                  key={`mobile-card-${activeScreenshot}`}
                  className="dashboard-card-primary p-5 rounded-xl cursor-pointer"
                  onClick={() => {
                    const nextIndex = (activeScreenshot + 1) % screenshots.length;
                    console.log('Card flipped to:', nextIndex, 'Previous state:', activeScreenshot);
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
                        className: "w-6 h-6 text-white"
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
                                  ? 'bg-blue-600 w-6' 
                                  : 'bg-slate-300'
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
                        ? 'dashboard-card-primary' 
                        : 'bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-md border border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => {
                      console.log('Desktop card clicked:', index, 'Previous state:', activeScreenshot);
                      setActiveScreenshot(index);
                    }}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    animate={{ 
                      scale: activeScreenshot === index ? 1.02 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                        activeScreenshot === index 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                          : 'bg-slate-100 group-hover:bg-slate-200'
                      }`}>
                        {React.cloneElement(screenshot.icon, {
                          className: `w-6 h-6 ${activeScreenshot === index ? 'text-white' : 'text-slate-600'}`
                        })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg text-slate-900">
                            {screenshot.title}
                          </h3>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
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
            <div className="inline-block bg-gradient-to-r from-blue-600/10 to-blue-800/10 backdrop-blur-sm border border-blue-200 rounded-full px-6 py-2 mb-6 badge-premium-gloss magnetic-hover">
              <span className="text-blue-700 font-semibold text-sm">WHY FINBOOST</span>
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
                subtitle: "Student loans, credit cards, buy now pay later — every payment forward can earn you money back."
              },
              {
                title: "Rising Costs Reality", 
                subtitle: "Everything costs more, saving feels impossible. Small wins add up to real rewards."
              },
              {
                title: "Addressing Beyond Just Next Month",
                subtitle: "FinBoost is about freedom from near-term stress and building momentum toward long-term goals."
              },
              {
                title: "A Better Approach",
                subtitle: "Most apps focus on today's spending. We reward steps toward tomorrow's security."
              }
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
            <div className="inline-block bg-gradient-to-r from-blue-600/10 to-blue-800/10 backdrop-blur-sm border border-blue-200 rounded-full px-6 py-2 mb-6 badge-premium-gloss magnetic-hover">
              <span className="text-blue-700 font-semibold text-sm">MEMBERSHIP VALUE</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-6">
              How Your Membership Fuels the Movement
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your membership isn’t just a transaction — it’s your access to financial growth and real cash rewards funded by the community.
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
              <h4 className="text-xl font-bold text-white mb-4">Financial Modules</h4>
              <p className="text-white/90 leading-relaxed">
                A portion of your membership supports full access to our growing library of financial lessons, quizzes, and real-world action incentives — all designed to build genuine financial skills.
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
              <h4 className="text-xl font-bold text-white mb-4">Rewards Pool</h4>
              <p className="text-white/90 leading-relaxed">
                The majority of every membership funds the rewards pool — where you can win real cash by completing lessons and building your financial habits. The bigger the community, the bigger the rewards.
              </p>
            </motion.div>
          </div>
        </div>
      </section>



      {/* Reward Pool Mechanics - Show Real Impact */}
      <section id="pool-mechanics" className="py-20 px-4 bg-gradient-to-br from-blue-50/40 via-white to-purple-50/40">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-block bg-gradient-to-r from-blue-600/10 to-purple-600/10 backdrop-blur-sm border border-blue-200/50 rounded-full px-6 py-2 mb-6 shadow-lg">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-semibold text-sm">STRENGTH IN NUMBERS</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
              Toggle the Dial to See the Power of the Collective
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
              The rewards pool described above isn't just theory. Move the slider below to see how community growth translates to real reward potential for every member.
            </p>
          </motion.div>

          {/* Main Layout: Left Controls + Right Visual */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            
            {/* LEFT SIDE: Interactive Controls and Cards */}
            <div className="space-y-8">
              {/* Dial Control */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-6">
                  <label className="text-xl font-bold text-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    Community Size
                  </label>
                  <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
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
                    className="w-full h-4 bg-gradient-to-r from-slate-200 via-blue-400/60 to-purple-500 rounded-lg appearance-none cursor-pointer slider-enhanced shadow-inner"
                  />
                  <div className="flex justify-between text-sm font-semibold text-slate-600 mt-4">
                    <span>250 members</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">5K members</span>
                    <span>10K+ members</span>
                  </div>
                </div>
              </motion.div>

              {/* Stats Cards */}
              <div className="grid sm:grid-cols-3 gap-3">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-sm border border-blue-200/40 rounded-xl p-4 text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-xs font-semibold text-slate-600 mb-1">Illustrative Member<br />Rewards %</div>
                  <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-1">
                    50-90%
                  </div>
                  <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-1">
                    Guaranteed
                  </div>
                  <div className="text-xs text-slate-500 font-medium">back to members</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-sm border border-blue-200/40 rounded-xl p-4 text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-xs font-semibold text-slate-600 mb-1">Illustrative Monthly Pool<br />Size</div>
                  <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-1">
                    {formatCurrency(calculateRewardsPool(communitySize))}
                  </div>
                  <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-1">
                    Total Rewards
                  </div>
                  <div className="text-xs text-slate-500 font-medium">to be distributed</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-sm border border-blue-200/40 rounded-xl p-4 text-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-xs font-semibold text-slate-600 mb-1">Illustrative Top<br />Reward</div>
                  <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-1">
                    Up to {formatCurrency(Math.round(calculateRewardsPool(communitySize) * 0.05))}
                  </div>
                  <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-1">
                    Top Reward
                  </div>
                  <div className="text-xs text-slate-500 font-medium">to cycle winner</div>
                </motion.div>
              </div>
            </div>

            {/* RIGHT SIDE: Donut Chart Only */}
            <div className="flex justify-center lg:justify-start">
              {/* Dynamic Donut Chart */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true }}
                className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className="relative w-64 h-64 mb-6 mx-auto">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="35"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                    />
                    {/* Rewards percentage */}
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="35"
                      fill="none"
                      stroke="url(#rewardsGradient)"
                      strokeWidth="8"
                      strokeDasharray={`${rewardsPercentage * 2.199} ${(100 - rewardsPercentage) * 2.199}`}
                      strokeLinecap="round"
                      className="drop-shadow-lg"
                      initial={{ strokeDasharray: "109.95 109.95" }}
                      animate={{ strokeDasharray: `${rewardsPercentage * 2.199} ${(100 - rewardsPercentage) * 2.199}` }}
                      transition={{ duration: 1.2, ease: "easeInOut" }}
                    />
                    {/* Operations percentage */}
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="35"
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="8"
                      strokeDasharray={`${(100 - rewardsPercentage) * 2.199} ${rewardsPercentage * 2.199}`}
                      strokeDashoffset={`-${rewardsPercentage * 2.199}`}
                      strokeLinecap="round"
                      initial={{ strokeDasharray: "109.95 109.95" }}
                      animate={{ 
                        strokeDasharray: `${(100 - rewardsPercentage) * 2.199} ${rewardsPercentage * 2.199}`,
                        strokeDashoffset: `-${rewardsPercentage * 2.199}`
                      }}
                      transition={{ duration: 1.2, ease: "easeInOut" }}
                    />
                    
                    {/* Gradient definition */}
                    <defs>
                      <linearGradient id="rewardsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Center content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-4xl font-black text-slate-800">$20</div>
                    <div className="text-sm text-slate-500 font-medium">monthly membership</div>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-sm"></div>
                    <span className="text-slate-700 font-medium">Majority → Member Funded Cash Rewards Pool</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-slate-400 rounded-sm"></div>
                    <span className="text-slate-700 font-medium">Portion → Financial Education + Platform Access</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
          
          {/* Disclaimer */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <p className="text-sm text-slate-500 max-w-3xl mx-auto leading-relaxed">
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
            <div className="inline-block bg-gradient-to-r from-blue-600/10 to-blue-800/10 backdrop-blur-sm border border-blue-200 rounded-full px-6 py-2 mb-6 badge-premium-gloss magnetic-hover">
              <span className="text-blue-700 font-semibold text-sm">REWARDS SYSTEM</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Half of Members Earn Rewards Each Cycle
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Users are placed in tiers based on tickets. The more you learn, the more you earn. Tickets aren't just for progress — they increase your chances at real cash rewards. At the end of each cycle, members with more tickets are eligible for larger potential payouts. Winners are selected based on ticket-weighted random draws.
            </p>
          </motion.div>

          {/* Tier explanation with integrated phone */}
          <div className="relative mb-12">
            {/* Main content container */}
            <div className="flex flex-col lg:flex-row lg:gap-8 lg:items-start lg:justify-center">
              {/* Left side - Tier Cards */}
              <div className="w-full lg:w-auto lg:flex-shrink-0">
                <div className="flex flex-col gap-4 max-w-lg mx-auto lg:mx-0">
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
                        <CardContent className="p-4 text-center bg-gradient-to-r from-blue-700 to-blue-900 relative tier-badge-gloss tier-badge-enhanced">
                          <div className="relative z-10">
                            <h3 className="text-xl font-semibold text-white mb-1">
                              {tier.tier}
                            </h3>
                            <p className="text-white/90 text-sm">{tier.subtitle} = {tier.rewardLevel}</p>
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
                  className="text-center mt-8"
                >
                  <p className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    Higher Effort → Higher Tier → Larger Rewards
                  </p>
                </motion.div>
              </div>

              {/* Right side - Phone Frame (positioned closer on desktop) */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="flex justify-center mt-8 lg:mt-0 lg:ml-8"
              >
                <div className="relative w-48 h-[360px] lg:w-56 lg:h-[420px] bg-gradient-to-b from-slate-800 to-slate-900 rounded-[2rem] lg:rounded-[2.5rem] p-2 shadow-xl shadow-slate-900/50">
                  <div className="w-full h-full bg-white rounded-[2rem] lg:rounded-[2.5rem] overflow-hidden">
                    {/* Status bar */}
                    <div className="bg-slate-50 h-8 lg:h-12 flex items-center justify-between px-4 lg:px-6 text-xs font-medium text-slate-600">
                      <span>9:41</span>
                      <div className="flex space-x-1">
                        <div className="w-3 h-1 bg-slate-300 rounded-sm"></div>
                        <div className="w-3 h-1 bg-slate-300 rounded-sm"></div>
                        <div className="w-4 h-1 bg-green-500 rounded-sm"></div>
                      </div>
                    </div>
                    
                    {/* App screenshot content */}
                    <div className="h-full bg-white overflow-hidden flex items-start justify-center">
                      <img
                        src={rewardsSystemScreenshot}
                        alt="Tier Thresholds & Rewards Interface"
                        className="max-w-full max-h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  </div>
                  <div className="absolute bottom-1 lg:bottom-2 left-1/2 transform -translate-x-1/2 w-24 lg:w-32 h-1 bg-white/30 rounded-full"></div>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="text-center mt-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 btn-hero-gloss btn-enhanced-hover interactive-glow text-white px-8 py-3 text-lg font-bold rounded-xl shadow-lg border-0 h-auto transition-all duration-300"
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
              Some Examples of Your FinBoost Lessons
            </h2>
            <p className="text-lg leading-relaxed text-gray-700 max-w-3xl mx-auto">
              Real financial education via 3-5 minute lessons and interactive quizzes based on proven strategies for common real-life scenarios
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
            >

            </motion.div>
            
            {/* Mobile Single Card with Navigation + Desktop Grid */}
            <MasterTopicsSection topics={[
                {
                  icon: <Shield className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Navigate Auto Loans and Refinancing"
                },
                {
                  icon: <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Harness Compound Growth Power"
                },
                {
                  icon: <BookOpen className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Strategic Student Loan Repayment Plans"
                },

                {
                  icon: <Calculator className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Do Small Daily Purchases Really Add Up?"
                },
                {
                  icon: <CreditCard className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Master Credit Utilization and Borrowing Power"
                },
                {
                  icon: <AlertTriangle className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Navigate Buy Now, Pay Later Risks"
                },
                {
                  icon: <PiggyBank className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Build Smart Emergency Fund Strategy"
                },
                {
                  icon: <Target className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Rethink the 30% Rent Rule"
                },
                {
                  icon: <DollarSign className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Master Debt Payoff Strategies"
                },
                {
                  icon: <Calculator className="h-5 w-5 lg:h-6 lg:w-6" />,
                  title: "Decode APR vs APY Differences"
                }
              ]} />

          </div>
        </div>
      </section>


      {/* Final CTA - Blue to Purple Gradient Background */}
      <section id="cta" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 px-6 text-center">
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