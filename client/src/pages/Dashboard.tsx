import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { 
  BookOpen, 
  Trophy, 
  TrendingUp, 
  Users, 
  Upload, 
  Star,
  Target,
  DollarSign,
  Award,
  Activity,
  Crown,
  Medal,
  User,
  User as UserIcon,
  Mail,
  CreditCard,
  Save,
  CheckCircle,
  Info,
  ChevronRight
} from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import TierStats from "@/components/TierStats";
import { WelcomeModal, Tour, dashboardTourSteps, desktopTourSteps } from "@/components/onboarding";
import { onboardingStorage } from "@/lib/onboardingStorage";
import { isFeatureEnabled } from "@/lib/featureFlags";
import finboostLogo from "@/assets/finboost-logo-v10.png";
import { DashboardColors } from "@/lib/colors";
import PointsSummary from "@/components/PointsSummary";
import PointsHistory from "@/components/PointsHistory";
import TicketsActions from "@/components/PointsActions";
import RewardsHistory from "@/components/RewardsHistory";
import RewardsSummary from "@/components/RewardsSummary";
import Leaderboard from "@/components/Leaderboard";
import ReferralSystem from "@/components/ReferralSystem";
import StreakDisplay from "@/components/StreakDisplay";
import CommunityGrowthDial from "@/components/CommunityGrowthDial";
import TierProgressTable from "@/components/TierProgressTable";
import SectionHeader from "@/components/SectionHeader";
import PredictionsContent from "@/components/PredictionsContent";
import DashboardStats from "@/components/DashboardStats";
import WinnerCelebrationBanner from "@/components/WinnerCelebrationBanner";
import KeepGoingMessage from "@/components/KeepGoingMessage";
import { educationContent } from "@/data/educationContent";
import VerificationBanner from "@/components/VerificationBanner";



interface User {
  id: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  totalPoints: number;
  currentCyclePoints: number;
  tier: string;
  currentStreak?: number;
  longestStreak?: number;
  subscriptionStatus?: string;
  paypalEmail?: string;
  payoutMethod?: string;
  subscriptionAmount?: number;
  subscriptionCurrency?: string;
  subscriptionPaymentMethod?: string;
  subscriptionStartDate?: string;
  lastPaymentDate?: string;
  nextBillingDate?: string;
  lastPaymentAmount?: number;
  lastPaymentStatus?: string;
  emailVerified?: boolean;
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboardData, setLeaderboardData] = useState<any>(null);
  const [tierThresholds, setTierThresholds] = useState<any>(null);
  const [lessonProgress, setLessonProgress] = useState<any[]>([]);
  // Initialize activeTab from URL parameters
  const getInitialTab = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['overview', 'learn', 'referrals', 'rewards', 'board', 'profile'].includes(tabParam)) {
      return tabParam;
    }
    return 'overview';
  };
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [publishedModules, setPublishedModules] = useState<any[]>([]);
  const [poolData, setPoolData] = useState({ 
    totalPool: 0, 
    premiumUsers: 0, 
    totalUsers: 0,
    tierBreakdown: undefined as { tier1: number; tier2: number; tier3: number; } | undefined
  });
  const [distributionInfo, setDistributionInfo] = useState<any>(null);
  const [paypalEmail, setPaypalEmail] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('paypal');
  const [savingPayment, setSavingPayment] = useState(false);

  // Onboarding state management
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [onboardingProgress, setOnboardingProgress] = useState({
    firstLesson: false,
    viewedRewards: false,
    referralAdded: false
  });

  const LeaderboardSidebar = () => {
    if (!leaderboardData) return null;
    
    return (
      <div className="w-80 bg-white border-l border-gray-200 h-full overflow-y-auto p-6">
        <div className="space-y-6">
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Tier 1 - Top Performers</h3>
            <div className="space-y-3">
              {leaderboardData.tier1?.slice(0, 3).map((entry: any, index: number) => (
                <div key={entry.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {index === 0 && <Crown className={`h-5 w-5 ${DashboardColors.iconColor.primary}`} />}
                    {index === 1 && <Medal className={`h-5 w-5 ${DashboardColors.iconColor.neutral}`} />}
                    {index === 2 && <Medal className={`h-5 w-5 ${DashboardColors.iconColor.neutral}`} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{entry.username}</p>
                    <p className="text-xs text-gray-500">{entry.currentCyclePoints} points</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Tier 2</h3>
            <div className="space-y-2">
              {leaderboardData.tier2?.slice(0, 5).map((entry: any) => (
                <div key={entry.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm truncate">{entry.username}</span>
                  <span className="text-xs text-gray-500">{entry.currentCyclePoints}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Onboarding orchestration logic
  const initializeOnboarding = useCallback(() => {
    if (!isFeatureEnabled('ONBOARDING_V1') || !user) return;
    
    const hasSeenWelcome = onboardingStorage.hasSeenWelcome();
    const hasTourCompleted = onboardingStorage.hasTourCompleted();
    
    // Check for new user onboarding triggers
    const url = new URL(window.location.href);
    const fromQuery = url.searchParams.get("onboard") === "1";
    const fromFlag = localStorage.getItem("fb.onboard.start") === "1";
    
    // Show welcome modal for first-time users OR new registrations
    if (!hasSeenWelcome || (fromQuery || fromFlag)) {
      setShowWelcomeModal(true);
    }
    
    // Update progress tracking from storage
    setOnboardingProgress({
      firstLesson: onboardingStorage.hasStartedFirstLesson(),
      viewedRewards: onboardingStorage.hasViewedRewards(),
      referralAdded: onboardingStorage.hasAddedReferral()
    });
  }, [user]);

  const handleWelcomeStart = () => {
    setShowWelcomeModal(false);
    onboardingStorage.setWelcomeSeen();
    
    // Clean up onboarding triggers
    localStorage.removeItem("fb.onboard.start");
    const url = new URL(window.location.href);
    if (url.searchParams.has("onboard")) {
      url.searchParams.delete("onboard");
      window.history.replaceState({}, '', url.toString());
    }
    
    setShowTour(true);
  };

  const handleWelcomeSkip = () => {
    setShowWelcomeModal(false);
    onboardingStorage.setWelcomeSeen();
    
    // Clean up onboarding triggers
    localStorage.removeItem("fb.onboard.start");
    const url = new URL(window.location.href);
    if (url.searchParams.has("onboard")) {
      url.searchParams.delete("onboard");
      window.history.replaceState({}, '', url.toString());
    }
    
    // Mark tour as seen for per-user tracking
    const userId = user?.id || user?.email || "anon";
    const seenKey = `fb.tour.seen:${userId}`;
    localStorage.setItem(seenKey, "1");
    
    // Optionally POST to server (no-op if endpoint doesn't exist)
    fetch("/api/users/me/seen-tour", { method: "POST" }).catch(() => {});
  };

  const handleTourComplete = () => {
    setShowTour(false);
    onboardingStorage.setTourCompleted();
    
    // Clean up onboarding triggers
    localStorage.removeItem("fb.onboard.start");
    const url = new URL(window.location.href);
    if (url.searchParams.has("onboard")) {
      url.searchParams.delete("onboard");
      window.history.replaceState({}, '', url.toString());
    }
    
    // Mark tour as seen for per-user tracking
    const userId = user?.id || user?.email || "anon";
    const seenKey = `fb.tour.seen:${userId}`;
    localStorage.setItem(seenKey, "1");
    
    // Optionally POST to server (no-op if endpoint doesn't exist)
    fetch("/api/users/me/seen-tour", { method: "POST" }).catch(() => {});
  };

  const handleTourSkip = () => {
    setShowTour(false);
    onboardingStorage.setTourCompleted();
    
    // Clean up onboarding triggers
    localStorage.removeItem("fb.onboard.start");
    const url = new URL(window.location.href);
    if (url.searchParams.has("onboard")) {
      url.searchParams.delete("onboard");
      window.history.replaceState({}, '', url.toString());
    }
    
    // Mark tour as seen for per-user tracking
    const userId = user?.id || user?.email || "anon";
    const seenKey = `fb.tour.seen:${userId}`;
    localStorage.setItem(seenKey, "1");
    
    // Optionally POST to server (no-op if endpoint doesn't exist)
    fetch("/api/users/me/seen-tour", { method: "POST" }).catch(() => {});
  };

  const handleTaskComplete = (task: keyof typeof onboardingProgress) => {
    if (task === 'firstLesson') {
      onboardingStorage.setFirstLessonStarted();
      setActiveTab('learn');
    } else if (task === 'viewedRewards') {
      onboardingStorage.setRewardsViewed();
      setActiveTab('rewards');
    } else if (task === 'referralAdded') {
      onboardingStorage.setReferralAdded();
      setActiveTab('referrals');
    }
    
    setOnboardingProgress(prev => ({
      ...prev,
      [task]: true
    }));
  };

  // Listen for URL changes to update active tab
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam && ['overview', 'learn', 'referrals', 'rewards', 'board', 'profile'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Update URL when tab changes
  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const currentTab = currentUrl.searchParams.get('tab') || 'overview';
    
    if (currentTab !== activeTab) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('tab', activeTab);
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Check for authToken in URL (auto-login after email verification)
        const urlParams = new URLSearchParams(window.location.search);
        const authTokenFromUrl = urlParams.get('authToken');
        const isVerified = urlParams.get('verified');
        
        if (authTokenFromUrl) {
          // Store the token and clean up the URL
          localStorage.setItem('token', authTokenFromUrl);
          
          // Remove the token from URL for security
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('authToken');
          window.history.replaceState({}, '', newUrl.toString());
          
          // Show success message if coming from email verification
          if (isVerified === 'true') {
            toast({
              title: "Email Verified!",
              description: "Welcome to FinBoost! Your email has been verified and you're now logged in.",
            });
          }
        }

        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No authentication token found, redirecting to login');
          setLocation('/auth');
          return;
        }

        // Fetch published modules first (no auth required)
        try {
          const modulesResponse = await fetch('/api/modules');
          
          if (modulesResponse.ok) {
            const modulesData = await modulesResponse.json();
            if (modulesData.success && modulesData.modules) {
              setPublishedModules(modulesData.modules);
            }
          }
        } catch (modulesError) {
          console.error('Modules fetch failed:', modulesError);
          setPublishedModules([]);
        }

        // Fetch user data
        const userResponse = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUser(userData.user);
          // Populate PayPal form with existing data
          setPaypalEmail(userData.user.paypalEmail || '');
          setPayoutMethod(userData.user.payoutMethod || 'paypal');
        } else if (userResponse.status === 401 || userResponse.status === 500) {
          console.log('Authentication failed (malformed token), clearing and redirecting to login');
          localStorage.removeItem('token');
          setLocation('/auth');
          return;
        }

        // Fetch lesson progress
        const progressResponse = await fetch('/api/user/progress', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          setLessonProgress(progressData.progress || []);
        }

        // Fetch cycle-based leaderboard data
        try {
          const leaderboardResponse = await fetch('/api/cycles/leaderboard', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (leaderboardResponse.ok) {
            const leaderboardData = await leaderboardResponse.json();
            setLeaderboardData(leaderboardData);
          }
        } catch (leaderboardError) {
          console.error('Leaderboard fetch failed:', leaderboardError);
        }

        // Fetch current cycle tier thresholds
        try {
          const thresholdsResponse = await fetch('/api/cycles/current/tier-thresholds', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (thresholdsResponse.ok) {
            const thresholdsData = await thresholdsResponse.json();
            setTierThresholds(thresholdsData);
          }
        } catch (thresholdsError) {
          console.error('Thresholds fetch failed:', thresholdsError);
        }

        // Fetch pool data for CommunityGrowthDial
        try {
          const poolResponse = await fetch('/api/cycles/pool', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (poolResponse.ok) {
            const poolData = await poolResponse.json();
            console.log('Pool data received:', poolData);
            setPoolData(poolData);
          } else {
            console.error('Pool fetch failed with status:', poolResponse.status);
          }
        } catch (poolError) {
          console.error('Pool fetch error:', poolError);
        }

        // Fetch cycle distribution info for CommunityGrowthDial
        try {
          const distributionResponse = await fetch('/api/cycles/distribution', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (distributionResponse.ok) {
            const distributionData = await distributionResponse.json();
            setDistributionInfo(distributionData);
          }
        } catch (distributionError) {
          console.error('Distribution fetch failed:', distributionError);
        }

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // Only show error toast for authentication failures or critical errors
        if (error instanceof Error && error.message.includes('401')) {
          setLocation('/login');
        } else {
          // Suppress general errors since individual API calls handle their own error states
          console.warn('Some dashboard data may not have loaded completely');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [setLocation, toast]);

// --- Auto-refresh profile when tab regains focus (so email verification banner disappears promptly) ---
const refetchMe = useCallback(async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const me = await res.json();
      if (me && me.user) {
        // Update state and localStorage so UI (including VerificationBanner) reflects changes
        localStorage.setItem('user', JSON.stringify(me.user));
        setUser(me.user);
      }
    }
  } catch {}
}, []);

useEffect(() => {
  const onFocus = () => refetchMe();
  window.addEventListener('focus', onFocus);
  return () => window.removeEventListener('focus', onFocus);
}, [refetchMe]);



  // Initialize onboarding when user data is loaded
  useEffect(() => {
    if (user) {
      initializeOnboarding();
    }
  }, [user, initializeOnboarding]);

  const getTierColor = (tier: string) => {
    // Use consistent neutral colors for all tier badges
    return DashboardColors.accent.neutral;
  };

  const getTierDisplayName = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'tier1':
        return 'Tier 1';
      case 'tier2':
        return 'Tier 2';
      case 'tier3':
        return 'Tier 3';
      default:
        return 'Tier 3';
    }
  };

  const isAdmin = (user: User | null) => {
    return user?.email === 'lafleur.andrew@gmail.com';
  };

  // Save PayPal payment information
  const handleSavePaymentInfo = async () => {
    if (!paypalEmail.trim()) {
      toast({
        title: "Error",
        description: "PayPal email is required",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(paypalEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setSavingPayment(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/payment-info', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          paypalEmail: paypalEmail.trim(),
          payoutMethod
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Update user state with new payment info
        setUser(prev => prev ? {
          ...prev,
          paypalEmail: data.paypalEmail,
          payoutMethod: data.payoutMethod
        } : null);

        toast({
          title: "Success",
          description: "Payment information saved successfully",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to save payment information",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save payment information",
        variant: "destructive",
      });
    } finally {
      setSavingPayment(false);
    }
  };

  // Get the completed lesson IDs from lessonProgress
  const completedLessonIds = lessonProgress.map(progress => progress.moduleId.toString());

  // Validate module data integrity before rendering
  const validateModule = (module: any) => {
    return module && 
           module.id && 
           module.title && 
           typeof module.id === 'number' &&
           typeof module.title === 'string';
  };

  // Filter out invalid modules and log validation results
  const validPublishedModules = publishedModules.filter(validateModule);
  const invalidModules = publishedModules.filter(module => !validateModule(module));
  
  if (invalidModules.length > 0) {
    console.warn('Invalid modules detected:', invalidModules);
  }

  // Use validated modules only
  const publishedLessons = validPublishedModules;
  const availableLessons = publishedLessons.slice(0, isMobile ? 3 : 6);
  const allAvailableLessons = publishedLessons;

  // Check if user is premium
  const isUserPremium = user?.subscriptionStatus === 'active';

  console.log('Module validation results:');
  console.log('- Total fetched modules:', publishedModules.length);
  console.log('- Valid modules:', validPublishedModules.length);
  console.log('- Invalid modules:', invalidModules.length);
  console.log('- Available lessons for Overview:', availableLessons.length);
  console.log('- Completed lesson IDs:', completedLessonIds);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" role="status" aria-live="polite">
        <div className="text-center space-y-4">
          <div className={`animate-spin w-8 h-8 border-4 ${DashboardColors.accent.primary.replace('bg-gradient-to-r', 'border-blue-600')} border-t-transparent rounded-full mx-auto`} aria-hidden="true" />
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-900">Loading your dashboard...</p>
            <p className="text-sm text-gray-600">Getting your latest progress and rewards</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Header with accessibility improvements */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b sticky top-0 z-50" role="banner">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img src={finboostLogo} alt="FinBoost Logo" className="h-8 w-auto" />
              <h1 className="text-2xl font-bold text-gray-900 hidden sm:block font-heading">
                FinBoost
              </h1>
            </div>

            {/* User Section */}
            <div className="flex items-center space-x-4">
              {/* Admin Link */}
              {isAdmin(user) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLocation('/admin')}
                  className="hidden sm:flex"
                >
                  <User className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}

              {/* User Badge */}
              <div className="flex items-center space-x-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.username || user?.email}</p>
                  <Badge variant="secondary" className={getTierColor(user?.tier || 'tier3')}>
                    {getTierDisplayName(user?.tier || 'tier3')}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-sm font-medium text-gray-700">
                    <Trophy className="h-4 w-4" />
                    <span>{user?.totalPoints?.toLocaleString() || '0'} pts</span>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  setLocation('/');
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Email verification banner */}
      <VerificationBanner emailVerified={user?.emailVerified} email={user?.email} />

      {/* Main Content */}
      <div className="flex">
        {/* Main dashboard content */}
        <div className={`flex-1 ${activeTab === 'board' && !isMobile ? 'pr-80' : ''}`}>
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Welcome Banner */}
            <WinnerCelebrationBanner userId={user?.id} />

            {/* Tabs Navigation with improved accessibility */}
            <nav className="mb-6" role="tablist" aria-label="Dashboard navigation">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-white/50 backdrop-blur-sm border border-gray-200">
                  <TabsTrigger value="overview" className="text-xs sm:text-sm" role="tab" aria-controls="overview-panel">
                    <Activity className="h-4 w-4 mr-1 sm:mr-2" aria-hidden="true" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="learn" className="text-xs sm:text-sm" role="tab" aria-controls="learn-panel">
                    <BookOpen className="h-4 w-4 mr-1 sm:mr-2" aria-hidden="true" />
                    Learn
                  </TabsTrigger>
                  <TabsTrigger value="referrals" className="text-xs sm:text-sm" role="tab" aria-controls="referrals-panel">
                    <Users className="h-4 w-4 mr-1 sm:mr-2" aria-hidden="true" />
                    Referrals
                  </TabsTrigger>
                  <TabsTrigger value="rewards" className="text-xs sm:text-sm" role="tab" aria-controls="rewards-panel">
                    <Trophy className="h-4 w-4 mr-1 sm:mr-2" aria-hidden="true" />
                    Rewards
                  </TabsTrigger>
                  <TabsTrigger value="board" className="text-xs sm:text-sm" role="tab" aria-controls="board-panel">
                    <Award className="h-4 w-4 mr-1 sm:mr-2" aria-hidden="true" />
                    Board
                  </TabsTrigger>
                  <TabsTrigger value="profile" className="text-xs sm:text-sm" role="tab" aria-controls="profile-panel">
                    <UserIcon className="h-4 w-4 mr-1 sm:mr-2" aria-hidden="true" />
                    Profile
                  </TabsTrigger>
                </TabsList>

                {/* Tab Content */}
                <TabsContent value="overview" className="mt-6 space-y-6" id="overview-panel" role="tabpanel" tabIndex={0}>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left column - Stats and Progress */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* User Summary Cards */}
                      <DashboardStats user={user} />

                      {/* Streak Display */}
                      <StreakDisplay user={user} />

                      {/* Community Growth */}
                      <CommunityGrowthDial
                        totalPool={poolData.totalPool}
                        premiumUsers={poolData.premiumUsers}
                        totalUsers={poolData.totalUsers}
                        nextDate={distributionInfo?.nextDate}
                        daysUntilDistribution={distributionInfo?.daysUntilDistribution}
                      />

                      {/* Tier Progress */}
                      <TierProgressTable user={user} tierThresholds={tierThresholds} />

                      {/* Keep Going Message */}
                      <KeepGoingMessage 
                        user={user} 
                        onTaskComplete={handleTaskComplete}
                        completedTasks={onboardingProgress}
                      />

                      {/* Quick Learning Section */}
                      <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow" data-tour="learn-quick">
                        <CardHeader className="pb-3">
                          <SectionHeader
                            icon={BookOpen}
                            title="Continue Learning"
                            subtitle="Pick up where you left off or start something new"
                          />
                        </CardHeader>
                        <CardContent>
                          {availableLessons.length === 0 ? (
                            <div className="text-center py-8">
                              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-600 mb-4">No lessons available yet</p>
                              <p className="text-sm text-gray-500">Check back soon for new content!</p>
                            </div>
                          ) : (
                            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                              {availableLessons.map((lesson: any) => {
                                const isCompleted = completedLessonIds.includes(lesson.id.toString());
                                const isPremiumContent = lesson.isPremium === true || lesson.isPremium === 1;
                                const canAccess = !isPremiumContent || isUserPremium;

                                return (
                                  <div 
                                    key={lesson.id} 
                                    className={`relative p-4 bg-white border rounded-lg hover:shadow-md transition-all duration-200 ${canAccess ? 'cursor-pointer hover:border-blue-300' : 'opacity-60'}`}
                                    onClick={() => canAccess && setLocation(`/learn/${lesson.id}`)}
                                    role="button"
                                    tabIndex={canAccess ? 0 : -1}
                                    aria-label={`${lesson.title} lesson ${isCompleted ? '(completed)' : ''} ${!canAccess ? '(premium required)' : ''}`}
                                    onKeyDown={(e) => {
                                      if ((e.key === 'Enter' || e.key === ' ') && canAccess) {
                                        e.preventDefault();
                                        setLocation(`/learn/${lesson.id}`);
                                      }
                                    }}
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <h3 className="font-medium text-sm text-gray-900 line-clamp-2">
                                        {lesson.title}
                                      </h3>
                                      <div className="flex items-center space-x-1 ml-2">
                                        {isPremiumContent && (
                                          <Star className="h-3 w-3 text-yellow-500 flex-shrink-0" aria-label="Premium content" />
                                        )}
                                        {isCompleted && (
                                          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" aria-label="Completed" />
                                        )}
                                      </div>
                                    </div>
                                    {lesson.description && (
                                      <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                                        {lesson.description}
                                      </p>
                                    )}
                                    {!canAccess && (
                                      <div className="text-xs text-yellow-600 font-medium">
                                        Premium required
                                      </div>
                                    )}
                                    <div className="flex items-center justify-between mt-3">
                                      <div className="flex items-center space-x-2">
                                        <div className="flex items-center space-x-1">
                                          <Target className="h-3 w-3 text-blue-600" />
                                          <span className="text-xs font-medium text-blue-600">
                                            {lesson.pointValue || 50} pts
                                          </span>
                                        </div>
                                      </div>
                                      {canAccess && (
                                        <ChevronRight className="h-3 w-3 text-gray-400" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
                          {availableLessons.length > 0 && (
                            <div className="mt-4 text-center">
                              <Button 
                                variant="outline" 
                                onClick={() => setActiveTab('learn')}
                                className="hover:bg-blue-50 hover:border-blue-300"
                              >
                                View All Lessons
                                <ChevronRight className="h-4 w-4 ml-2" />
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Right column - Quick Stats and Actions */}
                    <div className="space-y-6">
                      {/* Points Summary */}
                      <PointsSummary user={user} />

                      {/* Quick Actions */}
                      <TicketsActions />

                      {/* Tier Stats */}
                      <TierStats user={user} leaderboardData={leaderboardData} tierThresholds={tierThresholds} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="learn" className="mt-6" id="learn-panel" role="tabpanel" tabIndex={0}>
                  <div className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Financial Education</h2>
                      <p className="text-gray-600">Build your financial knowledge and earn points</p>
                    </div>

                    {allAvailableLessons.length === 0 ? (
                      <Card className="border-gray-200">
                        <CardContent className="text-center py-12">
                          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Lessons Available</h3>
                          <p className="text-gray-600 mb-4">We're working hard to bring you quality financial education content.</p>
                          <p className="text-sm text-gray-500">Check back soon for new lessons!</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {allAvailableLessons.map((lesson: any) => {
                          const isCompleted = completedLessonIds.includes(lesson.id.toString());
                          const isPremiumContent = lesson.isPremium === true || lesson.isPremium === 1;
                          const canAccess = !isPremiumContent || isUserPremium;

                          return (
                            <Card 
                              key={lesson.id} 
                              className={`border-gray-200 hover:shadow-lg transition-all duration-300 ${canAccess ? 'cursor-pointer hover:border-blue-300' : 'opacity-60'}`}
                              onClick={() => canAccess && setLocation(`/learn/${lesson.id}`)}
                              role="button"
                              tabIndex={canAccess ? 0 : -1}
                              aria-label={`${lesson.title} lesson ${isCompleted ? '(completed)' : ''} ${!canAccess ? '(premium required)' : ''}`}
                              onKeyDown={(e) => {
                                if ((e.key === 'Enter' || e.key === ' ') && canAccess) {
                                  e.preventDefault();
                                  setLocation(`/learn/${lesson.id}`);
                                }
                              }}
                            >
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                  <CardTitle className="text-lg line-clamp-2 pr-2">
                                    {lesson.title}
                                  </CardTitle>
                                  <div className="flex items-center space-x-1">
                                    {isPremiumContent && (
                                      <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" aria-label="Premium content" />
                                    )}
                                    {isCompleted && (
                                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" aria-label="Completed" />
                                    )}
                                  </div>
                                </div>
                                {lesson.description && (
                                  <CardDescription className="line-clamp-3">
                                    {lesson.description}
                                  </CardDescription>
                                )}
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  {!canAccess && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                      <div className="flex items-center space-x-2">
                                        <Star className="h-4 w-4 text-yellow-600" />
                                        <span className="text-sm font-medium text-yellow-800">Premium Content</span>
                                      </div>
                                      <p className="text-xs text-yellow-700 mt-1">
                                        Upgrade to access this lesson
                                      </p>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <Target className="h-4 w-4 text-blue-600" />
                                      <span className="text-sm font-medium text-blue-600">
                                        {lesson.pointValue || 50} points
                                      </span>
                                    </div>
                                    {canAccess && (
                                      <ChevronRight className="h-4 w-4 text-gray-400" />
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}

                    {/* Static education content as fallback */}
                    {allAvailableLessons.length === 0 && (
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {educationContent.map((lesson, index) => (
                          <Card 
                            key={index} 
                            className="border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-blue-300"
                            onClick={() => setLocation(`/learn/static/${index + 1}`)}
                          >
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg">
                                {lesson.title}
                              </CardTitle>
                              <CardDescription>
                                {lesson.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Target className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm font-medium text-blue-600">
                                    {lesson.points} points
                                  </span>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="referrals" className="mt-6" id="referrals-panel" role="tabpanel" tabIndex={0}>
                  <ReferralSystem />
                </TabsContent>

                <TabsContent value="rewards" className="mt-6 space-y-6" id="rewards-panel" role="tabpanel" tabIndex={0}>
                  <div className="space-y-6">
                    {/* Rewards Summary */}
                    <RewardsSummary user={user} />

                    {/* Predictions Section */}
                    <PredictionsContent user={user} />

                    {/* Rewards History */}
                    <RewardsHistory />
                  </div>
                </TabsContent>

                <TabsContent value="board" className="mt-6" id="board-panel" role="tabpanel" tabIndex={0}>
                  <Leaderboard />
                </TabsContent>

                <TabsContent value="profile" className="mt-6 space-y-6" id="profile-panel" role="tabpanel" tabIndex={0}>
                  <div className="max-w-2xl mx-auto space-y-6">
                    {/* Profile Information */}
                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <UserIcon className="h-5 w-5" />
                          <span>Profile Information</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Username</label>
                            <p className="mt-1 text-sm text-gray-900">{user?.username}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Current Tier</label>
                            <Badge variant="secondary" className={`mt-1 ${getTierColor(user?.tier || 'tier3')}`}>
                              {getTierDisplayName(user?.tier || 'tier3')}
                            </Badge>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Total Points</label>
                            <p className="mt-1 text-sm text-gray-900">{user?.totalPoints?.toLocaleString() || '0'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Payment Information */}
                    <Card className="border-gray-200">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <CreditCard className="h-5 w-5" />
                          <span>Payment Information</span>
                        </CardTitle>
                        <CardDescription>
                          Configure your PayPal email for reward payouts
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="paypal-email" className="block text-sm font-medium text-gray-700 mb-1">
                              PayPal Email
                            </label>
                            <input
                              id="paypal-email"
                              type="email"
                              value={paypalEmail}
                              onChange={(e) => setPaypalEmail(e.target.value)}
                              placeholder="your.email@example.com"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              This email will be used for PayPal reward distributions
                            </p>
                          </div>
                          
                          <Button 
                            onClick={handleSavePaymentInfo}
                            disabled={savingPayment}
                            className="w-full sm:w-auto"
                          >
                            {savingPayment ? (
                              <>
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Payment Info
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Subscription Information */}
                    {user?.subscriptionStatus && (
                      <Card className="border-gray-200">
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Star className="h-5 w-5" />
                            <span>Subscription</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-700">Status</label>
                              <Badge variant={user.subscriptionStatus === 'active' ? 'default' : 'secondary'} className="mt-1 block w-fit">
                                {user.subscriptionStatus}
                              </Badge>
                            </div>
                            {user.subscriptionAmount && (
                              <div>
                                <label className="text-sm font-medium text-gray-700">Amount</label>
                                <p className="mt-1 text-sm text-gray-900">
                                  ${(user.subscriptionAmount / 100).toFixed(2)} {user.subscriptionCurrency?.toUpperCase()}
                                </p>
                              </div>
                            )}
                            {user.nextBillingDate && (
                              <div>
                                <label className="text-sm font-medium text-gray-700">Next Billing</label>
                                <p className="mt-1 text-sm text-gray-900">
                                  {new Date(user.nextBillingDate).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                            {user.subscriptionPaymentMethod && (
                              <div>
                                <label className="text-sm font-medium text-gray-700">Payment Method</label>
                                <p className="mt-1 text-sm text-gray-900">{user.subscriptionPaymentMethod}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Points History */}
                    <PointsHistory />
                  </div>
                </TabsContent>
              </Tabs>
            </nav>
          </div>
        </div>

        {/* Leaderboard Sidebar for Board tab on desktop */}
        {activeTab === 'board' && !isMobile && <LeaderboardSidebar />}
      </div>

      {/* Onboarding Components */}
      {isFeatureEnabled('ONBOARDING_V1') && (
        <>
          <WelcomeModal
            isOpen={showWelcomeModal}
            onStart={handleWelcomeStart}
            onSkip={handleWelcomeSkip}
          />
          <Tour
            isOpen={showTour}
            steps={isMobile ? dashboardTourSteps : desktopTourSteps}
            onComplete={handleTourComplete}
            onSkip={handleTourSkip}
          />
        </>
      )}
    </div>
  );
}