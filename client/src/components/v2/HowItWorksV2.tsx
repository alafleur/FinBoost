import { BookOpen, DollarSign, TrendingUp, Trophy } from "lucide-react";

export default function HowItWorksV2() {
  return (
    <section className="py-16 md:py-20 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-6 text-gray-800">
            Learn. Take Action. Earn Points. Win Cash.
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Step 1: Learn */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-xl mb-3 text-gray-800">Learn</h3>
            <p className="text-gray-600 mb-4">
              Quick, actionable lessons on money, debt, savings, and investing. Earn points by completing each module.
            </p>
            {/* Screenshot placeholder */}
            <div className="bg-gray-50 rounded-lg p-4 aspect-square flex items-center justify-center">
              <div className="text-center">
                <BookOpen className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Lesson Interface</p>
              </div>
            </div>
          </div>
          
          {/* Step 2: Take Real-World Action */}
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-xl mb-3 text-gray-800">Take Real-World Action</h3>
            <p className="text-gray-600 mb-4">
              Prove real progress with debt payments, savings deposits, budgets. Verified actions earn bonus points.
            </p>
            {/* Screenshot placeholder */}
            <div className="bg-gray-50 rounded-lg p-4 aspect-square flex items-center justify-center">
              <div className="text-center">
                <DollarSign className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Proof Upload</p>
              </div>
            </div>
          </div>
          
          {/* Step 3: Make Predictions */}
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-xl mb-3 text-gray-800">Make Predictions <span className="text-sm text-gray-500">(Optional)</span></h3>
            <p className="text-gray-600 mb-4">
              Share your take on market or economy outcomes. Closer guesses earn more bonus points.
            </p>
            {/* Screenshot placeholder */}
            <div className="bg-gray-50 rounded-lg p-4 aspect-square flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Prediction Questions</p>
              </div>
            </div>
          </div>
          
          {/* Step 4: Win Rewards */}
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-xl mb-3 text-gray-800">Win Rewards</h3>
            <p className="text-gray-600 mb-4">
              Points boost your odds in bi-weekly reward draws. Point-weighted selection means better performance equals better odds.
            </p>
            {/* Screenshot placeholder */}
            <div className="bg-gray-50 rounded-lg p-4 aspect-square flex items-center justify-center">
              <div className="text-center">
                <Trophy className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Reward Results</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Flow visualization */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center">
            <span className="bg-white rounded-full px-4 py-2 font-medium text-gray-700">Complete Actions</span>
            <span className="text-gray-400 hidden md:block">→</span>
            <span className="bg-white rounded-full px-4 py-2 font-medium text-gray-700">Earn Points</span>
            <span className="text-gray-400 hidden md:block">→</span>
            <span className="bg-white rounded-full px-4 py-2 font-medium text-gray-700">Better Odds</span>
            <span className="text-gray-400 hidden md:block">→</span>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full px-4 py-2 font-medium">Win Cash</span>
          </div>
        </div>
      </div>
    </section>
  );
}