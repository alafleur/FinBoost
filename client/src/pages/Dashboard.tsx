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
    
    // Show welcome modal for first-time users
    if (!hasSeenWelcome) {
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
    setShowTour(true);
  };

  const handleWelcomeSkip = () => {
    setShowWelcomeModal(false);
    onboardingStorage.setWelcomeSeen();
  };

  const handleTourComplete = () => {
    setShowTour(false);
    onboardingStorage.setTourCompleted();
  };

  const handleTourSkip = () => {
    setShowTour(false);
    onboardingStorage.setTourCompleted();
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <img 
                src={finboostLogo} 
                alt="FinBoost Logo" 
                className="h-8 w-auto sm:h-10 object-contain"
                aria-label="FinBoost financial education platform logo"
              />
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-right hidden sm:block" aria-label="User greeting">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-semibold">{user?.firstName || user?.username}</p>
              </div>
              {isAdmin(user) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation('/admin')}
                  aria-label="Access admin portal"
                  className="flex items-center space-x-1"
                >
                  <span>Admin</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('profile')}
                aria-label="View profile and subscription details"
                className="flex items-center space-x-1"
              >
                <UserIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  localStorage.removeItem('token');
                  setLocation('/auth');
                }}
                aria-label="Logout from account"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Email Verification Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <VerificationBanner emailVerified={user?.emailVerified} email={user?.email} />
      </div>

      {isMobile ? (
        /* Mobile Layout with Complete Feature Parity */
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full" role="tablist" aria-label="Dashboard navigation">
          {/* Mobile Tab Navigation - Modern Bottom Tab Style */}
          <div className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-16 z-40 shadow-sm py-1">
            <TabsList className="grid w-full grid-cols-7 h-auto bg-transparent border-0 p-1 rounded-none">
              <TabsTrigger 
                value="overview" 
                id="nav-overview"
                className="flex flex-col items-center gap-0.5 text-xs px-0.5 py-1.5 text-gray-600 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:shadow-lg rounded-md transition-all duration-200 hover:text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Dashboard overview tab"
              >
                <Activity className="h-4 w-4" aria-hidden="true" />
                <span className="font-medium text-[10px]">Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="learn" 
                id="nav-learn"
                className="flex flex-col items-center gap-0.5 text-xs px-0.5 py-1.5 text-gray-600 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:shadow-lg rounded-md transition-all duration-200 hover:text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Learning modules tab"
              >
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                <span className="font-medium text-[10px]">Learn</span>
              </TabsTrigger>
              <TabsTrigger 
                value="actions" 
                id="nav-actions"
                className="flex flex-col items-center gap-0.5 text-xs px-0.5 py-1.5 text-gray-600 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:shadow-lg rounded-md transition-all duration-200 hover:text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Financial actions tab"
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                <span className="font-medium text-[10px]">Actions</span>
              </TabsTrigger>
              <TabsTrigger 
                value="leaderboard" 
                id="nav-leaderboard"
                className="flex flex-col items-center gap-0.5 text-xs px-0.5 py-1.5 text-gray-600 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:shadow-lg rounded-md transition-all duration-200 hover:text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Leaderboard tab"
              >
                <Trophy className="h-4 w-4" aria-hidden="true" />
                <span className="font-medium text-[10px]">Board</span>
              </TabsTrigger>
              <TabsTrigger 
                value="rewards" 
                id="nav-rewards"
                className="flex flex-col items-center gap-0.5 text-xs px-0.5 py-1.5 text-gray-600 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:shadow-lg rounded-md transition-all duration-200 hover:text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Rewards history tab"
              >
                <Award className="h-4 w-4" aria-hidden="true" />
                <span className="font-medium text-[10px]">Rewards</span>
              </TabsTrigger>
              <TabsTrigger 
                value="predictions" 
                id="nav-predictions"
                className="flex flex-col items-center gap-0.5 text-xs px-0.5 py-1.5 text-gray-600 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:shadow-lg rounded-md transition-all duration-200 hover:text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Bonus predictions tab"
              >
                <Target className="h-4 w-4" aria-hidden="true" />
                <span className="font-medium text-[10px]">Bonus</span>
              </TabsTrigger>
              <TabsTrigger 
                value="referrals" 
                id="nav-referrals"
                className="flex flex-col items-center gap-0.5 text-xs px-0.5 py-1.5 text-gray-600 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:shadow-lg rounded-md transition-all duration-200 hover:text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Referral system tab"
              >
                <Users className="h-4 w-4" aria-hidden="true" />
                <span className="font-medium text-[10px]">Referrals</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Mobile Tab Content with Full Desktop Features */}
          <div className="max-w-7xl mx-auto px-4 py-6 pb-20">
            <TabsContent value="overview" className="mt-0 space-y-8">
              {/* Step 3: Winner Celebration Banner - Prominent placement on Overview tab */}
              <WinnerCelebrationBanner />

              {/* Unified Stats Cards Component */}
              <DashboardStats 
                user={user}
                poolData={poolData}
                completedLessonsCount={completedLessonIds.length}
                totalLessonsCount={publishedLessons.length}
                getTierDisplayName={getTierDisplayName}
              />

              {/* Tier Stats */}
              {user && (
                <div className="space-y-4">
                  <SectionHeader 
                    icon={Target}
                    iconColor="blue"
                    title="Tier Thresholds & Rewards"
                  />
                  <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 relative overflow-hidden">

                    <div className="absolute top-0 left-0 w-full h-2 dashboard-accent-neutral"></div>
                    <TierStats 
                      tierThresholds={tierThresholds || { tier1: 56, tier2: 21, tier3: 0 }}
                      tierRewards={poolData.tierBreakdown}
                      user={user}
                    />
                  </div>
                </div>
              )}

              {/* Mobile Learning CTA - Enhanced Visual Design */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <SectionHeader 
                    icon={BookOpen}
                    iconColor="blue"
                    title="Continue Learning"
                  />
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium px-3 py-2">
                    {completedLessonIds.length} of {publishedLessons.length} completed
                  </Badge>
                </div>
                
                <Card
                  className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] relative overflow-hidden"
                  onClick={() => setLocation("/education")}
                >
                  <div className="absolute top-0 left-0 w-full h-2 gloss-accent-indigo"></div>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="p-4 bg-white rounded-xl shadow-sm border border-blue-100 flex-shrink-0">
                          <BookOpen className="h-7 w-7 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-gray-900 mb-3">
                            Explore All Lessons
                          </h3>
                          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                            Continue your financial education journey with {publishedLessons.length} available lessons and earn points for each completion.
                          </p>
                          <div className="flex items-center space-x-4 text-xs">
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-green-700 font-medium">{completedLessonIds.length} completed</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-blue-700 font-medium">{publishedLessons.length - completedLessonIds.length} remaining</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 w-full sm:w-auto">
                        <Button
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg w-full sm:w-auto px-6 py-3 text-base font-semibold transition-all duration-200"
                          size="default"
                        >
                          {completedLessonIds.length > 0 ? "Continue Learning" : "Start Learning"}
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Mobile Community Growth Dial - Enhanced Visual */}
              <div className="space-y-4">
                <SectionHeader 
                  icon={Users}
                  iconColor="blue"
                  title="Community Growth"
                />
                <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-2 dashboard-accent-primary"></div>
                  <CommunityGrowthDial 
                    poolData={poolData}
                    user={user as any}
                    distributionInfo={distributionInfo}
                    onUpgradeClick={() => setLocation('/subscribe')}
                  />
                </div>
              </div>

              {/* Mobile Rewards Summary */}
              <div className="space-y-4">
                <SectionHeader 
                  icon={Award}
                  iconColor="blue"
                  title="Rewards Summary"
                />
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-lg overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-2 dashboard-accent-success"></div>
                  <RewardsSummary />
                </div>
              </div>

            </TabsContent>

            <TabsContent value="learn" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <SectionHeader 
                    icon={BookOpen}
                    iconColor="blue"
                    title="All Learning Modules"
                  />
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-medium">
                    {completedLessonIds.length} of {publishedLessons.length} completed
                  </Badge>
                </div>
                
                {/* Progress Bar */}
                <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Learning Progress</span>
                    <span className="text-sm text-gray-500">
                      {publishedLessons.length > 0 ? Math.round((completedLessonIds.length / publishedLessons.length) * 100) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={publishedLessons.length > 0 ? (completedLessonIds.length / publishedLessons.length) * 100 : 0} 
                    className="h-2"
                  />
                </div>
                
                <div className="space-y-3">
                  {publishedLessons.map((module) => {
                    const isCompleted = completedLessonIds.includes(module.id.toString());
                    const isPremiumModule = module.accessType === 'premium';
                    return (
                      <Card 
                        key={module.id} 
                        className={`group border-0 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                          isCompleted 
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                            : isPremiumModule && !isUserPremium
                            ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200'
                            : 'bg-white hover:bg-gray-50 border-gray-100'
                        }`} 
                        onClick={() => {
                          console.log(`Learning tab - Module clicked: ID=${module.id}, Title=${module.title}`);
                          console.log(`Learning tab - Module validation:`, validateModule(module));
                          console.log(`Learning tab - Route being used: /lesson/${module.id}`);
                          
                          if (!validateModule(module)) {
                            console.error('Learning tab - Invalid module data, preventing navigation:', module);
                            return;
                          }
                          
                          setLocation(`/lesson/${module.id}`);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 pr-3">
                              <h4 className="font-semibold text-sm text-gray-900 leading-tight mb-1">{module.title}</h4>
                              <p className="text-xs text-gray-600 line-clamp-2 mb-2">{module.description?.substring(0, 100)}...</p>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full capitalize font-medium">
                                  {module.category}
                                </span>
                                {!isCompleted && (
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    isPremiumModule && !isUserPremium 
                                      ? 'text-yellow-700 bg-yellow-100' 
                                      : 'text-blue-600 bg-blue-100'
                                  }`}>
                                    {isPremiumModule && !isUserPremium ? 'Premium' : `${module.pointsReward} pts`}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              {isCompleted ? (
                                <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs font-medium shadow-sm">
                                  ✓ Done
                                </Badge>
                              ) : isPremiumModule && !isUserPremium ? (
                                <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white shadow-sm transition-colors">
                                  Upgrade
                                </Button>
                              ) : (
                                <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200">
                                  Start
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="actions" className="mt-0 space-y-6">
              <div className="space-y-4">
                <SectionHeader 
                  icon={Upload}
                  iconColor="blue"
                  title="Financial Actions"
                />
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <TicketsActions />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="referrals" className="mt-0 space-y-6">
              <div className="space-y-4">
                <SectionHeader 
                  icon={Users}
                  iconColor="blue"
                  title="Referral System"
                />
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <ReferralSystem />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="predictions" className="mt-0 space-y-6">
              <div className="space-y-4">
                <SectionHeader 
                  icon={Target}
                  iconColor="blue"
                  title="Prediction Questions"
                />
                <PredictionsContent 
                  user={user} 
                  onUpgradeClick={() => setLocation('/subscribe')}
                />
              </div>
            </TabsContent>

            <TabsContent value="rewards" className="mt-0 space-y-6">
              {/* Winner Celebration Banner */}
              <WinnerCelebrationBanner />
              
              {/* Keep Going Inspirational Message */}
              <KeepGoingMessage onTabChange={setActiveTab} />
              
              <div className="space-y-4">
                <SectionHeader 
                  icon={Award}
                  iconColor="blue"
                  title="Rewards History"
                />
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <RewardsHistory />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="leaderboard" className="mt-0 space-y-6">
              <div className="space-y-4">
                <SectionHeader 
                  icon={Trophy}
                  iconColor="blue"
                  title="Leaderboard"
                />
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <Leaderboard />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="profile" className="mt-0 space-y-6">
              <div className="space-y-4">
                <SectionHeader 
                  icon={UserIcon}
                  iconColor="blue"
                  title="Profile Settings"
                />
                
                {/* Profile Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Account Information
                    </CardTitle>
                    <CardDescription>
                      Manage your account details and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Username</label>
                        <p className="text-sm text-gray-900 mt-1">{user?.username}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <p className="text-sm text-gray-900 mt-1">{user?.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Subscription Status</label>
                        <div className="mt-1">
                          <Badge variant={user?.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                            {user?.subscriptionStatus === 'active' ? 'Premium Member' : 'Free User'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Subscription Payment Details */}
                {user?.subscriptionStatus === 'active' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Subscription Details
                      </CardTitle>
                      <CardDescription>
                        Your current membership plan and payment information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subscription Amount</label>
                          <p className="text-lg font-semibold text-gray-900">
                            ${((user?.subscriptionAmount || 2000) / 100).toFixed(2)} {(user?.subscriptionCurrency || 'USD').toUpperCase()}
                          </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Payment Method</label>
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {user?.subscriptionPaymentMethod || 'Card'}
                          </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Member Since</label>
                          <p className="text-sm font-medium text-gray-900">
                            {user?.subscriptionStartDate 
                              ? new Date(user.subscriptionStartDate).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })
                              : 'N/A'
                            }
                          </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Next Billing</label>
                          <p className="text-sm font-medium text-gray-900">
                            {user?.nextBillingDate 
                              ? new Date(user.nextBillingDate).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })
                              : 'End of month'
                            }
                          </p>
                        </div>
                      </div>

                      {user?.lastPaymentDate && (
                        <div className="border-t pt-4">
                          <h4 className="font-medium text-gray-900 mb-3">Recent Payment</h4>
                          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-green-900">
                                ${((user?.lastPaymentAmount || user?.subscriptionAmount || 2000) / 100).toFixed(2)} paid on{' '}
                                {new Date(user.lastPaymentDate).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </p>
                              <p className="text-xs text-green-700 capitalize">
                                Status: {user?.lastPaymentStatus || 'Succeeded'}
                              </p>
                            </div>
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                              ✓ Paid
                            </Badge>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Account Information Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Account Information
                    </CardTitle>
                    <CardDescription>
                      Manage your account details and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Username</label>
                        <p className="text-sm text-gray-900 mt-1">{user?.username}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <p className="text-sm text-gray-900 mt-1">{user?.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* PayPal Payment Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Information
                    </CardTitle>
                    <CardDescription>
                      Configure your PayPal email for reward disbursements
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-1 bg-blue-100 rounded">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-900">PayPal Email Required</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            To receive cycle reward disbursements, please provide your PayPal email address. This must match your active PayPal account.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">PayPal Email Address</label>
                        <input
                          type="email"
                          placeholder="your-paypal@email.com"
                          value={paypalEmail}
                          onChange={(e) => setPaypalEmail(e.target.value)}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          This email must be associated with an active PayPal account to receive payments
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">Payout Method</label>
                        <select
                          value={payoutMethod}
                          onChange={(e) => setPayoutMethod(e.target.value)}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="paypal">PayPal</option>
                          <option value="bank_transfer" disabled>Bank Transfer (Coming Soon)</option>
                        </select>
                      </div>
                      
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200" 
                        size="sm" 
                        onClick={handleSavePaymentInfo}
                        disabled={savingPayment}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {savingPayment ? 'Saving...' : 'Save Payment Information'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Account Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{user?.totalPoints || 0}</div>
                        <div className="text-sm text-gray-600">Total Points</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{user?.currentStreak || 0}</div>
                        <div className="text-sm text-gray-600">Day Streak</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      ) : (
        /* Desktop Layout - New Tab Structure */
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full" role="tablist" aria-label="Dashboard navigation">
          {/* Desktop Tab Navigation */}
          <div className="bg-white border-b border-gray-100 sticky top-16 z-40 shadow-sm py-1">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <TabsList className="grid w-full grid-cols-7 h-auto bg-transparent border-0 p-1 rounded-none">
                <TabsTrigger 
                  value="overview" 
                  id="nav-overview-desktop"
                  className="flex items-center gap-2 text-sm px-4 py-1.5 text-gray-600 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:shadow-lg rounded-md transition-all duration-200 hover:text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Dashboard overview tab"
                >
                  <Activity className="h-4 w-4" aria-hidden="true" />
                  <span className="font-medium">Overview</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="learn" 
                  id="nav-learn-desktop"
                  className="flex items-center gap-2 text-sm px-4 py-1.5 text-gray-600 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:shadow-lg rounded-md transition-all duration-200 hover:text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Learning modules tab"
                >
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                  <span className="font-medium">Learn</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="actions" 
                  id="nav-actions-desktop"
                  className="flex items-center gap-2 text-sm px-4 py-1.5 text-gray-600 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:shadow-lg rounded-md transition-all duration-200 hover:text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Financial actions tab"
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  <span className="font-medium">Actions</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="leaderboard" 
                  id="nav-leaderboard-desktop"
                  className="flex items-center gap-2 text-sm px-4 py-1.5 text-gray-600 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:shadow-lg rounded-md transition-all duration-200 hover:text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Leaderboard tab"
                >
                  <Trophy className="h-4 w-4" aria-hidden="true" />
                  <span className="font-medium">Board</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="rewards" 
                  id="nav-rewards-desktop"
                  className="flex items-center gap-2 text-sm px-4 py-1.5 text-gray-600 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:shadow-lg rounded-md transition-all duration-200 hover:text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Rewards history tab"
                >
                  <Award className="h-4 w-4" aria-hidden="true" />
                  <span className="font-medium">Rewards</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="predictions" 
                  id="nav-predictions-desktop"
                  className="flex items-center gap-2 text-sm px-4 py-1.5 text-gray-600 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:shadow-lg rounded-md transition-all duration-200 hover:text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Bonus predictions tab"
                >
                  <Target className="h-4 w-4" aria-hidden="true" />
                  <span className="font-medium">Bonus</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="referrals" 
                  id="nav-referrals-desktop"
                  className="flex items-center gap-2 text-sm px-4 py-1.5 text-gray-600 data-[state=active]:text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:shadow-lg rounded-md transition-all duration-200 hover:text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="Referral system tab"
                >
                  <Users className="h-4 w-4" aria-hidden="true" />
                  <span className="font-medium">Referrals</span>
                </TabsTrigger>

              </TabsList>
            </div>
          </div>

          {/* Desktop Tab Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            
            {/* Predictions Tab - Single Component Implementation */}
            <TabsContent value="predictions" className="mt-0 space-y-6">
              <div className="space-y-4">
                <SectionHeader 
                  icon={Target}
                  iconColor="blue"
                  title="Prediction Questions"
                  titleSize="2xl"
                />
                <PredictionsContent 
                  user={user} 
                  onUpgradeClick={() => setLocation('/subscribe')}
                />
              </div>
            </TabsContent>

            {/* Rewards Tab - Simplest Implementation */}
            <TabsContent value="rewards" className="mt-0 space-y-6">
              {/* Winner Celebration Banner */}
              <WinnerCelebrationBanner />
              
              {/* Keep Going Inspirational Message */}
              <KeepGoingMessage onTabChange={setActiveTab} />
              
              <div className="space-y-4">
                <SectionHeader 
                  icon={Award}
                  iconColor="blue"
                  title="Rewards History"
                  titleSize="2xl"
                />
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <RewardsHistory />
                </div>
              </div>
            </TabsContent>

            {/* Overview Tab - Complete Content from Mobile */}
            <TabsContent value="overview" className="mt-0 space-y-6">
              {/* Step 3: Winner Celebration Banner - Desktop Overview tab */}
              <WinnerCelebrationBanner />

              {/* Unified Stats Cards Component */}
              <DashboardStats 
                user={user}
                poolData={poolData}
                completedLessonsCount={completedLessonIds.length}
                totalLessonsCount={publishedLessons.length}
                getTierDisplayName={getTierDisplayName}
              />

              {/* Tier Thresholds */}
              {user && (
                <div className="space-y-4">
                  <SectionHeader 
                    icon={Target}
                    iconColor="blue"
                    title="Tier Thresholds & Rewards"
                    titleSize="lg"
                  />
                  <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 dashboard-accent-neutral"></div>
                    <TierStats 
                      tierThresholds={tierThresholds || { tier1: 56, tier2: 21, tier3: 0 }}
                      tierRewards={poolData.tierBreakdown}
                      user={user}
                    />
                  </div>
                </div>
              )}

              {/* Desktop Continue Learning Section - Enhanced Visual */}
              <div className="space-y-4">
                <SectionHeader 
                  icon={BookOpen}
                  iconColor="blue"
                  title="Continue Learning"
                  titleSize="lg"
                />
                <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden relative cursor-pointer hover:shadow-xl transition-all duration-300" onClick={() => setLocation("/education")}>
                  <div className="absolute top-0 left-0 w-full h-2 dashboard-accent-primary"></div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Master Essential Skills
                      </h3>
                      <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0">
                        {completedLessonIds.length > 0 ? "Continue" : "Start"}
                      </Button>
                    </div>
                    <p className="text-gray-600 mb-3">
                      Interactive lessons designed for real-world financial management application.
                    </p>
                    <div className="text-sm text-gray-500">
                      {completedLessonIds.length} of {publishedLessons.length} lessons completed
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Community Growth Dial - Enhanced Visual */}
              <div className="space-y-4">
                <SectionHeader 
                  icon={Users}
                  iconColor="blue"
                  title="Community Growth"
                  titleSize="lg"
                />
                <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-2 dashboard-accent-primary"></div>
                  <CommunityGrowthDial 
                    poolData={poolData}
                    user={user as any}
                    distributionInfo={distributionInfo}
                    onUpgradeClick={() => setLocation('/subscribe')}
                  />
                </div>
              </div>

              {/* Desktop Rewards Summary - Enhanced Visual */}
              <div className="space-y-4">
                <SectionHeader 
                  icon={Award}
                  iconColor="blue"
                  title="Rewards Summary"
                  titleSize="lg"
                />
                <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-2 dashboard-accent-success"></div>
                  <RewardsSummary />
                </div>
              </div>

            </TabsContent>

            {/* Referrals Tab */}
            <TabsContent value="referrals" className="mt-0 space-y-6">
              <div className="space-y-4">
                <SectionHeader 
                  icon={Users}
                  iconColor="blue"
                  title="Referral System"
                  titleSize="2xl"
                />
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <ReferralSystem />
                </div>
              </div>
            </TabsContent>

            {/* Learn Tab */}
            <TabsContent value="learn" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <SectionHeader 
                    icon={BookOpen}
                    iconColor="blue"
                    title="All Learning Modules"
                    titleSize="2xl"
                  />
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-sm font-medium">
                    {completedLessonIds.length} of {publishedLessons.length} completed
                  </Badge>
                </div>
                
                {/* Progress Bar */}
                <div className="bg-white rounded-lg p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-medium text-gray-700">Learning Progress</span>
                    <span className="text-sm text-gray-500">
                      {publishedLessons.length > 0 ? Math.round((completedLessonIds.length / publishedLessons.length) * 100) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={publishedLessons.length > 0 ? (completedLessonIds.length / publishedLessons.length) * 100 : 0} 
                    className="h-3"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {publishedLessons.map((module) => {
                    const isCompleted = completedLessonIds.includes(module.id.toString());
                    const isPremiumModule = module.accessType === 'premium';
                    return (
                      <Card 
                        key={module.id} 
                        className={`group border-0 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer ${
                          isCompleted 
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                            : isPremiumModule && !isUserPremium
                            ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200'
                            : 'bg-white hover:bg-gray-50 border-gray-100'
                        }`} 
                        onClick={() => setLocation(`/lesson/${module.id}`)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 pr-4">
                              <h4 className="font-semibold text-lg text-gray-900 leading-tight mb-2">{module.title}</h4>
                              <p className="text-sm text-gray-600 line-clamp-3 mb-3">{module.description?.substring(0, 150)}...</p>
                              <div className="flex items-center space-x-3">
                                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full capitalize font-medium">
                                  {module.category}
                                </span>
                                {!isCompleted && (
                                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                    isPremiumModule && !isUserPremium 
                                      ? 'text-yellow-700 bg-yellow-100' 
                                      : 'text-blue-600 bg-blue-100'
                                  }`}>
                                    {isPremiumModule && !isUserPremium ? 'Premium' : `${module.pointsReward} pts`}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-3">
                              {isCompleted ? (
                                <Badge className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium shadow-sm">
                                  ✓ Done
                                </Badge>
                              ) : isPremiumModule && !isUserPremium ? (
                                <Button size="lg" className="bg-yellow-600 hover:bg-yellow-700 text-white shadow-sm transition-colors">
                                  Upgrade
                                </Button>
                              ) : (
                                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200">
                                  Start
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* Actions Tab */}
            <TabsContent value="actions" className="mt-0 space-y-6">
              <div className="space-y-4">
                <SectionHeader 
                  icon={Upload}
                  iconColor="blue"
                  title="Financial Actions"
                  titleSize="2xl"
                />
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <TicketsActions />
                </div>
              </div>
            </TabsContent>

            {/* Leaderboard Tab */}
            <TabsContent value="leaderboard" className="mt-0 space-y-6">
              <div className="space-y-4">
                <SectionHeader 
                  icon={Trophy}
                  iconColor="blue"
                  title="Leaderboard"
                  titleSize="2xl"
                />
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <Leaderboard />
                </div>
              </div>
            </TabsContent>

            {/* Profile Tab - Desktop */}
            <TabsContent value="profile" className="mt-0 space-y-6">
              <div className="space-y-4">
                <SectionHeader 
                  icon={UserIcon}
                  iconColor="blue"
                  title="Profile Settings"
                  titleSize="2xl"
                />
                
                {/* Profile Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Account Information
                    </CardTitle>
                    <CardDescription>
                      Manage your account details and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Username</label>
                        <p className="text-sm text-gray-900 mt-1">{user?.username}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <p className="text-sm text-gray-900 mt-1">{user?.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Subscription Status</label>
                        <div className="mt-1">
                          <Badge variant={user?.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                            {user?.subscriptionStatus === 'active' ? 'Premium Member' : 'Free User'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Subscription Payment Details */}
                {user?.subscriptionStatus === 'active' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Subscription Details
                      </CardTitle>
                      <CardDescription>
                        Your current membership plan and payment information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subscription Amount</label>
                          <p className="text-lg font-semibold text-gray-900">
                            ${((user?.subscriptionAmount || 2000) / 100).toFixed(2)} {(user?.subscriptionCurrency || 'USD').toUpperCase()}
                          </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Payment Method</label>
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {user?.subscriptionPaymentMethod || 'Card'}
                          </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Member Since</label>
                          <p className="text-sm font-medium text-gray-900">
                            {user?.subscriptionStartDate 
                              ? new Date(user.subscriptionStartDate).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })
                              : 'N/A'
                            }
                          </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Next Billing</label>
                          <p className="text-sm font-medium text-gray-900">
                            {user?.nextBillingDate 
                              ? new Date(user.nextBillingDate).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })
                              : 'End of month'
                            }
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* PayPal Payment Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Information
                    </CardTitle>
                    <CardDescription>
                      Configure your PayPal email for reward disbursements
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="p-1 bg-blue-100 rounded">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-900">PayPal Email Required</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            To receive cycle reward disbursements, please provide your PayPal email address. This must match your active PayPal account.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">PayPal Email Address</label>
                        <input
                          type="email"
                          placeholder="your-paypal@email.com"
                          value={paypalEmail}
                          onChange={(e) => setPaypalEmail(e.target.value)}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          This email must be associated with an active PayPal account to receive payments
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">Payout Method</label>
                        <select
                          value={payoutMethod}
                          onChange={(e) => setPayoutMethod(e.target.value)}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="paypal">PayPal</option>
                          <option value="bank_transfer" disabled>Bank Transfer (Coming Soon)</option>
                        </select>
                      </div>
                      
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200" 
                        size="sm" 
                        onClick={handleSavePaymentInfo}
                        disabled={savingPayment}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {savingPayment ? 'Saving...' : 'Save Payment Information'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Account Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{user?.totalPoints || 0}</div>
                        <div className="text-sm text-gray-600">Total Points</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900">{user?.currentStreak || 0}</div>
                        <div className="text-sm text-gray-600">Day Streak</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

          </div>
        </Tabs>
      )}

      {/* Onboarding Components */}
      {isFeatureEnabled('ONBOARDING_V1') && user && (
        <>
          <WelcomeModal
            isOpen={showWelcomeModal}
            onStartTour={handleWelcomeStart}
            onSkip={handleWelcomeSkip}
            username={user.firstName || user.username || 'there'}
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