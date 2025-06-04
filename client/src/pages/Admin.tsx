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