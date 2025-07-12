import { Star, Shield, Clock } from "lucide-react";

export default function EarlyAccessV2() {
  return (
    <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
      <div className="container mx-auto max-w-4xl text-center">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-4">
            <Star className="h-4 w-4 text-yellow-300" />
            <span className="text-sm font-medium">Limited Time Early Access</span>
          </div>
          
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-6">
            Guaranteed Prize Pools. For Early Access Only.
          </h2>
        </div>
        
        <p className="text-blue-100 text-lg md:text-xl mb-8 max-w-3xl mx-auto leading-relaxed">
          Every reward cycle during Early Access is fully backed by FinBoost. That means real cash prizes guaranteed no matter how many users join. Join early to maximize your chances while the community is still small.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <Shield className="h-8 w-8 text-yellow-300 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Guaranteed Payouts</h3>
            <p className="text-blue-100 text-sm">Prize pools backed by FinBoost during Early Access period</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <Clock className="h-8 w-8 text-yellow-300 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Limited Time</h3>
            <p className="text-blue-100 text-sm">Only available to our first few hundred founding members</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <Star className="h-8 w-8 text-yellow-300 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Better Odds</h3>
            <p className="text-blue-100 text-sm">Smaller community means higher win probability for early members</p>
          </div>
        </div>
        
        <div className="bg-yellow-400 text-gray-900 rounded-lg p-6 max-w-2xl mx-auto">
          <h4 className="font-semibold text-lg mb-2">Early Access Advantage</h4>
          <p className="text-sm">
            Current members compete in smaller groups with guaranteed backing. As we grow, competition increases but total rewards grow too. The best time to start is now.
          </p>
        </div>
      </div>
    </section>
  );
}