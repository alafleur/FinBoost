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

  // Remove duplicate stats declaration
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

  // Pool data state with proper typing
  const [poolData, setPoolData] = useState<{
    totalPool: number;
    tier1Pool: number;
    tier2Pool: number;
    tier3Pool: number;
  } | null>(null);

  // Consolidated states
  const [users, setUsers] = useState([]);
  const [modules, setModules] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalModules: 0,
    totalCompletions: 0,
    avgCompletionRate: 0
  });

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch all data concurrently
      const [statsRes, usersRes, modulesRes, poolRes, tierRes] = await Promise.all([
        fetch('/api/admin/analytics', { headers: { 'Authorization': `Bearer ${token}` }}),
        fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` }}),
        fetch('/api/admin/modules', { headers: { 'Authorization': `Bearer ${token}` }}),
        fetch('/api/pool/monthly'),
        fetch('/api/tiers/thresholds')
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.analytics);
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users);
      }

      if (modulesRes.ok) {
        const data = await modulesRes.json();
        setModules(data.modules);
      }

      if (poolRes.ok) {
        const data = await poolRes.json();
        setPoolData(data.pool);
      }

      if (tierRes.ok) {
        const data = await tierRes.json();
        setTierThresholds(data.thresholds);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    Total Users: {users.length}
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {users.slice(0, 10).map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content">
            <Card>
              <CardHeader>
                <CardTitle>Content Management</CardTitle>
                <CardDescription>Manage learning modules and content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    Total Modules: {modules.length}
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {modules.slice(0, 5).map((module: any) => (
                      <div key={module.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{module.title}</div>
                          <div className="text-sm text-gray-500">{module.category}</div>
                        </div>
                        <Badge variant={module.isActive ? "default" : "secondary"}>
                          {module.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
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

              {/* Next Month Configuration (Editable) */}
              <Card>
                <CardHeader>
                  <CardTitle>Next Month Configuration</CardTitle>
                  <CardDescription>
                    Configure settings for {new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Pool Settings</h4>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="poolPercentage">Pool Percentage</Label>
                          <Input
                            id="poolPercentage"
                            type="number"
                            min="0"
                            max="100"
                            value={nextRewardsConfig.poolPercentage}
                            onChange={(e) => setNextRewardsConfig(prev => ({
                              ...prev,
                              poolPercentage: parseInt(e.target.value) || 0
                            }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Tier Allocations</h4>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="tier3Allocation">Tier 3 (%)</Label>
                          <Input
                            id="tier3Allocation"
                            type="number"
                            min="0"
                            max="100"
                            value={nextRewardsConfig.tierAllocations.tier3}
                            onChange={(e) => setNextRewardsConfig(prev => ({
                              ...prev,
                              tierAllocations: {
                                ...prev.tierAllocations,
                                tier3: parseInt(e.target.value) || 0
                              }
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="tier2Allocation">Tier 2 (%)</Label>
                          <Input
                            id="tier2Allocation"
                            type="number"
                            min="0"
                            max="100"
                            value={nextRewardsConfig.tierAllocations.tier2}
                            onChange={(e) => setNextRewardsConfig(prev => ({
                              ...prev,
                              tierAllocations: {
                                ...prev.tierAllocations,
                                tier2: parseInt(e.target.value) || 0
                              }
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="tier1Allocation">Tier 1 (%)</Label>
                          <Input
                            id="tier1Allocation"
                            type="number"
                            min="0"
                            max="100"
                            value={nextRewardsConfig.tierAllocations.tier1}
                            onChange={(e) => setNextRewardsConfig(prev => ({
                              ...prev,
                              tierAllocations: {
                                ...prev.tierAllocations,
                                tier1: parseInt(e.target.value) || 0
                              }
                            }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Winner Percentages</h4>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="tier3Winners">Tier 3 Winners (%)</Label>
                          <Input
                            id="tier3Winners"
                            type="number"
                            min="0"
                            max="100"
                            value={nextRewardsConfig.winnerPercentages.tier3}
                            onChange={(e) => setNextRewardsConfig(prev => ({
                              ...prev,
                              winnerPercentages: {
                                ...prev.winnerPercentages,
                                tier3: parseInt(e.target.value) || 0
                              }
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="tier2Winners">Tier 2 Winners (%)</Label>
                          <Input
                            id="tier2Winners"
                            type="number"
                            min="0"
                            max="100"
                            value={nextRewardsConfig.winnerPercentages.tier2}
                            onChange={(e) => setNextRewardsConfig(prev => ({
                              ...prev,
                              winnerPercentages: {
                                ...prev.winnerPercentages,
                                tier2: parseInt(e.target.value) || 0
                              }
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="tier1Winners">Tier 1 Winners (%)</Label>
                          <Input
                            id="tier1Winners"
                            type="number"
                            min="0"
                            max="100"
                            value={nextRewardsConfig.winnerPercentages.tier1}
                            onChange={(e) => setNextRewardsConfig(prev => ({
                              ...prev,
                              winnerPercentages: {
                                ...prev.winnerPercentages,
                                tier1: parseInt(e.target.value) || 0
                              }
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-2">
                    <Button onClick={() => console.log('Save next month config')}>
                      Save Configuration
                    </Button>
                    <Button variant="outline" onClick={() => console.log('Reset to defaults')}>
                      Reset to Defaults
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Point Deduction Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Point Deduction Management</CardTitle>
                  <CardDescription>Manage point deductions with rationale tracking</CardDescription>
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
                        <h4 className="font-medium">Recent Deductions</h4>
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
            </div>
          </TabsContent>

          <TabsContent value="points">
            <div className="space-y-6">
              {/* Points Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle>Points Analytics</CardTitle>
                  <CardDescription>Overview of point distribution and activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-800">Total Points Awarded</div>
                      <div className="text-2xl font-bold text-blue-900">
                        {users.reduce((sum: number, user: any) => sum + (user.points || 0), 0)}
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-sm font-medium text-green-800">Average Points</div>
                      <div className="text-2xl font-bold text-green-900">
                        {users.length > 0 ? Math.round(users.reduce((sum: number, user: any) => sum + (user.points || 0), 0) / users.length) : 0}
                      </div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="text-sm font-medium text-orange-800">Tier 3 Users</div>
                      <div className="text-2xl font-bold text-orange-900">
                        {users.filter((user: any) => (user.points || 0) >= tierThresholds.tier3).length}
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-sm font-medium text-purple-800">Active Today</div>
                      <div className="text-2xl font-bold text-purple-900">
                        {users.filter((user: any) => user.lastActive && new Date(user.lastActive).toDateString() === new Date().toDateString()).length}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bulk Points Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Points Management</CardTitle>
                  <CardDescription>Award or deduct points for multiple users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Award Points</h4>
                      <div className="space-y-4">
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
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label>Target Users</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select criteria" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Users</SelectItem>
                              <SelectItem value="tier1">Tier 1 Users</SelectItem>
                              <SelectItem value="tier2">Tier 2 Users</SelectItem>
                              <SelectItem value="tier3">Tier 3 Users</SelectItem>
                              <SelectItem value="active">Active Today</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button className="w-full">
                          <Trophy className="w-4 h-4 mr-2" />
                          Award Points
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Point History</h4>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        <div className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <div className="text-sm font-medium">Weekly Challenge Bonus</div>
                            <Badge variant="secondary">+50 pts</Badge>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Awarded to 25 users • 3 days ago</div>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <div className="text-sm font-medium">Module Completion</div>
                            <Badge variant="secondary">+20 pts</Badge>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">Awarded to 45 users • 5 days ago</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="support">
            <div className="space-y-6">
              {/* Support Tickets */}
              <Card>
                <CardHeader>
                  <CardTitle>Support Requests</CardTitle>
                  <CardDescription>Manage user support tickets and inquiries</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <Badge variant="destructive">3 Open</Badge>
                        <Badge variant="outline">12 In Progress</Badge>
                        <Badge variant="secondary">45 Resolved</Badge>
                      </div>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Ticket
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">Payment Issue</div>
                            <div className="text-sm text-gray-500">User: john.doe@email.com</div>
                            <div className="text-xs text-gray-400 mt-1">Opened 2 hours ago</div>
                          </div>
                          <Badge variant="destructive">High Priority</Badge>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          Unable to process monthly subscription payment. Getting error code 402.
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline">View</Button>
                          <Button size="sm">Respond</Button>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">Points Not Awarded</div>
                            <div className="text-sm text-gray-500">User: sarah.wilson@email.com</div>
                            <div className="text-xs text-gray-400 mt-1">Opened 5 hours ago</div>
                          </div>
                          <Badge variant="outline">Medium</Badge>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          Completed lesson "Budgeting Basics" but didn't receive points.
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline">View</Button>
                          <Button size="sm">Respond</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>Monitor system performance and errors</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div className="text-sm font-medium text-green-800">Server Status</div>
                      </div>
                      <div className="text-lg font-bold text-green-900 mt-1">Operational</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <div className="text-sm font-medium text-blue-800">Response Time</div>
                      </div>
                      <div className="text-lg font-bold text-blue-900 mt-1">245ms</div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                        <div className="text-sm font-medium text-orange-800">Error Rate</div>
                      </div>
                      <div className="text-lg font-bold text-orange-900 mt-1">0.02%</div>
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
    </div>
  );
}