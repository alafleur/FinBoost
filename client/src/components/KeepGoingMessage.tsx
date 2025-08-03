import { BookOpen, TrendingUp, DollarSign } from "lucide-react";
import { useLocation } from "wouter";

interface KeepGoingMessageProps {
  onTabChange: (tab: string) => void;
}

export default function KeepGoingMessage({ onTabChange }: KeepGoingMessageProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-600"></div>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Keep Going, You're Doing Amazing!</h3>
          <p className="text-sm text-gray-600 mb-4">
            Every module you complete brings you closer to your next reward. Your financial education journey is paying off - literally!
          </p>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => setLocation('/education')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm"
            >
              <BookOpen className="w-4 h-4" />
              Keep Learning
            </button>
            <button 
              onClick={() => onTabChange('leaderboard')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm"
            >
              <TrendingUp className="w-4 h-4" />
              Climb Higher
            </button>
            <button 
              onClick={() => setLocation('/subscribe')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm"
            >
              <DollarSign className="w-4 h-4" />
              Earn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}