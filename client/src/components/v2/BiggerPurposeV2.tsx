import { Heart, Users, TrendingUp, Shield } from "lucide-react";

export default function BiggerPurposeV2() {
  return (
    <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto max-w-4xl text-center">
        <h2 className="font-heading font-bold text-3xl md:text-4xl mb-6 text-gray-800">
          We're Here to Help Break the Cycle of Financial Stress
        </h2>
        
        <p className="text-gray-600 text-lg md:text-xl mb-12 max-w-3xl mx-auto leading-relaxed">
          Student loans, consumer debt, retirement fears - too many people feel stuck. FinBoost exists to reward your journey toward real financial freedom. Every lesson completed, every step forward, you're building a stronger future. And we'll reward you for it.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <Heart className="h-8 w-8 text-red-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">Real Impact</h3>
            <p className="text-sm text-gray-600">Every step forward improves your actual financial situation</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <Users className="h-8 w-8 text-blue-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">Community Support</h3>
            <p className="text-sm text-gray-600">You're not alone in this journey - we're all growing together</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">Rewarded Progress</h3>
            <p className="text-sm text-gray-600">Get recognized and rewarded for every positive financial move</p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <Shield className="h-8 w-8 text-purple-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">Built for Trust</h3>
            <p className="text-sm text-gray-600">Transparent, fair, and designed to help you succeed</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-lg p-8 text-white">
          <h3 className="font-semibold text-xl mb-4">Our Mission</h3>
          <p className="text-blue-100 leading-relaxed max-w-2xl mx-auto">
            Financial stress affects millions, but individual solutions aren't enough. We're building a community where your progress matters, where learning pays off, and where taking control of your money comes with real rewards along the way.
          </p>
        </div>
      </div>
    </section>
  );
}