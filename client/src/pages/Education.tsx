import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Clock, 
  Star, 
  CheckCircle,
  DollarSign,
  ArrowLeft,
  TrendingUp,
  Shield,
  PiggyBank,
  CreditCard,
  Calculator,
  Target,
  Crown
} from 'lucide-react';
import { educationContent } from '../data/educationContent';
import { canAccessModule, type UserForAccess } from "@shared/userAccess";

interface Module {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  pointsReward: number;
  icon: any;
  completed?: boolean;
  accessType: 'free' | 'premium';
}

export default function Education() {
  const [, setLocation] = useLocation();
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [availablePoints, setAvailablePoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [publishedModules, setPublishedModules] = useState<any[]>([]);
  const [user, setUser] = useState<UserForAccess | null>(null);

  useEffect(() => {
    // Fetch from API first to ensure sync
    fetchUserData();
    fetchCompletedLessons();
    fetchPublishedModules();

    // Listen for storage changes to refresh when lessons are completed
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'completedLessons') {
        fetchCompletedLessons();
      }
    };

    // Refresh when page becomes visible (user returns from lesson)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchCompletedLessons();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setUser(null);
    }
  };

  const fetchPublishedModules = async () => {
    try {
      const response = await fetch('/api/modules');
      if (response.ok) {
        const data = await response.json();
        setPublishedModules(data.modules);
      }
    } catch (error) {
      console.error('Error fetching published modules:', error);
    }
  };

  const fetchCompletedLessons = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setCompletedLessons([]);
        return;
      }

      // Fetch user progress
      const progressResponse = await fetch('/api/user/progress', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        setUserProgress(progressData.progress);
        setCompletedCount(progressData.completedCount || 0);

        // Get completed module IDs directly from progress
        const completedModuleIds = progressData.progress
          .filter((p: any) => p.completed)
          .map((p: any) => p.moduleId.toString()); // Ensure IDs are strings

        setCompletedLessons(completedModuleIds);
        localStorage.setItem('completedLessons', JSON.stringify(completedModuleIds));
      } else if (progressResponse.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setCompletedLessons([]);
      }
    } catch (error) {
      console.error('Error fetching completed lessons:', error);
      // Fallback to localStorage if API fails
      const storedCompleted = localStorage.getItem('completedLessons');
      if (storedCompleted) {
        setCompletedLessons(JSON.parse(storedCompleted));
      }
    }
  };

  // Get icon for category
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'budgeting': return Calculator;
      case 'savings': case 'saving': return PiggyBank;
      case 'investing': return TrendingUp;
      case 'credit': return CreditCard;
      case 'planning': return Target;
      case 'taxes': return Calculator;
      case 'debt': return CreditCard;
      case 'insurance': return Shield;
      default: return BookOpen;
    }
  };

  // Convert published modules to the required format
  const modules: Module[] = publishedModules.map(module => {
    const description = module.description || '';
    const moduleIdStr = module.id.toString();
    const isCompleted = completedLessons.includes(moduleIdStr);
    
    return {
      id: module.id,
      title: module.title,
      description: description.length > 120 ? description.substring(0, 120) + '...' : description,
      category: module.category,
      difficulty: 'Beginner' as const,
      estimatedMinutes: module.estimatedMinutes || 15,
      pointsReward: module.pointsReward,
      icon: getCategoryIcon(module.category),
      completed: isCompleted,
      accessType: module.accessType || 'free'
    };
  });



  // Get all unique categories from published modules
  const allCategories = [...new Set(publishedModules.map(module => module.category))];
  const categories = ['All', ...allCategories.sort()];



  const getIconComponent = (IconComponent: any) => {
    return <IconComponent className="h-5 w-5 text-gray-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            {localStorage.getItem('token') && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  setLocation('/');
                }}
                className="flex items-center gap-2"
              >
                Logout
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-primary-600" />
            <h1 className="text-3xl font-bold">Financial Education</h1>
          </div>
          <p className="text-gray-600">
            Master essential financial skills through interactive lessons and earn points for your progress.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Progress Overview */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
              <CardDescription>
                {localStorage.getItem('token') 
                  ? "Complete lessons to earn points and build your financial knowledge"
                  : "Log in to track your progress and earn points for completing lessons"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!localStorage.getItem('token') ? (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <p className="text-gray-600 mb-4">Log in to see your progress and completed lessons</p>
                    <Button onClick={() => setLocation('/login')} className="mr-2">
                      Log In
                    </Button>
                    <Button variant="outline" onClick={() => setLocation('/signup')}>
                      Sign Up
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {completedCount}
                    </div>
                    <div className="text-sm text-gray-600">Lessons Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {userProgress.reduce((total, progress) => {
                        return total + (progress.completed ? progress.pointsEarned || 0 : 0);
                      }, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Points Earned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {modules.length > 0 ? Math.round((completedLessons.length / modules.length) * 100) : 0}%
                    </div>
                    <div className="text-sm text-gray-600">Course Progress ({completedLessons.length}/{modules.length})</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>



        {/* Learning Modules */}
        <Tabs defaultValue="All" className="w-full">
          <TabsList className="grid grid-cols-4 lg:grid-cols-7 mb-6 overflow-x-auto">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="whitespace-nowrap">
                {category} ({category === 'All' ? modules.length : modules.filter(m => m.category === category).length})
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules
                  .filter((module) => category === 'All' || module.category === category)
                  .map((module) => {
                    const isCompleted = completedLessons.includes(module.id.toString());
                    const isPremiumModule = module.accessType === 'premium';
                    // Map module to the expected type for canAccessModule
                    const moduleForAccess = {
                      id: module.id,
                      title: module.title,
                      accessType: module.accessType,
                      isPublished: true, // Since these are from published modules
                      content: '', // Not needed for access checking
                      description: module.description,
                      quiz: null,
                      pointsReward: module.pointsReward,
                      category: module.category,
                      difficulty: module.difficulty,
                      estimatedMinutes: module.estimatedMinutes,
                      order: 0,
                      isActive: true,
                      publishedAt: new Date(),
                      createdAt: new Date()
                    };
                    const canAccess = user ? canAccessModule(user, moduleForAccess) : false;
                    const Icon = module.icon;

                    return (
                      <Card 
                        key={module.id} 
                        className={`hover:shadow-lg transition-shadow cursor-pointer relative ${
                          isCompleted ? 'border-green-200 bg-green-50' : 
                          isPremiumModule ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50 shadow-xl border-2' : ''
                        }`}
                        onClick={() => {
                          console.log(`Card clicked - navigating to lesson ${module.id}`);
                          setLocation(`/lesson/${module.id}`);
                        }}
                      >
                        {isPremiumModule && (
                          <div className="absolute top-3 left-3">
                            <Crown className="w-5 h-5 text-yellow-600" />
                          </div>
                        )}
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                isCompleted ? 'bg-green-100' : 'bg-gray-100'
                              }`}>
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
                            <div className="flex flex-col gap-2">
                              {isPremiumModule && (
                                <Badge variant="secondary" className="bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 text-xs font-semibold border border-yellow-300">
                                  Members
                                </Badge>
                              )}
                              {isCompleted && (
                                <Badge className="bg-green-100 text-green-700">
                                  Completed
                                </Badge>
                              )}
                            </div>
                          </div>
                          <CardDescription className="mt-2">
                            {module.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm text-gray-600">{module.pointsReward} pts</span>
                              </div>
                            </div>

                          </div>
                          <Button 
                            className={`w-full ${(isPremiumModule && !canAccess) ? 'border-yellow-400 text-yellow-700 hover:bg-yellow-50' : ''}`}
                            variant={isCompleted ? "outline" : (isPremiumModule && !canAccess) ? "outline" : "default"}
                            disabled={false}
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log(`Navigating to lesson ${module.id}`);
                              setLocation(`/lesson/${module.id}`);
                            }}
                          >
                            {isCompleted ? "Review" : (isPremiumModule && !canAccess) ? "Upgrade to Access" : "Start Lesson"}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}