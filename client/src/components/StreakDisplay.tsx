
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, Target, Trophy } from 'lucide-react';

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  className?: string;
}

export default function StreakDisplay({ currentStreak, longestStreak, className }: StreakDisplayProps) {
  const getStreakMessage = (streak: number) => {
    if (streak === 0) return "Start your learning streak today!";
    if (streak === 1) return "Great start! Keep going tomorrow.";
    if (streak < 5) return `${streak}-day streak! You're building momentum.`;
    if (streak < 7) return `${streak}-day streak! You're on fire!`;
    return `${streak}-day streak! Incredible dedication!`;
  };

  const getStreakBonus = (streak: number) => {
    if (streak < 2) return 0;
    if (streak >= 2 && streak <= 4) return 5;
    if (streak >= 5 && streak <= 6) return 10;
    return 15;
  };

  return (
    <Card className={`dashboard-card-primary border dashboard-border-primary ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Flame className={`h-6 w-6 ${currentStreak > 0 ? 'text-accent' : 'text-gray-400'}`} />
              <span className="text-2xl font-bold text-accent">{currentStreak}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {getStreakMessage(currentStreak)}
              </p>
              {currentStreak > 0 && (
                <p className="text-xs text-accent">
                  +{getStreakBonus(currentStreak)} XP bonus per lesson/quiz
                </p>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Trophy className="h-4 w-4" />
              <span>Best: {longestStreak}</span>
            </div>
          </div>
        </div>
        
        {currentStreak === 0 && (
          <div className="mt-3 p-2 bg-accent-light/20 rounded-lg">
            <p className="text-xs text-accent text-center">
              Complete a lesson or quiz to start your streak and earn bonus XP!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
