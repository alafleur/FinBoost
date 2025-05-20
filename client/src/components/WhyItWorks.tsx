import { Plus, TrendingUp, DollarSign, RefreshCw } from "lucide-react";
import FlywheelGraphic from "./FlywheelGraphic";

interface Feature {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
}

export default function WhyItWorks() {
  const features: Feature[] = [
    {
      id: 1,
      title: "More members means a larger monthly rewards pool",
      description: "The more members who join, the larger the rewards for everyone.",
      icon: <Plus className="h-5 w-5" />,
      bgColor: "bg-green-100",
      iconColor: "text-secondary-500",
    },
    {
      id: 2,
      title: "Merit-based rewards system for everyone",
      description: "The top 50% of members by points are guaranteed monthly cash rewards.",
      icon: <TrendingUp className="h-5 w-5" />,
      bgColor: "bg-blue-100",
      iconColor: "text-primary-500",
    },
    {
      id: 3,
      title: "Cash rewards reinforce better habits",
      description: "Real financial incentives help you stay committed to your money goals.",
      icon: <DollarSign className="h-5 w-5" />,
      bgColor: "bg-amber-100",
      iconColor: "text-accent-500",
    },
  ];

  return (
    <section className="py-20 px-4 bg-gray-50" id="why-it-works">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-heading font-bold text-3xl md:text-4xl mb-6">It's a Flywheel That Lifts Everyone</h2>
            <p className="text-gray-600 mb-8">Our platform creates a positive feedback loop where everyone benefits from collective growth.</p>
            
            <div className="space-y-6">
              {features.map((feature) => (
                <div key={feature.id} className="flex items-start">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full ${feature.bgColor} flex items-center justify-center`}>
                    <span className={feature.iconColor}>{feature.icon}</span>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-heading font-medium text-lg">{feature.title}</h3>
                    <p className="text-gray-600 mt-1">{feature.description}</p>
                  </div>
                </div>
              ))}

              {/* Virtuous cycle feature with special styling */}
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
          </div>
          
          <div className="bg-white rounded-xl shadow-xl p-6 md:p-8">
            <h3 className="font-heading font-semibold text-xl mb-6 text-center">The Financial Growth Flywheel</h3>
            
            {/* Flywheel Graphic */}
            <FlywheelGraphic />
            
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">Learn → Earn → Reward → Improve → Repeat</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-primary-600">$19.99</div>
                <div className="text-sm text-gray-600">Monthly Fee</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-primary-600">50%</div>
                <div className="text-sm text-gray-600">To Rewards Pool</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-primary-600">Merit</div>
                <div className="text-sm text-gray-600">Based System</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
