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
    <section className="py-20 px-4 bg-gradient-to-br from-blue-50 via-indigo-50/80 to-purple-50/60" id="how-it-works">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">🧭 How It Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Our platform makes financial education rewarding through a simple three-step process</p>
          <p className="text-lg font-medium text-primary-600 mt-4"><span className="font-bold">Break the cycle. Build together.</span> A new approach to financial wellness.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-200 hover:border-blue-300 transform hover:-translate-y-1"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <div className="text-white">
                  {step.icon}
                </div>
              </div>
              <h3 className="font-heading font-bold text-xl mb-3 text-blue-900">{step.title}</h3>
              <p className="text-blue-700">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Key Points Summary */}
        <div className="mt-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 max-w-4xl mx-auto border border-blue-100">
          <h3 className="text-2xl font-bold text-center mb-4 text-gray-800 flex items-center justify-center">
            <span className="bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">Key Reward System Facts</span>
          </h3>

          <div className="grid grid-cols-1 gap-8">

          </div>
        </div>
      </div>
    </section>
  );
}