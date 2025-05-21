import { Plus, RefreshCw, TrendingUp, DollarSign } from "lucide-react";

export default function FlywheelFeatures() {
  return (
    <div className="space-y-6">
      <div className="flex items-start">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <span className="text-secondary-500"><Plus className="h-5 w-5" /></span>
        </div>
        <div className="ml-4">
          <h3 className="font-heading font-medium text-lg">More members means a larger monthly rewards pool</h3>
          <p className="text-gray-600 mt-1">The more members who join, the larger the rewards for everyone.</p>
        </div>
      </div>
      
      <div className="flex items-start">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-primary-500"><TrendingUp className="h-5 w-5" /></span>
        </div>
        <div className="ml-4">
          <h3 className="font-heading font-medium text-lg">Merit-based rewards system for everyone</h3>
          <p className="text-gray-600 mt-1">The top 50% of members by points are guaranteed monthly cash rewards.</p>
        </div>
      </div>
      
      <div className="flex items-start">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
          <span className="text-accent-500"><DollarSign className="h-5 w-5" /></span>
        </div>
        <div className="ml-4">
          <h3 className="font-heading font-medium text-lg">Cash rewards reinforce better habits</h3>
          <p className="text-gray-600 mt-1">Real financial incentives help you stay committed to your money goals.</p>
        </div>
      </div>
      
      <div className="flex items-start">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
          <span className="text-purple-500"><RefreshCw className="h-5 w-5" /></span>
        </div>
        <div className="ml-4">
          <h3 className="font-heading font-medium text-lg">Virtuous cycle of financial growth</h3>
          <p className="text-gray-600 mt-1">Our flywheel model creates a continuous cycle of improvement.</p>
        </div>
      </div>
    </div>
  );
}