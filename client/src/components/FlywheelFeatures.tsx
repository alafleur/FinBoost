import { Plus, RefreshCw, TrendingUp, DollarSign } from "lucide-react";

export default function FlywheelFeatures() {
  return (
    <div className="space-y-6">
      <div className="flex items-start">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent-light/20 flex items-center justify-center">
          <span className="text-accent"><Plus className="h-5 w-5" /></span>
        </div>
        <div className="ml-4">
          <h3 className="font-heading font-medium text-lg">More members means a larger rewards pool</h3>
          <p className="text-gray-600 mt-1">The more members who join, the larger the rewards for everyone.</p>
        </div>
      </div>
      
      <div className="flex items-start">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent-light/20 flex items-center justify-center">
          <span className="text-accent"><TrendingUp className="h-5 w-5" /></span>
        </div>
        <div className="ml-4">
          <h3 className="font-heading font-medium text-lg">Merit-based rewards system for everyone</h3>
          <p className="text-gray-600 mt-1">The top 50% of members by tickets are guaranteed cash rewards each cycle.</p>
        </div>
      </div>
      
      <div className="flex items-start">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent-light/20 flex items-center justify-center">
          <span className="text-accent"><DollarSign className="h-5 w-5" /></span>
        </div>
        <div className="ml-4">
          <h3 className="font-heading font-medium text-lg">Cash rewards reinforce better habits</h3>
          <p className="text-gray-600 mt-1">Real financial incentives help you stay committed to your money goals.</p>
        </div>
      </div>
      
      <div className="flex items-start">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent-light/20 flex items-center justify-center">
          <span className="text-accent"><RefreshCw className="h-5 w-5" /></span>
        </div>
        <div className="ml-4">
          <h3 className="font-heading font-medium text-lg">Virtuous cycle of financial growth</h3>
          <p className="text-gray-600 mt-1">Our flywheel model creates a continuous cycle of improvement.</p>
        </div>
      </div>
    </div>
  );
}