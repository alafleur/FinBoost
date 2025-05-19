import { Plus, TrendingUp, DollarSign, Users } from "lucide-react";

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
      description: "As our community grows, so does the potential reward for each member.",
      icon: <Plus className="h-5 w-5" />,
      bgColor: "bg-green-100",
      iconColor: "text-secondary-500",
    },
    {
      id: 2,
      title: "Smarter financial actions increase your odds",
      description: "Knowledge and consistent action improve your chances of winning.",
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
    {
      id: 4,
      title: "Everyone has a real shot at progress",
      description: "Our reward system is designed to be inclusive and merit-based.",
      icon: <Users className="h-5 w-5" />,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-500",
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
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-xl p-6 md:p-8">
            <h3 className="font-heading font-semibold text-xl mb-6 text-center">How Rewards Scale With Members</h3>
            <div className="h-64 md:h-80 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-primary-100 text-primary-600 mb-4 animate-pulse">
                    <DollarSign className="h-16 w-16" />
                  </div>
                  <div className="text-2xl font-bold gradient-text">$125,000+</div>
                  <div className="text-gray-500">Potential Monthly Reward Pool</div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-primary-600">$5</div>
                <div className="text-sm text-gray-600">Monthly Fee</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-primary-600">25,000+</div>
                <div className="text-sm text-gray-600">Members</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-xl font-bold text-primary-600">100%</div>
                <div className="text-sm text-gray-600">Collective Reward</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
