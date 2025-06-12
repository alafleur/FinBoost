import { BarChart2, BookOpen, Trophy } from "lucide-react";

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
      title: "1. Take Your Assessment",
      description: "Take our quick assessment to discover your financial personality type.",
      icon: <BarChart2 className="h-6 w-6" />,
    },
    {
      id: 2,
      title: "2. Learn & Apply",
      description: "Complete bite-sized lessons, quizzes, and take real financial actions. Track your progress as you build essential money management skills.",
      icon: <BookOpen className="h-6 w-6" />,
    },
    {
      id: 3,
      title: "3. Earn Rewards",
      description: "Get points for every lesson completed and action taken. Join our monthly reward pools and earn real cash for your financial progress.",
      icon: <Trophy className="h-6 w-6" />,
    },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-blue-50 via-indigo-50/80 to-purple-50/60" id="how-it-works">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">🧭 How It Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Get started in minutes and begin your financial transformation journey today</p>
          <p className="text-lg font-medium text-primary-600 mt-4"><span className="font-bold">Assess. Learn. Earn.</span> Your path to financial wellness starts now.</p>
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


      </div>
    </section>
  );
}