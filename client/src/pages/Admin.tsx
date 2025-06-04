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
  Lock,
  Calculator
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

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch all data concurrently
      const [usersRes, modulesRes, poolRes, tierRes] = await Promise.all([
        fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` }}),
        fetch('/api/admin/modules', { headers: { 'Authorization': `Bearer ${token}` }}),
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

  // CRUD Handlers for Modules
  const handleCreateModule = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(moduleForm)
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
      if (!token) return;

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
      if (!token) return;

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

  // CRUD Handlers for Users
  const handleCreateUser = async (userData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
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

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculateProportionalRatios();
  }, [poolData, users, tierThresholds]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage users, content, and system settings</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
            <TabsTrigger value="points">Points</TabsTrigger>
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
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeUsers}</div>
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
                        <Label className="text-sm font-medium">Tier 3</Label>
                        <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                          {tierThresholds.tier3}+ points
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-medium">Tier 2</Label>
                        <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                          {tierThresholds.tier2}+ points
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-medium">Tier 1</Label>
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
                      <Input placeholder="Search users..." className="w-64" />
                      <Button>
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
                        {users.slice(0, 20).map((user: any) => (
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
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Settings className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
                    <Button>
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
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {modules.map((module: any) => (
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
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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

              {/* Point Actions Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Point Actions & Rewards</CardTitle>
                  <CardDescription>Manage available point-earning activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Daily Login</span>
                        <Badge variant="default">5 pts</Badge>
                      </div>
                      <div className="text-xs text-gray-500">Base daily activity reward</div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Module Completion</span>
                        <Badge variant="default">10-50 pts</Badge>
                      </div>
                      <div className="text-xs text-gray-500">Variable by difficulty</div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Quiz Perfect Score</span>
                        <Badge variant="default">15 pts</Badge>
                      </div>
                      <div className="text-xs text-gray-500">100% quiz completion</div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Streak Bonus</span>
                        <Badge variant="secondary">2-10 pts</Badge>
                      </div>
                      <div className="text-xs text-gray-500">Consecutive day multiplier</div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Referral Signup</span>
                        <Badge variant="default">25 pts</Badge>
                      </div>
                      <div className="text-xs text-gray-500">Friend joins platform</div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Community Activity</span>
                        <Badge variant="outline">1-5 pts</Badge>
                      </div>
                      <div className="text-xs text-gray-500">Forum participation</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                    <div className="text-2xl font-bold">23</div>
                    <p className="text-xs text-muted-foreground">
                      Awaiting response
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">8</div>
                    <p className="text-xs text-muted-foreground">
                      +2 from yesterday
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
                    <Clock className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">2.4h</div>
                    <p className="text-xs text-muted-foreground">
                      Response time
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
                    <Star className="h-4 w-4 text-yellow-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">4.8</div>
                    <p className="text-xs text-muted-foreground">
                      Out of 5.0
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
                        {[...Array(8)].map((_, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-sm">
                              #{1000 + index}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                  {users[index]?.username?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <span className="text-sm">{users[index]?.username || 'User'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-sm">
                                  {index % 3 === 0 ? 'Login Issues' : 
                                   index % 3 === 1 ? 'Points Not Updating' : 'Module Content Error'}
                                </div>
                                <div className="text-xs text-gray-500 truncate max-w-xs">
                                  {index % 3 === 0 ? 'Cannot access account after password reset' : 
                                   index % 3 === 1 ? 'Completed lesson but points not added' : 'Video not loading in lesson 5'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                index % 3 === 0 ? 'destructive' :
                                index % 3 === 1 ? 'default' : 'secondary'
                              }>
                                {index % 3 === 0 ? 'High' : index % 3 === 1 ? 'Medium' : 'Low'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                index % 2 === 0 ? 'default' : 'secondary'
                              }>
                                {index % 2 === 0 ? 'Open' : 'In Progress'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {new Date(Date.now() - (index * 2 * 60 * 60 * 1000)).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
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
    </div>
  );
}