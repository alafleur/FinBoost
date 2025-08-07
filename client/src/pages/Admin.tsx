import { useState, useEffect, useMemo, memo, Component, ErrorInfo, ReactNode } from 'react';
import { useLocation } from 'wouter';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { educationContent } from "@/data/educationContent";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import CycleManagementTab from "@/components/admin/CycleManagementTab";
import CycleOperationsTab from "@/components/admin/CycleOperationsTab";
import PredictionsTab from "@/components/admin/PredictionsTab";
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Users,
  BookOpen,
  BarChart3,
  Upload,
  Save,
  Eye,
  Star,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  LogOut,
  Trophy,
  X,
  Activity,
  Lock,
  Calculator,
  HelpCircle,
  MessageSquare,
  Timer,
  MoreHorizontal,
  Crown,
  Calendar,
  Copy,
  ExternalLink,
  RotateCcw,
  UserX,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<{children: ReactNode}, ErrorBoundaryState> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Admin component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Admin Panel Error</CardTitle>
              <CardDescription>Something went wrong loading the admin panel</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                Reload Page
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

interface LearningModule {
  id: number;
  title: string;
  description: string;
  content: string;
  quiz?: string;
  pointsReward: number;
  category: string;
  difficulty: string;
  estimatedMinutes: number;
  accessType: string;
  isActive: boolean;
  isPublished?: boolean;
  order: number;
  createdAt: string;
  completions?: number;
  avgRating?: number;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface AdminStats {
  totalModules: number;
  totalUsers: number;
  totalCompletions: number;
  avgCompletionRate: number;
  activeUsers: number;
  userGrowth: any[];
  pointsDistribution: any[];
  recentActivity: any[];
  systemHealth: any;
}

interface PendingProof {
  id: number;
  userId: number;
  action: string;
  points: number;
  description: string;
  proofUrl: string;
  createdAt: string;
  metadata?: any;
  user?: {
    username: string;
    email: string;
  };
}

interface SupportTicket {
  id: number;
  userId?: number;
  name: string;
  email: string;
  category: string;
  message: string;
  status: string;
  response?: string;
  hasAttachment?: boolean;
  fileName?: string;
  createdAt: string;
  resolvedAt?: string;
}

interface CycleSetting {
  id: number;
  cycleName: string;
  cycleStartDate: Date;
  cycleEndDate: Date;
  paymentPeriodDays: number;
  membershipFee: number;
  rewardPoolPercentage: number;
  tier1Threshold: number;
  tier2Threshold: number;
  isActive: boolean;
  allowMidCycleJoining: boolean;
  midCycleJoinThresholdDays: number;
  createdAt: Date;
  createdBy?: number;
}

interface UserCyclePoints {
  id: number;
  userId: number;
  cycleSettingId: number;
  currentCyclePoints: number;
  theoreticalPoints: number;
  pointsRolledOver: number;
  tier: string;
  isActive: boolean;
  joinedCycleAt: Date;
  lastActivityDate?: Date;
}

interface CycleWinnerSelection {
  id: number;
  cycleSettingId: number;
  selectionDate: Date;
  totalRewardPool: number;
  tier1Winners: number;
  tier2Winners: number;
  tier3Winners: number;
  tier1RewardAmount: number;
  tier2RewardAmount: number;
  tier3RewardAmount: number;
  isProcessed: boolean;
  processedAt?: Date;
}

function AdminComponent() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  // Enhanced state for user management
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [pointsToAdd, setPointsToAdd] = useState("");
  const [pointsToDeduct, setPointsToDeduct] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(20);
  const [currentModulePage, setCurrentModulePage] = useState(1);
  const [modulesPerPage] = useState(10);
  const [enrollmentPage, setEnrollmentPage] = useState(1);
  
  // Winner table pagination state
  const [winnerTablePage, setWinnerTablePage] = useState(1);
  const winnersPerPage = 50;
  
  // Enhanced Winners pagination state
  const [enhancedWinnersPage, setEnhancedWinnersPage] = useState(1);
  const [enhancedWinnersData, setEnhancedWinnersData] = useState({
    winners: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 0
  });
  
  // Loading states for performance monitoring
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isExecutingSelection, setIsExecutingSelection] = useState(false);

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState({
    userGrowth: [],
    pointsDistribution: [],
    recentActivity: [],
    systemHealth: {}
  });

  // System settings state
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    pointsMultiplier: 1.0,
    maxDailyPoints: 500,
    tierRequirements: {
      bronze: 0,
      silver: 500,
      gold: 2000
    }
  });

  // Tier thresholds state (dynamic percentile-based)
  const [tierThresholds, setTierThresholds] = useState({
    tier1: 0,
    tier2: 0,
    tier3: 0
  });

  // Current month rewards configuration (locked)
  const [currentRewardsConfig, setCurrentRewardsConfig] = useState({
    poolPercentage: 55,
    tierAllocations: {
      tier1: 50, // Tier 1 is now highest, gets largest allocation
      tier2: 30,
      tier3: 20 // Tier 3 is now lowest, gets smallest allocation
    },
    winnerPercentages: {
      tier1: 50,
      tier2: 50,
      tier3: 50
    },
    tierPercentiles: {
      tier1: 33, // Top 33%
      tier2: 33, // Middle 33%
      tier3: 34  // Bottom 34%
    },
    isLocked: true,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  // Next month rewards configuration (editable)
  const [nextRewardsConfig, setNextRewardsConfig] = useState({
    poolPercentage: 55,
    tierAllocations: {
      tier1: 50, // Tier 1 is now highest, gets largest allocation
      tier2: 30,
      tier3: 20 // Tier 3 is now lowest, gets smallest allocation
    },
    winnerPercentages: {
      tier1: 50,
      tier2: 50,
      tier3: 50
    },
    tierPercentiles: {
      tier1: 33, // Top 33%
      tier2: 33, // Middle 33%
      tier3: 34  // Bottom 34%
    },
    isLocked: false,
    month: new Date().getMonth() + 2 > 12 ? 1 : new Date().getMonth() + 2,
    year: new Date().getMonth() + 2 > 12 ? new Date().getFullYear() + 1 : new Date().getFullYear()
  });

  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [isEditingModule, setIsEditingModule] = useState(false);
  const [editingModule, setEditingModule] = useState<LearningModule | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  // Dialog states
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [showEditModuleDialog, setShowEditModuleDialog] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showUserSettingsDialog, setShowUserSettingsDialog] = useState(false);
  
  // Support ticket state
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [ticketReply, setTicketReply] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [showActionPublishDialog, setShowActionPublishDialog] = useState(false);
  const [selectedActionForPublish, setSelectedActionForPublish] = useState<any>(null);

  // Quiz management state
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  
  // Current pool settings - will be populated from API
  const [currentPoolSettings, setCurrentPoolSettings] = useState({
    rewardPoolPercentage: 0,
    membershipFee: 0
  });

  // PayPal disbursement state
  const [disbursementData, setDisbursementData] = useState<any>(null);
  const [payoutHistory, setPayoutHistory] = useState<any[]>([]);
  const [winnerCycles, setWinnerCycles] = useState<any[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<any>(null);
  const [winners, setWinners] = useState<any>({});
  const [showCreateCycleDialog, setShowCreateCycleDialog] = useState(false);
  const [isRunningSelection, setIsRunningSelection] = useState(false);
  const [selectionResults, setSelectionResults] = useState<any>(null);
  const [isProcessingDisbursements, setIsProcessingDisbursements] = useState(false);
  const [winnerSelectionMode, setWinnerSelectionMode] = useState('weighted_random');
  const [tierSettings, setTierSettings] = useState({
    tier1: { winnerCount: 0, poolPercentage: 50 },
    tier2: { winnerCount: 0, poolPercentage: 30 },
    tier3: { winnerCount: 0, poolPercentage: 20 }
  });
  const [eligibleUsers, setEligibleUsers] = useState<any[]>([]);
  const [customWinnerIds, setCustomWinnerIds] = useState<number[]>([]);
  const [winnerDetails, setWinnerDetails] = useState<any[]>([]);
  
  // Paginated winner state (new approach for performance)
  const [paginatedWinners, setPaginatedWinners] = useState<{winners: any[], totalCount: number, currentPage: number, totalPages: number}>({
    winners: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 0
  });
  const [csvImportData, setCsvImportData] = useState("");
  const [showCsvImportDialog, setShowCsvImportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);
  const [selectedForDisbursement, setSelectedForDisbursement] = useState<Set<number>>(new Set());
  
  // Payout adjustment state
  const [payoutPercentages, setPayoutPercentages] = useState<Record<number, string>>({});
  const [payoutOverrides, setPayoutOverrides] = useState<Record<number, number>>({});
  
  const [newCycleForm, setNewCycleForm] = useState({
    cycleName: '',
    cycleStartDate: '',
    cycleEndDate: '',
    tier1Threshold: 33,
    tier2Threshold: 67,
    selectionPercentage: 50,
    poolSettings: {}
  });

  // State for module form
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    content: '',
    pointsReward: 20,
    category: 'budgeting',
    difficulty: 'beginner',
    estimatedMinutes: 5,
    accessType: 'premium',
    isActive: true,
    isPublished: false
  });

  // State for custom category
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  // Cycle Settings state
  const [cyclePoolSettings, setCyclePoolSettings] = useState([]);
  const [showPoolSettingDialog, setShowPoolSettingDialog] = useState(false);
  const [editingPoolSetting, setEditingPoolSetting] = useState(null);
  const [poolSettingForm, setPoolSettingForm] = useState({
    cycleName: '',
    cycleStartDate: '',
    cycleEndDate: '',
    rewardPoolPercentage: 50,
    membershipFee: 2000,
    isActive: true
  });

  // New Cycle Management and Operations state
  const [cycleSettings, setCycleSettings] = useState<CycleSetting[]>([]);
  const [userCyclePoints, setUserCyclePoints] = useState<UserCyclePoints[]>([]);
  const [cycleWinnerSelections, setCycleWinnerSelections] = useState<CycleWinnerSelection[]>([]);
  const [showCycleDialog, setShowCycleDialog] = useState(false);
  const [editingCycle, setEditingCycle] = useState<CycleSetting | null>(null);
  const [showWinnerSelectionDialog, setShowWinnerSelectionDialog] = useState(false);
  const [selectedCycleForWinners, setSelectedCycleForWinners] = useState<CycleSetting | null>(null);
  
  const [cycleForm, setCycleForm] = useState({
    cycleName: '',
    cycleStartDate: '',
    cycleEndDate: '',
    paymentPeriodDays: 30,
    membershipFee: 2000,
    rewardPoolPercentage: 50,
    tier1Threshold: 67,
    tier2Threshold: 33,
    isActive: false,
    allowMidCycleJoining: true,
    midCycleJoinThresholdDays: 14
  });



  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    totalReferrers: 0,
    topReferrers: []
  });



  // Pending proof state
  const [pendingProofs, setPendingProofs] = useState<PendingProof[]>([]);

  // Winner selection state
  const [selectedWinners, setSelectedWinners] = useState({
    tier1: [] as any[],
    tier2: [] as any[],
    tier3: [] as any[]
  });

  // Proportional deduction calculation state
  const [proportionalConfig, setProportionalConfig] = useState({
    tier1PayoutPercentage: 100,
    tier2PayoutPercentage: 100,
    tier3PayoutPercentage: 100,
    randomSeed: ''
  });

  // State for dynamic winner configuration (spreadsheet-style)
  const [winnerConfiguration, setWinnerConfiguration] = useState({
    tier1: [] as Array<{ position: number; percentage: number; userId?: number; username?: string; points?: number }>,
    tier2: [] as Array<{ position: number; percentage: number; userId?: number; username?: string; points?: number }>,
    tier3: [] as Array<{ position: number; percentage: number; userId?: number; username?: string; points?: number }>
  });

  // Point actions management state
  const [pointActions, setPointActions] = useState<any[]>([]);
  const [editingPointAction, setEditingPointAction] = useState<any>(null);
  const [showPointActionDialog, setShowPointActionDialog] = useState(false);
  const [pointActionForm, setPointActionForm] = useState({
    actionId: '',
    name: '',
    basePoints: 10,
    maxDaily: 1,
    maxMonthly: 10,
    requiresProof: true,
    category: 'action',
    description: ''
  });

  // Pool data state with proper typing
  const [poolData, setPoolData] = useState<{
    totalPool: number;
    tier1Pool: number;
    tier2Pool: number;
    tier3Pool: number;
    premiumUsers?: number | string;
    totalUsers?: number | string;
  } | null>(null);

  // Consolidated states
  const [users, setUsers] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalModules: 0,
    totalCompletions: 0,
    avgCompletionRate: 0,
    userGrowth: [],
    pointsDistribution: [],
    recentActivity: [],
    systemHealth: {}
  });

  // Proportional Point Deduction System state
  const [tierRatios, setTierRatios] = useState({
    tier1: 0,
    tier2: 0,
    tier3: 0
  });

  const [proportionalDeductions, setProportionalDeductions] = useState([]);

  // Export functions for CSV/Excel
  const exportUserAccounts = (format: 'csv' | 'xlsx') => {
    const exportData = users
      .filter((user: any) => !user.isAdmin)
      .map((user: any) => ({
        'User ID': user.id,
        'Username': user.username,
        'Email': user.email,
        'Total Points': user.totalPoints || 0,
        'Current Month Points': user.currentMonthPoints || 0,
        'Tier': user.tier?.replace('tier', 'Tier ') || 'Tier 1',
        'PayPal Email': user.paypalEmail || 'Not set',
        'Membership': user.subscriptionStatus === 'active' ? 'Member' : 'Free',
        'Status': user.isActive ? 'Active' : 'Inactive',
        'Joined': user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'N/A',
        'Last Login': user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'
      }));

    if (format === 'csv') {
      const csvContent = [
        Object.keys(exportData[0]).join(','),
        ...exportData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-accounts-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } else {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'User Accounts');
      XLSX.writeFile(wb, `user-accounts-${new Date().toISOString().split('T')[0]}.xlsx`);
    }
    
    toast({
      title: "Export Complete",
      description: `User accounts exported as ${format.toUpperCase()}`
    });
  };

  const exportUserEnrollment = (format: 'csv' | 'xlsx') => {
    const exportData = userCyclePoints.map((userPoints: any) => {
      const userPredictions = userPoints.predictions || [];
      
      return {
        'User ID': userPoints.userId,
        'Username': userPoints.username || 'Unknown',
        'Email': userPoints.email || '',
        'Current Points': userPoints.currentCyclePoints,
        'Tier': userPoints.tier.replace('tier', 'Tier '),
        'Joined': new Date(userPoints.joinedCycleAt).toLocaleDateString(),
        'Last Activity': userPoints.lastActivityDate 
          ? new Date(userPoints.lastActivityDate).toLocaleDateString()
          : 'No activity',
        'Predictions Count': userPredictions.length,
        'Prediction Answers': userPredictions.map((p: any) => 
          `${p.question.substring(0, 20)}...: ${String.fromCharCode(65 + p.selectedOptionIndex)}`
        ).join('; ')
      };
    });

    if (format === 'csv') {
      const csvContent = [
        Object.keys(exportData[0]).join(','),
        ...exportData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-enrollment-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } else {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'User Enrollment');
      XLSX.writeFile(wb, `user-enrollment-${new Date().toISOString().split('T')[0]}.xlsx`);
    }
    
    toast({
      title: "Export Complete",
      description: `User enrollment data exported as ${format.toUpperCase()}`
    });
  };

  // Load quiz questions when editing a module
  useEffect(() => {
    if (editingModule && editingModule.quiz) {
      try {
        const parsedQuiz = JSON.parse(editingModule.quiz);
        if (Array.isArray(parsedQuiz)) {
          const formattedQuiz = parsedQuiz.map((q, index) => ({
            id: index + 1,
            question: q.question || '',
            options: q.options || ['', '', '', ''],
            correctAnswer: q.correctAnswer || 0,
            explanation: q.explanation || ''
          }));
          setQuizQuestions(formattedQuiz);
        }
      } catch (error) {
        console.error('Error parsing quiz data:', error);
        setQuizQuestions([]);
      }
    } else {
      setQuizQuestions([]);
    }
  }, [editingModule]);

  // Load initial data including cycle data
  useEffect(() => {
    // Consolidated API calls to prevent redundant requests
    const loadInitialData = async () => {
      const startTime = performance.now();
      setIsLoadingData(true);
      
      try {
        console.log('Loading admin data...');
        // Group API calls by priority and dependencies with individual error handling
        const results = await Promise.allSettled([
          fetchData().catch(e => console.error('fetchData failed:', e)), // Core data first
          fetchCycleSettings().catch(e => console.error('fetchCycleSettings failed:', e)), // Essential cycle data
          fetchUserCyclePoints().catch(e => console.error('fetchUserCyclePoints failed:', e)),
          fetchPendingProofs().catch(e => console.error('fetchPendingProofs failed:', e)),
          fetchPointActions().catch(e => console.error('fetchPointActions failed:', e)),
          fetchSupportTickets().catch(e => console.error('fetchSupportTickets failed:', e)),
          fetchCyclePoolSettings().catch(e => console.error('fetchCyclePoolSettings failed:', e)),
          fetchCurrentPoolSettings().catch(e => console.error('fetchCurrentPoolSettings failed:', e)),
          fetchCycleWinnerSelections().catch(e => console.error('fetchCycleWinnerSelections failed:', e))
        ]);
        
        // Log which calls failed
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.error(`API call ${index} failed:`, result.reason);
          }
        });
        
        const loadTime = performance.now() - startTime;
        console.log(`Admin data loaded in ${Math.round(loadTime)}ms`);
      } catch (error) {
        console.error('Error loading initial admin data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    loadInitialData();
  }, []);

  // Load winners when selected cycle changes
  useEffect(() => {
    if ((selectedCycle as any)?.selectionCompleted) {
      loadWinners();
    }
  }, [selectedCycle]);

  // Load paginated winners when Cycle Operations tab is opened or when cycle selection is completed
  useEffect(() => {
    if (activeTab === 'operations') {
      const activeCycle = cycleSettings.find(c => c.isActive);
      if (activeCycle?.id) {
        console.log('Loading paginated winners for operations tab');
        loadPaginatedWinnerDetails(activeCycle.id, 1, winnersPerPage);
        // Also check if selection was already completed (persistence fix)
        if ((activeCycle as any).selectionCompleted) {
          console.log('Cycle selection already completed, loading existing winners');
          setSelectionResults({
            winnersSelected: (activeCycle as any).totalWinners || 0,
            totalRewardPool: ((activeCycle as any).totalRewardPool || 0) / 100,
            selectionMode: 'loaded_from_database'
          });
        }
      }
    }
  }, [activeTab, cycleSettings]);

  const fetchData = async () => {
    try {

      // Fetch all data concurrently
      const [usersRes, modulesRes, poolRes, tierRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/modules'),
        fetch('/api/cycles/pool'),
        fetch('/api/tiers/thresholds')
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }

      if (modulesRes.ok) {
        const data = await modulesRes.json();
        setModules(data.modules || []);
      }

      if (poolRes.ok) {
        const data = await poolRes.json();
        // Map cycle API response to expected format
        setPoolData({
          totalPool: data.totalPool,
          tier1Pool: data.tierBreakdown?.tier1 || 0,
          tier2Pool: data.tierBreakdown?.tier2 || 0,
          tier3Pool: data.tierBreakdown?.tier3 || 0,
          premiumUsers: data.premiumUsers,
          totalUsers: data.totalUsers
        });
      }

      if (tierRes.ok) {
        const data = await tierRes.json();
        setTierThresholds(data.thresholds);
      }

      // Calculate proportional deduction ratios
      calculateProportionalRatios();
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  const fetchPendingProofs = async () => {
    try {
      const response = await fetch('/api/admin/pending-proofs');
      if (response.ok) {
        const data = await response.json();
        setPendingProofs(data.proofs || []);
      }
    } catch (error) {
      console.error('Error fetching pending proofs:', error);
    }
  };

  const fetchPointActions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/points/actions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPointActions(data.actions || []);
      }
    } catch (error) {
      console.error('Error fetching point actions:', error);
    }
  };

  const fetchSupportTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/support', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSupportTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Error fetching support tickets:', error);
    }
  };

  const fetchCyclePoolSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/cycle-settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCyclePoolSettings(data);
      }
    } catch (error) {
      console.error('Error fetching cycle pool settings:', error);
    }
  };

  const fetchCurrentPoolSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/cycle-settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const activeCycle = data.find(cycle => cycle.isActive);
        if (activeCycle) {
          setCurrentPoolSettings({
            rewardPoolPercentage: activeCycle.rewardPoolPercentage,
            membershipFee: activeCycle.membershipFee
          });
          // Update all form defaults to use actual cycle data
          setCycleForm(prev => ({
            ...prev,
            rewardPoolPercentage: activeCycle.rewardPoolPercentage,
            membershipFee: activeCycle.membershipFee
          }));
          setPoolSettingForm(prev => ({
            ...prev,
            rewardPoolPercentage: activeCycle.rewardPoolPercentage,
            membershipFee: activeCycle.membershipFee
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching current pool settings:', error);
    }
  };

  const fetchCycleSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/cycle-settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCycleSettings(data || []);
      }
    } catch (error) {
      console.error('Error fetching cycle settings:', error);
    }
  };

  const fetchUserCyclePoints = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/user-cycle-points', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserCyclePoints(data.userCyclePoints || []);
      }
    } catch (error) {
      console.error('Error fetching user cycle points:', error);
    }
  };

  const fetchCycleWinnerSelections = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/cycle-winner-selections', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCycleWinnerSelections(data.selections || []);
      }
    } catch (error) {
      console.error('Error fetching cycle winner selections:', error);
    }
  };

  const handleSaveCycle = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = editingCycle 
        ? `/api/admin/cycle-settings/${editingCycle.id}`
        : '/api/admin/cycle-settings';
      
      const method = editingCycle ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cycleForm)
      });

      if (response.ok) {
        toast({
          title: editingCycle ? "Cycle updated" : "Cycle created",
          description: "Cycle configuration has been saved successfully.",
        });
        
        setShowCycleDialog(false);
        setEditingCycle(null);
        setCycleForm({
          cycleName: '',
          cycleStartDate: '',
          cycleEndDate: '',
          paymentPeriodDays: 30,
          membershipFee: 2000,
          rewardPoolPercentage: 50,
          tier1Threshold: 67,
          tier2Threshold: 33,
          isActive: false,
          allowMidCycleJoining: true,
          midCycleJoinThresholdDays: 14
        });
        
        fetchCycleSettings();
      } else {
        throw new Error(`Failed to save cycle: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving cycle:', error);
      toast({
        title: "Error saving cycle",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCycle = async (cycleId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/cycle-settings/${cycleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast({
          title: "Cycle deleted",
          description: "Cycle has been removed successfully.",
        });
        fetchCycleSettings();
      } else {
        throw new Error('Failed to delete cycle');
      }
    } catch (error) {
      console.error('Error deleting cycle:', error);
      toast({
        title: "Error deleting cycle",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleSavePoolSetting = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = editingPoolSetting 
        ? `/api/admin/cycle-settings/${editingPoolSetting.id}`
        : '/api/admin/cycle-settings';
      
      const method = editingPoolSetting ? 'PUT' : 'POST';
      
      console.log('Saving pool setting:', { url, method, form: poolSettingForm, editingPoolSetting });
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(poolSettingForm)
      });

      const responseData = await response.text();
      console.log('Response:', response.status, responseData);

      if (response.ok) {
        toast({
          title: editingPoolSetting ? "Cycle setting updated" : "Cycle setting created",
          description: "Cycle configuration has been saved successfully.",
        });
        
        setShowPoolSettingDialog(false);
        setEditingPoolSetting(null);
        setPoolSettingForm({
          cycleName: '',
          cycleStartDate: '',
          cycleEndDate: '',
          rewardPoolPercentage: 50,
          membershipFee: 2000,
          isActive: true
        });
        
        fetchCyclePoolSettings();
        fetchCurrentPoolSettings();
      } else {
        throw new Error(`Failed to save pool setting: ${response.status} ${responseData}`);
      }
    } catch (error) {
      console.error('Error saving pool setting:', error);
      toast({
        title: "Error saving cycle setting",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleTicketReply = async (ticketId: number, reply: string, status: string = 'resolved') => {
    setIsSubmittingReply(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/support/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          response: reply,
          status: status,
          resolvedAt: status === 'resolved' ? new Date().toISOString() : null
        })
      });

      if (response.ok) {
        toast({
          title: "Reply sent successfully",
          description: "The support ticket has been updated.",
        });
        setTicketReply("");
        setShowTicketDialog(false);
        fetchSupportTickets(); // Refresh tickets
      } else {
        throw new Error('Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending ticket reply:', error);
      toast({
        title: "Failed to send reply",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleViewProofFile = async (proofUrl: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Admin authentication required to view files",
          variant: "destructive"
        });
        return;
      }

      // Create a secure blob URL for the file
      const response = await fetch(proofUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required to access files");
        } else if (response.status === 403) {
          throw new Error("Access denied to file");
        } else if (response.status === 404) {
          throw new Error("File not found");
        } else {
          throw new Error(`Failed to load file (${response.status})`);
        }
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Open in new tab
      const newWindow = window.open(blobUrl, '_blank');
      if (!newWindow) {
        toast({
          title: "Popup Blocked",
          description: "Please allow popups to view the file",
          variant: "destructive"
        });
        URL.revokeObjectURL(blobUrl);
        return;
      }

      // Clean up blob URL after some time
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 30000); // 30 seconds

    } catch (error) {
      console.error('Error viewing proof file:', error);
      toast({
        title: "File Access Error",
        description: error instanceof Error ? error.message : "Failed to view file",
        variant: "destructive"
      });
    }
  };

  const handleApproveProof = async (proofId: number) => {
    try {
      const response = await fetch(`/api/admin/approve-proof/${proofId}`, {
        method: 'POST'
      });

      if (response.ok) {
        toast({
          title: "Proof Approved",
          description: "Points have been awarded to the user."
        });
        fetchPendingProofs();
        fetchData();
      } else {
        throw new Error('Failed to approve proof');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve proof",
        variant: "destructive"
      });
    }
  };

  const handleRejectProof = async (proofId: number, reason: string) => {
    try {
      const response = await fetch(`/api/admin/reject-proof/${proofId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        toast({
          title: "Proof Rejected",
          description: "The submission has been rejected."
        });
        fetchPendingProofs();
      } else {
        throw new Error('Failed to reject proof');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject proof",
        variant: "destructive"
      });
    }
  };

  // CRUD Handlers for Modules
  const handleCreateModule = async () => {
    try {
      const moduleData = {
        ...moduleForm,
        quiz: JSON.stringify(quizQuestions)
      };

      const response = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(moduleData)
      });

      if (response.ok) {
        const data = await response.json();
        setModules([...modules, data.module]);
        setModuleForm({
          title: '',
          description: '',
          content: '',
          pointsReward: 20,
          category: 'budgeting',
          difficulty: 'beginner',
          estimatedMinutes: 5,
          accessType: 'premium',
          isActive: true,
          isPublished: false
        });
        setQuizQuestions([]);
        toast({
          title: "Success",
          description: "Module created successfully"
        });
      } else {
        throw new Error('Failed to create module');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create module",
        variant: "destructive"
      });
    }
  };

  const handleUpdateModule = async (moduleId: number, updateData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch(`/api/admin/modules/${moduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const data = await response.json();
        setModules(modules.map((m: any) => m.id === moduleId ? data.module : m));
        toast({
          title: "Success",
          description: "Module updated successfully"
        });
      } else {
        throw new Error('Failed to update module');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update module",
        variant: "destructive"
      });
    }
  };

  const handleDeleteModule = async (moduleId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch(`/api/admin/modules/${moduleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setModules(modules.filter((m: any) => m.id !== moduleId));
        toast({
          title: "Success",
          description: "Module deleted successfully"
        });
      } else {
        throw new Error('Failed to delete module');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete module",
        variant: "destructive"
      });
    }
  };

  const handleTogglePublish = async (moduleId: number, isPublished: boolean) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch(`/api/admin/modules/${moduleId}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isPublished })
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh modules data to ensure we have the latest state
        const modulesRes = await fetch('/api/admin/modules', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (modulesRes.ok) {
          const modulesData = await modulesRes.json();
          setModules(modulesData.modules || []);
        }
        toast({
          title: "Success",
          description: `Module ${isPublished ? 'published' : 'unpublished'} successfully`
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update module publish status');
      }
    } catch (error) {
      console.error('Toggle publish error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update module publish status",
        variant: "destructive"
      });
    }
  };

  // Handler for toggling user subscription status
  const handleToggleSubscription = async (userId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'premium' ? 'free' : 'premium';
      const response = await fetch(`/api/admin/users/${userId}/subscription`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ subscriptionStatus: newStatus })
      });

      if (response.ok) {
        // Update the users list
        setUsers(users.map((user: any) => 
          user.id === userId 
            ? { ...user, subscriptionStatus: newStatus }
            : user
        ));
        toast({
          title: "Success",
          description: `User ${newStatus === 'premium' ? 'upgraded to premium' : 'downgraded to free'} successfully`
        });
      } else {
        throw new Error('Failed to update subscription status');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update subscription status",
        variant: "destructive"
      });
    }
  };

  // CRUD Handlers for Users
  const handleCreateUser = async (userData: any) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const data = await response.json();
        setUsers([...users, data.user]);
        toast({
          title: "Success",
          description: "User created successfully"
        });
      } else {
        throw new Error('Failed to create user');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive"
      });
    }
  };

  const handleUpdateUser = async (userId: number, updateData: any) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(users.map((u: any) => u.id === userId ? data.user : u));
        toast({
          title: "Success",
          description: "User updated successfully"
        });
      } else {
        throw new Error('Failed to update user');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setUsers(users.filter((u: any) => u.id !== userId));
        toast({
          title: "Success",
          description: "User deleted successfully"
        });
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive"
      });
    }
  };

  // Winner cycle management functions
  const loadCycles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/winner-cycles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setWinnerCycles(data.cycles);
      }
    } catch (error) {
      console.error('Failed to load cycles:', error);
    }
  };





  // Flexible winner selection with point-weighted random as baseline
  const handleExecuteWinnerSelection = async () => {
    setIsRunningSelection(true);
    try {
      const activeCycle = cycleSettings.find(c => c.isActive);
      if (!activeCycle) {
        throw new Error('No active cycle found');
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/cycle-winner-selection/execute', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cycleSettingId: activeCycle.id,
          selectionMode: winnerSelectionMode,
          tierSettings,
          customWinnerIds: winnerSelectionMode === 'manual' ? customWinnerIds : undefined,
          pointDeductionPercentage: 50,
          rolloverPercentage: 50
        })
      });

      if (response.ok) {
        const results = await response.json();
        setSelectionResults(results);
        await loadPaginatedWinnerDetails(activeCycle.id, 1, winnersPerPage);
        toast({
          title: "Winner selection completed",
          description: `Selected ${results.winnersSelected} winners using ${winnerSelectionMode} method.`,
        });
        fetchCycleWinnerSelections();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to execute winner selection');
      }
    } catch (error) {
      console.error('Error executing winner selection:', error);
      toast({
        title: "Error executing winner selection",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsRunningSelection(false);
    }
  };

  // Load winner details for display and adjustment (original - loads all data)
  const loadWinnerDetails = async (cycleSettingId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/cycle-winner-details/${cycleSettingId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setWinnerDetails(data.winners);
      }
    } catch (error) {
      console.error('Error loading winner details:', error);
    }
  };

  // Load paginated winner details (new - for performance)
  const loadPaginatedWinnerDetails = async (cycleSettingId: number, page: number = 1, limit: number = 50) => {
    try {
      console.log(`Loading paginated winners: cycle ${cycleSettingId}, page ${page}, limit ${limit}`);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/cycle-winner-details/${cycleSettingId}/paginated?page=${page}&limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`Loaded ${data.winners?.length || 0} winners for page ${page}`);
        setPaginatedWinners({
          winners: data.winners || [],
          totalCount: data.totalCount || 0,
          currentPage: data.currentPage || page,
          totalPages: data.totalPages || 0
        });
      } else {
        console.error('Failed to load paginated winner details');
        setPaginatedWinners({ winners: [], totalCount: 0, currentPage: 1, totalPages: 0 });
      }
    } catch (error) {
      console.error('Error loading paginated winner details:', error);
      setPaginatedWinners({ winners: [], totalCount: 0, currentPage: 1, totalPages: 0 });
    }
  };

  // Load Enhanced Winners with pagination
  const loadEnhancedWinnersPaginated = async (cycleSettingId: number, page: number = 1, limit: number = 50) => {
    if (!cycleSettingId) return;

    try {
      const token = localStorage.getItem('token');
      console.log(`[Frontend] Loading enhanced winners page ${page} for cycle ${cycleSettingId}`);
      
      const response = await fetch(`/api/admin/cycle-winner-details/${cycleSettingId}/paginated?page=${page}&limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Transform the paginated data to enhanced format with proper field mapping
        const enhancedData = data.winners.map((winner: any) => ({
          overallRank: winner.overallRank,
          tierRank: winner.tierRank,
          username: winner.username,
          email: winner.email,
          cyclePoints: winner.pointsAtSelection || 0,
          tierSize: winner.tierSizeAmount || 0,
          payoutPercentage: winner.payoutPercentage || 100,
          payoutCalc: winner.payoutCalculated || 0,
          payoutOverride: winner.payoutOverride || 0,
          payoutFinal: winner.payoutFinal || 0,
          paypalEmail: winner.paypalEmail || 'Not set',
          status: winner.payoutStatus || 'pending',
          lastModified: winner.lastModified || new Date().toISOString()
        }));

        setEnhancedWinnersData({
          winners: enhancedData,
          totalCount: data.totalCount || 0,
          currentPage: page,
          totalPages: Math.ceil((data.totalCount || 0) / limit)
        });

        console.log(`[Frontend] Loaded ${enhancedData.length} enhanced winner records for page ${page}`);
      } else {
        console.log(`[Frontend] No enhanced winners data available (${response.status})`);
        setEnhancedWinnersData({ winners: [], totalCount: 0, currentPage: 1, totalPages: 0 });
      }
    } catch (error) {
      console.error('Failed to load enhanced winners:', error);
      setEnhancedWinnersData({ winners: [], totalCount: 0, currentPage: 1, totalPages: 0 });
    }
  };

  // Load eligible users for manual selection
  const loadEligibleUsers = async (cycleSettingId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/eligible-users/${cycleSettingId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setEligibleUsers(data.users);
      }
    } catch (error) {
      console.error('Error loading eligible users:', error);
    }
  };

  // Update individual winner payout percentage
  const handleUpdateWinnerPayout = async (winnerId: number, payoutPercentage: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/admin/winner-payout/${winnerId}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ payoutPercentage })
      });

      // Refresh winner details with pagination
      const activeCycle = cycleSettings.find(c => c.isActive);
      if (activeCycle) {
        await loadPaginatedWinnerDetails(activeCycle.id, paginatedWinners.currentPage || 1, winnersPerPage);
      }
    } catch (error) {
      console.error('Error updating winner payout:', error);
    }
  };

  // Update winner adjustment reason
  const handleUpdateWinnerReason = async (winnerId: number, adjustmentReason: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/admin/winner-payout/${winnerId}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ adjustmentReason })
      });
    } catch (error) {
      console.error('Error updating winner reason:', error);
    }
  };

  // Remove winner from selection
  const handleRemoveWinner = async (winnerId: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/admin/winner-payout/${winnerId}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ payoutStatus: 'removed' })
      });

      // Refresh winner details with pagination
      const activeCycle = cycleSettings.find(c => c.isActive);
      if (activeCycle) {
        await loadPaginatedWinnerDetails(activeCycle.id, paginatedWinners.currentPage || 1, winnersPerPage);
      }

      toast({
        title: "Winner removed",
        description: "Winner has been removed from the selection.",
      });
    } catch (error) {
      console.error('Error removing winner:', error);
      toast({
        title: "Error removing winner",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Clear winner selection for re-running
  const handleClearWinnerSelection = async () => {
    try {
      const activeCycle = cycleSettings.find(c => c.isActive);
      if (!activeCycle) return;

      const token = localStorage.getItem('token');
      await fetch(`/api/admin/cycle-winner-selection/${activeCycle.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setSelectionResults(null);
      setWinnerDetails([]);
      
      toast({
        title: "Winner selection cleared",
        description: "You can now run a new winner selection.",
      });
    } catch (error) {
      console.error('Error clearing winner selection:', error);
      toast({
        title: "Error clearing selection",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Export winner selection to Excel
  const handleExportWinners = async () => {
    try {
      const activeCycle = cycleSettings.find(c => c.isActive);
      if (!activeCycle) {
        toast({
          title: "No active cycle",
          description: "Please select an active cycle first.",
          variant: "destructive",
        });
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/cycle-winner-details/${activeCycle.id}/export`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'winner-selection.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export successful",
        description: `Winner selection exported to ${filename}`,
      });
    } catch (error) {
      console.error('Error exporting winners:', error);
      toast({
        title: "Export failed",
        description: "Unable to export winner selection to Excel.",
        variant: "destructive",
      });
    }
  };

  // Import winner selection from Excel
  const handleImportWinners = async () => {
    if (!importFile) {
      toast({
        title: "No file selected",
        description: "Please select an Excel file to import.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const activeCycle = cycleSettings.find(c => c.isActive);
      if (!activeCycle) {
        toast({
          title: "No active cycle",
          description: "Please select an active cycle first.",
          variant: "destructive",
        });
        return;
      }

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const fileData = e.target?.result as string;
          
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/admin/cycle-winner-details/${activeCycle.id}/import`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fileData })
          });

          const result = await response.json();
          
          if (!response.ok) {
            throw new Error(result.error || 'Import failed');
          }

          setImportResults(result.results);
          
          // Clear cached data and refresh from page 1
          console.log(`[Import] SUCCESS: Starting complete cache invalidation for cycle ${activeCycle.id}`);
          console.log(`[Import] Clearing state: paginatedWinners, enhancedWinnersData`);
          setPaginatedWinners({ winners: [], totalCount: 0, currentPage: 1, totalPages: 0 });
          setEnhancedWinnersData({ winners: [], totalCount: 0, currentPage: 1, totalPages: 0 });
          
          // Reset pagination state to page 1 in UI
          console.log(`[Import] Resetting pagination UI: winnerTablePage=${winnerTablePage}→1, enhancedWinnersPage=${enhancedWinnersPage}→1`);
          setWinnerTablePage(1);
          setEnhancedWinnersPage(1);
          
          // Refresh all winner data sources from page 1
          console.log(`[Import] Refreshing data sources: loadEnhancedWinnersPaginated, loadPaginatedWinnerDetails`);
          await loadEnhancedWinnersPaginated(activeCycle.id, 1, winnersPerPage);
          await loadPaginatedWinnerDetails(activeCycle.id, 1, winnersPerPage);
          console.log(`[Import] COMPLETE: All data sources refreshed, user now on page 1`);

          toast({
            title: "Import completed",
            description: `Processed ${result.results.processed} rows, updated ${result.results.updated} winners - All data refreshed`,
          });
        } catch (error) {
          console.error('Error importing winners:', error);
          toast({
            title: "Import failed",
            description: error instanceof Error ? error.message : "Unable to import winner data.",
            variant: "destructive",
          });
        } finally {
          setIsImporting(false);
        }
      };
      
      reader.readAsDataURL(importFile);
    } catch (error) {
      console.error('Error importing winners:', error);
      toast({
        title: "Import failed",
        description: "Unable to process import file.",
        variant: "destructive",
      });
      setIsImporting(false);
    }
  };

  const loadWinners = async () => {
    if (!selectedCycle) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/winner-cycles/${selectedCycle.id}/winners`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setWinners(data.winners);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load winners",
        variant: "destructive"
      });
    }
  };

  const updateWinnerPercentage = async (winnerId: number, percentage: number) => {
    if (!selectedCycle) return;

    // Update local state immediately for responsive UI
    setWinners((prev: any) => {
      const updated = { ...prev };
      for (const tier in updated) {
        updated[tier] = updated[tier].map((w: any) => 
          w.id === winnerId ? { ...w, rewardPercentage: percentage } : w
        );
      }
      return updated;
    });

    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/admin/winner-cycles/${selectedCycle.id}/update-percentages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          updates: [{ winnerId, rewardPercentage: percentage }]
        })
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update percentage",
        variant: "destructive"
      });
      // Reload winners to revert changes
      loadWinners();
    }
  };

  const exportWinners = async () => {
    if (!selectedCycle) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/winner-cycles/${selectedCycle.id}/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cycle_${selectedCycle.id}_allocations.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Export Complete",
          description: "CSV file downloaded successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export CSV",
        variant: "destructive"
      });
    }
  };

  // Points Management Handlers
  const handleAwardPoints = async (userId: number, points: number, reason: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/points/award', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, points, reason })
      });

      if (response.ok) {
        await fetchData(); // Refresh data
        toast({
          title: "Success",
          description: "Tickets awarded successfully"
        });
      } else {
        throw new Error('Failed to award tickets');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to award tickets",
        variant: "destructive"
      });
    }
  };

  const handleDeductPoints = async (userId: number, points: number, reason: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/points/deduct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, points, reason })
      });

      if (response.ok) {
        await fetchData(); // Refresh data
        toast({
          title: "Success",
          description: "Tickets deducted successfully"
        });
      } else {
        throw new Error('Failed to deduct tickets');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deduct tickets",
        variant: "destructive"
      });
    }
  };

  // Handle selective disbursement processing
  const handleProcessSelectedDisbursements = async () => {
    if (!selectedCycle || selectedForDisbursement.size === 0) {
      toast({
        title: "Error",
        description: "Please select winners to process disbursements for",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessingDisbursements(true);
      const token = localStorage.getItem('token');
      const selectedWinnerIds = Array.from(selectedForDisbursement);
      
      const response = await fetch(`/api/admin/winner-cycles/${selectedCycle.id}/process-disbursements`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ selectedWinnerIds })
      });
      
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Disbursements Processed",
          description: `Successfully processed ${selectedWinnerIds.length} disbursements`
        });
        // Clear selection and reload winners
        setSelectedForDisbursement(new Set());
        loadWinners();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to process disbursements",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to process disbursements",
        variant: "destructive"
      });
    } finally {
      setIsProcessingDisbursements(false);
    }
  };

  // Calculate Proportional Point Deduction Ratios
  const calculateProportionalRatios = () => {
    if (!poolData || !users.length) return;

    const tiers = {
      tier1: users.filter((user: any) => (user.points || 0) >= tierThresholds.tier1),
      tier2: users.filter((user: any) => (user.points || 0) >= tierThresholds.tier2 && (user.points || 0) < tierThresholds.tier1),
      tier3: users.filter((user: any) => (user.points || 0) < tierThresholds.tier2)
    };

    const ratios = {
      tier1: 0,
      tier2: 0,
      tier3: 0
    };

    // Calculate ratio for each tier: average_reward_amount / average_points
    Object.keys(tiers).forEach((tierKey) => {
      const tierUsers = tiers[tierKey as keyof typeof tiers];
      const tierPool = (poolData as any)[`${tierKey}Pool`] || 0;
      
      if (tierUsers.length > 0) {
        const avgReward = tierPool / tierUsers.length;
        const avgPoints = tierUsers.reduce((sum: number, user: any) => sum + (user.points || 0), 0) / tierUsers.length;
        
        ratios[tierKey as keyof typeof ratios] = avgPoints > 0 ? avgReward / avgPoints : 0;
      }
    });

    setTierRatios(ratios);
  };

  // Calculate proportional deduction for a specific reward amount and tier
  const calculateProportionalDeduction = (rewardAmount: number, tier: string) => {
    const ratio = tierRatios[tier as keyof typeof tierRatios] || 0;
    return Math.round(rewardAmount * ratio);
  };

  const handleCreatePointAction = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/points/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pointActionForm)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Point action created successfully"
        });
        setShowPointActionDialog(false);
        setPointActionForm({
          actionId: '',
          name: '',
          basePoints: 10,
          maxDaily: 1,
          maxMonthly: 10,
          requiresProof: true,
          category: 'action',
          description: ''
        });
        fetchPointActions();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create point action",
        variant: "destructive"
      });
    }
  };

  const handleDeletePointAction = async (actionId: number) => {
    if (!confirm('Are you sure you want to delete this action? This cannot be undone.')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/points/actions/${actionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Point action deleted successfully"
        });
        fetchPointActions();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to delete point action",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete point action",
        variant: "destructive"
      });
    }
  };

  const handleUpdatePointAction = async (actionData: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/points/actions/${actionData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: actionData.name,
          basePoints: actionData.basePoints,
          maxDaily: actionData.maxDaily,
          maxMonthly: actionData.maxMonthly,
          requiresProof: actionData.requiresProof,
          category: actionData.category,
          description: actionData.description,
          isActive: actionData.isActive
        })
      });

      if (response.ok) {
        fetchPointActions(); // Refresh the actions list
      } else {
        throw new Error('Failed to update point action');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update point action",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchData();
    fetchPendingProofs();
    fetchPointActions();
    fetchSupportTickets();
    fetchCyclePoolSettings();
    fetchCurrentPoolSettings();

    // Removed automatic polling to improve performance
    // Data will refresh when user manually interacts with the interface
  }, []);

  useEffect(() => {
    calculateProportionalRatios();
  }, [poolData, users, tierThresholds]);




  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-gray-600">Manage users, content, and system settings</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => {
                window.location.href = '/dashboard';
              }}
            >
              Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                window.location.href = '/analytics';
              }}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/auth';
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex w-full flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="overview" className="flex-shrink-0">Overview</TabsTrigger>
            <TabsTrigger value="users" className="flex-shrink-0">Users</TabsTrigger>
            <TabsTrigger value="content" className="flex-shrink-0">Content</TabsTrigger>
            <TabsTrigger value="quiz" className="flex-shrink-0">Quiz</TabsTrigger>
            <TabsTrigger value="cycle-management" className="flex-shrink-0">Cycle Management</TabsTrigger>
            <TabsTrigger value="cycle-operations" className="flex-shrink-0">Cycle Operations</TabsTrigger>
            <TabsTrigger value="predictions" className="flex-shrink-0">Predictions</TabsTrigger>
            <TabsTrigger value="points" className="flex-shrink-0">Points</TabsTrigger>
            <TabsTrigger value="actions" className="flex-shrink-0">Actions</TabsTrigger>
            <TabsTrigger value="proofs" className="flex-shrink-0">Proof Review</TabsTrigger>
            <TabsTrigger value="support" className="flex-shrink-0">Support</TabsTrigger>
            <TabsTrigger value="settings" className="flex-shrink-0">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Premium Members</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.filter((u: any) => u.subscriptionStatus === 'active' && !u.isAdmin).length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.filter((u: any) => !u.isAdmin).length}</div>
                  <div className="text-sm text-gray-500">
                    {users.filter((u: any) => u.subscriptionStatus === 'active' && !u.isAdmin).length} premium
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Total Pool</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${poolData?.totalPool ?? 0}</div>
                  <div className="text-sm text-gray-500">
                    From {poolData?.premiumUsers ?? 0} premium members
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>Subscription-Cycle Integration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium">Premium Subscribers</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {users.filter((u: any) => u.subscriptionStatus === 'active' && !u.isAdmin).length}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Cycle Participants</div>
                      <div className="text-2xl font-bold text-green-600">
                        {poolData?.premiumUsers ?? 0}
                      </div>
                    </div>
                  </div>
                  
                  {users.filter((u: any) => u.subscriptionStatus === 'active' && !u.isAdmin).length !== (poolData?.premiumUsers ?? 0) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="text-sm text-yellow-800">
                        <strong>Data Mismatch Detected:</strong> {users.filter((u: any) => u.subscriptionStatus === 'active' && !u.isAdmin).length - (poolData?.premiumUsers ?? 0)} premium subscribers not enrolled in cycles
                      </div>
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/admin/backfill-cycle-enrollment', {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                'Content-Type': 'application/json'
                              }
                            });
                            const result = await response.json();
                            
                            if (result.success) {
                              alert(`Backfill completed: ${result.data.message}`);
                              window.location.reload();
                            } else {
                              alert(`Backfill failed: ${result.error}`);
                            }
                          } catch (error) {
                            alert('Failed to execute backfill process');
                          }
                        }}
                      >
                        Fix Enrollment Issue
                      </Button>
                    </div>
                  )}
                  
                  {users.filter((u: any) => u.subscriptionStatus === 'active').length === (poolData?.premiumUsers ?? 0) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="text-sm text-green-800">
                        ✓ All premium subscribers are enrolled in cycles
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tier Thresholds</CardTitle>
                  <CardDescription>Dynamic percentile-based point thresholds</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-medium">Tier 1</Label>
                        <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                          {tierThresholds.tier1}+ points
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-medium">Tier 2</Label>
                        <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                          {tierThresholds.tier2}+ points
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-medium">Tier 3</Label>
                        <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                          0+ points
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="space-y-6">
              {/* User Statistics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{users.filter((u: any) => !u.isAdmin).length}</div>
                    <p className="text-xs text-muted-foreground">
                      +12% from last month
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                    <Activity className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{users.filter((u: any) => u.isActive && !u.isAdmin).length}</div>
                    <p className="text-xs text-muted-foreground">
                      {users.filter((u: any) => !u.isAdmin).length > 0 ? Math.round((users.filter((u: any) => u.isActive && !u.isAdmin).length / users.filter((u: any) => !u.isAdmin).length) * 100) : 100}% active rate
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Members</CardTitle>
                    <Crown className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {users.filter((u: any) => u.subscriptionStatus === 'active' && !u.isAdmin).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {users.filter((u: any) => u.subscriptionStatus !== 'active' && !u.isAdmin).length} free users
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Points</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {users.filter((u: any) => !u.isAdmin).length > 0 ? Math.round(users.filter((u: any) => !u.isAdmin).reduce((sum: number, u: any) => sum + (u.totalPoints || 0), 0) / users.filter((u: any) => !u.isAdmin).length) : 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Per user average
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Tier Thresholds Display */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Current Tier Thresholds</CardTitle>
                  <CardDescription>
                    Dynamic tier boundaries based on monthly points distribution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border">
                      <div className="text-sm text-blue-600 font-medium">Tier 1</div>
                      <div className="text-2xl font-bold text-blue-700">{tierThresholds.tier1}+</div>
                      <div className="text-xs text-blue-500">Top 33% (Monthly Points)</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border">
                      <div className="text-sm text-blue-600 font-medium">Tier 2</div>
                      <div className="text-2xl font-bold text-blue-700">{tierThresholds.tier2} - {tierThresholds.tier1 - 1}</div>
                      <div className="text-xs text-blue-500">Middle 33% (Monthly Points)</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border">
                      <div className="text-sm text-blue-600 font-medium">Tier 3</div>
                      <div className="text-2xl font-bold text-blue-700">0 - {tierThresholds.tier2 - 1}</div>
                      <div className="text-xs text-blue-500">Bottom 33% (Monthly Points)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Management Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>User Accounts</CardTitle>
                      <CardDescription>
                        Manage user accounts, permissions, and activity
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input 
                        placeholder="Search users..." 
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="w-64" 
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => exportUserAccounts('csv')}>
                            Export as CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportUserAccounts('xlsx')}>
                            Export as Excel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        onClick={() => {
                          setEditingUser(null);
                          setShowEditUserDialog(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add User
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Points</TableHead>
                          <TableHead>Tier</TableHead>
                          <TableHead>PayPal Email</TableHead>
                          <TableHead>Membership</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Last Login</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users
                          .filter((user: any) => 
                            !user.isAdmin &&
                            (user.username?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                            user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()))
                          )
                          .slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage)
                          .map((user: any) => (
                            <TableRow key={user.id}>
                            <TableCell>
                              <div className="text-sm font-mono text-gray-600">{user.id}</div>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                    {user.username?.charAt(0)?.toUpperCase() || 'U'}
                                  </div>
                                  <div>
                                    <div>{user.username}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{user.totalPoints || 0}</div>
                                <div className="text-sm text-gray-500">
                                  {user.currentMonthPoints || 0} this month
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                user.tier === 'tier3' ? 'default' :
                                user.tier === 'tier2' ? 'secondary' : 'outline'
                              }>
                                {user.tier?.replace('tier', 'Tier ') || 'Tier 1'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {user.paypalEmail ? (
                                  <span className="text-green-600">{user.paypalEmail}</span>
                                ) : (
                                  <span className="text-red-500">No PayPal email</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant={user.subscriptionStatus === 'active' ? "default" : "outline"}>
                                  {user.subscriptionStatus === 'active' ? 'Member' : 'Free'}
                                </Badge>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleToggleSubscription(user.id, user.subscriptionStatus)}
                                >
                                  {user.subscriptionStatus === 'active' ? 'Downgrade' : 'Upgrade'}
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.isActive ? "default" : "secondary"}>
                                {user.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowUserDialog(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setEditingUser(user);
                                    setShowEditUserDialog(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowUserSettingsDialog(true);
                                  }}
                                >
                                  <Settings className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                      {(() => {
                        const filteredUsers = users.filter((user: any) => 
                          !user.isAdmin &&
                          (user.username?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                          user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()))
                        );
                        const start = Math.min((currentPage - 1) * usersPerPage + 1, filteredUsers.length);
                        const end = Math.min(currentPage * usersPerPage, filteredUsers.length);
                        return `Showing ${start} to ${end} of ${filteredUsers.length} users`;
                      })()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {currentPage} of {(() => {
                          const filteredUsers = users.filter((user: any) => 
                            !user.isAdmin &&
                            (user.username?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                            user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()))
                          );
                          return Math.ceil(filteredUsers.length / usersPerPage);
                        })()}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={(() => {
                          const filteredUsers = users.filter((user: any) => 
                            !user.isAdmin &&
                            (user.username?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                            user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()))
                          );
                          return currentPage >= Math.ceil(filteredUsers.length / usersPerPage);
                        })()}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* User Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Tier Distribution</CardTitle>
                    <CardDescription>User distribution across performance tiers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['tier1', 'tier2', 'tier3'].map((tier) => {
                        const premiumUsers = users.filter((u: any) => u.subscriptionStatus === 'active' && !u.isAdmin);
                        const count = premiumUsers.filter((u: any) => u.tier === tier).length;
                        const percentage = premiumUsers.length > 0 ? Math.round((count / premiumUsers.length) * 100) : 0;
                        return (
                          <div key={tier} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{tier.replace('tier', 'Tier ')}</span>
                              <span>{count} users ({percentage}%)</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest user registrations and logins</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {users.filter((u: any) => !u.isAdmin).slice(0, 5).map((user: any) => (
                        <div key={user.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                              {user.username?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="text-sm font-medium">{user.username}</div>
                              <div className="text-xs text-gray-500">
                                {user.totalPoints || 0} points
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">
                              {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content">
            <div className="space-y-6">
              {/* Content Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{modules.length}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Modules</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{modules.filter((m: any) => m.isActive).length}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Categories</CardTitle>
                    <Target className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {[...new Set(modules.map((m: any) => m.category))].length}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Points</CardTitle>
                    <Star className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(modules.reduce((sum: number, m: any) => sum + (m.pointsReward || 0), 0) / (modules.length || 1))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Module Management Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Learning Modules</CardTitle>
                      <CardDescription>
                        Manage educational content and point rewards
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => {
                        setModuleForm({
                          title: '',
                          description: '',
                          content: '',
                          pointsReward: 20,
                          category: 'budgeting',
                          difficulty: 'beginner',
                          estimatedMinutes: 5,
                          accessType: 'premium',
                          isActive: true,
                          isPublished: false
                        });
                        setShowEditModuleDialog(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Module
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Difficulty</TableHead>
                          <TableHead>Points</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Access</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Published</TableHead>
                          <TableHead>Published Since</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {modules
                          .sort((a: any, b: any) => {
                            // Sort by published status first (published modules at top)
                            if (a.isPublished !== b.isPublished) {
                              return b.isPublished ? 1 : -1;
                            }
                            // Then sort by creation date (newest first)
                            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                          })
                          .slice((currentModulePage - 1) * modulesPerPage, currentModulePage * modulesPerPage)
                          .map((module: any) => (
                          <TableRow key={module.id}>
                            <TableCell className="font-medium">
                              <div>
                                <div>{module.title}</div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {module.description}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{module.category}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                module.difficulty === 'beginner' ? 'default' :
                                module.difficulty === 'intermediate' ? 'secondary' : 'destructive'
                              }>
                                {module.difficulty}
                              </Badge>
                            </TableCell>
                            <TableCell>{module.pointsReward}</TableCell>
                            <TableCell>{module.estimatedMinutes}min</TableCell>
                            <TableCell>
                              <Badge variant={module.accessType === 'premium' ? "default" : "outline"}>
                                {module.accessType === 'premium' ? 'Premium' : 'Free'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={module.isActive ? "default" : "secondary"}>
                                {module.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Switch 
                                checked={module.isPublished} 
                                onCheckedChange={(checked) => handleTogglePublish(module.id, checked)}
                              />
                            </TableCell>
                            <TableCell>
                              {module.publishedAt ? new Date(module.publishedAt).toLocaleDateString() : "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedModule(module);
                                    setShowModuleDialog(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setEditingModule(module);
                                    setShowEditModuleDialog(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDeleteModule(module.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Pagination Controls */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-600">
                      {(() => {
                        const start = Math.min((currentModulePage - 1) * modulesPerPage + 1, modules.length);
                        const end = Math.min(currentModulePage * modulesPerPage, modules.length);
                        return `Showing ${start} to ${end} of ${modules.length} modules`;
                      })()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentModulePage(Math.max(1, currentModulePage - 1))}
                        disabled={currentModulePage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {currentModulePage} of {Math.ceil(modules.length / modulesPerPage)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentModulePage(currentModulePage + 1)}
                        disabled={currentModulePage >= Math.ceil(modules.length / modulesPerPage)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Content Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Performance</CardTitle>
                    <CardDescription>Module completion rates and engagement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {modules.slice(0, 5).map((module: any) => (
                        <div key={module.id} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{module.title}</div>
                            <div className="text-xs text-gray-500">{module.category}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">85%</div>
                            <div className="text-xs text-gray-500">completion</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Category Distribution</CardTitle>
                    <CardDescription>Content breakdown by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[...new Set(modules.map((m: any) => m.category))].map((category: string) => {
                        const count = modules.filter((m: any) => m.category === category).length;
                        const percentage = Math.round((count / modules.length) * 100);
                        return (
                          <div key={category} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{category}</span>
                              <span>{count} modules ({percentage}%)</span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quiz">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <HelpCircle className="w-5 h-5" />
                        Quiz Management
                      </CardTitle>
                      <CardDescription>
                        Manage financial personality assessment questions
                      </CardDescription>
                    </div>
                    <Button onClick={() => setShowQuizDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {quizQuestions.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <HelpCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No quiz questions found. Add your first question to get started.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {quizQuestions.map((question: any, index: number) => (
                          <Card key={question.id || index} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium mb-2">
                                    Question {question.order || index + 1}: {question.question}
                                  </h4>
                                  <div className="space-y-1 text-sm text-gray-600">
                                    {question.options?.map((option: any, optIndex: number) => (
                                      <div key={optIndex} className="flex items-center gap-2">
                                        <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs">
                                          {String.fromCharCode(65 + optIndex)}
                                        </span>
                                        <span>{option.text || option}</span>
                                      </div>
                                    ))}
                                  </div>
                                  {question.explanation && (
                                    <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                                      <strong>Explanation:</strong> {question.explanation}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      // Edit functionality
                                      toast({
                                        title: "Edit Question",
                                        description: "Question editing will be available soon.",
                                      });
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      // Delete functionality
                                      const updatedQuestions = quizQuestions.filter((_, i) => i !== index);
                                      setQuizQuestions(updatedQuestions);
                                      toast({
                                        title: "Question Deleted",
                                        description: "Quiz question has been removed.",
                                      });
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cycle-management">
            <CycleManagementTab 
              cycleSettings={cycleSettings as any} 
              onRefresh={fetchData}
            />
          </TabsContent>

          <TabsContent value="cycle-operations">
            <CycleOperationsTab 
              cycleSettings={cycleSettings} 
              onRefresh={fetchData}
            />
          </TabsContent>

          <TabsContent value="predictions">
            <PredictionsTab 
              cycleSettings={cycleSettings} 
              onRefresh={fetchData}
            />
          </TabsContent>

          <TabsContent value="legacy-cycle-management">
            <div className="space-y-6">
              {/* Cycle Creation and Configuration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Cycle Configuration
                      </CardTitle>
                      <CardDescription>
                        Create and manage reward cycles with flexible durations and parameters
                      </CardDescription>
                    </div>
                    <Button onClick={() => {
                      setEditingCycle(null);
                      setCycleForm({
                        cycleName: '',
                        cycleStartDate: '',
                        cycleEndDate: '',
                        paymentPeriodDays: 30,
                        membershipFee: 2000,
                        rewardPoolPercentage: 50,
                        tier1Threshold: 56,
                        tier2Threshold: 21,
                        isActive: true,
                        allowMidCycleJoining: true,
                        midCycleJoinThresholdDays: 3
                      });
                      setShowCycleDialog(true);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Cycle
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cycleSettings.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No cycles configured yet. Create your first cycle to enable flexible reward periods.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {cycleSettings.map((cycle) => (
                          <div key={cycle.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold">{cycle.cycleName}</h3>
                                  <Badge variant={cycle.isActive ? "default" : "secondary"}>
                                    {cycle.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500">Duration:</span>
                                    <div className="font-medium">
                                      {new Date(cycle.cycleStartDate).toLocaleDateString()} - {new Date(cycle.cycleEndDate).toLocaleDateString()}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <span className="text-gray-500">Payment Period:</span>
                                    <div className="font-medium">{cycle.paymentPeriodDays} days</div>
                                  </div>
                                  
                                  <div>
                                    <span className="text-gray-500">Membership Fee:</span>
                                    <div className="font-medium">${(cycle.membershipFee / 100).toFixed(2)}</div>
                                  </div>
                                  
                                  <div>
                                    <span className="text-gray-500">Reward Pool:</span>
                                    <div className="font-medium">{cycle.rewardPoolPercentage}%</div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-2">
                                  <div>
                                    <span className="text-gray-500">Tier 1 Threshold:</span>
                                    <div className="font-medium">{cycle.tier1Threshold}+ points</div>
                                  </div>
                                  
                                  <div>
                                    <span className="text-gray-500">Tier 2 Threshold:</span>
                                    <div className="font-medium">{cycle.tier2Threshold}+ points</div>
                                  </div>
                                  
                                  <div>
                                    <span className="text-gray-500">Mid-cycle Joining:</span>
                                    <div className="font-medium">
                                      {cycle.allowMidCycleJoining 
                                        ? `Allowed (${cycle.midCycleJoinThresholdDays}d threshold)`
                                        : 'Disabled'
                                      }
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingCycle(cycle);
                                    setCycleForm({
                                      cycleName: cycle.cycleName,
                                      cycleStartDate: new Date(cycle.cycleStartDate).toISOString().split('T')[0],
                                      cycleEndDate: new Date(cycle.cycleEndDate).toISOString().split('T')[0],
                                      paymentPeriodDays: cycle.paymentPeriodDays,
                                      membershipFee: cycle.membershipFee,
                                      rewardPoolPercentage: cycle.rewardPoolPercentage,
                                      tier1Threshold: cycle.tier1Threshold,
                                      tier2Threshold: cycle.tier2Threshold,
                                      isActive: cycle.isActive,
                                      allowMidCycleJoining: cycle.allowMidCycleJoining,
                                      midCycleJoinThresholdDays: cycle.midCycleJoinThresholdDays
                                    });
                                    setShowCycleDialog(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteCycle(cycle.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tier Thresholds Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Tier Threshold Configuration
                  </CardTitle>
                  <CardDescription>
                    Set point thresholds for tier assignments within cycles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Current Tier Thresholds</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-green-800">Tier 1 (Highest)</div>
                          <div className="text-2xl font-bold text-green-900">{tierThresholds.tier1}+</div>
                          <div className="text-xs text-gray-600">Top performers</div>
                        </div>
                        <div>
                          <div className="font-medium text-blue-800">Tier 2 (Middle)</div>
                          <div className="text-2xl font-bold text-blue-900">{tierThresholds.tier2} - {tierThresholds.tier1 - 1}</div>
                          <div className="text-xs text-gray-600">Average performers</div>
                        </div>
                        <div>
                          <div className="font-medium text-orange-800">Tier 3 (Entry)</div>
                          <div className="text-2xl font-bold text-orange-900">0 - {tierThresholds.tier2 - 1}</div>
                          <div className="text-xs text-gray-600">New/inactive users</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-700">
                        <strong>Note:</strong> Tier thresholds are calculated dynamically based on user performance percentiles. 
                        Tier assignments update automatically as users earn points throughout the cycle.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pool Allocation Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Pool Allocation Settings
                  </CardTitle>
                  <CardDescription>
                    Configure how membership fees are distributed across reward pools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{currentPoolSettings.rewardPoolPercentage}%</div>
                      <div className="text-sm text-gray-500">To Rewards</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">${((currentPoolSettings.membershipFee / 100) * (currentPoolSettings.rewardPoolPercentage / 100)).toFixed(2)}</div>
                      <div className="text-sm text-gray-500">Per Member</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">${(currentPoolSettings.membershipFee / 100).toFixed(2)}</div>
                      <div className="text-sm text-gray-500">Monthly Fee</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">${((currentPoolSettings.membershipFee / 100) * ((100 - currentPoolSettings.rewardPoolPercentage) / 100)).toFixed(2)}</div>
                      <div className="text-sm text-gray-500">To Operations</div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg border">
                      <div className="text-sm font-medium text-green-800">Tier 1 Pool</div>
                      <div className="text-2xl font-bold text-green-900">
                        ${poolData?.tier1Pool || 0}
                      </div>
                      <div className="text-xs text-green-600">Highest tier rewards</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border">
                      <div className="text-sm font-medium text-blue-800">Tier 2 Pool</div>
                      <div className="text-2xl font-bold text-blue-900">
                        ${poolData?.tier2Pool || 0}
                      </div>
                      <div className="text-xs text-blue-600">Middle tier rewards</div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border">
                      <div className="text-sm font-medium text-orange-800">Tier 3 Pool</div>
                      <div className="text-2xl font-bold text-orange-900">
                        ${poolData?.tier3Pool || 0}
                      </div>
                      <div className="text-xs text-orange-600">Entry tier rewards</div>
                    </div>
                  </div>
                </CardContent>
              </Card>


            </div>
          </TabsContent>

          <TabsContent value="cycle-operations">
            <div className="space-y-6">
              {/* Current Cycle Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Cycle</CardTitle>
                    <Calendar className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {cycleSettings.filter(cycle => cycle.isActive).length > 0 ? 
                        cycleSettings.find(cycle => cycle.isActive)?.cycleName : 
                        'No Active Cycle'
                      }
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {cycleSettings.filter(cycle => cycle.isActive).length > 0 ? 
                        `${new Date(cycleSettings.find(cycle => cycle.isActive)?.cycleStartDate || '').toLocaleDateString()} - ${new Date(cycleSettings.find(cycle => cycle.isActive)?.cycleEndDate || '').toLocaleDateString()}` :
                        'Create a cycle to begin operations'
                      }
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Enrolled Users</CardTitle>
                    <Users className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {userCyclePoints.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Users participating in current cycle
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pool</CardTitle>
                    <Trophy className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${poolData?.totalPool || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Available for reward distribution
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* User Enrollment Management */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        User Enrollment Management
                      </CardTitle>
                      <CardDescription>
                        Monitor and manage user participation in active cycles
                      </CardDescription>
                    </div>
                    {userCyclePoints.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => exportUserEnrollment('csv')}>
                            Export as CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportUserEnrollment('xlsx')}>
                            Export as Excel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userCyclePoints.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No users enrolled in active cycles yet.
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2">ID</th>
                                <th className="text-left p-2">User</th>
                                <th className="text-left p-2">Email</th>
                                <th className="text-left p-2">Current Points</th>
                                <th className="text-left p-2">Tier</th>
                                <th className="text-left p-2">Joined</th>
                                <th className="text-left p-2">Last Activity</th>
                                <th className="text-left p-2">Predictions</th>
                                <th className="text-left p-2">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const USERS_PER_PAGE = 20;
                                const startIndex = (enrollmentPage - 1) * USERS_PER_PAGE;
                                const endIndex = startIndex + USERS_PER_PAGE;
                                const paginatedUsers = userCyclePoints.slice(startIndex, endIndex);

                                return paginatedUsers.map((userPoints) => {
                                  return (
                                    <tr key={userPoints.userId} className="border-b">
                                      <td className="p-2">
                                        <div className="text-sm font-mono text-gray-600">{userPoints.userId}</div>
                                      </td>
                                      <td className="p-2">
                                        <div className="font-medium">{userPoints.username || 'Unknown'}</div>
                                      </td>
                                      <td className="p-2">
                                        <div className="text-sm text-gray-700">{userPoints.email}</div>
                                      </td>
                                      <td className="p-2">
                                        <div className="font-bold text-green-600">
                                          {userPoints.currentCyclePoints}
                                        </div>
                                      </td>
                                      <td className="p-2">
                                        <Badge variant={
                                          userPoints.tier === 'tier1' ? 'default' :
                                          userPoints.tier === 'tier2' ? 'secondary' : 'outline'
                                        }>
                                          {userPoints.tier.replace('tier', 'Tier ')}
                                        </Badge>
                                      </td>
                                      <td className="p-2">
                                        <div className="text-xs">
                                          {new Date(userPoints.joinedCycleAt).toLocaleDateString()}
                                        </div>
                                      </td>
                                      <td className="p-2">
                                        <div className="text-xs">
                                          {userPoints.lastActivityDate 
                                            ? new Date(userPoints.lastActivityDate).toLocaleDateString()
                                            : 'No activity'
                                          }
                                        </div>
                                      </td>
                                      <td className="p-2">
                                        <div className="text-xs space-y-1">
                                          {userPoints.predictions && userPoints.predictions.length > 0 ? (
                                            userPoints.predictions.map((prediction, index) => (
                                              <div key={index} className="bg-gray-50 px-2 py-1 rounded text-xs">
                                                <div className="font-medium text-gray-700 truncate max-w-[120px]" title={prediction.question}>
                                                  {prediction.question.length > 20 ? 
                                                    prediction.question.substring(0, 20) + '...' : 
                                                    prediction.question
                                                  }
                                                </div>
                                                <div className="text-blue-600 font-bold text-sm" title={prediction.selectedOption}>
                                                  {String.fromCharCode(65 + prediction.selectedOptionIndex)}
                                                </div>
                                              </div>
                                            ))
                                          ) : (
                                            <span className="text-gray-400">No answers</span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="p-2">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                              <Settings className="w-4 h-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => {
                                              navigator.clipboard.writeText(`user${userPoints.userId}@test.com`);
                                              toast({ title: "Email copied", description: "User email copied to clipboard" });
                                            }}>
                                              <Copy className="mr-2 h-4 w-4" />
                                              Copy Email
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => {
                                              window.open(`/dashboard?user=${userPoints.userId}`, '_blank');
                                            }}>
                                              <ExternalLink className="mr-2 h-4 w-4" />
                                              View Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => {
                                              if (confirm(`Reset ${user?.username}'s cycle points to 0?`)) {
                                                // This would need an API endpoint implementation
                                                toast({ title: "Feature coming soon", description: "Point reset functionality will be added" });
                                              }
                                            }}>
                                              <RotateCcw className="mr-2 h-4 w-4" />
                                              Reset Points
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem 
                                              className="text-red-600"
                                              onClick={() => {
                                                if (confirm(`Remove ${user?.username} from the current cycle?`)) {
                                                  // This would need an API endpoint implementation
                                                  toast({ title: "Feature coming soon", description: "User removal functionality will be added" });
                                                }
                                              }}
                                            >
                                              <UserX className="mr-2 h-4 w-4" />
                                              Remove from Cycle
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </td>
                                    </tr>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Pagination Controls */}
                        {(() => {
                          const USERS_PER_PAGE = 20;
                          const totalPages = Math.ceil(userCyclePoints.length / USERS_PER_PAGE);
                          
                          if (totalPages <= 1) return null;
                          
                          return (
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-gray-500">
                                Showing {((enrollmentPage - 1) * USERS_PER_PAGE) + 1} to{' '}
                                {Math.min(enrollmentPage * USERS_PER_PAGE, userCyclePoints.length)} of{' '}
                                {userCyclePoints.length} users
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEnrollmentPage(prev => Math.max(prev - 1, 1))}
                                  disabled={enrollmentPage === 1}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                  Previous
                                </Button>
                                <span className="text-sm">
                                  Page {enrollmentPage} of {totalPages}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEnrollmentPage(prev => Math.min(prev + 1, totalPages))}
                                  disabled={enrollmentPage === totalPages}
                                >
                                  Next
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Winner Selection Interface */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Winner Selection & Distribution
                  </CardTitle>
                  <CardDescription>
                    Execute winner selection algorithm and manage reward distribution
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Selection Process</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <div>1. Point-weighted selection within each tier (higher points = better odds)</div>
                        <div>2. Configurable percentage of users selected as winners per tier</div>
                        <div>3. Individual payout adjustment capability before disbursement</div>
                        <div>4. PayPal integration for automated reward distribution</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm font-medium text-green-800">Tier 1 Pool</div>
                        <div className="text-2xl font-bold text-green-900">
                          ${poolData?.tier1Pool || 0}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Top performers pool
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm font-medium text-blue-800">Tier 2 Pool</div>
                        <div className="text-2xl font-bold text-blue-900">
                          ${poolData?.tier2Pool || 0}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Middle performers pool
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm font-medium text-orange-800">Tier 3 Pool</div>
                        <div className="text-2xl font-bold text-orange-900">
                          ${poolData?.tier3Pool || 0}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Entry level pool
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Label>Selection Mode:</Label>
                          <Select value={winnerSelectionMode} onValueChange={setWinnerSelectionMode}>
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weighted_random">Point-Weighted Random (Default)</SelectItem>
                              <SelectItem value="top_performers">Top Performers</SelectItem>
                              <SelectItem value="random">Pure Random</SelectItem>
                              <SelectItem value="manual">Manual Selection</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label>Tier 1 Winners</Label>
                            <Input 
                              type="number" 
                              value={tierSettings.tier1.winnerCount}
                              onChange={(e) => setTierSettings(prev => ({
                                ...prev,
                                tier1: { ...prev.tier1, winnerCount: parseInt(e.target.value) || 0 }
                              }))}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <Label>Tier 2 Winners</Label>
                            <Input 
                              type="number" 
                              value={tierSettings.tier2.winnerCount}
                              onChange={(e) => setTierSettings(prev => ({
                                ...prev,
                                tier2: { ...prev.tier2, winnerCount: parseInt(e.target.value) || 0 }
                              }))}
                              className="w-full"
                            />
                          </div>
                          <div>
                            <Label>Tier 3 Winners</Label>
                            <Input 
                              type="number" 
                              value={tierSettings.tier3.winnerCount}
                              onChange={(e) => setTierSettings(prev => ({
                                ...prev,
                                tier3: { ...prev.tier3, winnerCount: parseInt(e.target.value) || 0 }
                              }))}
                              className="w-full"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <Button 
                          variant="outline"
                          onClick={handleClearWinnerSelection}
                          disabled={!selectionResults}
                        >
                          Clear Selection
                        </Button>
                        <Button 
                          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                          onClick={handleExecuteWinnerSelection}
                          disabled={!cycleSettings.some(c => c.isActive) || isRunningSelection}
                        >
                          {isRunningSelection ? 'Running Selection...' : 'Execute Winner Selection'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Individual Payout Adjustments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Payout Adjustments
                  </CardTitle>
                  <CardDescription>
                    Adjust individual winner payout percentages before processing disbursements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectionResults ? (
                      <div className="space-y-4">
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-medium text-green-900 mb-2">Winner Selection Complete</h4>
                          <div className="text-sm text-green-800">
                            Winners have been selected. You can now adjust individual payout percentages before processing disbursements.
                          </div>
                        </div>
                        
                        {/* Flexible Winner Selection Results */}
                        <div className="space-y-4">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2">Selection Summary</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div className="text-blue-600 font-medium">Selection Mode</div>
                                <div className="capitalize">{selectionResults.selectionMode.replace('_', ' ')}</div>
                              </div>
                              <div>
                                <div className="text-blue-600 font-medium">Total Winners</div>
                                <div>{winnerDetails?.length || 0}</div>
                              </div>
                              <div>
                                <div className="text-blue-600 font-medium">Total Pool</div>
                                <div>${(selectionResults.totalRewardPool / 100).toFixed(2)}</div>
                              </div>
                              <div>
                                <div className="text-blue-600 font-medium">Method</div>
                                <div>Point-Weighted Random</div>
                              </div>
                            </div>
                          </div>

                          {/* Export/Import Controls */}
                          <div className="flex justify-between items-center mb-4">
                            <div className="text-sm text-gray-600">
                              {winnerDetails?.length || 0} winners selected
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={handleExportWinners}
                                disabled={!winnerDetails || winnerDetails.length === 0}
                                className="flex items-center gap-2"
                              >
                                <Download className="w-4 h-4" />
                                Export to Excel
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setShowImportDialog(true)}
                                disabled={!winnerDetails || winnerDetails.length === 0}
                                className="flex items-center gap-2"
                              >
                                <Upload className="w-4 h-4" />
                                Import from Excel
                              </Button>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left p-2">Overall Rank</th>
                                  <th className="text-left p-2">Tier Rank</th>
                                  <th className="text-left p-2">Winner</th>
                                  <th className="text-left p-2">User ID</th>
                                  <th className="text-left p-2">Email</th>
                                  <th className="text-left p-2">Tier</th>
                                  <th className="text-left p-2">Points</th>
                                  <th className="text-left p-2">Tier Size</th>
                                  <th className="text-left p-2">Payout %</th>
                                  <th className="text-left p-2">Payout Calc</th>
                                  <th className="text-left p-2">Payout Override</th>
                                  <th className="text-left p-2">Payout Final</th>
                                </tr>
                              </thead>
                              <tbody>
                                {useMemo(() => {
                                  // Use paginated data from server instead of client-side pagination
                                  const winnersToDisplay = paginatedWinners.winners || [];
                                  
                                  return winnersToDisplay.map((winner: any) => {
                                    // Calculate tier size from selection results to match the Winner Selection section
                                    const tierSize = (() => {
                                      if (winner.tier === 'tier1') return selectionResults?.tierBreakdown?.tier1?.poolAmount || 825000; // $8,250 in cents
                                      if (winner.tier === 'tier2') return selectionResults?.tierBreakdown?.tier2?.poolAmount || 495000; // $4,950 in cents
                                      if (winner.tier === 'tier3') return selectionResults?.tierBreakdown?.tier3?.poolAmount || 330000; // $3,300 in cents
                                      return 0;
                                    })();
                                  
                                  const payoutPercentage = payoutPercentages[winner.id] || '';
                                  const payoutCalc = payoutPercentage !== '' ? (tierSize * parseFloat(payoutPercentage)) / 100 : 0;
                                  const payoutOverride = payoutOverrides[winner.id];
                                  const payoutFinal = payoutOverride !== undefined ? payoutOverride : payoutCalc;
                                  
                                  return (
                                    <tr key={winner.id} className="border-b">
                                      <td className="p-2">
                                        <div className="font-bold text-blue-600">#{winner.overallRank}</div>
                                      </td>
                                      <td className="p-2">
                                        <div className="font-medium">#{winner.tierRank}</div>
                                      </td>
                                      <td className="p-2">
                                        <div className="font-medium">{winner.username}</div>
                                      </td>
                                      <td className="p-2">
                                        <div className="text-xs font-mono text-gray-600">{winner.userId}</div>
                                      </td>
                                      <td className="p-2">
                                        <div className="text-xs text-gray-500">{winner.email}</div>
                                      </td>
                                      <td className="p-2">
                                        <Badge variant={
                                          winner.tier === 'tier1' ? 'default' : 
                                          winner.tier === 'tier2' ? 'secondary' : 'outline'
                                        }>
                                          {winner.tier === 'tier1' ? 'Tier 1' : 
                                           winner.tier === 'tier2' ? 'Tier 2' : 'Tier 3'}
                                        </Badge>
                                      </td>
                                      <td className="p-2">
                                        <div className="font-bold text-green-600">{winner.pointsAtSelection}</div>
                                      </td>
                                      <td className="p-2">
                                        <div className="font-medium">${(tierSize / 100).toFixed(2)}</div>
                                      </td>
                                      <td className="p-2">
                                        <Input 
                                          type="text"
                                          value={payoutPercentages[winner.id] || ''}
                                          className="w-20 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            // Only allow numeric input for percentages
                                            if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0 && parseFloat(value) <= 100)) {
                                              setPayoutPercentages(prev => ({
                                                ...prev,
                                                [winner.id]: value
                                              }));
                                            }
                                          }}
                                          placeholder="0"
                                        />
                                      </td>
                                      <td className="p-2">
                                        <div className="font-medium">${(payoutCalc / 100).toFixed(2)}</div>
                                      </td>
                                      <td className="p-2">
                                        <input
                                          type="text"
                                          inputMode="decimal"
                                          pattern="^\d+(\.\d{0,2})?$"
                                          className="w-32 text-center p-2 border rounded bg-background text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                          value={payoutOverrides[winner.id] !== undefined ? (payoutOverrides[winner.id] / 100).toFixed(2) : ''}
                                          onChange={(e) => {
                                            const value = e.target.value;
                                            // Allow natural typing without premature validation
                                            if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
                                              // Store raw string value temporarily
                                              setPayoutOverrides(prev => {
                                                if (value === '') {
                                                  const updated = { ...prev };
                                                  delete updated[winner.id];
                                                  return updated;
                                                } else {
                                                  // Convert to cents only if valid number
                                                  const numValue = parseFloat(value);
                                                  if (!isNaN(numValue) && numValue >= 0) {
                                                    return {
                                                      ...prev,
                                                      [winner.id]: Math.round(numValue * 100)
                                                    };
                                                  }
                                                  return prev;
                                                }
                                              });
                                            }
                                          }}
                                          placeholder="0.00"
                                        />
                                      </td>
                                      <td className="p-2">
                                        <div className="font-bold text-blue-600">${(payoutFinal / 100).toFixed(2)}</div>
                                      </td>
                                    </tr>
                                  );
                                  });
                                }, [paginatedWinners.winners, selectionResults, payoutPercentages, payoutOverrides])}
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Winner Table Pagination - Server-side */}
                          {paginatedWinners.totalCount > 0 && (
                            <div className="flex items-center justify-between mt-4">
                              <div className="text-sm text-gray-600">
                                Showing {((paginatedWinners.currentPage - 1) * winnersPerPage) + 1} to {Math.min(paginatedWinners.currentPage * winnersPerPage, paginatedWinners.totalCount)} of {paginatedWinners.totalCount} winners
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newPage = Math.max(1, paginatedWinners.currentPage - 1);
                                    setWinnerTablePage(newPage);
                                    if (currentPoolSettings?.id) {
                                      loadPaginatedWinnerDetails(currentPoolSettings.id, newPage, winnersPerPage);
                                    }
                                  }}
                                  disabled={paginatedWinners.currentPage <= 1}
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                  Previous
                                </Button>
                                <span className="text-sm">
                                  Page {paginatedWinners.currentPage} of {paginatedWinners.totalPages}
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newPage = Math.min(paginatedWinners.totalPages, paginatedWinners.currentPage + 1);
                                    setWinnerTablePage(newPage);
                                    if (currentPoolSettings?.id) {
                                      loadPaginatedWinnerDetails(currentPoolSettings.id, newPage, winnersPerPage);
                                    }
                                  }}
                                  disabled={paginatedWinners.currentPage >= paginatedWinners.totalPages}
                                >
                                  Next
                                  <ChevronRight className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end space-x-3">
                          <Button variant="outline">Reset All to 100%</Button>
                          <Button>Save Adjustments</Button>
                          <Button className="bg-green-600 hover:bg-green-700">
                            Process PayPal Disbursements
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Run winner selection first to enable payout adjustments.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Point Deduction Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Point Deduction Management
                  </CardTitle>
                  <CardDescription>
                    Manual point deductions and proportional point system controls
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Manual Point Deduction</h4>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="targetUser">Target User</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select user" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.slice(0, 10).map((user: any) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.username} ({user.totalPoints} points)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="deductionAmount">Points to Deduct</Label>
                          <Input
                            id="deductionAmount"
                            type="number"
                            min="1"
                            placeholder="Enter amount"
                          />
                        </div>
                        <div>
                          <Label htmlFor="deductionReason">Rationale</Label>
                          <Textarea
                            id="deductionReason"
                            placeholder="Provide detailed reason for point deduction..."
                            rows={3}
                          />
                        </div>
                        <Button className="w-full">
                          Apply Deduction
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Proportional Deduction System</h4>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-sm text-blue-800 space-y-2">
                          <div><strong>Tier 1 Ratio:</strong> {tierRatios.tier1.toFixed(4)}</div>
                          <div><strong>Tier 2 Ratio:</strong> {tierRatios.tier2.toFixed(4)}</div>
                          <div><strong>Tier 3 Ratio:</strong> {tierRatios.tier3.toFixed(4)}</div>
                        </div>
                        <div className="mt-3 text-xs text-gray-600">
                          Automatic proportional deduction applied to winners based on reward amount and tier performance.
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Winner Selection History */}
              <Card>
                <CardHeader>
                  <CardTitle>Cycle Operations History</CardTitle>
                  <CardDescription>
                    Track completed cycles, winner selections, and disbursements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cycleWinnerSelections.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No completed winner selections yet.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {cycleWinnerSelections.slice(0, 5).map((selection) => {
                          const cycle = cycleSettings.find(c => c.id === selection.cycleSettingId);
                          return (
                            <div key={selection.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-semibold">{cycle?.cycleName || 'Unknown Cycle'}</h3>
                                  <div className="text-sm text-gray-500">
                                    Selection Date: {new Date(selection.selectionDate).toLocaleDateString()}
                                  </div>
                                  <div className="text-sm">
                                    Total Pool: <span className="font-mono">${selection.totalRewardPool}</span>
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  <Badge variant={selection.isProcessed ? "default" : "secondary"}>
                                    {selection.isProcessed ? "Processed" : "Pending"}
                                  </Badge>
                                  {selection.processedAt && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      {new Date(selection.processedAt).toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                                <div>
                                  <span className="text-gray-500">Tier 1:</span>
                                  <div className="font-medium">{selection.tier1Winners} winners, ${selection.tier1RewardAmount} each</div>
                                </div>
                                <div>
                                  <span className="text-gray-500">Tier 2:</span>
                                  <div className="font-medium">{selection.tier2Winners} winners, ${selection.tier2RewardAmount} each</div>
                                </div>
                                <div>
                                  <span className="text-gray-500">Tier 3:</span>
                                  <div className="font-medium">{selection.tier3Winners} winners, ${selection.tier3RewardAmount} each</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="points">
            <div className="space-y-6">
              {/* Points Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                    <Star className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {users.reduce((sum: number, u: any) => sum + (u.totalPoints || 0), 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Across all users
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">This Cycle</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {users.reduce((sum: number, u: any) => sum + (u.currentCyclePoints || 0), 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Current cycle activity
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Point Actions</CardTitle>
                    <Activity className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">47</div>
                    <p className="text-xs text-muted-foreground">
                      Available activities
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Per User</CardTitle>
                    <Target className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round(users.reduce((sum: number, u: any) => sum + (u.totalPoints || 0), 0) / (users.length || 1))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Points per user
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Point Distribution & Top Earners */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Points by Tier</CardTitle>
                    <CardDescription>Point distribution across user tiers</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['tier3', 'tier2', 'tier1'].map((tier) => {
                        const premiumUsers = users.filter((u: any) => u.subscriptionStatus === 'active');
                        const tierUsers = premiumUsers.filter((u: any) => u.tier === tier);
                        const totalPoints = tierUsers.reduce((sum: number, u: any) => sum + (u.totalPoints || 0), 0);
                        const avgPoints = tierUsers.length > 0 ? Math.round(totalPoints / tierUsers.length) : 0;
                        const allPoints = premiumUsers.reduce((sum: number, u: any) => sum + (u.totalPoints || 0), 0);
                        return (
                          <div key={tier} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{tier.replace('tier', 'Tier ')}</span>
                              <span>{totalPoints.toLocaleString()} total ({avgPoints} avg)</span>
                            </div>
                            <Progress value={allPoints > 0 ? (totalPoints / allPoints) * 100 : 0} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Earners</CardTitle>
                    <CardDescription>Users with highest point totals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {users
                        .sort((a: any, b: any) => (b.totalPoints || 0) - (a.totalPoints || 0))
                        .slice(0, 5)
                        .map((user: any, index: number) => (
                          <div key={user.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <div className="text-sm font-medium">{user.username}</div>
                                <div className="text-xs text-gray-500">{user.tier?.replace('tier', 'Tier ') || 'Tier 1'}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold">{(user.totalPoints || 0).toLocaleString()}</div>
                              <div className="text-xs text-gray-500">{user.currentCyclePoints || 0} this cycle</div>
                            </div>
                          </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>



              {/* Manual Point Management */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Award Points</CardTitle>
                    <CardDescription>Grant bonus tickets to users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="awardUser">Select User</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose user" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.slice(0, 10).map((user: any) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.username} ({user.totalPoints || 0} points)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="awardAmount">Points to Award</Label>
                        <Input
                          id="awardAmount"
                          type="number"
                          min="1"
                          placeholder="Enter amount"
                        />
                      </div>
                      <div>
                        <Label htmlFor="awardReason">Reason</Label>
                        <Textarea
                          id="awardReason"
                          placeholder="Reason for awarding points..."
                          rows={3}
                        />
                      </div>
                      <Button className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Award Points
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Point Activity</CardTitle>
                    <CardDescription>Latest point transactions and changes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[...Array(5)].map((_, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                              index % 2 === 0 ? 'bg-green-500' : 'bg-blue-500'
                            }`}>
                              {index % 2 === 0 ? '+' : '✓'}
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                {index % 2 === 0 ? 'Points Awarded' : 'Module Completed'}
                              </div>
                              <div className="text-xs text-gray-500">
                                User {users[index]?.username || 'Unknown'} • 2 hours ago
                              </div>
                            </div>
                          </div>
                          <Badge variant={index % 2 === 0 ? "default" : "secondary"}>
                            +{index % 2 === 0 ? '25' : '15'} pts
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="actions">
            <div className="space-y-6">
              {/* Points Actions Management */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Points Actions Configuration
                      </CardTitle>
                      <CardDescription>
                        Configure point values, limits, and proof requirements for user actions
                      </CardDescription>
                    </div>
                    <Button onClick={() => {
                      setEditingPointAction(null);
                      setShowPointActionDialog(true);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Action
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {pointActions.filter(action => action.actionId !== 'debt-paydown').map((action) => (
                        <div key={action.id} className="p-4 border rounded-lg relative">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">{action.name}</span>
                                <Badge variant={action.isActive ? "default" : "secondary"}>
                                  {action.basePoints} pts
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-500 mb-3">{action.description}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant={action.isActive ? "default" : "outline"} className="text-xs">
                                {action.isActive ? "Published" : "Draft"}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedActionForPublish(action);
                                  setShowActionPublishDialog(true);
                                }}
                              >
                                <Settings className="w-3 h-3" />
                              </Button>
                              
                              <Button
                                size="sm"
                                variant={action.isActive ? "secondary" : "default"}
                                onClick={() => {
                                  setSelectedActionForPublish(action);
                                  setShowActionPublishDialog(true);
                                }}
                              >
                                {action.isActive ? "Unpublish" : "Publish"}
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeletePointAction(action.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="proofs">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Pending Proof Submissions
                  </CardTitle>
                  <CardDescription>
                    Review and approve user-submitted proof of financial actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingProofs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No pending proof submissions
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingProofs.map((proof) => (
                        <Card key={proof.id} className="border-l-4 border-l-yellow-400">
                          <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <h4 className="font-semibold">{proof.action}</h4>
                                <p className="text-sm text-gray-600">
                                  User: {proof.user?.username} ({proof.user?.email})
                                </p>
                                <p className="text-sm text-gray-600">
                                  Points: {proof.points}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Submitted: {new Date(proof.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium mb-2">Description:</p>
                                <p className="text-sm text-gray-700">{proof.description}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium mb-2">Proof Attachment:</p>
                                {proof.proofUrl ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span className="text-sm text-green-700">File attached</span>
                                    </div>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => handleViewProofFile(proof.proofUrl)}
                                      className="w-full"
                                    >
                                      <Eye className="h-4 w-4 mr-1" />
                                      View Proof File
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <span className="text-sm text-red-600">No file attached</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => handleApproveProof(proof.id)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleRejectProof(proof.id, "Does not meet requirements")}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="support">
            <div className="space-y-6">
              {/* Support Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {supportTickets.filter(t => t.status === 'open').length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Awaiting response
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {supportTickets.filter(t => t.status === 'resolved').length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Completed tickets
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                    <Clock className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {supportTickets.filter(t => t.status === 'in-progress').length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Being handled
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total</CardTitle>
                    <HelpCircle className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{supportTickets.length}</div>
                    <p className="text-xs text-muted-foreground">
                      All tickets
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Support Tickets Management */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Support Tickets</CardTitle>
                      <CardDescription>
                        Manage user support requests and system issues
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input placeholder="Search tickets..." className="w-64" />
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Ticket
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ticket ID</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {supportTickets.length > 0 ? (
                          supportTickets.map((ticket) => (
                            <TableRow key={ticket.id}>
                              <TableCell className="font-mono text-sm">
                                #{ticket.id}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                    {ticket.name?.charAt(0)?.toUpperCase() || 'A'}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium">{ticket.name || 'Anonymous'}</div>
                                    <div className="text-xs text-gray-500">{ticket.email}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <div className="font-medium text-sm capitalize">{ticket.category}</div>
                                    {ticket.hasAttachment && (
                                      <div className="w-4 h-4 bg-yellow-100 rounded-full flex items-center justify-center">
                                        <Upload className="w-3 h-3 text-yellow-600" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 truncate max-w-xs">
                                    {ticket.message.substring(0, 50)}...
                                  </div>
                                  {ticket.hasAttachment && ticket.fileName && (
                                    <div className="text-xs text-yellow-600 mt-1">
                                      📎 {ticket.fileName}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={
                                  ticket.category === 'billing' ? 'destructive' :
                                  ticket.category === 'technical' ? 'default' : 'secondary'
                                }>
                                  {ticket.category === 'billing' ? 'High' : 
                                   ticket.category === 'technical' ? 'Medium' : 'Low'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={
                                  ticket.status === 'pending' ? 'destructive' :
                                  ticket.status === 'in-progress' ? 'default' : 'outline'
                                }>
                                  {ticket.status === 'pending' ? 'Open' : 
                                   ticket.status === 'in-progress' ? 'In Progress' : 'Resolved'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {new Date(ticket.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                      setSelectedTicket(ticket);
                                      setShowTicketDialog(true);
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  {ticket.status !== 'resolved' && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => {
                                        setSelectedTicket(ticket);
                                        setTicketReply('');
                                        setShowReplyDialog(true);
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {ticket.status === 'pending' && (
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleTicketReply(ticket.id, 'Ticket resolved automatically', 'resolved')}
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                              <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
                              <p>No support tickets found</p>
                              <p className="text-sm">Customer support requests will appear here</p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* System Health & Support Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>System Health</CardTitle>
                    <CardDescription>Current system status and performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Database</span>
                        </div>
                        <Badge variant="default">Healthy</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm">API Services</span>
                        </div>
                        <Badge variant="default">Operational</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm">Payment Processing</span>
                        </div>
                        <Badge variant="secondary">Slow</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm">Content Delivery</span>
                        </div>
                        <Badge variant="default">Optimal</Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm">User Authentication</span>
                        </div>
                        <Badge variant="default">Active</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Common Issues</CardTitle>
                    <CardDescription>Most frequent support categories</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { category: 'Login & Account', count: 12, percentage: 35 },
                        { category: 'Points & Rewards', count: 8, percentage: 25 },
                        { category: 'Payment Issues', count: 6, percentage: 18 },
                        { category: 'Content Problems', count: 5, percentage: 15 },
                        { category: 'Technical Bugs', count: 3, percentage: 7 }
                      ].map((issue, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{issue.category}</span>
                            <span>{issue.count} tickets ({issue.percentage}%)</span>
                          </div>
                          <Progress value={issue.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions & Knowledge Base */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Common administrative tasks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="justify-start h-auto p-4">
                        <div className="text-left">
                          <div className="font-medium text-sm">Reset Password</div>
                          <div className="text-xs text-gray-500">For user accounts</div>
                        </div>
                      </Button>
                      
                      <Button variant="outline" className="justify-start h-auto p-4">
                        <div className="text-left">
                          <div className="font-medium text-sm">Unlock Account</div>
                          <div className="text-xs text-gray-500">Remove restrictions</div>
                        </div>
                      </Button>
                      
                      <Button variant="outline" className="justify-start h-auto p-4">
                        <div className="text-left">
                          <div className="font-medium text-sm">Refund Payment</div>
                          <div className="text-xs text-gray-500">Process refunds</div>
                        </div>
                      </Button>
                      
                      <Button variant="outline" className="justify-start h-auto p-4">
                        <div className="text-left">
                          <div className="font-medium text-sm">Clear Cache</div>
                          <div className="text-xs text-gray-500">System maintenance</div>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest support interactions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[...Array(4)].map((_, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                              index % 2 === 0 ? 'bg-green-500' : 'bg-blue-500'
                            }`}>
                              {index % 2 === 0 ? '✓' : '💬'}
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                {index % 2 === 0 ? 'Ticket Resolved' : 'New Response'}
                              </div>
                              <div className="text-xs text-gray-500">
                                Ticket #{1000 + index} • {index + 1} hour ago
                              </div>
                            </div>
                          </div>
                          <Badge variant={index % 2 === 0 ? "default" : "secondary"}>
                            {index % 2 === 0 ? 'Closed' : 'Active'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="disbursements">
            <div className="space-y-6">
              {/* Disbursement Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pool</CardTitle>
                    <Target className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${poolData?.totalPool ?? 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Available for disbursement
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Eligible Users</CardTitle>
                    <Crown className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {users.filter((u: any) => u.subscriptionStatus === 'active' && u.paypalEmail).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      With PayPal emails
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Cycles</CardTitle>
                    <Calendar className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{winnerCycles.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Winner selection cycles
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Selection</CardTitle>
                    <Clock className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedCycle ? selectedCycle.cycleName : "None"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Selected cycle
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Winner Cycle Management */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Winner Selection Cycles</CardTitle>
                      <CardDescription>
                        Manage random winner selection and disbursement cycles
                      </CardDescription>
                    </div>
                    <Button onClick={() => setShowCreateCycleDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      New Cycle
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {winnerCycles.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No winner cycles created yet. Create your first cycle to begin random selection.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {winnerCycles.map((cycle: any) => (
                          <div 
                            key={cycle.id} 
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedCycle?.id === cycle.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedCycle(cycle)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold">{cycle.cycleName}</h4>
                                <p className="text-sm text-gray-600">
                                  {new Date(cycle.cycleStartDate).toLocaleDateString()} - {new Date(cycle.cycleEndDate).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={cycle.selectionCompleted ? "default" : "secondary"}>
                                  {cycle.selectionCompleted ? "Selection Complete" : "Pending"}
                                </Badge>
                                <Badge variant={cycle.disbursementCompleted ? "default" : "outline"}>
                                  {cycle.disbursementCompleted ? "Disbursed" : "Not Disbursed"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Selected Cycle Actions */}
              {selectedCycle && (
                <Card>
                  <CardHeader>
                    <CardTitle>Cycle Actions: {selectedCycle.cycleName}</CardTitle>
                    <CardDescription>
                      Run random selection, manage winners, and process disbursements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button 
                        onClick={async () => {
                          try {
                            setIsRunningSelection(true);
                            const token = localStorage.getItem('token');
                            const response = await fetch(`/api/admin/winner-cycles/${selectedCycle.id}/run-selection`, {
                              method: 'POST',
                              headers: { 'Authorization': `Bearer ${token}` }
                            });
                            const data = await response.json();
                            if (data.success) {
                              toast({
                                title: "Random Selection Complete",
                                description: `Selected ${data.winners.length} winners. Pool: $${(data.poolCalculation.totalRewardPool / 100).toFixed(2)}`
                              });
                              setSelectionResults(data);
                              loadWinners();
                              loadCycles();
                            }
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to run selection",
                              variant: "destructive"
                            });
                          } finally {
                            setIsRunningSelection(false);
                          }
                        }}
                        disabled={selectedCycle.selectionCompleted || isRunningSelection}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Star className="w-4 h-4 mr-2" />
                        {isRunningSelection ? "Running..." : "Run Random Selection"}
                      </Button>

                      <Button 
                        onClick={async () => {
                          try {
                            setIsProcessingDisbursements(true);
                            const token = localStorage.getItem('token');
                            const response = await fetch(`/api/admin/winner-cycles/${selectedCycle.id}/process-disbursements`, {
                              method: 'POST',
                              headers: { 'Authorization': `Bearer ${token}` }
                            });
                            const data = await response.json();
                            if (data.success) {
                              toast({
                                title: "Disbursements Processed",
                                description: `$${(data.totalAmount / 100).toFixed(2)} sent to ${data.totalRecipients} winners`
                              });
                              loadCycles();
                            } else {
                              toast({
                                title: "Error",
                                description: data.error || "Failed to process disbursements",
                                variant: "destructive"
                              });
                            }
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to process disbursements",
                              variant: "destructive"
                            });
                          } finally {
                            setIsProcessingDisbursements(false);
                          }
                        }}
                        disabled={!selectedCycle.selectionCompleted || selectedCycle.disbursementCompleted || isProcessingDisbursements}
                        variant={selectedCycle.disbursementCompleted ? "secondary" : "default"}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Calculator className="w-4 h-4 mr-2" />
                        {isProcessingDisbursements ? "Processing..." : selectedCycle.disbursementCompleted ? "Disbursed" : "Process PayPal Disbursements"}
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={loadWinners}
                        disabled={!selectedCycle.selectionCompleted}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Winners
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={() => exportWinners()}
                        disabled={!selectedCycle.selectionCompleted}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={() => setShowCsvImportDialog(true)}
                        disabled={!selectedCycle.selectionCompleted}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Import CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pool Calculation Results */}
              {selectionResults && selectionResults.poolCalculation && (
                <Card>
                  <CardHeader>
                    <CardTitle>Pool Calculation Results</CardTitle>
                    <CardDescription>
                      Reward pool calculated from current pool settings and subscription revenue
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectionResults.poolCalculation.totalSubscribers}
                        </div>
                        <div className="text-sm text-gray-600">Total Subscribers</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          ${(selectionResults.poolCalculation.monthlyRevenue).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">Monthly Revenue</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectionResults.poolCalculation.rewardPoolPercentage}%
                        </div>
                        <div className="text-sm text-gray-600">Pool Percentage</div>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          ${(selectionResults.poolCalculation.totalRewardPool / 100).toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">Total Pool</div>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-yellow-50 rounded">
                        <div className="font-bold text-yellow-600">
                          ${(selectionResults.poolCalculation.tier1Pool / 100).toFixed(2)}
                        </div>
                        <div className="text-sm">Tier 1 Pool (50%)</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="font-bold text-gray-600">
                          ${(selectionResults.poolCalculation.tier2Pool / 100).toFixed(2)}
                        </div>
                        <div className="text-sm">Tier 2 Pool (35%)</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded">
                        <div className="font-bold text-orange-600">
                          ${(selectionResults.poolCalculation.tier3Pool / 100).toFixed(2)}
                        </div>
                        <div className="text-sm">Tier 3 Pool (15%)</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Winners Display */}
              {selectedCycle && winners && Object.keys(winners).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {['tier1', 'tier2', 'tier3'].map(tier => (
                    <Card key={tier}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Crown className={`w-5 h-5 ${
                            tier === 'tier1' ? 'text-yellow-500' : 
                            tier === 'tier2' ? 'text-gray-500' : 'text-orange-500'
                          }`} />
                          {tier.replace('tier', 'Tier ')} Winners
                        </CardTitle>
                        <CardDescription>
                          {winners[tier]?.length || 0} winners selected
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {winners[tier]?.map((winner: any, index: number) => (
                            <div key={winner.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={selectedForDisbursement.has(winner.id)}
                                  onChange={(e) => {
                                    const newSet = new Set(selectedForDisbursement);
                                    if (e.target.checked) {
                                      newSet.add(winner.id);
                                    } else {
                                      newSet.delete(winner.id);
                                    }
                                    setSelectedForDisbursement(newSet);
                                  }}
                                  className="w-4 h-4"
                                />
                                <div>
                                  <div className="font-medium">#{winner.tierRank} {winner.username}</div>
                                  <div className="text-sm text-gray-600">{winner.email}</div>
                                  {winner.user?.paypalEmail ? (
                                    <div className="text-xs text-green-600">PayPal: {winner.user.paypalEmail}</div>
                                  ) : (
                                    <div className="text-xs text-red-500">No PayPal email</div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={winner.rewardPercentage}
                                  onChange={(e) => updateWinnerPercentage(winner.id, parseInt(e.target.value))}
                                  className="w-16 text-center"
                                  placeholder="%"
                                />
                                <div className="text-xs text-gray-500 mt-1">Percentage</div>
                              </div>
                            </div>
                          ))}
                          
                          {winners[tier]?.length > 0 && (
                            <div className="pt-2 border-t space-y-2">
                              <div className="flex justify-between items-center">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newSet = new Set(selectedForDisbursement);
                                    const tierWinners = winners[tier].filter((w: any) => w.user?.paypalEmail);
                                    tierWinners.forEach((w: any) => newSet.add(w.id));
                                    setSelectedForDisbursement(newSet);
                                  }}
                                >
                                  Select All with PayPal
                                </Button>
                                <div className="flex justify-between text-sm font-medium">
                                  <span>Total:</span>
                                  <span className={`${
                                    winners[tier].reduce((sum: number, w: any) => sum + (w.rewardPercentage || 0), 0) === 100 
                                      ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {winners[tier].reduce((sum: number, w: any) => sum + (w.rewardPercentage || 0), 0)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Payout History */}
              {payoutHistory && payoutHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Payouts</CardTitle>
                    <CardDescription>PayPal disbursement transaction history</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Tier</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payoutHistory.slice(0, 10).map((payout: any) => (
                          <TableRow key={payout.id}>
                            <TableCell>{payout.username}</TableCell>
                            <TableCell>{payout.recipientEmail}</TableCell>
                            <TableCell>${payout.amount}</TableCell>
                            <TableCell>
                              <Badge variant={
                                payout.tier === 'tier1' ? 'default' :
                                payout.tier === 'tier2' ? 'secondary' : 'outline'
                              }>
                                {payout.tier}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                payout.status === 'SUCCESS' ? 'default' :
                                payout.status === 'PENDING' ? 'secondary' : 'destructive'
                              }>
                                {payout.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(payout.processedAt || payout.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="cycles">
            <div className="space-y-6">
              {/* Cycle Configuration Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Cycles</CardTitle>
                    <Calendar className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {cycleSettings.filter(cycle => cycle.isActive).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Currently running cycles
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                    <Users className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {userCyclePoints.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Users in current cycles
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed Selections</CardTitle>
                    <Trophy className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {cycleWinnerSelections.filter(selection => selection.isProcessed).length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Winner selections processed
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Cycle Management */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Cycle Configuration</CardTitle>
                      <CardDescription>
                        Manage reward cycles with flexible durations and configurable parameters
                      </CardDescription>
                    </div>
                    <Button onClick={() => {
                      setEditingCycle(null);
                      setCycleForm({
                        cycleName: '',
                        cycleStartDate: '',
                        cycleEndDate: '',
                        paymentPeriodDays: 30,
                        membershipFee: 2000,
                        rewardPoolPercentage: 50,
                        tier1Threshold: 56,
                        tier2Threshold: 21,
                        isActive: true,
                        allowMidCycleJoining: true,
                        midCycleJoinThresholdDays: 3
                      });
                      setShowCycleDialog(true);
                    }}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Cycle
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cycleSettings.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No cycles configured yet. Create your first cycle to enable flexible reward periods.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {cycleSettings.map((cycle) => (
                          <div key={cycle.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold">{cycle.cycleName}</h3>
                                  <Badge variant={cycle.isActive ? "default" : "secondary"}>
                                    {cycle.isActive ? "Active" : "Inactive"}
                                  </Badge>

                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-500">Duration:</span>
                                    <div className="font-medium">
                                      {new Date(cycle.cycleStartDate).toLocaleDateString()} - {new Date(cycle.cycleEndDate).toLocaleDateString()}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <span className="text-gray-500">Payment Period:</span>
                                    <div className="font-medium">{cycle.paymentPeriodDays} days</div>
                                  </div>
                                  
                                  <div>
                                    <span className="text-gray-500">Membership Fee:</span>
                                    <div className="font-medium">${(cycle.membershipFee / 100).toFixed(2)}</div>
                                  </div>
                                  
                                  <div>
                                    <span className="text-gray-500">Reward Pool:</span>
                                    <div className="font-medium">{cycle.rewardPoolPercentage}%</div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-2">
                                  <div>
                                    <span className="text-gray-500">Tier 1 Threshold:</span>
                                    <div className="font-medium">{cycle.tier1Threshold}+ points</div>
                                  </div>
                                  
                                  <div>
                                    <span className="text-gray-500">Tier 2 Threshold:</span>
                                    <div className="font-medium">{cycle.tier2Threshold}+ points</div>
                                  </div>
                                  
                                  <div>
                                    <span className="text-gray-500">Mid-cycle Joining:</span>
                                    <div className="font-medium">
                                      {cycle.allowMidCycleJoining 
                                        ? `Allowed (${cycle.midCycleJoinThresholdDays}d threshold)`
                                        : 'Disabled'
                                      }
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingCycle(cycle);
                                    setCycleForm({
                                      cycleName: cycle.cycleName,
                                      cycleStartDate: new Date(cycle.cycleStartDate).toISOString().split('T')[0],
                                      cycleEndDate: new Date(cycle.cycleEndDate).toISOString().split('T')[0],
                                      paymentPeriodDays: cycle.paymentPeriodDays,
                                      membershipFee: cycle.membershipFee,
                                      rewardPoolPercentage: cycle.rewardPoolPercentage,
                                      tier1Threshold: cycle.tier1Threshold,
                                      tier2Threshold: cycle.tier2Threshold,
                                      isActive: cycle.isActive,
                                      allowMidCycleJoining: cycle.allowMidCycleJoining,
                                      midCycleJoinThresholdDays: cycle.midCycleJoinThresholdDays
                                    });
                                    setShowCycleDialog(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCycleForWinners(cycle);
                                    setShowWinnerSelectionDialog(true);
                                  }}
                                >
                                  <Trophy className="w-4 h-4" />
                                </Button>
                                
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteCycle(cycle.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* User Points Tracking */}
              <Card>
                <CardHeader>
                  <CardTitle>User Cycle Points</CardTitle>
                  <CardDescription>
                    Track user points across active cycles and tier assignments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {userCyclePoints.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No users have joined active cycles yet.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">User</th>
                              <th className="text-left p-2">Cycle</th>
                              <th className="text-left p-2">Current Points</th>
                              <th className="text-left p-2">Theoretical Points</th>
                              <th className="text-left p-2">Tier</th>
                              <th className="text-left p-2">Joined</th>
                              <th className="text-left p-2">Last Activity</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userCyclePoints.map((userPoints) => {
                              const user = users.find(u => u.id === userPoints.userId);
                              const cycle = cycleSettings.find(c => c.id === userPoints.cycleSettingId);
                              return (
                                <tr key={userPoints.id} className="border-b">
                                  <td className="p-2">
                                    <div className="font-medium">{user?.username || 'Unknown'}</div>
                                    <div className="text-xs text-gray-500">{user?.email}</div>
                                  </td>
                                  <td className="p-2">
                                    <div className="font-medium">{cycle?.cycleName || 'Unknown'}</div>
                                    <div className="text-xs text-gray-500">
                                      {cycle && new Date(cycle.cycleStartDate).toLocaleDateString()} - {cycle && new Date(cycle.cycleEndDate).toLocaleDateString()}
                                    </div>
                                  </td>
                                  <td className="p-2">
                                    <div className="font-bold text-green-600">
                                      {userPoints.currentCyclePoints}
                                    </div>
                                  </td>
                                  <td className="p-2">
                                    <div className="font-medium text-blue-600">
                                      {userPoints.theoreticalPoints}
                                    </div>
                                  </td>
                                  <td className="p-2">
                                    <Badge variant={
                                      userPoints.tier === 'tier1' ? 'default' :
                                      userPoints.tier === 'tier2' ? 'secondary' : 'outline'
                                    }>
                                      {userPoints.tier.replace('tier', 'Tier ')}
                                    </Badge>
                                  </td>
                                  <td className="p-2">
                                    <div className="text-xs">
                                      {new Date(userPoints.joinedCycleAt).toLocaleDateString()}
                                    </div>
                                  </td>
                                  <td className="p-2">
                                    <div className="text-xs">
                                      {userPoints.lastActivityDate 
                                        ? new Date(userPoints.lastActivityDate).toLocaleDateString()
                                        : 'No activity'
                                      }
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Winner Selection History */}
              <Card>
                <CardHeader>
                  <CardTitle>Winner Selection History</CardTitle>
                  <CardDescription>
                    View completed winner selections and reward distributions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cycleWinnerSelections.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No winner selections have been completed yet.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {cycleWinnerSelections.map((selection) => {
                          const cycle = cycleSettings.find(c => c.id === selection.cycleSettingId);
                          return (
                            <div key={selection.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h3 className="font-semibold">{cycle?.cycleName || 'Unknown Cycle'}</h3>
                                  <div className="text-sm text-gray-500">
                                    Selection Date: {new Date(selection.selectionDate).toLocaleDateString()}
                                  </div>
                                </div>
                                <Badge variant={selection.isProcessed ? "default" : "secondary"}>
                                  {selection.isProcessed ? "Processed" : "Pending"}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500">Total Pool:</span>
                                  <div className="font-bold text-green-600">
                                    ${(selection.totalRewardPool / 100).toFixed(2)}
                                  </div>
                                </div>
                                
                                <div>
                                  <span className="text-gray-500">Tier 1 Winners:</span>
                                  <div className="font-medium">
                                    {selection.tier1Winners} (${(selection.tier1RewardAmount / 100).toFixed(2)})
                                  </div>
                                </div>
                                
                                <div>
                                  <span className="text-gray-500">Tier 2 Winners:</span>
                                  <div className="font-medium">
                                    {selection.tier2Winners} (${(selection.tier2RewardAmount / 100).toFixed(2)})
                                  </div>
                                </div>
                                
                                <div>
                                  <span className="text-gray-500">Tier 3 Winners:</span>
                                  <div className="font-medium">
                                    {selection.tier3Winners} (${(selection.tier3RewardAmount / 100).toFixed(2)})
                                  </div>
                                </div>
                              </div>
                              
                              {selection.processedAt && (
                                <div className="text-xs text-gray-500 mt-2">
                                  Processed: {new Date(selection.processedAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pool-settings">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Cycle Management
                    <Button onClick={() => setShowPoolSettingDialog(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Cycle
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Configure reward pool percentages for each cycle. Changes affect how much of each membership fee goes to rewards.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cyclePoolSettings.map((setting: any) => (
                      <div key={setting.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{setting.cycleName}</h3>
                            <div className="text-sm text-gray-500">
                              {new Date(setting.cycleStartDate).toLocaleDateString()} - {new Date(setting.cycleEndDate).toLocaleDateString()}
                            </div>
                            <div className="text-sm mt-1">
                              <span className="font-medium">{setting.rewardPoolPercentage}%</span> of ${setting.membershipFee / 100} goes to rewards
                              <span className="text-gray-500 ml-2">
                                (${((setting.membershipFee / 100) * (setting.rewardPoolPercentage / 100)).toFixed(2)} per subscription)
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={setting.isActive ? "default" : "secondary"}>
                              {setting.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingPoolSetting(setting);
                                setPoolSettingForm({
                                  cycleName: setting.cycleName,
                                  cycleStartDate: setting.cycleStartDate?.split('T')[0] || '',
                                  cycleEndDate: setting.cycleEndDate?.split('T')[0] || '',
                                  rewardPoolPercentage: setting.rewardPoolPercentage,
                                  membershipFee: setting.membershipFee,
                                  isActive: setting.isActive
                                });
                                setShowPoolSettingDialog(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {cyclePoolSettings.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No cycles configured. Create your first cycle to start managing dynamic pool settings.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Current Pool Settings</CardTitle>
                  <CardDescription>Active settings for this month's subscription payments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">55%</div>
                      <div className="text-sm text-gray-500">Current Pool %</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">$11.00</div>
                      <div className="text-sm text-gray-500">Per Subscription</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">$20.00</div>
                      <div className="text-sm text-gray-500">Membership Fee</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">$9.00</div>
                      <div className="text-sm text-gray-500">To Operations</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system-wide settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maintenance">Maintenance Mode</Label>
                    <Switch id="maintenance" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="registration">Registration Enabled</Label>
                    <Switch id="registration" defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* User View Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Username</Label>
                  <div className="text-sm text-gray-600">{selectedUser.username}</div>
                </div>
                <div>
                  <Label>Email</Label>
                  <div className="text-sm text-gray-600">{selectedUser.email}</div>
                </div>
                <div>
                  <Label>Total Points</Label>
                  <div className="text-sm text-gray-600">{selectedUser.totalPoints || 0}</div>
                </div>
                <div>
                  <Label>Current Tier</Label>
                  <div className="text-sm text-gray-600">{selectedUser.tier?.replace('tier', 'Tier ') || 'Tier 1'}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={selectedUser.isActive ? "default" : "secondary"}>
                    {selectedUser.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div>
                  <Label>Joined</Label>
                  <div className="text-sm text-gray-600">
                    {selectedUser.joinedAt ? new Date(selectedUser.joinedAt).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Point Action Dialog */}
      <Dialog open={showPointActionDialog} onOpenChange={setShowPointActionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPointAction ? 'Edit Point Action' : 'Add New Point Action'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="actionId">Action ID</Label>
                <Input 
                  id="actionId"
                  value={pointActionForm.actionId}
                  onChange={(e) => setPointActionForm({...pointActionForm, actionId: e.target.value})}
                  placeholder="e.g., debt-payment"
                />
              </div>
              <div>
                <Label htmlFor="name">Action Name</Label>
                <Input 
                  id="name"
                  value={pointActionForm.name}
                  onChange={(e) => setPointActionForm({...pointActionForm, name: e.target.value})}
                  placeholder="e.g., Debt Payment"
                />
              </div>
              <div>
                <Label htmlFor="basePoints">Base Points</Label>
                <Input 
                  id="basePoints"
                  type="number"
                  value={pointActionForm.basePoints}
                  onChange={(e) => setPointActionForm({...pointActionForm, basePoints: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input 
                  id="category"
                  value={pointActionForm.category}
                  onChange={(e) => setPointActionForm({...pointActionForm, category: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="maxDaily">Max Daily</Label>
                <Input 
                  id="maxDaily"
                  type="number"
                  value={pointActionForm.maxDaily}
                  onChange={(e) => setPointActionForm({...pointActionForm, maxDaily: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="maxMonthly">Max Monthly</Label>
                <Input 
                  id="maxMonthly"
                  type="number"
                  value={pointActionForm.maxMonthly}
                  onChange={(e) => setPointActionForm({...pointActionForm, maxMonthly: parseInt(e.target.value)})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={pointActionForm.description}
                onChange={(e) => setPointActionForm({...pointActionForm, description: e.target.value})}
                placeholder="Describe what this action involves..."
              />
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox"
                id="requiresProof"
                checked={pointActionForm.requiresProof}
                onChange={(e) => setPointActionForm({...pointActionForm, requiresProof: e.target.checked})}
              />
              <Label htmlFor="requiresProof">Requires Proof</Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowPointActionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePointAction}>
              {editingPointAction ? 'Update' : 'Create'} Action
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Edit Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username"
                  value={editingUser?.username || ''}
                  onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  type="email"
                  value={editingUser?.email || ''}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  id="firstName"
                  value={editingUser?.firstName || ''}
                  onChange={(e) => setEditingUser({...editingUser, firstName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  id="lastName"
                  value={editingUser?.lastName || ''}
                  onChange={(e) => setEditingUser({...editingUser, lastName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="totalPoints">Total Points</Label>
                <Input 
                  id="totalPoints"
                  type="number"
                  value={editingUser?.totalPoints || 0}
                  onChange={(e) => setEditingUser({...editingUser, totalPoints: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="tier">Tier</Label>
                <select 
                  id="tier"
                  className="w-full p-2 border rounded"
                  value={editingUser?.tier || 'tier1'}
                  onChange={(e) => setEditingUser({...editingUser, tier: e.target.value})}
                >
                  <option value="tier1">Tier 1</option>
                  <option value="tier2">Tier 2</option>
                  <option value="tier3">Tier 3</option>
                </select>
              </div>
              <div>
                <Label htmlFor="paypalEmail">PayPal Email</Label>
                <Input 
                  id="paypalEmail"
                  type="email"
                  value={editingUser?.paypalEmail || ''}
                  onChange={(e) => setEditingUser({...editingUser, paypalEmail: e.target.value})}
                  placeholder="paypal@example.com"
                />
                <div className="text-xs text-gray-500 mt-1">Required for PayPal disbursements</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox"
                id="isActive"
                checked={editingUser?.isActive || false}
                onChange={(e) => setEditingUser({...editingUser, isActive: e.target.checked})}
              />
              <Label htmlFor="isActive">Active User</Label>
            </div>
            {!editingUser?.id && (
              <div>
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password"
                  type="password"
                  value={editingUser?.password || ''}
                  onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                  placeholder="Enter password for new user"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowEditUserDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (editingUser?.id) {
                handleUpdateUser(editingUser.id, editingUser);
              } else {
                // Initialize new user with default values
                const newUser = {
                  username: editingUser?.username || '',
                  email: editingUser?.email || '',
                  password: editingUser?.password || '',
                  firstName: editingUser?.firstName || '',
                  lastName: editingUser?.lastName || '',
                  totalPoints: editingUser?.totalPoints || 0,
                  tier: editingUser?.tier || 'tier1',
                  isActive: editingUser?.isActive !== undefined ? editingUser.isActive : true
                };
                handleCreateUser(newUser);
              }
              setShowEditUserDialog(false);
            }}>
              {editingUser?.id ? 'Update' : 'Create'} User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Module View Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Module Details</DialogTitle>
          </DialogHeader>
          {selectedModule && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <div className="text-sm text-gray-600">{selectedModule.title}</div>
                </div>
                <div>
                  <Label>Category</Label>
                  <div className="text-sm text-gray-600">{selectedModule.category}</div>
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <div className="text-sm text-gray-600">{selectedModule.difficulty}</div>
                </div>
                <div>
                  <Label>Points Reward</Label>
                  <div className="text-sm text-gray-600">{selectedModule.pointsReward}</div>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <div className="text-sm text-gray-600">{selectedModule.description}</div>
              </div>
              <div>
                <Label>Content</Label>
                <div className="text-sm text-gray-600 max-h-48 overflow-y-auto">
                  {selectedModule.content}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Module Edit Dialog */}
      <Dialog open={showEditModuleDialog} onOpenChange={setShowEditModuleDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingModule ? 'Edit Module' : 'Add New Module'}</DialogTitle>
            <DialogDescription>
              Create comprehensive learning modules with lesson content and interactive quiz questions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Module Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input 
                  id="title"
                  placeholder="e.g., Budgeting Basics"
                  value={editingModule?.title || moduleForm.title}
                  onChange={(e) => {
                    if (editingModule) {
                      setEditingModule({...editingModule, title: e.target.value});
                    } else {
                      setModuleForm({...moduleForm, title: e.target.value});
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <div className="space-y-2">
                  <select 
                    id="category"
                    className="w-full p-2 border rounded"
                    value={showCustomCategory ? 'custom' : (editingModule?.category || moduleForm.category)}
                    onChange={(e) => {
                      if (e.target.value === 'custom') {
                        setShowCustomCategory(true);
                        setCustomCategory('');
                      } else {
                        setShowCustomCategory(false);
                        if (editingModule) {
                          setEditingModule({...editingModule, category: e.target.value});
                        } else {
                          setModuleForm({...moduleForm, category: e.target.value});
                        }
                      }
                    }}
                  >
                    <option value="budgeting">Budgeting</option>
                    <option value="investing">Investing</option>
                    <option value="credit">Credit</option>
                    <option value="taxes">Taxes</option>
                    <option value="planning">Planning</option>
                    <option value="savings">Savings</option>
                    <option value="custom">+ Add New Category</option>
                  </select>
                  
                  {showCustomCategory && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter new category name..."
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          if (customCategory.trim()) {
                            if (editingModule) {
                              setEditingModule({...editingModule, category: customCategory.trim()});
                            } else {
                              setModuleForm({...moduleForm, category: customCategory.trim()});
                            }
                            setShowCustomCategory(false);
                            setCustomCategory('');
                          }
                        }}
                      >
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setShowCustomCategory(false);
                          setCustomCategory('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <select 
                  id="difficulty"
                  className="w-full p-2 border rounded"
                  value={editingModule?.difficulty || moduleForm.difficulty}
                  onChange={(e) => {
                    if (editingModule) {
                      setEditingModule({...editingModule, difficulty: e.target.value});
                    } else {
                      setModuleForm({...moduleForm, difficulty: e.target.value});
                    }
                  }}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <Label htmlFor="pointsReward">Points Reward</Label>
                <Input 
                  id="pointsReward"
                  type="number"
                  min="1"
                  max="100"
                  value={editingModule?.pointsReward || moduleForm.pointsReward}
                  onChange={(e) => {
                    if (editingModule) {
                      setEditingModule({...editingModule, pointsReward: parseInt(e.target.value)});
                    } else {
                      setModuleForm({...moduleForm, pointsReward: parseInt(e.target.value)});
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="estimatedMinutes">Estimated Minutes</Label>
                <Input 
                  id="estimatedMinutes"
                  type="number"
                  min="1"
                  max="60"
                  value={editingModule?.estimatedMinutes || moduleForm.estimatedMinutes}
                  onChange={(e) => {
                    if (editingModule) {
                      setEditingModule({...editingModule, estimatedMinutes: parseInt(e.target.value)});
                    } else {
                      setModuleForm({...moduleForm, estimatedMinutes: parseInt(e.target.value)});
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="accessType">Access Type</Label>
                <select 
                  id="accessType"
                  className="w-full p-2 border rounded"
                  value={editingModule?.accessType || moduleForm.accessType}
                  onChange={(e) => {
                    if (editingModule) {
                      setEditingModule({...editingModule, accessType: e.target.value});
                    } else {
                      setModuleForm({...moduleForm, accessType: e.target.value});
                    }
                  }}
                >
                  <option value="free">Free (Available to all users)</option>
                  <option value="premium">Premium (Paying members only)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea 
                id="description"
                className="w-full p-3 border rounded h-20"
                placeholder="Brief description of what users will learn in this module..."
                value={editingModule?.description || moduleForm.description}
                onChange={(e) => {
                  if (editingModule) {
                    setEditingModule({...editingModule, description: e.target.value});
                  } else {
                    setModuleForm({...moduleForm, description: e.target.value});
                  }
                }}
              />
            </div>

            {/* Lesson Content */}
            <div>
              <Label htmlFor="content">Lesson Content</Label>
              <div className="border rounded">
                <ReactQuill
                  theme="snow"
                  value={editingModule?.content || moduleForm.content}
                  onChange={(content) => {
                    if (editingModule) {
                      setEditingModule({...editingModule, content});
                    } else {
                      setModuleForm({...moduleForm, content});
                    }
                  }}
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      ['link'],
                      ['clean']
                    ],
                  }}
                  formats={[
                    'header', 'bold', 'italic', 'underline',
                    'list', 'bullet', 'link'
                  ]}
                  placeholder="Start writing your lesson content... Use the toolbar above to format text, add headings, lists, and links."
                  style={{ height: '200px', marginBottom: '50px' }}
                />
              </div>
            </div>

            {/* Quiz Questions Section */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Quiz Questions ({quizQuestions.length})</h3>
                <Button 
                  onClick={() => {
                    setQuizQuestions([...quizQuestions, {
                      id: Date.now(),
                      question: '',
                      options: ['', '', '', ''],
                      correctAnswer: 0,
                      explanation: ''
                    }]);
                  }}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>

              <div className="space-y-4">
                {quizQuestions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium">Question {index + 1}</h4>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setQuizQuestions(quizQuestions.filter((_, i) => i !== index));
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label>Question Text</Label>
                        <Input
                          placeholder="Enter your question here..."
                          value={question.question}
                          onChange={(e) => {
                            const updated = [...quizQuestions];
                            updated[index].question = e.target.value;
                            setQuizQuestions(updated);
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={question.correctAnswer === optIndex}
                              onChange={() => {
                                const updated = [...quizQuestions];
                                updated[index].correctAnswer = optIndex;
                                setQuizQuestions(updated);
                              }}
                            />
                            <Input
                              placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                              value={option}
                              onChange={(e) => {
                                const updated = [...quizQuestions];
                                updated[index].options[optIndex] = e.target.value;
                                setQuizQuestions(updated);
                              }}
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <Label>Explanation (Optional)</Label>
                        <textarea
                          className="w-full p-2 border rounded h-16 text-sm"
                          placeholder="Explain why this is the correct answer..."
                          value={question.explanation}
                          onChange={(e) => {
                            const updated = [...quizQuestions];
                            updated[index].explanation = e.target.value;
                            setQuizQuestions(updated);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {quizQuestions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No quiz questions added yet.</p>
                    <p className="text-sm">Click "Add Question" to create interactive quiz questions for this module.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Module Settings */}
            <div className="flex items-center space-x-6 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={editingModule?.isActive ?? moduleForm.isActive}
                  onCheckedChange={(checked) => {
                    if (editingModule) {
                      setEditingModule({...editingModule, isActive: checked});
                    } else {
                      setModuleForm({...moduleForm, isActive: checked});
                    }
                  }}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublished"
                  checked={editingModule?.isPublished ?? moduleForm.isPublished}
                  onCheckedChange={(checked) => {
                    if (editingModule) {
                      setEditingModule({...editingModule, isPublished: checked});
                    } else {
                      setModuleForm({...moduleForm, isPublished: checked});
                    }
                  }}
                />
                <Label htmlFor="isPublished">Published</Label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-6 border-t">
            <Button variant="outline" onClick={() => {
              setShowEditModuleDialog(false);
              setQuizQuestions([]);
            }}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (editingModule?.id) {
                // Include quiz questions in the update data
                const updateData = {
                  ...editingModule,
                  quiz: JSON.stringify(quizQuestions)
                };
                handleUpdateModule(editingModule.id, updateData);
              } else {
                handleCreateModule();
              }
              setShowEditModuleDialog(false);
              setQuizQuestions([]);
            }}>
              {editingModule?.id ? 'Update' : 'Create'} Module
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Settings Dialog */}
      <Dialog open={showUserSettingsDialog} onOpenChange={setShowUserSettingsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Settings</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Username</Label>
                  <div className="text-sm text-gray-600">{selectedUser.username}</div>
                </div>
                <div>
                  <Label>Email</Label>
                  <div className="text-sm text-gray-600">{selectedUser.email}</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-medium">Account Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={() => {
                    // Reset password functionality
                    toast({
                      title: "Password Reset",
                      description: "Password reset email sent to user"
                    });
                  }}>
                    Reset Password
                  </Button>
                  
                  <Button variant="outline" onClick={() => {
                    // Toggle account status
                    handleUpdateUser(selectedUser.id, {
                      ...selectedUser,
                      isActive: !selectedUser.isActive
                    });
                    setShowUserSettingsDialog(false);
                  }}>
                    {selectedUser.isActive ? 'Deactivate' : 'Activate'} Account
                  </Button>
                  
                  <Button variant="outline" onClick={() => {
                    // Clear user progress
                    toast({
                      title: "Progress Cleared",
                      description: "User progress has been reset"
                    });
                  }}>
                    Clear Progress
                  </Button>
                  
                  <Button variant="destructive" onClick={() => {
                    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                      handleDeleteUser(selectedUser.id);
                      setShowUserSettingsDialog(false);
                    }
                  }}>
                    Delete User
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-medium">Points Management</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="pointsToAdd">Add Points</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="pointsToAdd"
                        type="number"
                        placeholder="Points"
                        value={pointsToAdd}
                        onChange={(e) => setPointsToAdd(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={async () => {
                        if (!pointsToAdd || !selectedUser) return;
                        try {
                          const newPoints = selectedUser.totalPoints + parseInt(pointsToAdd);
                          await handleUpdateUser(selectedUser.id, {
                            ...selectedUser,
                            totalPoints: newPoints
                          });
                          setPointsToAdd("");
                          toast({
                            title: "Tickets Added",
                            description: `${pointsToAdd} tickets have been awarded to ${selectedUser.username}`
                          });
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to add tickets",
                            variant: "destructive"
                          });
                        }
                      }}>
                        Add
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="pointsToDeduct">Deduct Points</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="pointsToDeduct"
                        type="number"
                        placeholder="Points"
                        value={pointsToDeduct}
                        onChange={(e) => setPointsToDeduct(e.target.value)}
                        className="flex-1"
                      />
                      <Button variant="outline" onClick={async () => {
                        if (!pointsToDeduct || !selectedUser) return;
                        try {
                          const newPoints = Math.max(0, selectedUser.totalPoints - parseInt(pointsToDeduct));
                          await handleUpdateUser(selectedUser.id, {
                            ...selectedUser,
                            totalPoints: newPoints
                          });
                          setPointsToDeduct("");
                          toast({
                            title: "Tickets Deducted",
                            description: `${pointsToDeduct} tickets have been deducted from ${selectedUser.username}`
                          });
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to deduct tickets",
                            variant: "destructive"
                          });
                        }
                      }}>
                        Deduct
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Module View Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Module Details</DialogTitle>
            <DialogDescription>
              View lesson content and quiz information
            </DialogDescription>
          </DialogHeader>
          {selectedModule && (
            <div className="space-y-6">
              {/* Module Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <div className="text-sm font-medium">{selectedModule.title}</div>
                </div>
                <div>
                  <Label>Category</Label>
                  <div className="text-sm">{selectedModule.category}</div>
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <div className="text-sm">{selectedModule.difficulty}</div>
                </div>
                <div>
                  <Label>Points Reward</Label>
                  <div className="text-sm">{selectedModule.pointsReward}</div>
                </div>
                <div>
                  <Label>Duration</Label>
                  <div className="text-sm">{selectedModule.estimatedMinutes} minutes</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="text-sm">{selectedModule.isActive ? 'Active' : 'Inactive'}</div>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label>Description</Label>
                <div className="text-sm p-3 bg-gray-50 rounded border">
                  {selectedModule.description || 'No description available'}
                </div>
              </div>

              {/* Lesson Content */}
              <div>
                <Label>Lesson Content</Label>
                <div className="text-sm p-4 bg-gray-50 rounded border max-h-60 overflow-y-auto">
                  {(() => {
                    // Create title mapping for mismatched titles
                    const titleMappings: { [key: string]: string } = {
                      'Credit Basics': 'Credit Management',
                      'Emergency Fund Essentials': 'Emergency Fund',
                      'Investment Basics': 'Investment Basics',
                      'SMART Goal Setting': 'Setting SMART Financial Goals',
                      'Understanding Credit Scores': 'Understanding Credit Scores: A Comprehensive Guide',
                      'Managing Student Loans': 'Managing Student Loans Effectively',
                      'Debt Snowball vs Avalanche': 'Debt Snowball vs. Avalanche: Which Strategy Wins?',
                      'Zero-Based Budgeting': 'Zero-Based Budgeting: Give Every Dollar a Job'
                    };

                    // Try exact match first, then mapped title, then partial match
                    let lessonKey = Object.keys(educationContent).find(key => 
                      educationContent[key].title === selectedModule.title
                    );
                    
                    if (!lessonKey && titleMappings[selectedModule.title]) {
                      lessonKey = Object.keys(educationContent).find(key => 
                        educationContent[key].title === titleMappings[selectedModule.title]
                      );
                    }
                    
                    if (!lessonKey) {
                      lessonKey = Object.keys(educationContent).find(key => 
                        educationContent[key].title.toLowerCase().includes(selectedModule.title.toLowerCase()) ||
                        selectedModule.title.toLowerCase().includes(educationContent[key].title.toLowerCase())
                      );
                    }

                    const lesson = lessonKey ? educationContent[lessonKey] : null;
                    
                    if (lesson) {
                      return <div dangerouslySetInnerHTML={{ __html: lesson.content }} />;
                    } else {
                      return (
                        <div className="text-gray-500">
                          <div>No matching lesson content found for "{selectedModule.title}"</div>
                          <div className="mt-2 text-xs">
                            Database titles: {selectedModule.title}<br/>
                            Available content titles: {Object.keys(educationContent).map(key => educationContent[key].title).slice(0, 5).join(', ')}...
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Quiz Questions */}
              <div>
                <Label>Quiz Questions</Label>
                <div className="text-sm p-4 bg-gray-50 rounded border max-h-60 overflow-y-auto">
                  {(() => {
                    // Use same mapping logic for quiz questions
                    const titleMappings: { [key: string]: string } = {
                      'Credit Basics': 'Credit Management',
                      'Emergency Fund Essentials': 'Emergency Fund',
                      'Investment Basics': 'Investment Basics',
                      'SMART Goal Setting': 'Setting SMART Financial Goals',
                      'Understanding Credit Scores': 'Understanding Credit Scores: A Comprehensive Guide',
                      'Managing Student Loans': 'Managing Student Loans Effectively',
                      'Debt Snowball vs Avalanche': 'Debt Snowball vs. Avalanche: Which Strategy Wins?',
                      'Zero-Based Budgeting': 'Zero-Based Budgeting: Give Every Dollar a Job'
                    };

                    let lessonKey = Object.keys(educationContent).find(key => 
                      educationContent[key].title === selectedModule.title
                    );
                    
                    if (!lessonKey && titleMappings[selectedModule.title]) {
                      lessonKey = Object.keys(educationContent).find(key => 
                        educationContent[key].title === titleMappings[selectedModule.title]
                      );
                    }
                    
                    if (!lessonKey) {
                      lessonKey = Object.keys(educationContent).find(key => 
                        educationContent[key].title.toLowerCase().includes(selectedModule.title.toLowerCase()) ||
                        selectedModule.title.toLowerCase().includes(educationContent[key].title.toLowerCase())
                      );
                    }

                    const lesson = lessonKey ? educationContent[lessonKey] : null;
                    
                    if (lesson?.quiz && lesson.quiz.length > 0) {
                      return (
                        <div className="space-y-4">
                          <div className="text-xs text-green-600 mb-2">
                            Found {lesson.quiz.length} quiz questions for: {lesson.title}
                          </div>
                          {lesson.quiz.map((question: any, index: number) => (
                            <div key={index} className="p-4 border rounded-lg bg-white">
                              <div className="font-medium mb-2">
                                Question {index + 1}: {question.question}
                              </div>
                              <div className="space-y-1">
                                {question.options?.map((option: string, optIndex: number) => (
                                  <div key={optIndex} className={`text-sm p-2 rounded ${
                                    optIndex === question.correctAnswer ? 'bg-green-100 text-green-800' : 'bg-gray-50'
                                  }`}>
                                    {String.fromCharCode(65 + optIndex)}. {option}
                                    {optIndex === question.correctAnswer && ' ✓ (Correct)'}
                                  </div>
                                ))}
                              </div>
                              {question.explanation && (
                                <div className="mt-2 text-sm text-gray-600 italic">
                                  Explanation: {question.explanation}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    } else {
                      return (
                        <div className="text-gray-500">
                          <div>No quiz questions found for "{selectedModule.title}"</div>
                          {lesson ? (
                            <div className="text-xs mt-1">Found lesson content but no quiz questions</div>
                          ) : (
                            <div className="text-xs mt-1">No matching lesson found</div>
                          )}
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>

              {/* Module Stats */}
              <div>
                <Label>Statistics</Label>
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded border">
                  <div className="text-center">
                    <div className="text-lg font-bold">{selectedModule.completions || 0}</div>
                    <div className="text-xs text-gray-600">Completions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{selectedModule.avgRating || 'N/A'}</div>
                    <div className="text-xs text-gray-600">Avg Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{selectedModule.order || 'N/A'}</div>
                    <div className="text-xs text-gray-600">Order</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Publish Dialog */}
      <Dialog open={showActionPublishDialog} onOpenChange={setShowActionPublishDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Action: {selectedActionForPublish?.name}</DialogTitle>
            <DialogDescription>
              Configure publication settings and properties for this point-earning action.
            </DialogDescription>
          </DialogHeader>
          
          {selectedActionForPublish && (
            <div className="space-y-4">
              {/* Action Details */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Action ID:</span>
                    <span className="text-sm text-gray-600">{selectedActionForPublish.actionId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Points:</span>
                    <span className="text-sm text-gray-600">{selectedActionForPublish.basePoints} pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={selectedActionForPublish.isActive ? "default" : "outline"}>
                      {selectedActionForPublish.isActive ? "Published" : "Draft"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Publication Settings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="action-published">Published</Label>
                  <Switch
                    id="action-published"
                    checked={selectedActionForPublish.isActive}
                    onCheckedChange={(checked) => {
                      setSelectedActionForPublish({
                        ...selectedActionForPublish,
                        isActive: checked
                      });
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="action-description">Description</Label>
                  <Textarea
                    id="action-description"
                    value={selectedActionForPublish.description}
                    onChange={(e) => {
                      setSelectedActionForPublish({
                        ...selectedActionForPublish,
                        description: e.target.value
                      });
                    }}
                    placeholder="Enter action description..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="action-points">Points Value</Label>
                  <Input
                    id="action-points"
                    value={selectedActionForPublish.points}
                    onChange={(e) => {
                      setSelectedActionForPublish({
                        ...selectedActionForPublish,
                        points: e.target.value
                      });
                    }}
                    placeholder="e.g., 10 pts or 5-15 pts"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowActionPublishDialog(false);
                    setSelectedActionForPublish(null);
                  }}
                >
                  Cancel
                </Button>
                
                <div className="flex gap-2">
                  {selectedActionForPublish.isActive && (
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        // Handle unpublish action
                        await handleUpdatePointAction({ ...selectedActionForPublish, isActive: false });
                        toast({
                          title: "Action Unpublished",
                          description: `${selectedActionForPublish.name} has been unpublished.`,
                        });
                        setShowActionPublishDialog(false);
                        setSelectedActionForPublish(null);
                      }}
                    >
                      Unpublish
                    </Button>
                  )}
                  
                  <Button
                    onClick={async () => {
                      // Handle save/publish action
                      await handleUpdatePointAction(selectedActionForPublish);
                      const action = selectedActionForPublish.isActive ? "updated" : "published";
                      toast({
                        title: `Action ${action.charAt(0).toUpperCase() + action.slice(1)}`,
                        description: `${selectedActionForPublish.name} has been ${action} successfully.`,
                      });
                      setShowActionPublishDialog(false);
                      setSelectedActionForPublish(null);
                    }}
                  >
                    {selectedActionForPublish.isActive ? "Save Changes" : "Publish Action"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Support Ticket View Dialog */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Support Ticket #{selectedTicket?.id}</DialogTitle>
            <DialogDescription>
              View ticket details and history
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>User</Label>
                  <div className="text-sm">{selectedTicket.name || 'Anonymous'}</div>
                </div>
                <div>
                  <Label>Email</Label>
                  <div className="text-sm">{selectedTicket.email}</div>
                </div>
                <div>
                  <Label>Category</Label>
                  <div className="text-sm">{selectedTicket.category}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={selectedTicket.status === 'resolved' ? 'default' : 'destructive'}>
                    {selectedTicket.status}
                  </Badge>
                </div>
                <div>
                  <Label>Created</Label>
                  <div className="text-sm">{new Date(selectedTicket.createdAt).toLocaleString()}</div>
                </div>
                {selectedTicket.resolvedAt && (
                  <div>
                    <Label>Resolved</Label>
                    <div className="text-sm">{new Date(selectedTicket.resolvedAt).toLocaleString()}</div>
                  </div>
                )}
              </div>
              
              <div>
                <Label>Message</Label>
                <div className="p-3 bg-gray-50 rounded border text-sm">
                  {selectedTicket.message}
                </div>
              </div>
              
              {selectedTicket.hasAttachment && selectedTicket.fileName && (
                <div>
                  <Label>Attachment</Label>
                  <div className="p-3 bg-yellow-50 rounded border">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-medium">{selectedTicket.fileName}</span>
                    </div>
                    <p className="text-xs text-yellow-600 mt-1">
                      File uploaded by user (stored in uploads folder)
                    </p>
                  </div>
                </div>
              )}
              
              {selectedTicket.response && (
                <div>
                  <Label>Admin Response</Label>
                  <div className="p-3 bg-blue-50 rounded border text-sm">
                    {selectedTicket.response}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Support Ticket Reply Dialog */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reply to Ticket #{selectedTicket?.id}</DialogTitle>
            <DialogDescription>
              Send a response to {selectedTicket?.name || 'the user'}
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded border">
                <div className="text-sm font-medium mb-2">Original Message:</div>
                <div className="text-sm">{selectedTicket.message}</div>
              </div>
              
              <div>
                <Label htmlFor="ticketReply">Your Response</Label>
                <Textarea
                  id="ticketReply"
                  value={ticketReply}
                  onChange={(e) => setTicketReply(e.target.value)}
                  placeholder="Type your response here..."
                  rows={6}
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowReplyDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleTicketReply(selectedTicket.id, ticketReply, 'resolved')}
                  disabled={!ticketReply.trim() || isSubmittingReply}
                >
                  {isSubmittingReply ? 'Sending...' : 'Send & Resolve'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cycle Setting Dialog */}
      <Dialog open={showPoolSettingDialog} onOpenChange={setShowPoolSettingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPoolSetting ? 'Edit Cycle' : 'Add New Cycle'}</DialogTitle>
            <DialogDescription>
              Configure reward pool percentage and membership fee for a specific cycle.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cycleName">Cycle Name</Label>
                <Input 
                  id="cycleName"
                  value={poolSettingForm.cycleName}
                  onChange={(e) => setPoolSettingForm({...poolSettingForm, cycleName: e.target.value})}
                  placeholder="e.g., January 2025"
                />
              </div>
              <div>
                <Label htmlFor="rewardPoolPercentage">Reward Pool %</Label>
                <Input 
                  id="rewardPoolPercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={poolSettingForm.rewardPoolPercentage}
                  onChange={(e) => setPoolSettingForm({...poolSettingForm, rewardPoolPercentage: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label htmlFor="cycleStartDate">Start Date</Label>
                <Input 
                  id="cycleStartDate"
                  type="date"
                  value={poolSettingForm.cycleStartDate}
                  onChange={(e) => setPoolSettingForm({...poolSettingForm, cycleStartDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="cycleEndDate">End Date</Label>
                <Input 
                  id="cycleEndDate"
                  type="date"
                  value={poolSettingForm.cycleEndDate}
                  onChange={(e) => setPoolSettingForm({...poolSettingForm, cycleEndDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="membershipFee">Membership Fee (cents)</Label>
                <Input 
                  id="membershipFee"
                  type="number"
                  min="0"
                  value={poolSettingForm.membershipFee}
                  onChange={(e) => setPoolSettingForm({...poolSettingForm, membershipFee: parseInt(e.target.value)})}
                />
                <div className="text-xs text-gray-500 mt-1">
                  ${(poolSettingForm.membershipFee / 100).toFixed(2)} per subscription
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="isActive"
                  checked={poolSettingForm.isActive}
                  onCheckedChange={(checked) => setPoolSettingForm({...poolSettingForm, isActive: checked})}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Preview</h4>
              <div className="text-sm text-blue-700">
                With {poolSettingForm.rewardPoolPercentage}% going to rewards:
                <ul className="mt-1 space-y-1">
                  <li>• ${((poolSettingForm.membershipFee / 100) * (poolSettingForm.rewardPoolPercentage / 100)).toFixed(2)} per subscription goes to reward pool</li>
                  <li>• ${((poolSettingForm.membershipFee / 100) * ((100 - poolSettingForm.rewardPoolPercentage) / 100)).toFixed(2)} per subscription goes to operations</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setShowPoolSettingDialog(false);
                setEditingPoolSetting(null);
                setPoolSettingForm({
                  cycleName: '',
                  cycleStartDate: '',
                  cycleEndDate: '',
                  rewardPoolPercentage: 50,
                  membershipFee: 2000,
                  isActive: true
                });
              }}>
                Cancel
              </Button>
              <Button onClick={handleSavePoolSetting}>
                {editingPoolSetting ? 'Update Cycle' : 'Create Cycle'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Winner Cycle Dialog */}
      <Dialog open={showCreateCycleDialog} onOpenChange={setShowCreateCycleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Winner Selection Cycle</DialogTitle>
            <DialogDescription>
              Set up a new cycle for random winner selection and disbursement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cycleName">Cycle Name</Label>
              <Input
                id="cycleName"
                placeholder="e.g., January 2024 Distribution"
                value={newCycleForm.cycleName || ''}
                onChange={(e) => setNewCycleForm(prev => ({ ...prev, cycleName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newCycleForm.cycleStartDate || ''}
                  onChange={(e) => setNewCycleForm(prev => ({ ...prev, cycleStartDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newCycleForm.cycleEndDate || ''}
                  onChange={(e) => setNewCycleForm(prev => ({ ...prev, cycleEndDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tier1Threshold">Tier 1 Threshold (%)</Label>
                <Input
                  id="tier1Threshold"
                  type="number"
                  min="1"
                  max="100"
                  value={newCycleForm.tier1Threshold || 33}
                  onChange={(e) => setNewCycleForm(prev => ({ ...prev, tier1Threshold: parseInt(e.target.value) }))}
                />
                <div className="text-xs text-gray-500 mt-1">Top X% users</div>
              </div>
              <div>
                <Label htmlFor="tier2Threshold">Tier 2 Threshold (%)</Label>
                <Input
                  id="tier2Threshold"
                  type="number"
                  min="1"
                  max="100"
                  value={newCycleForm.tier2Threshold || 67}
                  onChange={(e) => setNewCycleForm(prev => ({ ...prev, tier2Threshold: parseInt(e.target.value) }))}
                />
                <div className="text-xs text-gray-500 mt-1">Top X% users (tier 2 ends here)</div>
              </div>
              <div>
                <Label htmlFor="selectionPercentage">Selection Rate (%)</Label>
                <Input
                  id="selectionPercentage"
                  type="number"
                  min="1"
                  max="100"
                  value={newCycleForm.selectionPercentage || 50}
                  onChange={(e) => setNewCycleForm(prev => ({ ...prev, selectionPercentage: parseInt(e.target.value) }))}
                />
                <div className="text-xs text-gray-500 mt-1">% of each tier selected</div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateCycleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={async () => {
                try {
                  const token = localStorage.getItem('token');
                  const response = await fetch('/api/admin/winner-cycles/create', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(newCycleForm)
                  });
                  const data = await response.json();
                  if (data.success) {
                    toast({
                      title: "Cycle Created",
                      description: "New winner selection cycle created successfully"
                    });
                    setShowCreateCycleDialog(false);
                    setNewCycleForm({ 
                      cycleName: '', 
                      cycleStartDate: '', 
                      cycleEndDate: '', 
                      tier1Threshold: 33,
                      tier2Threshold: 67,
                      selectionPercentage: 50,
                      poolSettings: {} 
                    });
                    loadCycles();
                  }
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to create cycle",
                    variant: "destructive"
                  });
                }
              }}>
                Create Cycle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog open={showCsvImportDialog} onOpenChange={setShowCsvImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import CSV Allocation Data</DialogTitle>
            <DialogDescription>
              Upload a CSV file with UserID and Percentage columns to update winner allocations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="csvData">CSV Data</Label>
              <textarea
                id="csvData"
                className="w-full h-48 p-3 border rounded-md font-mono text-sm"
                placeholder="UserID,Username,Email,PayPalEmail,Tier,TierRank,Percentage
123,user1,user1@email.com,paypal@email.com,tier1,1,25
124,user2,user2@email.com,paypal2@email.com,tier1,2,20"
                value={csvImportData}
                onChange={(e) => setCsvImportData(e.target.value)}
              />
            </div>
            <div className="text-sm text-gray-600">
              <p>Expected format: UserID,Username,Email,PayPalEmail,Tier,TierRank,Percentage</p>
              <p>Only UserID and Percentage columns are required for import.</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCsvImportDialog(false)}>
                Cancel
              </Button>
              <Button onClick={async () => {
                if (!selectedCycle) return;
                
                try {
                  const token = localStorage.getItem('token');
                  const response = await fetch(`/api/admin/winner-cycles/${selectedCycle.id}/import`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ csvData: csvImportData })
                  });
                  const data = await response.json();
                  if (data.success) {
                    toast({
                      title: "Import Complete",
                      description: data.message
                    });
                    setShowCsvImportDialog(false);
                    setCsvImportData('');
                    loadWinners();
                  }
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to import CSV",
                    variant: "destructive"
                  });
                }
              }}>
                Import CSV
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cycle Configuration Dialog */}
      <Dialog open={showCycleDialog} onOpenChange={setShowCycleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCycle ? 'Edit Cycle' : 'Create New Cycle'}
            </DialogTitle>
            <DialogDescription>
              Configure cycle parameters including duration, payment periods, and tier thresholds
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Cycle Name</label>
              <Input
                value={cycleForm.cycleName}
                onChange={(e) => setCycleForm({...cycleForm, cycleName: e.target.value})}
                placeholder="e.g., Weekly Beta Test, Bi-weekly Jan 1-14"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={cycleForm.cycleStartDate}
                  onChange={(e) => setCycleForm({...cycleForm, cycleStartDate: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={cycleForm.cycleEndDate}
                  onChange={(e) => setCycleForm({...cycleForm, cycleEndDate: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Payment Period (days)</label>
                <Input
                  type="number"
                  value={cycleForm.paymentPeriodDays}
                  onChange={(e) => setCycleForm({...cycleForm, paymentPeriodDays: parseInt(e.target.value)})}
                  placeholder="30"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Billing cycle containing multiple reward cycles
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Membership Fee (cents)</label>
                <Input
                  type="number"
                  value={cycleForm.membershipFee}
                  onChange={(e) => setCycleForm({...cycleForm, membershipFee: parseInt(e.target.value)})}
                  placeholder="2000"
                />
                <div className="text-xs text-gray-500 mt-1">
                  ${(cycleForm.membershipFee / 100).toFixed(2)} per payment period
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Reward Pool %</label>
                <Input
                  type="number"
                  value={cycleForm.rewardPoolPercentage}
                  onChange={(e) => setCycleForm({...cycleForm, rewardPoolPercentage: parseInt(e.target.value)})}
                  placeholder="55"
                  min="0"
                  max="100"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Tier 1 Threshold</label>
                <Input
                  type="number"
                  value={cycleForm.tier1Threshold}
                  onChange={(e) => setCycleForm({...cycleForm, tier1Threshold: parseInt(e.target.value)})}
                  placeholder="56"
                />
                <div className="text-xs text-gray-500 mt-1">Minimum points for Tier 1</div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Tier 2 Threshold</label>
                <Input
                  type="number"
                  value={cycleForm.tier2Threshold}
                  onChange={(e) => setCycleForm({...cycleForm, tier2Threshold: parseInt(e.target.value)})}
                  placeholder="21"
                />
                <div className="text-xs text-gray-500 mt-1">Minimum points for Tier 2</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={cycleForm.isActive}
                  onChange={(e) => setCycleForm({...cycleForm, isActive: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                  Active Cycle
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allowMidCycleJoining"
                  checked={cycleForm.allowMidCycleJoining}
                  onChange={(e) => setCycleForm({...cycleForm, allowMidCycleJoining: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="allowMidCycleJoining" className="text-sm font-medium">
                  Allow Mid-cycle Joining
                </label>
              </div>

              {cycleForm.allowMidCycleJoining && (
                <div>
                  <label className="text-sm font-medium">Mid-cycle Join Threshold (days)</label>
                  <Input
                    type="number"
                    value={cycleForm.midCycleJoinThresholdDays}
                    onChange={(e) => setCycleForm({...cycleForm, midCycleJoinThresholdDays: parseInt(e.target.value)})}
                    placeholder="3"
                    className="w-32"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Users join current cycle if next cycle starts in more than this many days
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowCycleDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveCycle}>
              {editingCycle ? 'Update Cycle' : 'Create Cycle'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Winner Selection Dialog */}
      <Dialog open={showWinnerSelectionDialog} onOpenChange={setShowWinnerSelectionDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Run Winner Selection</DialogTitle>
            <DialogDescription>
              {selectedCycleForWinners 
                ? `Run winner selection for "${selectedCycleForWinners.cycleName}"`
                : 'Select a cycle to run winner selection'
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedCycleForWinners && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Cycle Details</h4>
                <div className="text-sm space-y-1">
                  <div>Name: {selectedCycleForWinners.cycleName}</div>
                  <div>Duration: {new Date(selectedCycleForWinners.cycleStartDate).toLocaleDateString()} - {new Date(selectedCycleForWinners.cycleEndDate).toLocaleDateString()}</div>
                  <div>Reward Pool: {selectedCycleForWinners.rewardPoolPercentage}%</div>
                  <div>Membership Fee: ${(selectedCycleForWinners.membershipFee / 100).toFixed(2)}</div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-800">Selection Details</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>• Winners selected based on tier performance</div>
                  <div>• Tier 1: {selectedCycleForWinners.tier1Threshold}+ points</div>
                  <div>• Tier 2: {selectedCycleForWinners.tier2Threshold}+ points</div>
                  <div>• Tier 3: 0-{selectedCycleForWinners.tier2Threshold - 1} points</div>
                </div>
              </div>

              {isRunningSelection && (
                <div className="text-center py-4">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <div className="text-sm text-gray-600">Running winner selection...</div>
                </div>
              )}

              {selectionResults && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-green-800">Selection Results</h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <div>Total Winners: {selectionResults.totalWinners}</div>
                    <div>Tier 1 Winners: {selectionResults.tier1Winners}</div>
                    <div>Tier 2 Winners: {selectionResults.tier2Winners}</div>
                    <div>Tier 3 Winners: {selectionResults.tier3Winners}</div>
                    <div>Total Reward Pool: ${(selectionResults.totalRewardPool / 100).toFixed(2)}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowWinnerSelectionDialog(false);
                setSelectedCycleForWinners(null);
                setSelectionResults(null);
              }}
            >
              Close
            </Button>
            {selectedCycleForWinners && !isRunningSelection && (
              <Button 
                onClick={handleExecuteWinnerSelection}
                disabled={isRunningSelection}
              >
                Run Winner Selection
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cycle Management Dialog */}
      <Dialog open={showCycleDialog} onOpenChange={setShowCycleDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCycle ? "Edit Cycle" : "Create New Cycle"}
            </DialogTitle>
            <DialogDescription>
              Configure cycle parameters including duration, membership fees, and tier thresholds
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cycleName">Cycle Name</Label>
                <Input
                  id="cycleName"
                  value={cycleForm.cycleName}
                  onChange={(e) => setCycleForm(prev => ({ ...prev, cycleName: e.target.value }))}
                  placeholder="e.g., Q1 2025 Cycle"
                />
              </div>
              
              <div>
                <Label htmlFor="paymentPeriodDays">Payment Period (Days)</Label>
                <Input
                  id="paymentPeriodDays"
                  type="number"
                  value={cycleForm.paymentPeriodDays}
                  onChange={(e) => setCycleForm(prev => ({ ...prev, paymentPeriodDays: parseInt(e.target.value) }))}
                  placeholder="30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cycleStartDate">Start Date</Label>
                <Input
                  id="cycleStartDate"
                  type="date"
                  value={cycleForm.cycleStartDate}
                  onChange={(e) => setCycleForm(prev => ({ ...prev, cycleStartDate: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="cycleEndDate">End Date</Label>
                <Input
                  id="cycleEndDate"
                  type="date"
                  value={cycleForm.cycleEndDate}
                  onChange={(e) => setCycleForm(prev => ({ ...prev, cycleEndDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="membershipFee">Membership Fee (cents)</Label>
                <Input
                  id="membershipFee"
                  type="number"
                  value={cycleForm.membershipFee}
                  onChange={(e) => setCycleForm(prev => ({ ...prev, membershipFee: parseInt(e.target.value) }))}
                  placeholder="2000"
                />
                <p className="text-xs text-gray-500 mt-1">${(cycleForm.membershipFee / 100).toFixed(2)}</p>
              </div>
              
              <div>
                <Label htmlFor="rewardPoolPercentage">Reward Pool (%)</Label>
                <Input
                  id="rewardPoolPercentage"
                  type="number"
                  min="1"
                  max="100"
                  value={cycleForm.rewardPoolPercentage}
                  onChange={(e) => setCycleForm(prev => ({ ...prev, rewardPoolPercentage: parseInt(e.target.value) }))}
                  placeholder="55"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tier1Threshold">Tier 1 Threshold (points)</Label>
                <Input
                  id="tier1Threshold"
                  type="number"
                  value={cycleForm.tier1Threshold}
                  onChange={(e) => setCycleForm(prev => ({ ...prev, tier1Threshold: parseInt(e.target.value) }))}
                  placeholder="67"
                />
                <p className="text-xs text-gray-500 mt-1">Top tier threshold</p>
              </div>
              
              <div>
                <Label htmlFor="tier2Threshold">Tier 2 Threshold (points)</Label>
                <Input
                  id="tier2Threshold"
                  type="number"
                  value={cycleForm.tier2Threshold}
                  onChange={(e) => setCycleForm(prev => ({ ...prev, tier2Threshold: parseInt(e.target.value) }))}
                  placeholder="33"
                />
                <p className="text-xs text-gray-500 mt-1">Middle tier threshold</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allowMidCycleJoining"
                  checked={cycleForm.allowMidCycleJoining}
                  onChange={(e) => setCycleForm(prev => ({ ...prev, allowMidCycleJoining: e.target.checked }))}
                />
                <Label htmlFor="allowMidCycleJoining">Allow Mid-Cycle Joining</Label>
              </div>
              
              {cycleForm.allowMidCycleJoining && (
                <div>
                  <Label htmlFor="midCycleJoinThresholdDays">Mid-Cycle Join Threshold (Days)</Label>
                  <Input
                    id="midCycleJoinThresholdDays"
                    type="number"
                    value={cycleForm.midCycleJoinThresholdDays}
                    onChange={(e) => setCycleForm(prev => ({ ...prev, midCycleJoinThresholdDays: parseInt(e.target.value) }))}
                    placeholder="14"
                  />
                  <p className="text-xs text-gray-500 mt-1">Users can join up to this many days before cycle end</p>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={cycleForm.isActive}
                  onChange={(e) => setCycleForm(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                <Label htmlFor="isActive">Set as Active Cycle</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowCycleDialog(false);
                setEditingCycle(null);
                setCycleForm({
                  cycleName: '',
                  cycleStartDate: '',
                  cycleEndDate: '',
                  paymentPeriodDays: 30,
                  membershipFee: 2000,
                  rewardPoolPercentage: 50,
                  tier1Threshold: 67,
                  tier2Threshold: 33,
                  isActive: false,
                  allowMidCycleJoining: true,
                  midCycleJoinThresholdDays: 14
                });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveCycle}>
              {editingCycle ? "Update Cycle" : "Create Cycle"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Winner Selection Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Winner Selection</DialogTitle>
            <DialogDescription>
              Import an Excel file to update winner selection data. The file must contain Email, Reward Amount, and Payout Status columns.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Import Requirements</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div>• Excel file must contain "Email", "Reward Amount", and "Payout Status" columns</div>
                <div>• Only existing winners in the current cycle can be updated</div>
                <div>• Email addresses are used to match and update records</div>
                <div>• Reward amounts should be in dollar format (e.g., $10.50)</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="import-file">Select Excel File</Label>
              <Input
                id="import-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setImportFile(file || null);
                  setImportResults(null);
                }}
                className="cursor-pointer"
              />
              {importFile && (
                <div className="text-sm text-gray-600">
                  Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            {importResults && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Import Results</h4>
                <div className="text-sm text-green-800 space-y-1">
                  <div>✓ Processed: {importResults.processed} rows</div>
                  <div>✓ Updated: {importResults.updated} winners</div>
                  <div>• Skipped: {importResults.skipped} rows</div>
                  {importResults.errors.length > 0 && (
                    <div className="mt-2">
                      <div className="text-red-800 font-medium">Errors:</div>
                      <div className="max-h-32 overflow-y-auto">
                        {importResults.errors.slice(0, 5).map((error: string, index: number) => (
                          <div key={index} className="text-xs text-red-700">• {error}</div>
                        ))}
                        {importResults.errors.length > 5 && (
                          <div className="text-xs text-red-700">... and {importResults.errors.length - 5} more errors</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isImporting && (
              <div className="text-center py-4">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                <div className="text-sm text-gray-600">Processing import...</div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowImportDialog(false);
                setImportFile(null);
                setImportResults(null);
              }}
              disabled={isImporting}
            >
              Close
            </Button>
            <Button 
              onClick={handleImportWinners}
              disabled={!importFile || isImporting}
            >
              {isImporting ? 'Importing...' : 'Import Winners'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Admin() {
  return (
    <ErrorBoundary>
      <AdminComponent />
    </ErrorBoundary>
  );
}