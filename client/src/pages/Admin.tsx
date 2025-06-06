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
import { educationContent } from "@/data/educationContent";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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
  Calculator
} from 'lucide-react';

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
  createdAt: string;
  resolvedAt?: string;
}

export default function Admin() {
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

  // State for custom category
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  // State for quiz questions
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: ''
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

  const fetchData = async () => {
    try {

      // Fetch all data concurrently
      const [usersRes, modulesRes, poolRes, tierRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/modules'),
        fetch('/api/pool/monthly'),
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
        setPoolData(data.pool);
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
      const response = await fetch(`/api/admin/modules/${moduleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
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
      const response = await fetch(`/api/admin/modules/${moduleId}`, {
        method: 'DELETE'
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
      const response = await fetch(`/api/admin/modules/${moduleId}/publish`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isPublished })
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh modules data to ensure we have the latest state
        const modulesRes = await fetch('/api/admin/modules');
        if (modulesRes.ok) {
          const data = await modulesRes.json();
          setModules(data.modules || []);
        }
        toast({
          title: "Success",
          description: `Module ${isPublished ? 'published' : 'unpublished'} successfully`
        });
      } else {
        throw new Error('Failed to update module publish status');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update module publish status",
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
          description: "Points awarded successfully"
        });
      } else {
        throw new Error('Failed to award points');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to award points",
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
          description: "Points deducted successfully"
        });
      } else {
        throw new Error('Failed to deduct points');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to deduct points",
        variant: "destructive"
      });
    }
  };

  // Calculate Proportional Point Deduction Ratios
  const calculateProportionalRatios = () => {
    if (!poolData || !users.length) return;

    const tiers = {
      tier1: users.filter((user: any) => (user.points || 0) < tierThresholds.tier2),
      tier2: users.filter((user: any) => (user.points || 0) >= tierThresholds.tier2 && (user.points || 0) < tierThresholds.tier3),
      tier3: users.filter((user: any) => (user.points || 0) >= tierThresholds.tier3)
    };

    const ratios = {
      tier1: 0,
      tier2: 0,
      tier3: 0
    };

    // Calculate ratio for each tier: average_reward_amount / average_points
    Object.keys(tiers).forEach((tierKey) => {
      const tierUsers = tiers[tierKey as keyof typeof tiers];
      const tierPool = poolData[`${tierKey}Pool` as keyof typeof poolData] || 0;
      
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

    // Set up automatic tier threshold refresh every 10 minutes to improve performance
    const tierThresholdInterval = setInterval(() => {
      fetchData(); // This includes tier threshold fetching
    }, 600000);

    return () => {
      clearInterval(tierThresholdInterval);
    };
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
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="points">Points</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="proofs">Proof Review</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.filter((u: any) => u.isActive).length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Total Pool</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${poolData?.totalPool ?? 0}</div>
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
                    <div className="text-2xl font-bold">{users.length}</div>
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
                    <div className="text-2xl font-bold">{users.filter((u: any) => u.isActive).length}</div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((users.filter((u: any) => u.isActive).length / users.length) * 100)}% active rate
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Tier 3 Users</CardTitle>
                    <Trophy className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {users.filter((u: any) => u.tier === 'tier3').length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Top performers
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
                      {Math.round(users.reduce((sum: number, u: any) => sum + (u.totalPoints || 0), 0) / (users.length || 1))}
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
                        {users
                          .filter((user: any) => 
                            user.username?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                            user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
                          )
                          .slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage)
                          .map((user: any) => (
                            <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              <div>
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
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
                          user.username?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                          user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
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
                            user.username?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                            user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
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
                            user.username?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                            user.email?.toLowerCase().includes(userSearchTerm.toLowerCase())
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
                        const count = users.filter((u: any) => u.tier === tier).length;
                        const percentage = Math.round((count / users.length) * 100);
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
                      {users.slice(0, 5).map((user: any) => (
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

          <TabsContent value="rewards">
            <div className="space-y-6">
              {/* Current Month Configuration (Locked) */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Current Month Configuration
                      </CardTitle>
                      <CardDescription>
                        Locked settings for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Locked</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Pool Allocation</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Pool:</span>
                          <span className="font-mono">${poolData?.totalPool || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Pool Percentage:</span>
                          <span className="font-mono">{currentRewardsConfig.poolPercentage}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium">Tier Distribution</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Tier 3:</span>
                          <span className="font-mono">{currentRewardsConfig.tierAllocations.tier3}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Tier 2:</span>
                          <span className="font-mono">{currentRewardsConfig.tierAllocations.tier2}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Tier 1:</span>
                          <span className="font-mono">{currentRewardsConfig.tierAllocations.tier1}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Winner Percentages</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Tier 3:</span>
                          <span className="font-mono">{currentRewardsConfig.winnerPercentages.tier3}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Tier 2:</span>
                          <span className="font-mono">{currentRewardsConfig.winnerPercentages.tier2}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Tier 1:</span>
                          <span className="font-mono">{currentRewardsConfig.winnerPercentages.tier1}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="text-sm font-medium text-orange-800">Tier 3 Pool</div>
                      <div className="text-2xl font-bold text-orange-900">
                        ${poolData?.tier3Pool || 0}
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-800">Tier 2 Pool</div>
                      <div className="text-2xl font-bold text-blue-900">
                        ${poolData?.tier2Pool || 0}
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-sm font-medium text-green-800">Tier 1 Pool</div>
                      <div className="text-2xl font-bold text-green-900">
                        ${poolData?.tier1Pool || 0}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Proportional Point Deduction System */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Proportional Point Deduction System
                  </CardTitle>
                  <CardDescription>
                    Automatic fair point deduction based on tier-specific reward ratios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">System Formula</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <div>1. Tier Ratio = Average Reward Amount ÷ Average Points</div>
                        <div>2. Points Deducted = Winner Reward Amount × Tier Ratio</div>
                        <div className="mt-2 font-medium">This ensures fair deductions proportional to the reward received</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm font-medium text-orange-800">Tier 3 Ratio</div>
                        <div className="text-2xl font-bold text-orange-900">
                          {tierRatios.tier3.toFixed(4)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          ${poolData?.tier3Pool || 0} pool ÷ avg points
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm font-medium text-blue-800">Tier 2 Ratio</div>
                        <div className="text-2xl font-bold text-blue-900">
                          {tierRatios.tier2.toFixed(4)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          ${poolData?.tier2Pool || 0} pool ÷ avg points
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm font-medium text-green-800">Tier 1 Ratio</div>
                        <div className="text-2xl font-bold text-green-900">
                          {tierRatios.tier1.toFixed(4)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          ${poolData?.tier1Pool || 0} pool ÷ avg points
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-3">Example Calculations</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-orange-800">Tier 3 Example</div>
                          <div>$100 reward × {tierRatios.tier3.toFixed(4)} = {calculateProportionalDeduction(100, 'tier3')} points</div>
                        </div>
                        <div>
                          <div className="font-medium text-blue-800">Tier 2 Example</div>
                          <div>$50 reward × {tierRatios.tier2.toFixed(4)} = {calculateProportionalDeduction(50, 'tier2')} points</div>
                        </div>
                        <div>
                          <div className="font-medium text-green-800">Tier 1 Example</div>
                          <div>$25 reward × {tierRatios.tier1.toFixed(4)} = {calculateProportionalDeduction(25, 'tier1')} points</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Manual Point Deduction (Separate from Proportional System) */}
              <Card>
                <CardHeader>
                  <CardTitle>Manual Point Deduction</CardTitle>
                  <CardDescription>Administrative point deductions with rationale tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-medium">Deduct Points</h4>
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
                                    {user.username} ({user.points} points)
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
                            Deduct Points
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Recent Manual Deductions</h4>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          <div className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-sm">Sample User</div>
                                <div className="text-xs text-gray-500">50 points deducted</div>
                              </div>
                              <div className="text-xs text-gray-400">2 hours ago</div>
                            </div>
                            <div className="mt-2 text-xs text-gray-600">
                              Violation of community guidelines - inappropriate content posted
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Next Month Configuration (Editable) */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Next Month Configuration
                      </CardTitle>
                      <CardDescription>
                        Configure settings for {new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </CardDescription>
                    </div>
                    <Badge variant="default">Editable</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Pool Settings</h4>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="nextPoolPercentage">Pool Percentage</Label>
                          <Input
                            id="nextPoolPercentage"
                            type="number"
                            min="1"
                            max="100"
                            defaultValue={55}
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">% of total revenue for rewards</p>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor="nextTier3">Tier 3 %</Label>
                            <Input
                              id="nextTier3"
                              type="number"
                              min="1"
                              max="100"
                              defaultValue={50}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="nextTier2">Tier 2 %</Label>
                            <Input
                              id="nextTier2"
                              type="number"
                              min="1"
                              max="100"
                              defaultValue={30}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="nextTier1">Tier 1 %</Label>
                            <Input
                              id="nextTier1"
                              type="number"
                              min="1"
                              max="100"
                              defaultValue={20}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Winner Selection</h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor="nextWinnerTier3">Tier 3 Winners %</Label>
                            <Input
                              id="nextWinnerTier3"
                              type="number"
                              min="1"
                              max="100"
                              defaultValue={10}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="nextWinnerTier2">Tier 2 Winners %</Label>
                            <Input
                              id="nextWinnerTier2"
                              type="number"
                              min="1"
                              max="100"
                              defaultValue={15}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="nextWinnerTier1">Tier 1 Winners %</Label>
                            <Input
                              id="nextWinnerTier1"
                              type="number"
                              min="1"
                              max="100"
                              defaultValue={20}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="deductionMethod">Point Deduction Method</Label>
                          <Select defaultValue="proportional">
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="proportional">Proportional (Recommended)</SelectItem>
                              <SelectItem value="fixed">Fixed Percentage</SelectItem>
                              <SelectItem value="none">No Deduction</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <Button variant="outline">Reset to Default</Button>
                    <Button>
                      <Save className="w-4 h-4 mr-2" />
                      Save Configuration
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Winner Selection & Distribution System */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5" />
                    Monthly Winner Selection
                  </CardTitle>
                  <CardDescription>
                    Select winners and distribute monthly rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {['tier3', 'tier2', 'tier1'].map((tier) => {
                        const tierUsers = users.filter((u: any) => u.tier === tier);
                        const tierName = tier.replace('tier', 'Tier ');
                        const tierPool = poolData?.[`${tier}Pool` as keyof typeof poolData] || 0;
                        
                        return (
                          <div key={tier} className="space-y-4">
                            <div className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{tierName}</h4>
                                <Badge variant={tier === 'tier3' ? 'default' : tier === 'tier2' ? 'secondary' : 'outline'}>
                                  {tierUsers.length} users
                                </Badge>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Pool Amount:</span>
                                  <span className="font-mono">${tierPool}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Winners (10%):</span>
                                  <span className="font-mono">{Math.ceil(tierUsers.length * 0.1)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Per Winner:</span>
                                  <span className="font-mono">
                                    ${tierUsers.length > 0 ? Math.floor(tierPool / Math.ceil(tierUsers.length * 0.1)) : 0}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="mt-4">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="w-full"
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  Select Winners
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Distribution Process</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <div>1. Winners selected based on highest points within each tier</div>
                        <div>2. Proportional point deduction applied to winners automatically</div>
                        <div>3. Rewards distributed via Stripe to user payment methods</div>
                        <div>4. Non-winners keep all points and roll over to next month</div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <Button variant="outline">Preview Distribution</Button>
                      <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                        Execute Monthly Distribution
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Distribution History */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribution History</CardTitle>
                  <CardDescription>Previous monthly reward distributions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead>Total Pool</TableHead>
                          <TableHead>Winners</TableHead>
                          <TableHead>Avg Reward</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...Array(6)].map((_, index) => {
                          const date = new Date();
                          date.setMonth(date.getMonth() - index - 1);
                          return (
                            <TableRow key={index}>
                              <TableCell className="font-medium">
                                {date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                              </TableCell>
                              <TableCell>${(2240 - index * 100).toLocaleString()}</TableCell>
                              <TableCell>{28 - index}</TableCell>
                              <TableCell>${Math.floor((2240 - index * 100) / (28 - index))}</TableCell>
                              <TableCell>
                                <Badge variant="default">Distributed</Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(date.getTime() + 32 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="sm">
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Upload className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
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
                    <CardTitle className="text-sm font-medium">This Month</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {users.reduce((sum: number, u: any) => sum + (u.currentMonthPoints || 0), 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Current month activity
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
                    <Target className="h-4 w-4 text-purple-500" />
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
                        const tierUsers = users.filter((u: any) => u.tier === tier);
                        const totalPoints = tierUsers.reduce((sum: number, u: any) => sum + (u.totalPoints || 0), 0);
                        const avgPoints = tierUsers.length > 0 ? Math.round(totalPoints / tierUsers.length) : 0;
                        const allPoints = users.reduce((sum: number, u: any) => sum + (u.totalPoints || 0), 0);
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
                              <div className="text-xs text-gray-500">{user.currentMonthPoints || 0} this month</div>
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
                    <CardDescription>Grant bonus points to users</CardDescription>
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
                      {pointActions.map((action) => (
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                {proof.proofUrl && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => window.open(proof.proofUrl, '_blank')}
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View Proof
                                  </Button>
                                )}
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
                    <HelpCircle className="h-4 w-4 text-purple-500" />
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
                                  <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xs font-medium">
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
                                  <div className="font-medium text-sm capitalize">{ticket.category}</div>
                                  <div className="text-xs text-gray-500 truncate max-w-xs">
                                    {ticket.message.substring(0, 50)}...
                                  </div>
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
                                  ticket.status === 'open' ? 'destructive' :
                                  ticket.status === 'in-progress' ? 'default' : 'outline'
                                }>
                                  {ticket.status === 'open' ? 'Open' : 
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
                                  {ticket.status === 'open' && (
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
                            title: "Points Added",
                            description: `${pointsToAdd} points have been awarded to ${selectedUser.username}`
                          });
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to add points",
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
                            title: "Points Deducted",
                            description: `${pointsToDeduct} points have been deducted from ${selectedUser.username}`
                          });
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to deduct points",
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
    </div>
  );
}