import { TrendingDown, CreditCard, PiggyBank } from "lucide-react";

export default function SharedStruggleV2() {
  return (
    <section className="py-16 md:py-20 px-4 bg-gray-50">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="font-heading font-bold text-3xl md:text-4xl mb-6 text-gray-800">
          Money Stress is Real. But You're Not Powerless.
        </h2>
        
        <p className="text-gray-600 text-lg md:text-xl mb-12 max-w-3xl mx-auto leading-relaxed">
          Rising costs. Debt that feels endless. Worries about saving or being ready for retirement. You're not alone. Small, smart steps taken consistently can change the game. FinBoost rewards you for every move you make.
        </p>
        
        {/* Visual representation of common struggles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Rising Costs</h3>
            <p className="text-gray-600 text-sm">Everything costs more while paychecks stay the same</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Endless Debt</h3>
            <p className="text-gray-600 text-sm">Student loans, credit cards, and monthly payments that never end</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PiggyBank className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Retirement Fears</h3>
            <p className="text-gray-600 text-sm">Wondering if you'll ever save enough for the future</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
          <p className="text-lg font-medium">
            What if every step forward earned you real rewards while building real financial skills?
          </p>
        </div>
      </div>
    </section>
  );
}