import { BookOpen, Target, DollarSign, Trophy } from "lucide-react";

export default function HowItWorksV2() {
  return (
    <section className="py-16 md:py-20 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-6 text-gray-800">
            How FinBoost Works: Learn, Act, Earn
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-gray-800">1. Learn</h3>
            <p className="text-gray-600 text-sm">Complete interactive lessons on budgeting, saving, investing, and debt management</p>
          </div>
          
          {/* Step 2 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-gray-800">2. Take Action</h3>
            <p className="text-gray-600 text-sm">Apply what you learned with real financial actions and upload proof to earn points</p>
          </div>
          
          {/* Step 3 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-gray-800">3. Earn Points</h3>
            <p className="text-gray-600 text-sm">Build your tier status with points from lessons, quizzes, and verified financial actions</p>
          </div>
          
          {/* Step 4 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-gray-800">4. Win Rewards</h3>
            <p className="text-gray-600 text-sm">Get selected for cash rewards every two weeks based on your engagement and progress</p>
          </div>
        </div>
        
        {/* Screenshot placeholder for app interface */}
        <div className="bg-gray-50 rounded-lg p-8">
          <div className="text-center mb-6">
            <h3 className="font-semibold text-lg text-gray-800">See It In Action</h3>
            <p className="text-sm text-gray-600">Your learning progress and rewards dashboard</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 max-w-4xl mx-auto aspect-video flex items-center justify-center">
            <div className="text-center">
              <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">App Screenshot: Learning Dashboard</p>
              <p className="text-sm text-gray-500 mt-1">Lessons, progress tracking, and point system</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}