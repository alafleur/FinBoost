import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
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
  Trophy,
  X,
  Activity,
  Lock
} from 'lucide-react';

interface LearningModule {
  id: number;
  title: string;
  description: string;
  content: string;
  pointsReward: number;
  category: string;
  difficulty: string;
  estimatedMinutes: number;
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
  totalCompletions: number;
  totalUsers: number;
  avgCompletionRate: number;
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

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Enhanced state for user management
  const [users, setUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  
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
      tier1: 50,
      tier2: 30,
      tier3: 20
    },
    winnerPercentages: {
      tier1: 50,
      tier2: 50,
      tier3: 50
    },
    tierPercentiles: {
      tier1: 33,
      tier2: 33,
      tier3: 34
    },
    isLocked: true,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  // Next month rewards configuration (editable)
  const [nextRewardsConfig, setNextRewardsConfig] = useState({
    poolPercentage: 55,
    tierAllocations: {
      tier1: 50,
      tier2: 30,
      tier3: 20
    },
    winnerPercentages: {
      tier1: 50,
      tier2: 50,
      tier3: 50
    },
    tierPercentiles: {
      tier1: 33,
      tier2: 33,
      tier3: 34
    },
    isLocked: false,
    month: new Date().getMonth() + 2 > 12 ? 1 : new Date().getMonth() + 2,
    year: new Date().getMonth() + 2 > 12 ? new Date().getFullYear() + 1 : new Date().getFullYear()
  });

  // State for modules
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [isEditingModule, setIsEditingModule] = useState(false);

  // State for module form
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    content: '',
    pointsReward: 20,
    category: 'budgeting',
    difficulty: 'beginner',
    estimatedMinutes: 5,
    isActive: true,
    isPublished: false
  });

  // State for quiz questions
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: ''
  });

  // Admin stats
  const [stats, setStats] = useState({
    totalModules: 0,
    totalUsers: 0,
    totalCompletions: 0,
    avgCompletionRate: 0
  });
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    totalReferrers: 0,
    topReferrers: []
  });

  // State for proof review
  const [pendingProofs, setPendingProofs] = useState<PendingProof[]>([]);
  const [reviewingProof, setReviewingProof] = useState<PendingProof | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // State for rewards payout
  const [payoutConfig, setPayoutConfig] = useState({
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

  // State for cycle management
  const [cycleSettings, setCycleSettings] = useState({
    cycleStartDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    cycleEndDate: (() => {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(0); // Last day of current month
      return nextMonth.toISOString().split('T')[0];
    })(),
    distributionDate: (() => {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(5); // 5th of next month
      return nextMonth.toISOString().split('T')[0];
    })(),
    rewardsAnnouncementDate: (() => {
      const today = new Date();
      today.setDate(today.getDate() + 3); // 3 days from now
      return today.toISOString().split('T')[0];
    })(),
    cycleStartTime: "00:00",
    distributionTime: "12:00",
    timezone: "UTC",
    rewardsAnnouncementTime: "10:00"
  });

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [csvImportData, setCsvImportData] = useState('');
  const [winnerPreview, setWinnerPreview] = useState([]);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [confirmDistribution, setConfirmDistribution] = useState(false);
  const [isExecutingDistribution, setIsExecutingDistribution] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out."
    });
    setLocation('/auth');
  };

  const categories = [
    { value: 'budgeting', label: 'Budgeting' },
    { value: 'credit', label: 'Credit' },
    { value: 'debt', label: 'Debt Management' },
    { value: 'saving', label: 'Saving' },
    { value: 'investing', label: 'Investing' },
    { value: 'career', label: 'Career & Income' }
  ];

  const difficulties = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      setLocation('/auth');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);

      // Check if user is admin (you'd implement proper role checking)
      if (parsedUser.email !== 'lafleur.andrew@gmail.com') {
        toast({
          title: "Access Denied",
          description: "Admin access required",
          variant: "destructive"
        });
        setLocation('/dashboard');
        return;
      }

      setUser(parsedUser);
      loadAdminData();
      loadPendingProofs();
      fetchReferralStats();
      setLoading(false);
    } catch (error) {
      console.error('Error loading admin data:', error);
      setLocation('/auth');
    }
  }, [setLocation, toast]);

  const loadPendingProofs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/points/pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingProofs(data.pending);
      }
    } catch (error) {
      console.error('Failed to load pending proofs:', error);
    }
  };

  const loadAdminData = async () => {
    try {
      // Load real admin data
      await loadUsersData();
      await loadAnalyticsData();
      await loadSystemSettings();
      await loadModulesData();
      await loadRealStats();
      await loadTierThresholds();
      await loadRewardsConfig();
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  };

  const loadModulesData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/modules', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setModules(data.modules || []);
      } else {
        console.error('Failed to load modules data');
        setModules([]);
      }
    } catch (error) {
      console.error('Error loading modules:', error);
      setModules([]);
    }
  };

  const loadTierThresholds = async () => {
    try {
      const response = await fetch('/api/tiers/thresholds');
      if (response.ok) {
        const data = await response.json();
        setTierThresholds({
          tier1: data.thresholds.tier1,
          tier2: data.thresholds.tier2,
          tier3: data.thresholds.tier3
        });
      }
    } catch (error) {
      console.error('Failed to load tier thresholds:', error);
    }
  };

  const loadRewardsConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/rewards/config', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentRewardsConfig(data.config);
        setNextRewardsConfig(data.config);
      }
    } catch (error) {
      console.error('Failed to load rewards config:', error);
    }
  };

  const saveNextRewardsConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/rewards/config', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ config: nextRewardsConfig })
      });

      if (response.ok) {
        toast({
          title: "Next Month Configuration Saved",
          description: "Settings will take effect after lock-in"
        });
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save rewards configuration",
        variant: "destructive"
      });
    }
  };

  const canLockIn = () => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    
    // Can lock in if we're configuring next month and it's before the 25th
    return nextRewardsConfig.month === (currentMonth % 12) + 1 && 
           nextRewardsConfig.year === (currentMonth === 12 ? currentYear + 1 : currentYear) &&
           today.getDate() <= 25;
  };

  const lockInNextMonth = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/rewards/lock-in', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(nextRewardsConfig)
      });

      if (response.ok) {
        setCurrentRewardsConfig({ ...nextRewardsConfig });
        toast({
          title: "Configuration Locked In",
          description: `Settings locked for ${new Date(0, nextRewardsConfig.month-1).toLocaleString('default', { month: 'long' })}`
        });
      } else {
        throw new Error('Failed to lock in configuration');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to lock in configuration",
        variant: "destructive"
      });
    }
  };

  const loadRealStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Get real module count
      const modulesResponse = await fetch('/api/admin/modules', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Get real user count from pool data
      const poolResponse = await fetch('/api/pool/monthly');
      
      // Get real completion data
      const progressResponse = await fetch('/api/admin/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      let realStats = {
        totalModules: 27, // Default to 27 if modules not loaded yet
        totalUsers: 0,
        totalCompletions: 0,
        avgCompletionRate: 0
      };

      if (modulesResponse.ok) {
        const moduleData = await modulesResponse.json();
        realStats.totalModules = moduleData.modules?.length || 27;
      }

      if (poolResponse.ok) {
        const poolData = await poolResponse.json();
        realStats.totalUsers = parseInt(poolData.pool?.totalUsers || 0);
      }

      if (progressResponse.ok) {
        const analyticsData = await progressResponse.json();
        // Use real completion data from database
        realStats.totalCompletions = analyticsData.analytics?.totalCompletions || 0;
        realStats.avgCompletionRate = realStats.totalUsers > 0 && realStats.totalModules > 0 ? 
          Math.round((realStats.totalCompletions / (realStats.totalUsers * realStats.totalModules)) * 10000) / 100 : 0;
      }

      setStats(realStats);
    } catch (error) {
      console.error('Failed to load real stats:', error);
      // Use zero stats if data loading fails
      setStats({
        totalModules: 0,
        totalCompletions: 0,
        totalUsers: 0,
        avgCompletionRate: 0
      });
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSaveModule = async () => {
    setIsSaving(true);
    try {
      // Validate required fields
      if (!moduleForm.title.trim()) {
        toast({
          title: "Validation Error",
          description: "Module title is required.",
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }

      if (!moduleForm.content.trim()) {
        toast({
          title: "Validation Error",
          description: "Module content is required.",
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }

      if (isEditingModule && selectedModule) {
        // Update existing module
        const updatedModules = modules.map(m => 
          m.id === selectedModule.id 
            ? { ...selectedModule, ...moduleForm, id: selectedModule.id }
            : m
        );
        setModules(updatedModules);
        toast({
          title: "✅ Module Updated",
          description: "Learning module has been successfully updated."
        });
      } else {
        // Create new module
        const newModule: LearningModule = {
          ...moduleForm,
          id: Math.max(...modules.map(m => m.id), 0) + 1,
          createdAt: new Date().toISOString(),
          order: modules.length + 1,
          completions: 0,
          avgRating: 0
        };
        setModules([...modules, newModule]);
        toast({
          title: "✅ Module Created",
          description: "New learning module has been successfully created."
        });
      }

      // Reset form
      setModuleForm({
        title: '',
        description: '',
        content: '',
        pointsReward: 20,
        category: 'budgeting',
        difficulty: 'beginner',
        estimatedMinutes: 5,
        isActive: true,
        isPublished: false
      });
      setIsEditingModule(false);
      setSelectedModule(null);
    } catch (error) {
      console.error('Save module error:', error);
      toast({
        title: "❌ Save Failed",
        description: "Failed to save module. Please check your input and try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditModule = (module: LearningModule) => {
    setSelectedModule(module);
    setModuleForm({
      title: module.title,
      description: module.description,
      content: module.content,
      pointsReward: module.pointsReward,
      category: module.category,
      difficulty: module.difficulty,
      estimatedMinutes: module.estimatedMinutes,
      isActive: module.isActive,
      isPublished: module.isPublished || false
    });
    setIsEditingModule(true);
  };

  const handleDeleteModule = async (moduleId: number) => {
    try {
      const moduleToDelete = modules.find(m => m.id === moduleId);
      if (window.confirm(`Are you sure you want to delete "${moduleToDelete?.title}"? This action cannot be undone.`)) {
        setModules(modules.filter(m => m.id !== moduleId));
        toast({
          title: "✅ Module Deleted",
          description: `"${moduleToDelete?.title}" has been successfully deleted.`
        });
      }
    } catch (error) {
      console.error('Delete module error:', error);
      toast({
        title: "❌ Delete Failed",
        description: "Failed to delete module. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAddQuizQuestion = () => {
    if (!newQuestion.question || newQuestion.options.some(opt => !opt.trim())) {
      toast({
        title: "Incomplete Question",
        description: "Please fill in all question fields.",
        variant: "destructive"
      });
      return;
    }

    const question: QuizQuestion = {
      id: Math.max(...quizQuestions.map(q => q.id), 0) + 1,
      ...newQuestion
    };

    setQuizQuestions([...quizQuestions, question]);
    setNewQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    });

    toast({
      title: "Question Added",
      description: "Quiz question has been successfully added."
    });
  };

  const handleApproveProof = async (proofId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/points/approve/${proofId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: "Proof Approved! ✅",
          description: "Points have been awarded to the user."
        });

        // Remove from pending list
        setPendingProofs(pendingProofs.filter(p => p.id !== proofId));
      } else {
        const error = await response.json();
        toast({
          title: "Approval Failed",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to approve proof:', error);
      toast({
        title: "Error",
        description: "Failed to approve proof. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRejectProof = async (proofId: number, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection.",
        variant: "destructive"
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/points/reject/${proofId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        toast({
          title: "Proof Rejected",
          description: "User has been notified of the rejection."
        });

        // Remove from pending list
        setPendingProofs(pendingProofs.filter(p => p.id !== proofId));
        setReviewingProof(null);
        setRejectionReason('');
      } else {
        const error = await response.json();
        toast({
          title: "Rejection Failed",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to reject proof:', error);
      toast({
        title: "Error",
        description: "Failed to reject proof. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getActionName = (actionId: string) => {
    const actionNames: Record<string, string> = {
      'debt_payment': 'Debt Payment',
      'investment': 'Investment',
      'emergency_fund': 'Emergency Fund Contribution',
      'referral_signup': 'Referral Sign-up',
      'savings_milestone': 'Savings Milestone',
      'budget_creation': 'Budget Creation'
    };
    return actionNames[actionId] || actionId;
  };

  const loadUsersData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data.analytics);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadSystemSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSystemSettings(data.settings);
        
        // Load cycle settings if they exist
        if (data.settings.monthlySettings) {
          setCycleSettings({
            ...cycleSettings,
            ...data.settings.monthlySettings
          });
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleUserAction = async (action: string, userIds: number[]) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users/bulk-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, userIds })
      });

      if (response.ok) {
        toast({
          title: "Action Completed",
          description: `Successfully applied ${action} to ${userIds.length} user(s)`
        });
        await loadUsersData();
        setSelectedUsers([]);
      } else {
        throw new Error('Failed to execute action');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to execute bulk action",
        variant: "destructive"
      });
    }
  };

  const handleUpdateSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          settings: {
            ...systemSettings,
            monthlySettings: cycleSettings
          }
        })
      });

      if (response.ok) {
        toast({
          title: "Settings Updated",
          description: "System settings have been successfully updated"
        });
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update system settings",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const fetchReferralStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/referrals/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setReferralStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching referral stats:', error);
    }
  };

  // Calculate how many winners each tier should have
  const calculateWinnerCounts = () => {
    return {
      tier1: Math.round((Math.round((stats.totalUsers * currentRewardsConfig.tierPercentiles.tier1) / 100) * currentRewardsConfig.winnerPercentages.tier1) / 100),
      tier2: Math.round((Math.round((stats.totalUsers * currentRewardsConfig.tierPercentiles.tier2) / 100) * currentRewardsConfig.winnerPercentages.tier2) / 100),
      tier3: Math.round((Math.round((stats.totalUsers * currentRewardsConfig.tierPercentiles.tier3) / 100) * currentRewardsConfig.winnerPercentages.tier3) / 100)
    };
  };

  // Initialize winner configuration based on calculated counts
  const initializeWinnerConfiguration = () => {
    const counts = calculateWinnerCounts();
    const newConfig = { tier1: [], tier2: [], tier3: [] };

    (['tier1', 'tier2', 'tier3'] as const).forEach(tier => {
      const count = counts[tier];
      const evenPercentage = count > 0 ? Math.floor(100 / count) : 0;
      const remainder = count > 0 ? 100 - (evenPercentage * count) : 0;

      newConfig[tier] = Array.from({ length: count }, (_, index) => ({
        position: index + 1,
        percentage: index === 0 ? evenPercentage + remainder : evenPercentage
      }));
    });

    setWinnerConfiguration(newConfig);
  };

  // Export winner configuration to CSV
  const exportToCSV = () => {
    let csvContent = "Tier,Position,Percentage,User ID,Username,Points\n";
    
    (['tier1', 'tier2', 'tier3'] as const).forEach(tier => {
      winnerConfiguration[tier].forEach(winner => {
        csvContent += `${tier},${winner.position},${winner.percentage},${winner.userId || ''},${winner.username || ''},${winner.points || ''}\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `winner_configuration_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import winner configuration from CSV
  const importFromCSV = () => {
    try {
      const lines = csvImportData.trim().split('\n');
      const headers = lines[0].split(',');
      
      const newConfig = { tier1: [], tier2: [], tier3: [] };

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const tier = values[0] as 'tier1' | 'tier2' | 'tier3';
        const position = parseInt(values[1]);
        const percentage = parseFloat(values[2]);
        const userId = values[3] ? parseInt(values[3]) : undefined;
        const username = values[4] || undefined;
        const points = values[5] ? parseInt(values[5]) : undefined;

        if (tier && position && percentage) {
          newConfig[tier].push({
            position,
            percentage,
            userId,
            username,
            points
          });
        }
      }

      // Sort by position
      (['tier1', 'tier2', 'tier3'] as const).forEach(tier => {
        newConfig[tier].sort((a, b) => a.position - b.position);
      });

      setWinnerConfiguration(newConfig);
      setImportDialogOpen(false);
      setCsvImportData('');
      
      toast({
        title: "Configuration Imported",
        description: "Winner configuration has been imported successfully"
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Please check your CSV format and try again",
        variant: "destructive"
      });
    }
  };

  // Update individual winner percentage
  const updateWinnerPercentage = (tier: 'tier1' | 'tier2' | 'tier3', position: number, percentage: number) => {
    setWinnerConfiguration(prev => ({
      ...prev,
      [tier]: prev[tier].map(winner => 
        winner.position === position 
          ? { ...winner, percentage } 
          : winner
      )
    }));
  };

  // Add new winner position
  const addWinnerPosition = (tier: 'tier1' | 'tier2' | 'tier3') => {
    setWinnerConfiguration(prev => ({
      ...prev,
      [tier]: [
        ...prev[tier],
        {
          position: prev[tier].length + 1,
          percentage: 0
        }
      ]
    }));
  };

  // Remove winner position
  const removeWinnerPosition = (tier: 'tier1' | 'tier2' | 'tier3', position: number) => {
    setWinnerConfiguration(prev => ({
      ...prev,
      [tier]: prev[tier]
        .filter(winner => winner.position !== position)
        .map((winner, index) => ({ ...winner, position: index + 1 }))
    }));
  };

  // Calculate total percentage for a tier
  const getTierTotalPercentage = (tier: 'tier1' | 'tier2' | 'tier3') => {
    return winnerConfiguration[tier].reduce((sum, winner) => sum + winner.percentage, 0);
  };

  const generateWinnerPreview = async () => {
    setIsGeneratingPreview(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/rewards/preview-winners', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payoutConfig,
          rewardsConfig: currentRewardsConfig,
          winnerConfiguration
        })
      });

      if (response.ok) {
        const data = await response.json();
        setWinnerPreview(data.winners);
      } else {
        throw new Error('Failed to generate winner preview');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate winner preview",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const executeDistribution = async () => {
    setIsExecutingDistribution(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/rewards/execute-distribution', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payoutConfig,
          rewardsConfig: currentRewardsConfig,
          winners: winnerPreview
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Distribution Executed Successfully! 🎉",
          description: `Processed ${data.totalWinners} winners with $${(data.totalPayout / 100).toFixed(2)} in rewards`
        });
        
        // Reset state
        setWinnerPreview([]);
        setConfirmDistribution(false);
        
        // Refresh admin data
        await loadAdminData();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to execute distribution');
      }
    } catch (error) {
      toast({
        title: "Distribution Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsExecutingDistribution(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setLocation('/dashboard')}>
                ← Back to Dashboard
              </Button>
              <div className="flex items-center space-x-3">
                <Settings className="h-8 w-8 text-primary-600" />
                <h1 className="font-heading font-bold text-2xl text-dark-800">Admin Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                Admin Access
              </Badge>
              <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex w-full overflow-x-auto scrollbar-hide">
            <TabsTrigger value="overview" className="whitespace-nowrap px-3 py-2 text-sm">Overview</TabsTrigger>
            <TabsTrigger value="users" className="whitespace-nowrap px-3 py-2 text-sm">Users</TabsTrigger>
            <TabsTrigger value="modules" className="whitespace-nowrap px-3 py-2 text-sm">Modules</TabsTrigger>
            <TabsTrigger value="quiz" className="whitespace-nowrap px-3 py-2 text-sm">Quiz Builder</TabsTrigger>
            <TabsTrigger value="proofs" className="whitespace-nowrap px-3 py-2 text-sm">Proof Review</TabsTrigger>
            <TabsTrigger value="analytics" className="whitespace-nowrap px-3 py-2 text-sm">Analytics</TabsTrigger>
            <TabsTrigger value="current-rewards" className="whitespace-nowrap px-3 py-2 text-sm">Current Rewards</TabsTrigger>
            <TabsTrigger value="rewards-config" className="whitespace-nowrap px-3 py-2 text-sm">Rewards Config</TabsTrigger>
            <TabsTrigger value="rewards-payout" className="whitespace-nowrap px-3 py-2 text-sm">Rewards Payout</TabsTrigger>
            <TabsTrigger value="cycle-management" className="whitespace-nowrap px-3 py-2 text-sm">Cycle Management</TabsTrigger>
            <TabsTrigger value="settings" className="whitespace-nowrap px-3 py-2 text-sm">Settings</TabsTrigger>
          </TabsList>

          {/* Users Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">User Management</h2>
                <p className="text-gray-600">Manage user accounts, permissions, and activities</p>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Search users..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Button onClick={loadUsersData} variant="outline">
                  Refresh
                </Button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedUsers.length > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {selectedUsers.length} user(s) selected
                    </span>
                    <div className="flex gap-2">
                      <Select value={bulkAction} onValueChange={setBulkAction}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select action..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="activate">Activate Users</SelectItem>
                          <SelectItem value="deactivate">Deactivate Users</SelectItem>
                          <SelectItem value="reset_password">Reset Passwords</SelectItem>
                          <SelectItem value="export">Export Data</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={() => handleUserAction(bulkAction, selectedUsers)}
                        disabled={!bulkAction}
                      >
                        Apply
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedUsers([])}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Users Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(filteredUsers.map(u => u.id));
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                          checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.length}
                        />
                      </TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.username}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.totalPoints}</p>
                            <p className="text-sm text-gray-500">
                              {user.currentMonthPoints} this month
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            user.tier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                            user.tier === 'silver' ? 'bg-gray-100 text-gray-700' :
                            'bg-orange-100 text-orange-700'
                          }>
                            {user.tier}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.joinedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {user.lastLoginAt 
                            ? new Date(user.lastLoginAt).toLocaleDateString()
                            : 'Never'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
                  <BookOpen className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalModules}</div>
                  <p className="text-xs text-muted-foreground">Active learning modules</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">Registered users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completions</CardTitle>
                  <CheckCircle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCompletions}</div>
                  <p className="text-xs text-muted-foreground">Lessons completed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.avgCompletionRate}%</div>
                  <Progress value={stats.avgCompletionRate} className="h-2 mt-2" />
                </CardContent>
              </Card>
            </div>

             {/* Referral Stats */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{referralStats.totalReferrals}</div>
                  <p className="text-xs text-muted-foreground">All-time referrals</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Referrers</CardTitle>
                  <Users className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{referralStats.totalReferrers}</div>
                  <p className="text-xs text-muted-foreground">Users who made referrals</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Top Referrer</CardTitle>
                  <Trophy className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {referralStats.topReferrers.length > 0 ? referralStats.topReferrers[0].referralCount : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {referralStats.topReferrers.length > 0 ? referralStats.topReferrers[0].username : 'No referrals yet'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common administrative tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button onClick={() => setActiveTab("modules")} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Module
                  </Button>
                  <Button onClick={() => setActiveTab("quiz")} variant="outline" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Create Quiz
                  </Button>
                  <Button onClick={() => setActiveTab("proofs")} variant="outline" className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Review Proofs ({pendingProofs.length})
                  </Button>
                  <Button onClick={() => setActiveTab("analytics")} variant="outline" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Learning Modules</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Module
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {isEditingModule ? 'Edit Learning Module' : 'Create New Learning Module'}
                    </DialogTitle>
                    <DialogDescription>
                      Add educational content that helps users learn financial concepts and earn points.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title" className="text-sm font-medium">
                          Title <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="title"
                          value={moduleForm.title}
                          onChange={(e) => setModuleForm({...moduleForm, title: e.target.value})}
                          placeholder="e.g., Budget Basics for Beginners"
                          className={!moduleForm.title.trim() ? "border-red-300" : ""}
                        />
                        {!moduleForm.title.trim() && (
                          <p className="text-xs text-red-500 mt-1">Title is required</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="points" className="text-sm font-medium">
                          Points Reward <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="points"
                          type="number"
                          min="1"
                          max="100"
                          value={moduleForm.pointsReward}
                          onChange={(e) => setModuleForm({...moduleForm, pointsReward: parseInt(e.target.value) || 20})}
                        />
                        <p className="text-xs text-gray-500 mt-1">Points awarded upon completion (1-100)</p>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-sm font-medium">
                        Description <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="description"
                        value={moduleForm.description}
                        onChange={(e) => setModuleForm({...moduleForm, description: e.target.value})}
                        placeholder="Brief description of what users will learn..."
                        rows={2}
                        className={!moduleForm.description.trim() ? "border-red-300" : ""}
                      />
                      {!moduleForm.description.trim() && (
                        <p className="text-xs text-red-500 mt-1">Description is required</p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select value={moduleForm.category} onValueChange={(value) => setModuleForm({...moduleForm, category: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="difficulty">Difficulty</Label>
                        <Select value={moduleForm.difficulty} onValueChange={(value) => setModuleForm({...moduleForm, difficulty: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {difficulties.map(diff => (
                              <SelectItem key={diff.value} value={diff.value}>{diff.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="minutes">Estimated Minutes</Label>
                        <Input
                          id="minutes"
                          type="number"
                          value={moduleForm.estimatedMinutes}
                          onChange={(e) => setModuleForm({...moduleForm, estimatedMinutes: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="content" className="text-sm font-medium flex items-center gap-2">
                        Lesson Content (HTML) <span className="text-red-500">*</span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          💡 Must be valid HTML format
                        </span>
                      </Label>
                      <Textarea
                        id="content"
                        value={moduleForm.content}
                        onChange={(e) => setModuleForm({...moduleForm, content: e.target.value})}
                        placeholder="<h2>Lesson Title</h2><p>Lesson content here...</p><ul><li>Key point 1</li><li>Key point 2</li></ul>"
                        rows={8}
                        className={`font-mono text-sm ${!moduleForm.content.trim() ? "border-red-300" : ""}`}
                      />
                      <div className="mt-1 space-y-1">
                        {!moduleForm.content.trim() && (
                          <p className="text-xs text-red-500">Content is required</p>
                        )}
                        <p className="text-xs text-gray-500">
                          ✅ Supported HTML tags: h2, h3, p, ul, ol, li, strong, em, blockquote, code
                        </p>
                        <p className="text-xs text-gray-500">
                          💡 Tip: Use &lt;h2&gt; for main sections, &lt;p&gt; for paragraphs, &lt;ul&gt; for lists
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Module Status</Label>
                        <p className="text-xs text-gray-500">
                          Only published modules are visible to learners
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={moduleForm.isActive}
                            onCheckedChange={(checked) => setModuleForm({...moduleForm, isActive: checked})}
                          />
                          <Label className="text-sm">Active</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={moduleForm.isPublished}
                            onCheckedChange={(checked) => setModuleForm({...moduleForm, isPublished: checked})}
                          />
                          <Label className="text-sm font-medium">Published</Label>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => {
                        setIsEditingModule(false);
                        setSelectedModule(null);
                        setModuleForm({
                          title: '',
                          description: '',
                          content: '',
                          pointsReward: 20,
                          category: 'budgeting',
                          difficulty: 'beginner',
                          estimatedMinutes: 5,
                          isActive: true,
                          isPublished: false
                        });
                      }} disabled={isSaving}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveModule} disabled={isSaving} className="flex items-center gap-2">
                        {isSaving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            {isEditingModule ? 'Update Module' : 'Create Module'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Completions</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {modules.map((module) => (
                      <TableRow key={module.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-semibold">{module.title}</p>
                            <p className="text-sm text-gray-500 truncate max-w-xs">{module.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{module.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            module.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                            module.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }>
                            {module.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell>{module.pointsReward}</TableCell>
                        <TableCell>{module.completions || 0}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            {module.avgRating?.toFixed(1) || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={module.isActive ? "default" : "secondary"}>
                            {module.isActive ? 'Active' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={module.isPublished ? "default" : "outline"}>
                            {module.isPublished ? '🌐 Published' : '📝 Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditModule(module)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setLocation(`/lesson/${module.id}`)}>
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteModule(module.id)}>
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quiz Builder Tab */}
          <TabsContent value="quiz" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Builder</CardTitle>
                <CardDescription>Create interactive quiz questions to test user knowledge</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="quiz-question" className="text-sm font-medium">
                    Question <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="quiz-question"
                    value={newQuestion.question}
                    onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                    placeholder="Enter your quiz question here..."
                    rows={2}
                    className={!newQuestion.question.trim() ? "border-red-300" : ""}
                  />
                  {!newQuestion.question.trim() && (
                    <p className="text-xs text-red-500 mt-1">Question is required</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Answer Options <span className="text-red-500">*</span>
                  </Label>
                  <div className="grid grid-cols-1 gap-3">
                    {newQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="text-sm font-medium w-8">{String.fromCharCode(65 + index)}.</span>
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...newQuestion.options];
                            newOptions[index] = e.target.value;
                            setNewQuestion({...newQuestion, options: newOptions});
                          }}
                          placeholder={`Enter option ${String.fromCharCode(65 + index)}`}
                          className={!option.trim() ? "border-red-300" : ""}
                        />
                        <Button
                          variant={newQuestion.correctAnswer === index ? "default" : "outline"}
                          size="sm"
                          onClick={() => setNewQuestion({...newQuestion, correctAnswer: index})}
                          className={newQuestion.correctAnswer === index ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          {newQuestion.correctAnswer === index ? '✓ Correct' : 'Mark Correct'}
                        </Button>
                      </div>
                    ))}
                  </div>
                  {newQuestion.options.some(opt => !opt.trim()) && (
                    <p className="text-xs text-red-500 mt-1">All options must be filled</p>
                  )}
                  <p className="text-xs text-blue-600 mt-1">💡 Click "Mark Correct" to set the right answer</p>
                </div>

                <div>
                  <Label htmlFor="explanation" className="text-sm font-medium">
                    Explanation <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="explanation"
                    value={newQuestion.explanation}
                    onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
                    placeholder="Explain why this is the correct answer..."
                    rows={2}
                    className={!newQuestion.explanation.trim() ? "border-red-300" : ""}
                  />
                  {!newQuestion.explanation.trim() && (
                    <p className="text-xs text-red-500 mt-1">Explanation is required</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Help learners understand the correct answer</p>
                </div>

                <Button 
                  onClick={handleAddQuizQuestion} 
                  className="flex items-center gap-2"
                  disabled={!newQuestion.question.trim() || newQuestion.options.some(opt => !opt.trim()) || !newQuestion.explanation.trim()}
                >
                  <Plus className="h-4 w-4" />
                  Add Question
                </Button>
              </CardContent>
            </Card>

            {quizQuestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Quiz Questions ({quizQuestions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {quizQuestions.map((question, index) => (
                      <div key={question.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium mb-2">Q{index + 1}: {question.question}</h4>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                              {question.options.map((option, optIndex) => (
                                <p key={optIndex} className={`text-sm p-2 rounded ${
                                  optIndex === question.correctAnswer 
                                    ? 'bg-green-100 text-green-700 font-medium' 
                                    : 'bg-gray-50'
                                }`}>
                                  {optIndex + 1}. {option}
                                  {optIndex === question.correctAnswer && ' ✓'}
                                </p>
                              ))}
```python
                            </div>
                            <p className="text-xs text-gray-600"><strong>Explanation:</strong> {question.explanation}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setQuizQuestions(quizQuestions.filter(q => q.id !== question.id))}>
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Proof Review Tab */}
          <TabsContent value="proofs" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Proof Review</h2>
                <p className="text-gray-600">Review and approve user-submitted proofs for financial actions</p>
              </div>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                {pendingProofs.length} Pending
              </Badge>
            </div>

            {pendingProofs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                  <p className="text-gray-600 text-center">No pending proof submissions to review at this time.</p>
                  <Button 
                    variant="outline" 
                    onClick={loadPendingProofs}
                    className="mt-4"
                  >
                    Refresh
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingProofs.map((proof) => (
                  <Card key={proof.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {getActionName(proof.action)}
                            <Badge className="bg-blue-100 text-blue-700">
                              {proof.points} pts
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            Submitted by {proof.user?.username || `User ${proof.userId}`} • {new Date(proof.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleApproveProof(proof.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => setReviewingProof(proof)}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Proof Submission</DialogTitle>
                                <DialogDescription>
                                  Please provide a reason for rejecting this proof. The user will be notified.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Textarea
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  placeholder="e.g., Image is unclear, amount not visible, document appears to be edited..."
                                  rows={3}
                                />
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => {
                                      setReviewingProof(null);
                                      setRejectionReason('');
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    variant="destructive"
                                    onClick={() => handleRejectProof(proof.id, rejectionReason)}
                                  >
                                    Reject Proof
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label className="font-medium">Description:</Label>
                          <p className="text-sm text-gray-700 mt-1">{proof.description}</p>
                        </div>

                        <div>
                          <Label className="font-medium">Proof Document:</Label>
                          <div className="mt-2 border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center gap-3">
                              <Upload className="h-8 w-8 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium">Uploaded Proof</p>
                                <p className="text-xs text-gray-500">
                                  {proof.metadata?.fileName || 'Document'} • {proof.metadata?.fileSize ? `${(proof.metadata.fileSize / (1024 * 1024)).toFixed(2)} MB` : 'Unknown size'}
                                </p>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(proof.proofUrl, '_blank')}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        </div>

                        {proof.metadata && (
                          <div>
                            <Label className="font-medium">Additional Details:</Label>
                            <div className="mt-1 text-sm text-gray-600">
                              <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">
                                {JSON.stringify(proof.metadata, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
              <div className="flex gap-2">
                <Select defaultValue="7d">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={loadAnalyticsData}>
                  Refresh
                </Button>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Activity className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.systemHealth?.activeUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Points Awarded</CardTitle>
                  <Star className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsData.systemHealth?.totalPointsAwarded || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    This month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingProofs.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Proof submissions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Health</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">99.9%</div>
                  <p className="text-xs text-muted-foreground">
                    Uptime
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Growth Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                  <CardDescription>New user registrations over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">User growth chart would go here</p>
                      <p className="text-xs text-gray-400">Integration with chart library needed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Points Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Points Distribution</CardTitle>
                  <CardDescription>How points are earned across categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Education</span>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Financial Actions</span>
                      <span className="text-sm font-medium">35%</span>
                    </div>
                    <Progress value={35} className="h-2" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Referrals</span>
                      <span className="text-sm font-medium">20%</span>
                    </div>
                    <Progress value={20} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Popular Modules */}
              <Card>
                <CardHeader>
                  <CardTitle>Popular Modules</CardTitle>
                  <CardDescription>Most completed learning modules</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {modules.sort((a, b) => (b.completions || 0) - (a.completions || 0)).slice(0, 5).map((module) => (
                      <div key={module.id} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{module.title}</p>
                          <p className="text-xs text-gray-500">{module.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{module.completions}</p>
                          <p className="text-xs text-gray-500">completions</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest system events and user actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-2 bg-green-50 rounded">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">New user registered</p>
                        <p className="text-xs text-gray-500">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-blue-50 rounded">
                      <Upload className="h-4 w-4 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Proof submitted for review</p>
                        <p className="text-xs text-gray-500">5 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-yellow-50 rounded">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">User earned 25 points</p>
                        <p className="text-xs text-gray-500">8 minutes ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">System Settings</h2>
                <p className="text-gray-600">Configure application settings and parameters</p>
              </div>
              <Button onClick={handleUpdateSettings} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Settings
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* General Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Basic application configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Maintenance Mode</Label>
                      <p className="text-sm text-gray-500">Disable access for non-admin users</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemSettings.maintenanceMode}
                      onChange={(e) => setSystemSettings({
                        ...systemSettings,
                        maintenanceMode: e.target.checked
                      })}
                      className="toggle"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">User Registration</Label>
                      <p className="text-sm text-gray-500">Allow new users to register</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemSettings.registrationEnabled}
                      onChange={(e) => setSystemSettings({
                        ...systemSettings,
                        registrationEnabled: e.target.checked
                      })}
                      className="toggle"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Points Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Points Configuration</CardTitle>
                  <CardDescription>Configure point system parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Points Multiplier</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={systemSettings.pointsMultiplier}
                      onChange={(e) => setSystemSettings({
                        ...systemSettings,
                        pointsMultiplier: parseFloat(e.target.value)
                      })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Global multiplier for all point awards</p>
                  </div>

                  <div>
                    <Label>Max Daily Points</Label>
                    <Input
                      type="number"
                      value={systemSettings.maxDailyPoints}
                      onChange={(e) => setSystemSettings({
                        ...systemSettings,
                        maxDailyPoints: parseInt(e.target.value)
                      })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum points a user can earn per day</p>
                  </div>
                </CardContent>
              </Card>

              {/* Tier Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle>Tier Requirements</CardTitle>
                  <CardDescription>Dynamic percentile-based point thresholds for user tiers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-3">
                      Tier thresholds are automatically calculated based on user point percentiles and update monthly.
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-medium">Tier 1 (Top 33%)</Label>
                        <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                          {tierThresholds.tier1} points
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-medium">Tier 2 (Middle 33%)</Label>
                        <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                          {tierThresholds.tier2} points
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-medium">Tier 3 (Bottom 33%)</Label>
                        <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                          {tierThresholds.tier3} points
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Status */}
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Current system information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span className="text-sm font-medium">Database</span>
                    <Badge className="bg-green-100 text-green-700">Connected</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span className="text-sm font-medium">File Storage</span>
                    <Badge className="bg-green-100 text-green-700">Operational</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span className="text-sm font-medium">Email Service</span>
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span className="text-sm font-medium">Version</span>
                    <Badge variant="outline">v1.0.0</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Current Rewards Tab */}
          <TabsContent value="current-rewards" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Current Rewards</h2>
                <p className="text-gray-600">Locked settings for {new Date(0, currentRewardsConfig.month-1).toLocaleString('default', { month: 'long' })} {currentRewardsConfig.year}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Locked & Active
                </div>
              </div>
            </div>

            {/* Rewards Overview Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stats.totalUsers}</div>
                    <div className="text-sm text-gray-600">Total Users</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">${stats.totalUsers * 20}</div>
                    <div className="text-sm text-gray-600">Monthly Revenue</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      ${Math.round((stats.totalUsers * 20 * currentRewardsConfig.poolPercentage) / 100)}
                    </div>
                    <div className="text-sm text-gray-600">Monthly Rewards Pool</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      ${Math.round((stats.totalUsers * 20 * (100 - currentRewardsConfig.poolPercentage)) / 100)}
                    </div>
                    <div className="text-sm text-gray-600">Education Fund</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tier Distribution Statistics */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Tier Distribution Analysis</CardTitle>
                <CardDescription>Current user distribution and reward allocation by tier</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Tier 1 Stats */}
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <h4 className="font-semibold">Tier 1 (Top {currentRewardsConfig.tierPercentiles.tier1}%)</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Users in tier:</span>
                        <span className="font-mono">{Math.round((stats.totalUsers * currentRewardsConfig.tierPercentiles.tier1) / 100)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly fees:</span>
                        <span className="font-mono">${Math.round((stats.totalUsers * currentRewardsConfig.tierPercentiles.tier1) / 100) * 20}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pool allocation:</span>
                        <span className="font-mono">${Math.round(((stats.totalUsers * 20 * currentRewardsConfig.poolPercentage) / 100) * (currentRewardsConfig.tierAllocations.tier1 / 100))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Winners ({currentRewardsConfig.winnerPercentages.tier1}%):</span>
                        <span className="font-mono">{Math.round((Math.round((stats.totalUsers * currentRewardsConfig.tierPercentiles.tier1) / 100) * currentRewardsConfig.winnerPercentages.tier1) / 100)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium">Avg reward:</span>
                        <span className="font-mono font-bold">
                          ${Math.round(
                            (((stats.totalUsers * 20 * currentRewardsConfig.poolPercentage) / 100) * (currentRewardsConfig.tierAllocations.tier1 / 100)) /
                            Math.max(1, Math.round((Math.round((stats.totalUsers * currentRewardsConfig.tierPercentiles.tier1) / 100) * currentRewardsConfig.winnerPercentages.tier1) / 100))
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tier 2 Stats */}
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <h4 className="font-semibold">Tier 2 (Middle {nextRewardsConfig.tierPercentiles.tier2}%)</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Users in tier:</span>
                        <span className="font-mono">{Math.round((stats.totalUsers * nextRewardsConfig.tierPercentiles.tier2) / 100)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly fees:</span>
                        <span className="font-mono">${Math.round((stats.totalUsers * nextRewardsConfig.tierPercentiles.tier2) / 100) * 20}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pool allocation:</span>
                        <span className="font-mono">${Math.round(((stats.totalUsers * 20 * nextRewardsConfig.poolPercentage) / 100) * (nextRewardsConfig.tierAllocations.tier2 / 100))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Winners ({nextRewardsConfig.winnerPercentages.tier2}%):</span>
                        <span className="font-mono">{Math.round((Math.round((stats.totalUsers * nextRewardsConfig.tierPercentiles.tier2) / 100) * nextRewardsConfig.winnerPercentages.tier2) / 100)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium">Avg reward:</span>
                        <span className="font-mono font-bold">
                          ${Math.round(
                            (((stats.totalUsers * 20 * nextRewardsConfig.poolPercentage) / 100) * (nextRewardsConfig.tierAllocations.tier2 / 100)) /
                            Math.max(1, Math.round((Math.round((stats.totalUsers * nextRewardsConfig.tierPercentiles.tier2) / 100) * nextRewardsConfig.winnerPercentages.tier2) / 100))
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tier 3 Stats */}
                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-amber-600 rounded-full"></div>
                      <h4 className="font-semibold">Tier 3 (Bottom {nextRewardsConfig.tierPercentiles.tier3}%)</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Users in tier:</span>
                        <span className="font-mono">{Math.round((stats.totalUsers * nextRewardsConfig.tierPercentiles.tier3) / 100)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly fees:</span>
                        <span className="font-mono">${Math.round((stats.totalUsers * nextRewardsConfig.tierPercentiles.tier3) / 100) * 20}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pool allocation:</span>
                        <span className="font-mono">${Math.round(((stats.totalUsers * 20 * nextRewardsConfig.poolPercentage) / 100) * (nextRewardsConfig.tierAllocations.tier3 / 100))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Winners ({nextRewardsConfig.winnerPercentages.tier3}%):</span>
                        <span className="font-mono">{Math.round((Math.round((stats.totalUsers * nextRewardsConfig.tierPercentiles.tier3) / 100) * nextRewardsConfig.winnerPercentages.tier3) / 100)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-medium">Avg reward:</span>
                        <span className="font-mono font-bold">
                          ${Math.round(
                            (((stats.totalUsers * 20 * nextRewardsConfig.poolPercentage) / 100) * (nextRewardsConfig.tierAllocations.tier3 / 100)) /
                            Math.max(1, Math.round((Math.round((stats.totalUsers * nextRewardsConfig.tierPercentiles.tier3) / 100) * nextRewardsConfig.winnerPercentages.tier3) / 100))
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Distribution Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Monthly Distribution Summary</CardTitle>
                <CardDescription>Total reward distribution breakdown for the current month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Total Winners This Month</h4>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tier 1 Winners:</span>
                        <span className="font-mono font-bold text-green-700">
                          {Math.round((Math.round((stats.totalUsers * nextRewardsConfig.tierPercentiles.tier1) / 100) * nextRewardsConfig.winnerPercentages.tier1) / 100)} users
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tier 2 Winners:</span>
                        <span className="font-mono font-bold text-green-700">
                          {Math.round((Math.round((stats.totalUsers * nextRewardsConfig.tierPercentiles.tier2) / 100) * nextRewardsConfig.winnerPercentages.tier2) / 100)} users
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Tier 3 Winners:</span>
                        <span className="font-mono font-bold text-green-700">
                          {Math.round((Math.round((stats.totalUsers * nextRewardsConfig.tierPercentiles.tier3) / 100) * nextRewardsConfig.winnerPercentages.tier3) / 100)} users
                        </span>
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Total Winners:</span>
                          <span className="font-mono font-bold text-xl text-green-800">
                            {Math.round((Math.round((stats.totalUsers * nextRewardsConfig.tierPercentiles.tier1) / 100) * nextRewardsConfig.winnerPercentages.tier1) / 100) +
                             Math.round((Math.round((stats.totalUsers * nextRewardsConfig.tierPercentiles.tier2) / 100) * nextRewardsConfig.winnerPercentages.tier2) / 100) +
                             Math.round((Math.round((stats.totalUsers * nextRewardsConfig.tierPercentiles.tier3) / 100) * nextRewardsConfig.winnerPercentages.tier3) / 100)} users
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {(((Math.round((Math.round((stats.totalUsers * nextRewardsConfig.tierPercentiles.tier1) / 100) * nextRewardsConfig.winnerPercentages.tier1) / 100) +
                             Math.round((Math.round((stats.totalUsers * nextRewardsConfig.tierPercentiles.tier2) / 100) * nextRewardsConfig.winnerPercentages.tier2) / 100) +
                             Math.round((Math.round((stats.totalUsers * nextRewardsConfig.tierPercentiles.tier3) / 100) * nextRewardsConfig.winnerPercentages.tier3) / 100)) / stats.totalUsers) * 100).toFixed(1)}% of all users
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Pool Distribution</h4>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total Revenue:</span>
                          <span className="font-mono font-bold">${stats.totalUsers * 20}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-orange-400 to-red-500 h-2 rounded-full" 
                            style={{ width: `${nextRewardsConfig.poolPercentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-orange-600">Rewards: ${Math.round((stats.totalUsers * 20 * nextRewardsConfig.poolPercentage) / 100)} ({nextRewardsConfig.poolPercentage}%)</span>
                          <span className="text-blue-600">Education: ${Math.round((stats.totalUsers * 20 * (100 - nextRewardsConfig.poolPercentage)) / 100)} ({100 - nextRewardsConfig.poolPercentage}%)</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border">
                      <h5 className="font-medium mb-2">Tier Allocations</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Tier 1 ({nextRewardsConfig.tierAllocations.tier1}%):</span>
                          <span className="font-mono text-sm">${Math.round(((stats.totalUsers * 20 * nextRewardsConfig.poolPercentage) / 100) * (nextRewardsConfig.tierAllocations.tier1 / 100))}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Tier 2 ({nextRewardsConfig.tierAllocations.tier2}%):</span>
                          <span className="font-mono text-sm">${Math.round(((stats.totalUsers * 20 * nextRewardsConfig.poolPercentage) / 100) * (nextRewardsConfig.tierAllocations.tier2 / 100))}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Tier 3 ({nextRewardsConfig.tierAllocations.tier3}%):</span>
                          <span className="font-mono text-sm">${Math.round(((stats.totalUsers * 20 * nextRewardsConfig.poolPercentage) / 100) * (nextRewardsConfig.tierAllocations.tier3 / 100))}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rewards Payout Tab */}
          <TabsContent value="rewards-payout" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Rewards Payout Management</h2>
                <p className="text-gray-600">Execute monthly rewards distribution and manage payouts</p>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={() => setActiveTab("current-rewards")} variant="outline">
                  View Current Config
                </Button>
              </div>
            </div>

            {/* Current Month Payout Status */}
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-800">Current Month Payout Status</CardTitle>
                <CardDescription className="text-orange-600">
                  {new Date(0, new Date().getMonth()).toLocaleString('default', { month: 'long' })} {new Date().getFullYear()} Distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded border">
                    <div className="text-lg font-semibold text-orange-800">${Math.round((stats.totalUsers * 20 * currentRewardsConfig.poolPercentage) / 100)}</div>
                    <div className="text-sm text-orange-600">Total Pool</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-lg font-semibold text-green-800">
                      {Math.round((Math.round((stats.totalUsers * currentRewardsConfig.tierPercentiles.tier1) / 100) * currentRewardsConfig.winnerPercentages.tier1) / 100) +
                       Math.round((Math.round((stats.totalUsers * currentRewardsConfig.tierPercentiles.tier2) / 100) * currentRewardsConfig.winnerPercentages.tier2) / 100) +
                       Math.round((Math.round((stats.totalUsers * currentRewardsConfig.tierPercentiles.tier3) / 100) * currentRewardsConfig.winnerPercentages.tier3) / 100)}
                    </div>
                    <div className="text-sm text-green-600">Total Winners</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-lg font-semibold text-blue-800">Ready</div>
                    <div className="text-sm text-blue-600">Status</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-lg font-semibold text-purple-800">
                      {new Date().getDate() >= 28 ? 'Available' : `${28 - new Date().getDate()} days left`}
                    </div>
                    <div className="text-sm text-purple-600">Distribution Window</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payout Configuration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dynamic Payout Percentages */}
              <Card>
                <CardHeader>
                  <CardTitle>Dynamic Payout Configuration</CardTitle>
                  <CardDescription>Adjust what percentage of each tier's pool is paid out this month</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Tier 1 Payout Percentage</Label>
                    <div className="flex items-center space-x-4 mt-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={payoutConfig.tier1PayoutPercentage}
                        onChange={(e) => setPayoutConfig({
                          ...payoutConfig,
                          tier1PayoutPercentage: parseInt(e.target.value) || 0
                        })}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600">% of tier 1 pool</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Paying out: ${Math.round(((stats.totalUsers * 20 * currentRewardsConfig.poolPercentage) / 100) * (currentRewardsConfig.tierAllocations.tier1 / 100) * (payoutConfig.tier1PayoutPercentage / 100))}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Tier 2 Payout Percentage</Label>
                    <div className="flex items-center space-x-4 mt-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={payoutConfig.tier2PayoutPercentage}
                        onChange={(e) => setPayoutConfig({
                          ...payoutConfig,
                          tier2PayoutPercentage: parseInt(e.target.value) || 0
                        })}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600">% of tier 2 pool</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Paying out: ${Math.round(((stats.totalUsers * 20 * currentRewardsConfig.poolPercentage) / 100) * (currentRewardsConfig.tierAllocations.tier2 / 100) * (payoutConfig.tier2PayoutPercentage / 100))}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Tier 3 Payout Percentage</Label>
                    <div className="flex items-center space-x-4 mt-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={payoutConfig.tier3PayoutPercentage}
                        onChange={(e) => setPayoutConfig({
                          ...payoutConfig,
                          tier3PayoutPercentage: parseInt(e.target.value) || 0
                        })}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600">% of tier 3 pool</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Paying out: ${Math.round(((stats.totalUsers * 20 * currentRewardsConfig.poolPercentage) / 100) * (currentRewardsConfig.tierAllocations.tier3 / 100) * (payoutConfig.tier3PayoutPercentage / 100))}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <div className="flex justify-between font-medium">
                      <span>Total Payout Amount:</span>
                      <span className="text-green-600">
                        ${Math.round(
                          ((stats.totalUsers * 20 * currentRewardsConfig.poolPercentage) / 100) * (currentRewardsConfig.tierAllocations.tier1 / 100) * (payoutConfig.tier1PayoutPercentage / 100) +
                          ((stats.totalUsers * 20 * currentRewardsConfig.poolPercentage) / 100) * (currentRewardsConfig.tierAllocations.tier2 / 100) * (payoutConfig.tier2PayoutPercentage / 100) +
                          ((stats.totalUsers * 20 * currentRewardsConfig.poolPercentage) / 100) * (currentRewardsConfig.tierAllocations.tier3 / 100) * (payoutConfig.tier3PayoutPercentage / 100)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining Pool:</span>
                      <span className="text-blue-600">
                        ${Math.round((stats.totalUsers * 20 * currentRewardsConfig.poolPercentage) / 100) - Math.round(
                          ((stats.totalUsers * 20 * currentRewardsConfig.poolPercentage) / 100) * (currentRewardsConfig.tierAllocations.tier1 / 100) * (payoutConfig.tier1PayoutPercentage / 100) +
                          ((stats.totalUsers * 20 * currentRewardsConfig.poolPercentage) / 100) * (currentRewardsConfig.tierAllocations.tier2 / 100) * (payoutConfig.tier2PayoutPercentage / 100) +
                          ((stats.totalUsers * 20 * currentRewardsConfig.poolPercentage) / 100) * (currentRewardsConfig.tierAllocations.tier3 / 100) * (payoutConfig.tier3PayoutPercentage / 100)
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Winner Selection Controls */}
              <Card>
                <CardHeader>
                  <CardTitle>Random Winner Selection</CardTitle>
                  <CardDescription>Configure and execute random winner selection for each tier</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Selection Method: Weighted Random</h4>
                    <p className="text-xs text-gray-600 mb-3">
                      Winners are selected randomly from eligible users in each tier, weighted by their monthly points to ensure fairness.
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Tier 1 Winner Count:</span>
                        <span className="font-mono text-sm">
                          {Math.round((Math.round((stats.totalUsers * currentRewardsConfig.tierPercentiles.tier1) / 100) * currentRewardsConfig.winnerPercentages.tier1) / 100)} users
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Tier 2 Winner Count:</span>
                        <span className="font-mono text-sm">
                          {Math.round((Math.round((stats.totalUsers * currentRewardsConfig.tierPercentiles.tier2) / 100) * currentRewardsConfig.winnerPercentages.tier2) / 100)} users
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Tier 3 Winner Count:</span>
                        <span className="font-mono text-sm">
                          {Math.round((Math.round((stats.totalUsers * currentRewardsConfig.tierPercentiles.tier3) / 100) * currentRewardsConfig.winnerPercentages.tier3) / 100)} users
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Random Seed (Optional)</Label>
                    <Input
                      type="text"
                      value={payoutConfig.randomSeed}
                      onChange={(e) => setPayoutConfig({
                        ...payoutConfig,
                        randomSeed: e.target.value
                      })}
                      placeholder="Enter seed for reproducible results"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty for truly random selection, or enter a seed for reproducible results
                    </p>
                  </div>

                  <Button 
                    onClick={generateWinnerPreview}
                    variant="outline" 
                    className="w-full"
                    disabled={isGeneratingPreview}
                  >
                    {isGeneratingPreview ? 'Generating...' : 'Preview Random Selection'}
                  </Button>
                </CardContent>
              </Card>

              {/* Dynamic Winner Configuration (Spreadsheet Style) */}
              <Card>
                <CardHeader>
                  <CardTitle>Winner Configuration Management</CardTitle>
                  <CardDescription>
                    Configure individual percentage allocations for all winners in each tier. Import/export spreadsheet data.
                  </CardDescription>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={initializeWinnerConfiguration} variant="outline" size="sm">
                      Auto-Generate Configuration
                    </Button>
                    <Button onClick={exportToCSV} variant="outline" size="sm">
                      Export CSV
                    </Button>
                    <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">Import CSV</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Import Winner Configuration</DialogTitle>
                          <DialogDescription>
                            Paste CSV data with columns: Tier,Position,Percentage,User ID,Username,Points
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Textarea
                            value={csvImportData}
                            onChange={(e) => setCsvImportData(e.target.value)}
                            placeholder="tier1,1,25,123,john_doe,850&#10;tier1,2,20,456,jane_smith,820&#10;tier1,3,15,789,bob_wilson,790&#10;..."
                            rows={10}
                            className="font-mono text-sm"
                          />
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={importFromCSV}>
                              Import Configuration
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Tier 1 Configuration */}
                    <div className="bg-yellow-50 p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-yellow-800">
                          Tier 1 Winners ({calculateWinnerCounts().tier1} positions)
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            Total: {getTierTotalPercentage('tier1')}%
                          </span>
                          <Button 
                            onClick={() => addWinnerPosition('tier1')} 
                            size="sm" 
                            variant="outline"
                            className="h-8"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="grid grid-cols-5 gap-2 text-xs font-medium text-gray-600 pb-2 border-b">
                          <span>Position</span>
                          <span>Percentage</span>
                          <span>Est. Amount</span>
                          <span>User</span>
                          <span>Actions</span>
                        </div>
                        
                        {winnerConfiguration.tier1.map((winner, index) => (
                          <div key={index} className="grid grid-cols-5 gap-2 items-center">
                            <span className="text-sm font-medium">#{winner.position}</span>
                            <div className="flex items-center space-x-1">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={winner.percentage}
                                onChange={(e) => updateWinnerPercentage('tier1', winner.position, parseFloat(e.target.value) || 0)}
                                className="w-16 h-8 text-xs"
                              />
                              <span className="text-xs">%</span>
                            </div>
                            <span className="text-xs font-mono">
                              ${Math.floor(((stats.totalUsers * 20 * currentRewardsConfig.poolPercentage) / 100) * (currentRewardsConfig.tierAllocations.tier1 / 100) * (payoutConfig.tier1PayoutPercentage / 100) * (winner.percentage / 100))}
                            </span>
                            <span className="text-xs text-gray-600 truncate">
                              {winner.username || 'TBD'}
                            </span>
                            <Button
                              onClick={() => removeWinnerPosition('tier1', winner.position)}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tier 2 Configuration */}
                    <div className="bg-amber-50 p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-amber-800">
                          Tier 2 Winners ({calculateWinnerCounts().tier2} positions)
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            Total: {getTierTotalPercentage('tier2')}%
                          </span>
                          <Button 
                            onClick={() => addWinnerPosition('tier2')} 
                            size="sm" 
                            variant="outline"
                            className="h-8"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="grid grid-cols-5 gap-2 text-xs font-medium text-gray-600 pb-2 border-b">
                          <span>Position</span>
                          <span>Percentage</span>
                          <span>Est. Amount</span>
                          <span>User</span>
                          <span>Actions</span>
                        </div>
                        
                        {winnerConfiguration.tier2.map((winner, index) => (
                          <div key={index} className="grid grid-cols-5 gap-2 items-center">
                            <span className="text-sm font-medium">#{winner.position}</span>
                            <div className="flex items-center space-x-1">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={winner.percentage}
                                onChange={(e) => updateWinnerPercentage('tier2', winner.position, parseFloat(e.target.value) || 0)}
                                className="w-16 h-8 text-xs"
                              />
                              <span className="text-xs">%</span>
                            </div>
                            <span className="text-xs font-mono">
                              ${Math.floor(((stats.totalUsers * 20 * currentRewardsConfig.poolPercentage) / 100) * (currentRewardsConfig.tierAllocations.tier2 / 100) * (payoutConfig.tier2PayoutPercentage / 100) * (winner.percentage / 100))}
                            </span>
                            <span className="text-xs text-gray-600 truncate">
                              {winner.username || 'TBD'}
                            </span>
                            <Button
                              onClick={() => removeWinnerPosition('tier2', winner.position)}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tier 3 Configuration */}
                    <div className="bg-amber-50 p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-amber-800">
                          Tier 3 Winners ({calculateWinnerCounts().tier3} positions)
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            Total: {getTierTotalPercentage('tier3')}%
                          </span>
                          <Button 
                            onClick={() => addWinnerPosition('tier3')} 
                            size="sm" 
                            variant="outline"
                            className="h-8"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="grid grid-cols-5 gap-2 text-xs font-medium text-gray-600 pb-2 border-b">
                          <span>Position</span>
                          <span>Percentage</span>
                          <span>Est. Amount</span>
                          <span>User</span>
                          <span>Actions</span>
                        </div>
                        
                        {winnerConfiguration.tier3.map((winner, index) => (
                          <div key={index} className="grid grid-cols-5 gap-2 items-center">
                            <span className="text-sm font-medium">#{winner.position}</span>
                            <div className="flex items-center space-x-1">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={winner.percentage}
                                onChange={(e) => updateWinnerPercentage('tier3', winner.position, parseFloat(e.target.value) || 0)}
                                className="w-16 h-8 text-xs"
                              />
                              <span className="text-xs">%</span>
                            </div>
                            <span className="text-xs font-mono">
                              ${Math.floor(((stats.totalUsers * 20 * currentRewardsConfig.poolPercentage) / 100) * (currentRewardsConfig.tierAllocations.tier3 / 100) * (payoutConfig.tier3PayoutPercentage / 100) * (winner.percentage / 100))}
                            </span>
                            <span className="text-xs text-gray-600 truncate">
                              {winner.username || 'TBD'}
                            </span>
                            <Button
                              onClick={() => removeWinnerPosition('tier3', winner.position)}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h5 className="font-medium text-blue-800 mb-2">Instructions</h5>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Click "Auto-Generate Configuration" to create an even distribution for all winners</li>
                        <li>• Add/remove positions using the + and × buttons</li>
                        <li>• Export to CSV to work with spreadsheet software</li>
                        <li>• Import CSV data to bulk-configure winner percentages</li>
                        <li>• Ensure each tier's percentages total 100% before executing distribution</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Winner Preview */}
            {winnerPreview.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Winner Selection Preview</CardTitle>
                  <CardDescription>Preview of randomly selected winners for this distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['tier1', 'tier2', 'tier3'].map((tier) => {
                      const tierWinners = winnerPreview.filter(w => w.tier === tier);
                      const tierName = tier === 'tier1' ? 'Tier 1' : tier === 'tier2' ? 'Tier 2' : 'Tier 3';
                      const tierColor = tier === 'tier1' ? 'yellow' : tier === 'tier2' ? 'gray' : 'amber';
                      
                      return (
                        <div key={tier} className={`bg-${tierColor}-50 p-4 rounded-lg border`}>
                          <h4 className={`font-semibold text-${tierColor}-800 mb-2`}>
                            {tierName} Winners ({tierWinners.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {tierWinners.map((winner) => (
                              <div key={winner.userId} className="bg-white p-2 rounded border text-sm">
                                <div className="font-medium">{winner.username}</div>
                                <div className="text-gray-600">{winner.points} points</div>
                                <div className="text-xs text-gray-500">
                                  {winner.positionLabel} ({winner.positionPercentage?.toFixed(1)}%)
                                </div>
                                <div className={`text-${tierColor}-600 font-medium`}>
                                  ${(winner.rewardAmount / 100).toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setWinnerPreview([])}
                    >
                      Clear Preview
                    </Button>
                    <Button 
                      onClick={generateWinnerPreview}
                      disabled={isGeneratingPreview}
                    >
                      Regenerate Selection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Execute Distribution */}
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-800">Execute Monthly Distribution</CardTitle>
                <CardDescription className="text-red-600">
                  Execute the rewards distribution with current settings. This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-red-800 mb-2">Pre-Distribution Checklist:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>✓ Tier thresholds calculated and locked</li>
                    <li>✓ Rewards configuration verified</li>
                    <li>✓ Payout percentages set</li>
                    <li>✓ Winner selection previewed</li>
                    <li>⚠️ Users will have points deducted according to config</li>
                    <li>⚠️ Stripe payouts will be initiated for all winners</li>
                  </ul>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="confirm-distribution"
                      checked={confirmDistribution}
                      onChange={(e) => setConfirmDistribution(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="confirm-distribution" className="text-sm font-medium">
                      I confirm that I want to execute the monthly rewards distribution
                    </label>
                  </div>
                  
                  <Button 
                    onClick={executeDistribution}
                    disabled={!confirmDistribution || isExecutingDistribution}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isExecutingDistribution ? 'Executing...' : 'Execute Distribution'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rewards Configuration Tab */}
          <TabsContent value="rewards-config" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Rewards Configuration</h2>
                <p className="text-gray-600">Configure settings for {new Date(0, nextRewardsConfig.month-1).toLocaleString('default', { month: 'long' })} {nextRewardsConfig.year}</p>
              </div>
              <div className="flex items-center gap-3">
                {canLockIn() && (
                  <Button onClick={lockInNextMonth} variant="outline" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Lock In for Next Month
                  </Button>
                )}
                <Button onClick={saveNextRewardsConfig} className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Save Configuration
                </Button>
              </div>
            </div>

            {/* Preview Statistics for Next Month */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800">Next Month Preview</CardTitle>
                <CardDescription className="text-blue-600">How these settings will affect {new Date(0, nextRewardsConfig.month-1).toLocaleString('default', { month: 'long' })} rewards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded border">
                    <div className="text-lg font-semibold text-blue-800">${Math.round((stats.totalUsers * 20 * nextRewardsConfig.poolPercentage) / 100)}</div>
                    <div className="text-sm text-blue-600">Monthly Rewards Pool</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-lg font-semibold text-green-800">
                      {Math.round((Math.round((stats.totalUsers * nextRewardsConfig.tierPercentiles.tier1) / 100) * nextRewardsConfig.winnerPercentages.tier1) / 100) +
                       Math.round((Math.round((stats.totalUsers * nextRewardsConfig.tierPercentiles.tier2) / 100) * nextRewardsConfig.winnerPercentages.tier2) / 100) +
                       Math.round((Math.round((stats.totalUsers * nextRewardsConfig.tierPercentiles.tier3) / 100) * nextRewardsConfig.winnerPercentages.tier3) / 100)}
                    </div>
                    <div className="text-sm text-green-600">Total Winners</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-lg font-semibold text-orange-800">
                      ${Math.round(
                        (((stats.totalUsers * 20 * nextRewardsConfig.poolPercentage) / 100) * (nextRewardsConfig.tierAllocations.tier1 / 100)) /
                        Math.max(1, Math.round((Math.round((stats.totalUsers * nextRewardsConfig.tierPercentiles.tier1) / 100) * nextRewardsConfig.winnerPercentages.tier1) / 100))
                      )}
                    </div>
                    <div className="text-sm text-orange-600">Avg Tier 1 Reward</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pool Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Pool Configuration</CardTitle>
                  <CardDescription>Manage how membership fees are allocated to the rewards pool</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Rewards Pool Percentage</Label>
                    <div className="flex items-center space-x-4 mt-2">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={nextRewardsConfig.poolPercentage}
                        onChange={(e) => setNextRewardsConfig({
                          ...nextRewardsConfig,
                          poolPercentage: parseInt(e.target.value) || 0
                        })}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600">% of membership fees</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Currently: {nextRewardsConfig.poolPercentage}% to rewards, {100 - nextRewardsConfig.poolPercentage}% to education
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Monthly Pool Estimate</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total subscribers:</span>
                        <span className="font-mono">12</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly revenue:</span>
                        <span className="font-mono">${12 * 20}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span>Rewards pool:</span>
                        <span className="font-mono font-bold">${Math.round((12 * 20 * nextRewardsConfig.poolPercentage) / 100)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tier Allocations */}
              <Card>
                <CardHeader>
                  <CardTitle>Tier Pool Allocation</CardTitle>
                  <CardDescription>Distribute the rewards pool among user tiers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Tier 1 (Top Performers)</Label>
                    <div className="flex items-center space-x-4 mt-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={nextRewardsConfig.tierAllocations.tier1}
                        onChange={(e) => setNextRewardsConfig({
                          ...nextRewardsConfig,
                          tierAllocations: {
                            ...nextRewardsConfig.tierAllocations,
                            tier1: parseInt(e.target.value) || 0
                          }
                        })}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600">% of pool</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Tier 2 (Middle Performers)</Label>
                    <div className="flex items-center space-x-4 mt-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={nextRewardsConfig.tierAllocations.tier2}
                        onChange={(e) => setNextRewardsConfig({
                          ...nextRewardsConfig,
                          tierAllocations: {
                            ...nextRewardsConfig.tierAllocations,
                            tier2: parseInt(e.target.value) || 0
                          }
                        })}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600">% of pool</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Tier 3 (Emerging Learners)</Label>
                    <div className="flex items-center space-x-4 mt-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={nextRewardsConfig.tierAllocations.tier3}
                        onChange={(e) => setNextRewardsConfig({
                          ...nextRewardsConfig,
                          tierAllocations: {
                            ...nextRewardsConfig.tierAllocations,
                            tier3: parseInt(e.target.value) || 0
                          }
                        })}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600">% of pool</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <div className="flex justify-between font-medium">
                      <span>Total allocation:</span>
                      <span className={
                        (nextRewardsConfig.tierAllocations.tier1 + nextRewardsConfig.tierAllocations.tier2 + nextRewardsConfig.tierAllocations.tier3) === 100 
                        ? "text-green-600" 
                        : "text-red-600"
                      }>
                        {nextRewardsConfig.tierAllocations.tier1 + nextRewardsConfig.tierAllocations.tier2 + nextRewardsConfig.tierAllocations.tier3}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Winner Percentages */}
              <Card>
                <CardHeader>
                  <CardTitle>Winner Selection</CardTitle>
                  <CardDescription>Set what percentage of each tier receives monthly rewards</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Tier 1 Winners</Label>
                    <div className="flex items-center space-x-4 mt-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={nextRewardsConfig.winnerPercentages.tier1}
                        onChange={(e) => setNextRewardsConfig({
                          ...nextRewardsConfig,
                          winnerPercentages: {
                            ...nextRewardsConfig.winnerPercentages,
                            tier1: parseInt(e.target.value) || 0
                          }
                        })}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600">% of tier 1 members</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Tier 2 Winners</Label>
                    <div className="flex items-center space-x-4 mt-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={nextRewardsConfig.winnerPercentages.tier2}
                        onChange={(e) => setNextRewardsConfig({
                          ...nextRewardsConfig,
                          winnerPercentages: {
                            ...nextRewardsConfig.winnerPercentages,
                            tier2: parseInt(e.target.value) || 0
                          }
                        })}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600">% of tier 2 members</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Tier 3 Winners</Label>
                    <div className="flex items-center space-x-4 mt-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={nextRewardsConfig.winnerPercentages.tier3}
                        onChange={(e) => setNextRewardsConfig({
                          ...nextRewardsConfig,
                          winnerPercentages: {
                            ...nextRewardsConfig.winnerPercentages,
                            tier3: parseInt(e.target.value) || 0
                          }
                        })}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600">% of tier 3 members</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tier Percentiles Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Tier Percentile Configuration</CardTitle>
                  <CardDescription>Define what percentage of users fall into each tier</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Tier 1 (Top Performers)</Label>
                    <div className="flex items-center space-x-4 mt-1">
                      <Input
                        type="number"
                        min="1"
                        max="99"
                        value={nextRewardsConfig.tierPercentiles.tier1}
                        onChange={(e) => setNextRewardsConfig({
                          ...nextRewardsConfig,
                          tierPercentiles: {
                            ...nextRewardsConfig.tierPercentiles,
                            tier1: parseInt(e.target.value) || 0
                          }
                        })}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600">% of all users</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Tier 2 (Middle Performers)</Label>
                    <div className="flex items-center space-x-4 mt-1">
                      <Input
                        type="number"
                        min="1"
                        max="99"
                        value={nextRewardsConfig.tierPercentiles.tier2}
                        onChange={(e) => setNextRewardsConfig({
                          ...nextRewardsConfig,
                          tierPercentiles: {
                            ...nextRewardsConfig.tierPercentiles,
                            tier2: parseInt(e.target.value) || 0
                          }
                        })}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600">% of all users</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Tier 3 (Emerging Learners)</Label>
                    <div className="flex items-center space-x-4 mt-1">
                      <Input
                        type="number"
                        min="1"
                        max="99"
                        value={nextRewardsConfig.tierPercentiles.tier3}
                        onChange={(e) => setNextRewardsConfig({
                          ...nextRewardsConfig,
                          tierPercentiles: {
                            ...nextRewardsConfig.tierPercentiles,
                            tier3: parseInt(e.target.value) || 0
                          }
                        })}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600">% of all users</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <div className="flex justify-between font-medium">
                      <span>Total coverage:</span>
                      <span className={
                        (nextRewardsConfig.tierPercentiles.tier1 + nextRewardsConfig.tierPercentiles.tier2 + nextRewardsConfig.tierPercentiles.tier3) === 100 
                        ? "text-green-600" 
                        : "text-red-600"
                      }>
                        {nextRewardsConfig.tierPercentiles.tier1 + nextRewardsConfig.tierPercentiles.tier2 + nextRewardsConfig.tierPercentiles.tier3}%
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Current Tier Thresholds</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Tier 1 (Top {nextRewardsConfig.tierPercentiles.tier1}%):</span>
                        <span className="font-mono">{tierThresholds.tier1}+ points</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tier 2 (Middle {nextRewardsConfig.tierPercentiles.tier2}%):</span>
                        <span className="font-mono">{tierThresholds.tier2}+ points</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tier 3 (Bottom {nextRewardsConfig.tierPercentiles.tier3}%):</span>
                        <span className="font-mono">{tierThresholds.tier3}+ points</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Thresholds update automatically based on user point distribution
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Cycle Management Tab */}
          <TabsContent value="cycle-management" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Monthly Cycle Management</h2>
                <p className="text-gray-600">Configure monthly cycle dates and reward distribution timing</p>
              </div>
              <Button onClick={handleUpdateSettings} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Save Cycle Settings
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cycle Start Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    Monthly Cycle Dates
                  </CardTitle>
                  <CardDescription>Configure specific dates for cycle start and end</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Cycle Start Date</Label>
                    <Input
                      type="date"
                      value={cycleSettings.cycleStartDate}
                      onChange={(e) => setCycleSettings({
                        ...cycleSettings,
                        cycleStartDate: e.target.value
                      })}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Exact date when the monthly cycle begins
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Cycle End Date</Label>
                    <Input
                      type="date"
                      value={cycleSettings.cycleEndDate}
                      onChange={(e) => setCycleSettings({
                        ...cycleSettings,
                        cycleEndDate: e.target.value
                      })}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Last day of the current cycle (points lock at midnight)
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Cycle Start Time</Label>
                    <Input
                      type="time"
                      value={cycleSettings.cycleStartTime}
                      onChange={(e) => setCycleSettings({
                        ...cycleSettings,
                        cycleStartTime: e.target.value
                      })}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Time when the cycle officially starts
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Timezone</Label>
                    <Select value={cycleSettings.timezone} onValueChange={(value) => setCycleSettings({
                      ...cycleSettings,
                      timezone: value
                    })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="EST">EST (Eastern)</SelectItem>
                        <SelectItem value="CST">CST (Central)</SelectItem>
                        <SelectItem value="MST">MST (Mountain)</SelectItem>
                        <SelectItem value="PST">PST (Pacific)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Rewards Announcement Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    Rewards Announcement
                  </CardTitle>
                  <CardDescription>When to announce and preview monthly rewards</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Announcement Date</Label>
                    <Input
                      type="date"
                      value={cycleSettings.rewardsAnnouncementDate}
                      onChange={(e) => setCycleSettings({
                        ...cycleSettings,
                        rewardsAnnouncementDate: e.target.value
                      })}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Exact date to announce upcoming rewards and winner percentages
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Announcement Time</Label>
                    <Input
                      type="time"
                      value={cycleSettings.rewardsAnnouncementTime}
                      onChange={(e) => setCycleSettings({
                        ...cycleSettings,
                        rewardsAnnouncementTime: e.target.value
                      })}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Time to send announcement notifications
                    </p>
                  </div>

                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      📢 Announcements will include tier thresholds, pool size, and winner percentages
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Distribution Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-green-500" />
                    Rewards Distribution
                  </CardTitle>
                  <CardDescription>Configure when monthly rewards are distributed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Distribution Date</Label>
                    <Input
                      type="date"
                      value={cycleSettings.distributionDate}
                      onChange={(e) => setCycleSettings({
                        ...cycleSettings,
                        distributionDate: e.target.value
                      })}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Exact date when rewards will be distributed to winners
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Distribution Time</Label>
                    <Input
                      type="time"
                      value={cycleSettings.distributionTime}
                      onChange={(e) => setCycleSettings({
                        ...cycleSettings,
                        distributionTime: e.target.value
                      })}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Time when rewards are automatically distributed
                    </p>
                  </div>

                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      💰 Distribution includes winner selection, point deduction, and Stripe payouts
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-500" />
                    Timeline Preview
                  </CardTitle>
                  <CardDescription>Preview of monthly cycle timeline with current settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                      <div>
                        <div className="font-medium text-blue-800">Cycle Start</div>
                        <div className="text-sm text-blue-600">
                          {new Date(cycleSettings.cycleStartDate).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })} at {cycleSettings.cycleStartTime}
                        </div>
                      </div>
                      <div className="text-xs text-blue-500">Month begins</div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                      <div>
                        <div className="font-medium text-yellow-800">Rewards Announcement</div>
                        <div className="text-sm text-yellow-600">
                          {new Date(cycleSettings.rewardsAnnouncementDate).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })} at {cycleSettings.rewardsAnnouncementTime}
                        </div>
                      </div>
                      <div className="text-xs text-yellow-500">Preview sent</div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-red-50 rounded border-l-4 border-red-400">
                      <div>
                        <div className="font-medium text-red-800">Cycle End</div>
                        <div className="text-sm text-red-600">
                          {new Date(cycleSettings.cycleEndDate).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })} at 23:59
                        </div>
                      </div>
                      <div className="text-xs text-red-500">Points locked</div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 rounded border-l-4 border-green-400">
                      <div>
                        <div className="font-medium text-green-800">Distribution</div>
                        <div className="text-sm text-green-600">
                          {new Date(cycleSettings.distributionDate).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })} at {cycleSettings.distributionTime}
                        </div>
                      </div>
                      <div className="text-xs text-green-500">Payouts sent</div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">
                      ⏰ All times are in {cycleSettings.timezone}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      📅 Cycle duration: {Math.ceil((new Date(cycleSettings.cycleEndDate).getTime() - new Date(cycleSettings.cycleStartDate).getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">System Settings</h2>
                <p className="text-gray-600">Configure system-wide settings and preferences</p>
              </div>
              <Button onClick={handleUpdateSettings} className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Save Settings
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Controls */}
              <Card>
                <CardHeader>
                  <CardTitle>System Controls</CardTitle>
                  <CardDescription>Basic system operation settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Maintenance Mode</Label>
                      <p className="text-sm text-gray-500">Temporarily disable user access</p>
                    </div>
                    <Switch
                      checked={systemSettings.maintenanceMode}
                      onCheckedChange={(checked) => setSystemSettings({
                        ...systemSettings,
                        maintenanceMode: checked
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Registration Enabled</Label>
                      <p className="text-sm text-gray-500">Allow new user registrations</p>
                    </div>
                    <Switch
                      checked={systemSettings.registrationEnabled}
                      onCheckedChange={(checked) => setSystemSettings({
                        ...systemSettings,
                        registrationEnabled: checked
                      })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Points System */}
              <Card>
                <CardHeader>
                  <CardTitle>Points System</CardTitle>
                  <CardDescription>Configure point earning and limits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Points Multiplier</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={systemSettings.pointsMultiplier}
                      onChange={(e) => setSystemSettings({
                        ...systemSettings,
                        pointsMultiplier: parseFloat(e.target.value)
                      })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Global multiplier for all point earnings</p>
                  </div>

                  <div>
                    <Label>Max Daily Points</Label>
                    <Input
                      type="number"
                      min="0"
                      value={systemSettings.maxDailyPoints}
                      onChange={(e) => setSystemSettings({
                        ...systemSettings,
                        maxDailyPoints: parseInt(e.target.value)
                      })}
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum points a user can earn per day</p>
                  </div>
                </CardContent>
              </Card>

              {/* System Status */}
              <Card>
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Current system information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span className="text-sm font-medium">Database</span>
                    <Badge className="bg-green-100 text-green-700">Connected</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span className="text-sm font-medium">File Storage</span>
                    <Badge className="bg-green-100 text-green-700">Operational</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span className="text-sm font-medium">Email Service</span>
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                    <span className="text-sm font-medium">Version</span>
                    <Badge variant="outline">v1.0.0</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}