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
        
        {/* Key Points Summary */}
        <div className="mt-10 bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
          <h3 className="text-xl font-semibold text-center mb-6">Key Reward System Facts</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-lg text-gray-800">Member fees directly power the rewards pool</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-lg text-gray-800">50% of members receive monthly cash rewards</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-lg text-gray-800">Top rewards can reach thousands in larger pools</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
