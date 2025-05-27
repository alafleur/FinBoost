
import React from 'react';
import { Flame, Star } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StreakNotificationProps {
  pointsEarned: number;
  streakBonus: number;
  newStreak: number;
  onClose: () => void;
}

export default function StreakNotification({ pointsEarned, streakBonus, newStreak, onClose }: StreakNotificationProps) {
  const totalPoints = pointsEarned + streakBonus;

  return (
    <Alert className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 mb-4">
      <Star className="h-4 w-4 text-green-600" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <span className="font-medium text-green-800">
            +{totalPoints} XP earned!
          </span>
          {streakBonus > 0 && (
            <div className="flex items-center space-x-1 mt-1">
              <Flame className="h-3 w-3 text-orange-500" />
              <span className="text-sm text-orange-600">
                {newStreak}-day streak bonus: +{streakBonus} XP
              </span>
            </div>
          )}
          {streakBonus === 0 && newStreak > 0 && (
            <div className="flex items-center space-x-1 mt-1">
              <Flame className="h-3 w-3 text-orange-500" />
              <span className="text-sm text-orange-600">
                {newStreak}-day streak active!
              </span>
            </div>
          )}
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg"
        >
          ×
        </button>
      </AlertDescription>
    </Alert>
  );
}
