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
  Target
} from 'lucide-react';
import { educationContent } from '../data/educationContent';

interface Module {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: string;
  pointsReward: number;
  icon: any;
  completed?: boolean;
}

export default function Education() {
  const [, setLocation] = useLocation();
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  useEffect(() => {
    // Fetch from API first to ensure sync
    fetchCompletedLessons();

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

  const fetchCompletedLessons = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/progress', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();

        // Map numeric module IDs back to lesson string IDs
        const moduleToLessonMap: { [key: number]: string } = {
          1: 'budgeting-basics',
          2: 'emergency-fund', 
          3: 'investment-basics',
          4: 'credit-management',
          5: 'retirement-planning',
          6: 'tax-optimization',
          7: 'credit-basics',
          8: 'understanding-credit-scores',
          9: 'debt-snowball-vs-avalanche',
          10: 'smart-expense-cutting',
          11: 'zero-based-budgeting',
          12: 'envelope-budgeting',
          13: 'high-yield-savings',
          14: 'cd-laddering',
          15: 'sinking-funds',
          16: 'roth-vs-traditional-ira',
          17: 'index-fund-investing',
          18: 'asset-allocation',
          19: 'dollar-cost-averaging',
          20: 'options-trading-basics',
          21: 'smart-goal-setting',
          22: 'estate-planning-basics',
          23: 'insurance-essentials',
          24: 'managing-student-loans',
          25: 'charitable-giving-strategies',
          26: 'home-buying-process',
          27: 'retirement-income-planning',

          // Add missing lesson IDs that appear in educationContent
          28: 'emergency-fund-detailed',
          29: 'budgeting-basics-detailed',
          30: 'investment-basics-detailed',
          31: 'credit-management-detailed',
          32: 'retirement-planning-detailed',
          33: 'tax-optimization-detailed'
        };

        const completedIds = result.progress
          .filter((p: any) => p.completed)
          .map((p: any) => moduleToLessonMap[p.moduleId] || p.moduleId.toString());

        console.log('Fetched completed lesson IDs:', completedIds); // Debug log
        console.log('Raw progress data:', result.progress); // Debug log

        setCompletedLessons(completedIds);
        localStorage.setItem('completedLessons', JSON.stringify(completedIds));
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

  // Convert educationContent to modules format - ensure all lessons are included
  const modules: Module[] = Object.values(educationContent).map(lesson => {
    const description = lesson.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return {
      id: lesson.id,
      title: lesson.title,
      description: description.length > 120 ? description.substring(0, 120) + '...' : description,
      category: lesson.category,
      difficulty: lesson.difficulty,
      estimatedTime: lesson.estimatedTime,
      pointsReward: lesson.points,
      icon: getCategoryIcon(lesson.category),
      completed: completedLessons.includes(lesson.id)
    };
  });

  console.log('Total modules loaded:', modules.length); // Debug log

  // Get all unique categories from educationContent
  const allCategories = [...new Set(Object.values(educationContent).map(lesson => lesson.category))];
  const categories = ['All', ...allCategories.sort()];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIconComponent = (IconComponent: any) => {
    return <IconComponent className="h-5 w-5 text-gray-600" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
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
                Complete lessons to earn points and build your financial knowledge
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">
                    {completedLessons.length}
                  </div>
                  <div className="text-sm text-gray-600">Lessons Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {(() => {
                      const userData = JSON.parse(localStorage.getItem('user') || '{}');
                      return userData.totalPoints || 0;
                    })()}
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
            </CardContent>
          </Card>
        </div>

        {/* Debug Info */}
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Debug:</strong> Found {modules.length} total lessons across {allCategories.length} categories: {allCategories.join(', ')}
          </p>
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
                    const isCompleted = completedLessons.includes(module.id);
                    const Icon = module.icon;

                    return (
                      <Card 
                        key={module.id} 
                        className={`hover:shadow-lg transition-shadow cursor-pointer ${
                          isCompleted ? 'border-green-200 bg-green-50' : ''
                        }`}
                        onClick={() => setLocation(`/lesson/${module.id}`)}
                      >
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
                                
                                <span className="text-sm text-gray-600">{module.estimatedTime}</span>
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
                          <Button 
                            className="w-full" 
                            variant={isCompleted ? "outline" : "default"}
                            disabled={false}
                          >
                            {isCompleted ? "✓ Completed" : "Start Lesson"}
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