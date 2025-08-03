import { Users, Shield, Award, Target } from "lucide-react";
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
      title: "Community-powered progress",
      description: "Learn alongside others who share your financial goals and challenges.",
      icon: <Users className="h-5 w-5" />,
      bgColor: "bg-accent-light/20",
      iconColor: "text-accent",
    },
    {
      id: 2,
      title: "Accountability that works",
      description: "Stay motivated with a system that rewards consistent participation.",
      icon: <Target className="h-5 w-5" />,
      bgColor: "bg-accent-light/20",
      iconColor: "text-accent",
    },
    {
      id: 3,
      title: "Real-world financial improvement",
      description: "Apply what you learn to see actual improvement in your financial situation.",
      icon: <Award className="h-5 w-5" />,
      bgColor: "bg-amber-100",
      iconColor: "text-accent-500",
    },
  ];

  return (
    <section className="py-20 px-4 bg-gray-50" id="why-it-works">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-heading font-bold text-3xl md:text-4xl mb-6">Why Our Approach Is Different</h2>
            <p className="text-gray-600 mb-8">We combine community support, accountability, and real-world application to create lasting financial change.</p>
            
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
            <h3 className="font-heading font-semibold text-xl mb-6 text-center">Membership Benefits</h3>
            
            <div className="mt-2 text-center mb-6">
              <p className="text-gray-600">A simple, transparent system designed for your financial success</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4 mt-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Shield className="h-5 w-5 text-primary-600 mr-2" />
                  <div className="font-semibold">Expert-Curated Content</div>
                </div>
                <p className="text-sm text-gray-600">Access financial education designed by industry experts</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Users className="h-5 w-5 text-primary-600 mr-2" />
                  <div className="font-semibold">Supportive Community</div>
                </div>
                <p className="text-sm text-gray-600">Connect with others on the same financial journey</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Award className="h-5 w-5 text-primary-600 mr-2" />
                  <div className="font-semibold">Cycle Cash Rewards</div>
                </div>
                <p className="text-sm text-gray-600">Earn real money as you learn and participate</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
