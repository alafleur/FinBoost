import { PieChart, Users, DollarSign, Shield } from "lucide-react";

export default function TransparentEconomicsV2() {
  return (
    <section className="py-16 md:py-20 px-4 bg-gray-50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-6 text-gray-800">
            See Exactly How Our Community-Funded Model Works
          </h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - breakdown */}
          <div className="space-y-8">
            <div>
              <h3 className="font-semibold text-xl mb-6 text-gray-800">Your Membership Funds:</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-white rounded-lg p-4 shadow-sm">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <PieChart className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Educational platform and learning tools</p>
                    <p className="text-sm text-gray-600">Lessons, quizzes, progress tracking</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 bg-white rounded-lg p-4 shadow-sm">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Community prize pools for all members</p>
                    <p className="text-sm text-gray-600">Bi-weekly cash rewards</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 bg-white rounded-lg p-4 shadow-sm">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Fully transparent - no hidden fees</p>
                    <p className="text-sm text-gray-600">See exactly where every dollar goes</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
              <h4 className="font-semibold mb-2">Community-Powered Growth</h4>
              <p className="text-blue-100">Your success helps fund others' rewards. Their success helps fund yours.</p>
            </div>
          </div>
          
          {/* Right side - growth examples */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="font-semibold text-xl mb-6 text-gray-800 text-center">As We Grow:</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">100 members</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">$800</p>
                  <p className="text-xs text-gray-500">monthly prize pool</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-600" />
                  <span className="font-medium">500 members</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">$4,000</p>
                  <p className="text-xs text-gray-500">monthly prize pool</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">1,000 members</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-blue-600">$8,000</p>
                  <p className="text-xs text-blue-500">monthly prize pool</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600 font-medium">The more we grow, the bigger everyone's opportunities</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}