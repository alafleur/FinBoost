
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
  TrendingUp
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
  const [stats, setStats] = useState<AdminStats>({
    totalModules: 0,
    totalCompletions: 0,
    totalUsers: 0,
    avgCompletionRate: 0
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="quiz">Quiz Builder</TabsTrigger>
            <TabsTrigger value="proofs">Proof Review</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <Card>
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                  <CardDescription>Completion rates by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categories.map((category) => {
                      const categoryModules = modules.filter(m => m.category === category.value);
                      const totalCompletions = categoryModules.reduce((sum, m) => sum + (m.completions || 0), 0);
                      const avgCompletions = categoryModules.length > 0 ? totalCompletions / categoryModules.length : 0;
                      
                      return (
                        <div key={category.value}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{category.label}</span>
                            <span>{Math.round(avgCompletions)} avg</span>
                          </div>
                          <Progress value={Math.min((avgCompletions / 200) * 100, 100)} className="h-2" />
                        </div>
                      );
                    })}
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
