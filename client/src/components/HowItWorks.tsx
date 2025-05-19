import { User, CheckCircle, TrendingUp, FileText } from "lucide-react";

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
      title: "1. Become a Member",
      description: "Get access to the platform and be part of the rewards pool.",
      icon: <User className="h-6 w-6" />,
    },
    {
      id: 2,
      title: "2. Learn and Earn Points",
      description: "Complete short financial lessons and quizzes to earn points — the more you engage, the more you earn.",
      icon: <CheckCircle className="h-6 w-6" />,
    },
    {
      id: 3,
      title: "3. Climb the Leaderboard",
      description: "Points boost your chances to win monthly cash rewards. Top performers get the biggest bonuses.",
      icon: <TrendingUp className="h-6 w-6" />,
    },
    {
      id: 4,
      title: "4. Show Your Progress",
      description: "Use your winnings to repay debt or invest — and upload proof to earn even more points.",
      icon: <FileText className="h-6 w-6" />,
    },
  ];

  return (
    <section className="py-20 px-4 bg-white" id="how-it-works">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">How It Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Our platform makes financial education rewarding through a simple four-step process</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
      </div>
    </section>
  );
}
