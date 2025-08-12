import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, BookOpen, Award, Users, ArrowRight } from 'lucide-react';
import type { GettingStartedCardProps } from './types';

/**
 * Getting Started Progress Card
 * Shows onboarding task completion status with actionable CTAs
 */
export default function GettingStartedCard({ 
  progress, 
  onTaskComplete 
}: GettingStartedCardProps) {
  
  const tasks = [
    {
      key: 'firstLesson' as const,
      title: 'Complete Your First Lesson',
      description: 'Start with "Budgeting Basics" - 5 min read',
      icon: BookOpen,
      completed: progress.firstLesson,
      cta: 'Start Learning',
      points: '25 points'
    },
    {
      key: 'viewedRewards' as const,
      title: 'Explore Rewards System',
      description: 'See how you can earn monthly cash prizes',
      icon: Award,
      completed: progress.viewedRewards,
      cta: 'View Rewards',
      points: '10 points'
    },
    {
      key: 'referralAdded' as const,
      title: 'Invite a Friend (Optional)',
      description: 'Both earn bonus points when they join',
      icon: Users,
      completed: progress.referralAdded,
      cta: 'Share Link',
      points: '50 points'
    }
  ];

  const completedCount = tasks.filter(task => task.completed).length;
  const progressPercentage = Math.round((completedCount / tasks.length) * 100);

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            Getting Started
          </CardTitle>
          
          <Badge 
            variant="secondary" 
            className={`px-3 py-1 font-medium ${
              completedCount === tasks.length 
                ? 'bg-green-100 text-green-800 border-green-200' 
                : 'bg-blue-100 text-blue-800 border-blue-200'
            }`}
          >
            {completedCount}/{tasks.length} Complete
          </Badge>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Your Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {tasks.map((task) => {
          const Icon = task.icon;
          
          return (
            <div 
              key={task.key}
              className={`flex items-start gap-4 p-4 rounded-lg border transition-all duration-200 ${
                task.completed 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {task.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className={`font-medium ${
                      task.completed ? 'text-green-900' : 'text-gray-900'
                    }`}>
                      {task.title}
                    </h4>
                    <p className={`text-sm mt-1 ${
                      task.completed ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      {task.description}
                    </p>
                    
                    {/* Points Badge */}
                    <Badge 
                      variant="outline" 
                      className={`mt-2 text-xs ${
                        task.completed 
                          ? 'border-green-300 text-green-700 bg-green-50' 
                          : 'border-blue-300 text-blue-700 bg-blue-50'
                      }`}
                    >
                      <Icon className="h-3 w-3 mr-1" />
                      {task.points}
                    </Badge>
                  </div>

                  {/* Action Button */}
                  {!task.completed && (
                    <Button
                      size="sm"
                      onClick={() => onTaskComplete?.(task.key)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-3 py-1.5 text-xs font-medium shadow-sm"
                    >
                      {task.cta}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Completion Message */}
        {completedCount === tasks.length && (
          <div className="mt-6 p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white text-center">
            <CheckCircle2 className="h-6 w-6 mx-auto mb-2" />
            <h4 className="font-semibold">Onboarding Complete!</h4>
            <p className="text-sm text-green-100 mt-1">
              You're all set to start earning rewards. Happy learning!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}