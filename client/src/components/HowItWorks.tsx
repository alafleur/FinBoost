import { CheckCircle, BarChart3, Trophy } from "lucide-react";

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function HowItWorks() {
  const steps: Step[] = [
    {
      id: 1,
      title: "1. Earn Points",
      description: "Complete short tutorials, quizzes, refer friends, or take action like uploading proof of debt repayment. The more you participate, the more points you earn.",
      icon: <CheckCircle className="h-6 w-6" />,
    },
    {
      id: 2,
      title: "2. Enter Monthly Tiers",
      description: "Every month, members are ranked into 3 tiers based on their point totals. Each tier earns a share of the reward pool — top tier gets the most.",
      icon: <BarChart3 className="h-6 w-6" />,
    },
    {
      id: 3,
      title: "3. Win Rewards — Randomly & Fairly",
      description: "Half of each tier is selected at random to receive cash rewards. Your points help you qualify — and the more points, the better your tier and payout odds.",
      icon: <Trophy className="h-6 w-6" />,
    },
  ];

  return (
    <section className="py-20 px-4 bg-white" id="how-it-works">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">🧭 How It Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Our platform makes financial education rewarding through a simple three-step process</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div 
              key={step.id} 
              className="step-card bg-white rounded-xl shadow-md p-6 border border-gray-100 transition-all duration-300"
            >
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-primary-100 text-primary-600 mb-6">
                {step.icon}
              </div>
              <h3 className="font-heading font-semibold text-xl mb-3">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-12 bg-gray-50 rounded-xl p-6 border border-gray-100 shadow-sm max-w-3xl mx-auto">
          <p className="text-center text-lg font-medium flex items-center justify-center gap-2 mb-4">
            <span className="text-accent-500">💰</span> Example Reward Distribution
          </p>
          <p className="text-gray-600 mb-6 text-center">
            If the reward pool is $100,000, the top third shares $50,000, the middle third shares $35,000, and the bottom third shares $15,000.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-primary-50 p-4 rounded-lg text-center">
              <p className="font-semibold text-lg">Top Tier</p>
              <p className="text-primary-600 font-bold text-xl">$50,000</p>
              <p className="text-sm text-gray-600">50% of pool</p>
            </div>
            <div className="bg-secondary-50 p-4 rounded-lg text-center">
              <p className="font-semibold text-lg">Middle Tier</p>
              <p className="text-secondary-600 font-bold text-xl">$35,000</p>
              <p className="text-sm text-gray-600">35% of pool</p>
            </div>
            <div className="bg-accent-50 p-4 rounded-lg text-center">
              <p className="font-semibold text-lg">Bottom Tier</p>
              <p className="text-accent-600 font-bold text-xl">$15,000</p>
              <p className="text-sm text-gray-600">15% of pool</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
