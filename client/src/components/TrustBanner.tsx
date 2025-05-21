import React from 'react';
import { Lock, TrendingUp, BookOpen, Users } from 'lucide-react';

export default function TrustBanner() {
  const trustItems = [
    {
      icon: <Lock className="h-5 w-5" />,
      label: 'Secure Payments'
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      label: 'Transparent Rewards'
    },
    {
      icon: <BookOpen className="h-5 w-5" />,
      label: 'Expert-Created Content'
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: 'Community Support'
    }
  ];

  return (
    <section className="py-8 bg-gray-50 border-y border-gray-100">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          {trustItems.map((item, index) => (
            <div key={index} className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mr-3">
                <div className="text-primary-600">
                  {item.icon}
                </div>
              </div>
              <span className="font-medium text-gray-700">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}