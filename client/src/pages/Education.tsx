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
    // Load completed lessons from localStorage or API
    const completed = JSON.parse(localStorage.getItem('completedLessons') || '[]');
    setCompletedLessons(completed);
  }, []);

  const modules: Module[] = [
    {
      id: 'budgeting-basics',
      title: 'Budgeting Basics',
      description: 'Learn the fundamentals of creating and managing a budget',
      category: 'Budgeting',
      difficulty: 'Beginner',
      estimatedTime: '15 min',
      pointsReward: 25,
      icon: Calculator,
    },
    {
      id: 'emergency-fund',
      title: 'Emergency Fund',
      description: 'Build a safety net for unexpected expenses',
      category: 'Savings',
      difficulty: 'Beginner',
      estimatedTime: '12 min',
      pointsReward: 30,
      icon: Shield,
    },
    {
      id: 'investment-basics',
      title: 'Investment Basics',
      description: 'Introduction to stocks, bonds, and investment strategies',
      category: 'Investing',
      difficulty: 'Intermediate',
      estimatedTime: '20 min',
      pointsReward: 35,
      icon: TrendingUp,
    },
    {
      id: 'credit-management',
      title: 'Credit Management',
      description: 'Understanding credit scores and debt management',
      category: 'Credit',
      difficulty: 'Beginner',
      estimatedTime: '18 min',
      pointsReward: 30,
      icon: CreditCard,
    },
    {
      id: 'retirement-planning',
      title: 'Retirement Planning',
      description: 'Plan for your financial future with retirement strategies',
      category: 'Planning',
      difficulty: 'Intermediate',
      estimatedTime: '25 min',
      pointsReward: 40,
      icon: Target,
    },
    {
      id: 'tax-optimization',
      title: 'Tax Optimization',
      description: 'Maximize your tax savings and understand deductions',
      category: 'Taxes',
      difficulty: 'Intermediate',
      estimatedTime: '22 min',
      pointsReward: 35,
      icon: PiggyBank,
    },
  ];

  const categories = ['All', 'Budgeting', 'Savings', 'Investing', 'Credit', 'Planning', 'Taxes'];

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
                    {completedLessons.reduce((total, lessonId) => {
                      const lesson = modules.find(m => m.id === lessonId);
                      return total + (lesson?.pointsReward || 0);
                    }, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Points Earned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round((completedLessons.length / modules.length) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Course Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Learning Modules */}
        <Tabs defaultValue="All" className="w-full">
          <TabsList className="grid grid-cols-4 lg:grid-cols-7 mb-6">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category}
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
                                <Clock className="h-4 w-4 text-gray-500" />
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
      </div>
    </div>
  );
}