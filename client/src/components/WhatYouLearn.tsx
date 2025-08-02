import { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  CreditCard, 
  Calculator, 
  BookOpen
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function WhatYouLearn() {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  const sampleLessons = [
    {
      id: 1,
      title: "How to finally stick to a budget",
      icon: "💰",
      color: "bg-blue-100",
      textColor: "text-blue-600"
    },
    {
      id: 2,
      title: "Cracking your credit score",
      icon: "📈",
      color: "bg-green-100",
      textColor: "text-green-600"
    },
    {
      id: 3,
      title: "Intro to investing—even if you're broke",
      icon: "📊",
      color: "bg-amber-100",
      textColor: "text-amber-600"
    },
    {
      id: 4,
      title: "Student loan paydown hacks",
      icon: "🎓",
      color: "bg-blue-100",
      textColor: "text-blue-600"
    }
  ];
  
  const topics = [
    {
      title: "Improve Your Credit Score with Smart Strategies",
      subtitle: "Learn the tactics that have helped thousands boost their scores",
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      title: "Create a Budget That Actually Fits Your Life",
      subtitle: "Practical approaches that work even on tight budgets",
      icon: <Calculator className="h-5 w-5" />,
    },
    {
      title: "Accelerate Your Debt Payoff with Smart Planning",
      subtitle: "Strategic methods to save on interest and get debt-free sooner",
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      title: "Start Investing Even with Small Amounts",
      subtitle: "Simple, low-risk ways to begin building wealth",
      icon: <TrendingUp className="h-5 w-5" />,
    },
  ];

  const resetQuiz = () => {
    setSelectedAnswer(null);
    setShowResult(false);
  };

  return (
    <section className="py-20 px-4 bg-gray-50" id="what-you-learn">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">
            Build Better Money Habits That Actually Stick
          </h2>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg">
            Learn practical financial skills through bite-sized lessons designed to fit into your daily routine.
          </p>
        </div>
        
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-4 bg-blue-50 px-6 py-3 rounded-full border border-blue-200">
              <span className="text-blue-600 font-semibold">Most members start seeing progress in their first month</span>
            </div>
          </div>
          
          <h3 className="font-heading font-semibold text-2xl mb-8 text-center">What You'll Master:</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {topics.map((topic, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                    {topic.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">{topic.title}</h4>
                    <p className="text-gray-600 text-sm">{topic.subtitle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>3-5 minute lessons</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Interactive quizzes</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                <span>Real-world applications</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <span>Preview a Lesson</span>
                  <BookOpen className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Debt Avalanche vs. Debt Snowball</DialogTitle>
                  <DialogDescription>
                    A preview of the lessons you'll get as a member
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-6">
                  <div className="space-y-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-lg mb-3">The Two Main Debt Repayment Strategies</h4>
                      <p className="text-gray-600 mb-3">
                        <strong>Debt Avalanche:</strong> Pay minimum payments on all debts, then use extra money to pay off the highest interest rate debt first. This saves you the most money mathematically.
                      </p>
                      <p className="text-gray-600">
                        <strong>Debt Snowball:</strong> Pay minimum payments on all debts, then use extra money to pay off the smallest balance first, regardless of interest rate. This gives you quick wins for motivation.
                      </p>
                    </div>
                    
                    {!showResult ? (
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-lg mb-4">Quick Quiz</h4>
                        <p className="mb-4">Which debt repayment method would save you the most money over time?</p>
                        
                        <RadioGroup value={selectedAnswer || ""} onValueChange={setSelectedAnswer}>
                          <div className="flex items-center space-x-2 mb-3">
                            <RadioGroupItem value="avalanche" id="avalanche" />
                            <Label htmlFor="avalanche">Debt Avalanche</Label>
                          </div>
                          <div className="flex items-center space-x-2 mb-3">
                            <RadioGroupItem value="snowball" id="snowball" />
                            <Label htmlFor="snowball">Debt Snowball</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="both" id="both" />
                            <Label htmlFor="both">They save the same amount</Label>
                          </div>
                        </RadioGroup>
                        
                        <Button 
                          className="mt-4"
                          onClick={() => setShowResult(true)}
                          disabled={!selectedAnswer}
                        >
                          Check Answer
                        </Button>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-lg mb-3">Answer:</h4>
                        
                        {selectedAnswer === "avalanche" ? (
                          <div className="p-3 bg-green-50 border border-green-200 rounded text-green-800 mb-4">
                            <p className="font-medium">Correct! 🎉</p>
                            <p>The Debt Avalanche method (focusing on highest interest rates first) will save you the most money over time.</p>
                          </div>
                        ) : (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 mb-4">
                            <p className="font-medium">Not quite!</p>
                            <p>The Debt Avalanche method (focusing on highest interest rates first) will save you the most money over time.</p>
                          </div>
                        )}
                        
                        <p className="text-primary-600 font-medium">+ 5 points awarded for quiz completion</p>
                        
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={resetQuiz}
                        >
                          Try Again
                        </Button>
                      </div>
                    )}
                    
                    <div className="text-center text-sm text-gray-500 mt-4">
                      Earn points when you complete real tutorials like this inside the app.
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </section>
  );
}