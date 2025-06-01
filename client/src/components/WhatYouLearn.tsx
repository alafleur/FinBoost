import { BookOpen, TrendingUp, Shield } from "lucide-react";

const features = [
  {
    id: 1,
    icon: <BookOpen className="h-6 w-6" />,
    title: "Practical Financial Skills",
    description: "Learn budgeting, investing, and debt management through real-world scenarios and actionable strategies.",
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600"
  },
  {
    id: 2,
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Progressive Learning Path",
    description: "Start with basics and advance to complex topics. Track your progress and build confidence step by step.",
    bgColor: "bg-green-100",
    iconColor: "text-green-600"
  },
  {
    id: 3,
    icon: <Shield className="h-6 w-6" />,
    title: "Expert-Backed Content",
    description: "All lessons are created by certified financial advisors and updated regularly to reflect current best practices.",
    bgColor: "bg-purple-100",
    iconColor: "text-purple-600"
  }
];

export default function WhatYouLearn() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">What You'll Learn</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Comprehensive financial education designed to help you make smarter money decisions and build lasting wealth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div 
              key={feature.id} 
              className="text-center p-6 rounded-xl border border-gray-100 hover:shadow-md transition-shadow duration-300"
            >
              <div className={`w-16 h-16 ${feature.bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}>
                <span className={feature.iconColor}>{feature.icon}</span>
              </div>
              <h3 className="font-heading font-semibold text-xl mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}