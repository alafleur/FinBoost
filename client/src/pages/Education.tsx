import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useLocation } from 'wouter';
import { educationContent, getCategories, getLessonsByCategory } from '../data/educationContent';
import { 
  BookOpen, 
  Clock, 
  Star, 
  Trophy,
  Target,
  CheckCircle,
  Play,
  Award,
  TrendingUp,
  DollarSign,
  CreditCard,
  PiggyBank,
  Calculator
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  totalPoints: number;
  currentMonthPoints: number;
  tier: string;
}

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
}

interface UserProgress {
  id: number;
  userId: number;
  moduleId: number;
  completed: boolean;
  pointsEarned: number;
  completedAt?: string;
  createdAt: string;
}

export default function Education() {
  const [user, setUser] = useState<User | null>(null);
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState('overview');
  const [, setLocation] = useLocation();

  const categories = getCategories();
  const allLessons = Object.values(educationContent);
  const { toast } = useToast();

  // Sample data - this will be replaced with API calls later
  const sampleModules: LearningModule[] = [
    {
      id: 1,
      title: "Creating Your First Budget That Actually Works",
      description: "Learn the simple 50/30/20 rule and how to track expenses without feeling overwhelmed.",
      content: "",
      pointsReward: 15,
      category: "budgeting",
      difficulty: "beginner",
      estimatedMinutes: 5,
      isActive: true,
      order: 1,
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      title: "Understanding Your Credit Score",
      description: "Discover what affects your credit score and simple steps to improve it quickly.",
      content: "",
      pointsReward: 20,
      category: "credit",
      difficulty: "beginner",
      estimatedMinutes: 7,
      isActive: true,
      order: 2,
      createdAt: new Date().toISOString()
    },
    {
      id: 3,
      title: "Debt Avalanche vs. Debt Snowball",
      description: "Compare the two most popular debt payoff strategies and choose what works for you.",
      content: "",
      pointsReward: 25,
      category: "debt",
      difficulty: "beginner",
      estimatedMinutes: 6,
      isActive: true,
      order: 3,
      createdAt: new Date().toISOString()
    },
    {
      id: 4,
      title: "Emergency Fund Basics",
      description: "How much you really need and the fastest way to build your safety net.",
      content: "",
      pointsReward: 20,
      category: "saving",
      difficulty: "beginner",
      estimatedMinutes: 5,
      isActive: true,
      order: 4,
      createdAt: new Date().toISOString()
    },
    {
      id: 5,
      title: "Investing 101: Getting Started with $100",
      description: "Your first steps into investing, even if you're starting small.",
      content: "",
      pointsReward: 30,
      category: "investing",
      difficulty: "intermediate",
      estimatedMinutes: 10,
      isActive: true,
      order: 5,
      createdAt: new Date().toISOString()
    },
    {
      id: 6,
      title: "Student Loan Repayment Strategies",
      description: "Navigate repayment options, forgiveness programs, and optimization tactics.",
      content: "",
      pointsReward: 25,
      category: "debt",
      difficulty: "intermediate",
      estimatedMinutes: 8,
      isActive: true,
      order: 6,
      createdAt: new Date().toISOString()
    }
  ];

  const sampleProgress: UserProgress[] = [
    {
      id: 1,
      userId: 1,
      moduleId: 1,
      completed: true,
      pointsEarned: 15,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      userId: 1,
      moduleId: 2,
      completed: true,
      pointsEarned: 20,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
  ];

  

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      setLocation('/auth');
      return;
    }

    try {
      setUser(JSON.parse(userData));
      // Load sample data - replace with API calls later
      setModules(sampleModules);
      setUserProgress(sampleProgress);
      setLoading(false);
    } catch (error) {
      console.error('Error loading education data:', error);
      setLocation('/auth');
    }
  }, [setLocation]);

  const getModuleProgress = (moduleId: number) => {
    return userProgress.find(p => p.moduleId === moduleId);
  };

  const getCompletedModulesCount = () => {
    return userProgress.filter(p => p.completed).length;
  };

  const getTotalPointsEarned = () => {
    return userProgress.reduce((total, p) => total + p.pointsEarned, 0);
  };

  const getFilteredModules = () => {
    if (selectedCategory === "all") return modules;
    return modules.filter(m => m.category === selectedCategory);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(c => c.id === category);
    if (!categoryData) return BookOpen;
    return categoryData.icon;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your education hub...</p>
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
                <BookOpen className="h-8 w-8 text-primary-600" />
                <h1 className="font-heading font-bold text-2xl text-dark-800">Financial Education Hub</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Points</p>
                <p className="font-semibold">{user?.totalPoints || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lessons Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getCompletedModulesCount()}</div>
              <p className="text-xs text-muted-foreground">
                of {modules.length} available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points Earned</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{getTotalPointsEarned()}</div>
              <p className="text-xs text-muted-foreground">
                from education
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <Trophy className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round((getCompletedModulesCount() / modules.length) * 100)}%</div>
              <Progress value={(getCompletedModulesCount() / modules.length) * 100} className="h-2 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Invested</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userProgress.reduce((total, p) => {
                  const module = modules.find(m => m.id === p.moduleId);
                  return total + (module?.estimatedMinutes || 0);
                }, 0)} min
              </div>
              <p className="text-xs text-muted-foreground">
                learning time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-7">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <TabsTrigger key={category.id} value={category.id} className="flex items-center space-x-1">
                  <Icon className={`h-4 w-4 ${category.color}`} />
                  <span className="hidden sm:inline">{category.name}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredModules().map((module) => {
                  const progress = getModuleProgress(module.id);
                  const isCompleted = progress?.completed || false;
                  const Icon = getCategoryIcon(module.category);

                  return (
                    <Card 
                      key={module.id} 
                      className={`hover:shadow-lg transition-shadow cursor-pointer ${isCompleted ? 'border-green-200 bg-green-50' : ''}`}
                      onClick={() => setLocation(`/lesson/${module.id}`)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCompleted ? 'bg-green-100' : 'bg-gray-100'}`}>
                              {isCompleted ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <Icon className="h-5 w-5 text-gray-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-lg leading-tight">{module.title}</CardTitle>
                            </div>
                          </div>
                          {isCompleted && (
                            <Badge className="bg-green-100 text-green-700">
                              Completed
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-2">
                          {module.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">{module.estimatedMinutes} min</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm text-gray-600">{module.pointsReward} pts</span>
                            </div>
                          </div>
                          <Badge className={getDifficultyColor(module.difficulty)}>
                            {module.difficulty}
                          </Badge>
                        </div>
                        <Button className="w-full" variant={isCompleted ? "outline" : "default"}>
                          {isCompleted ? "Review Lesson" : "Start Lesson"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Next Steps */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Continue Your Learning Journey</span>
            </CardTitle>
            <CardDescription>
              Keep building your financial knowledge to earn more points and improve your tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Complete More Lessons</h4>
                  <p className="text-sm text-gray-600">Each lesson earns you 10-30 points</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Take Action</h4>
                  <p className="text-sm text-gray-600">Submit proof of actions for bonus points</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}