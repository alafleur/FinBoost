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
  X
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
    isActive: true
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
      if (parsedUser.email !== 'admin@finboost.com') {
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
      // Load users data
      await loadUsersData();
      await loadAnalyticsData();
      await loadSystemSettings();
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }

    // Sample data - replace with API calls
    const sampleModules: LearningModule[] = [
      {
        id: 1,
        title: "Creating Your First Budget That Actually Works",
        description: "Learn the simple 50/30/20 rule and how to track expenses without feeling overwhelmed.",
        content: "<h2>Budget Basics</h2><p>A budget is your financial roadmap...</p>",
        pointsReward: 15,
        category: "budgeting",
        difficulty: "beginner",
        estimatedMinutes: 5,
        isActive: true,
        order: 1,
        createdAt: new Date().toISOString(),
        completions: 234,
        avgRating: 4.7
      },
      {
        id: 2,
        title: "Understanding Your Credit Score",
        description: "Discover what affects your credit score and simple steps to improve it quickly.",
        content: "<h2>Credit Score Fundamentals</h2><p>Your credit score is a three-digit number...</p>",
        pointsReward: 20,
        category: "credit",
        difficulty: "beginner",
        estimatedMinutes: 7,
        isActive: true,
        order: 2,
        createdAt: new Date().toISOString(),
        completions: 189,
        avgRating: 4.5
      }
    ];

    setModules(sampleModules);
    setStats({
      totalModules: sampleModules.length,
      totalCompletions: sampleModules.reduce((sum, m) => sum + (m.completions || 0), 0),
      totalUsers: 347,
      avgCompletionRate: 68.5
    });
  };

  const handleSaveModule = async () => {
    try {
      if (isEditingModule && selectedModule) {
        // Update existing module
        const updatedModules = modules.map(m => 
          m.id === selectedModule.id 
            ? { ...selectedModule, ...moduleForm, id: selectedModule.id }
            : m
        );
        setModules(updatedModules);
        toast({
          title: "Module Updated",
          description: "Learning module has been successfully updated."
        });
      } else {
        // Create new module
        const newModule: LearningModule = {
          ...moduleForm,
          id: Math.max(...modules.map(m => m.id)) + 1,
          createdAt: new Date().toISOString(),
          order: modules.length + 1,
          completions: 0,
          avgRating: 0
        };
        setModules([...modules, newModule]);
        toast({
          title: "Module Created",
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
        isActive: true
      });
      setIsEditingModule(false);
      setSelectedModule(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save module. Please try again.",
        variant: "destructive"
      });
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
      isActive: module.isActive
    });
    setIsEditingModule(true);
  };

  const handleDeleteModule = async (moduleId: number) => {
    try {
      setModules(modules.filter(m => m.id !== moduleId));
      toast({
        title: "Module Deleted",
        description: "Learning module has been successfully deleted."
      });
    } catch (error) {
      toast({
        title: "Error",
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
        body: JSON.stringify({ settings: systemSettings })
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
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Admin Access
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="quiz">Quiz Builder</TabsTrigger>
            <TabsTrigger value="proofs">Proof Review</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
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
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={moduleForm.title}
                          onChange={(e) => setModuleForm({...moduleForm, title: e.target.value})}
                          placeholder="e.g., Budget Basics for Beginners"
                        />
                      </div>
                      <div>
                        <Label htmlFor="points">Points Reward</Label>
                        <Input
                          id="points"
                          type="number"
                          value={moduleForm.pointsReward}
                          onChange={(e) => setModuleForm({...moduleForm, pointsReward: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={moduleForm.description}
                        onChange={(e) => setModuleForm({...moduleForm, description: e.target.value})}
                        placeholder="Brief description of what users will learn..."
                        rows={2}
                      />
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
                      <Label htmlFor="content">Lesson Content (HTML)</Label>
                      <Textarea
                        id="content"
                        value={moduleForm.content}
                        onChange={(e) => setModuleForm({...moduleForm, content: e.target.value})}
                        placeholder="<h2>Lesson Title</h2><p>Lesson content here...</p>"
                        rows={8}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use HTML tags for formatting. Supported: h2, h3, p, ul, ol, li, strong, em
                      </p>
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
                          isActive: true
                        });
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveModule} className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        {isEditingModule ? 'Update Module' : 'Create Module'}
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
                  <Label htmlFor="quiz-question">Question</Label>
                  <Textarea
                    id="quiz-question"
                    value={newQuestion.question}
                    onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                    placeholder="Enter your quiz question here..."
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Answer Options</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {newQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...newQuestion.options];
                            newOptions[index] = e.target.value;
                            setNewQuestion({...newQuestion, options: newOptions});
                          }}
                          placeholder={`Option ${index + 1}`}
                        />
                        <Button
                          variant={newQuestion.correctAnswer === index ? "default" : "outline"}
                          size="sm"
                          onClick={() => setNewQuestion({...newQuestion, correctAnswer: index})}
                        >
                          {newQuestion.correctAnswer === index ? '✓' : index + 1}
                        </Button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Click the number button to mark the correct answer</p>
                </div>

                <div>
                  <Label htmlFor="explanation">Explanation</Label>
                  <Textarea
                    id="explanation"
                    value={newQuestion.explanation}
                    onChange={(e) => setNewQuestion({...newQuestion, explanation: e.target.value})}
                    placeholder="Explain why this is the correct answer..."
                    rows={2}
                  />
                </div>

                <Button onClick={handleAddQuizQuestion} className="flex items-center gap-2">
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
                  <CardDescription>Set point thresholds for user tiers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Bronze Tier</Label>
                    <Input
                      type="number"
                      value={systemSettings.tierRequirements.bronze}
                      onChange={(e) => setSystemSettings({
                        ...systemSettings,
                        tierRequirements: {
                          ...systemSettings.tierRequirements,
                          bronze: parseInt(e.target.value)
                        }
                      })}
                    />
                  </div>

                  <div>
                    <Label>Silver Tier</Label>
                    <Input
                      type="number"
                      value={systemSettings.tierRequirements.silver}
                      onChange={(e) => setSystemSettings({
                        ...systemSettings,
                        tierRequirements: {
                          ...systemSettings.tierRequirements,
                          silver: parseInt(e.target.value)
                        }
                      })}
                    />
                  </div>

                  <div>
                    <Label>Gold Tier</Label>
                    <Input
                      type="number"
                      value={systemSettings.tierRequirements.gold}
                      onChange={(e) => setSystemSettings({
                        ...systemSettings,
                        tierRequirements: {
                          ...systemSettings.tierRequirements,
                          gold: parseInt(e.target.value)
                        }
                      })}
                    />
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