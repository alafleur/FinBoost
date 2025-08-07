import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  HelpCircle,
  Award,
  ChevronRight,
  ChevronLeft,
  BarChart2,
  TrendingUp,
  PiggyBank,
  CreditCard,
  Home,
  Eye,
  RefreshCw
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface QuizOption {
  id: string;
  text: string;
  icon: React.ReactNode;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
  explanation?: string;
}

const FinancialPersona = {
  careful: {
    title: "The Careful Planner",
    description: "You're methodical about money and prefer stability. Regular learning sessions and steady progress will help you maximize your rewards.",
    icon: <PiggyBank className="h-8 w-8" />,
    color: "bg-blue-500"
  },
  balanced: {
    title: "The Balanced Achiever",
    description: "You take a well-rounded approach to finances. A mix of learning and community engagement will help you earn consistent rewards.",
    icon: <BarChart2 className="h-8 w-8" />,
    color: "bg-blue-600"
  },
  growth: {
    title: "The Growth Seeker",
    description: "You're motivated by opportunities and growth. Frequent participation and referring others will help you reach top reward tiers.",
    icon: <TrendingUp className="h-8 w-8" />,
    color: "bg-green-500"
  }
};



export default function FinancialQuiz() {
  const [step, setStep] = useState<number>(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [persona, setPersona] = useState<keyof typeof FinancialPersona | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  
  const questions: QuizQuestion[] = [
    {
      id: 1,
      question: "What's your main financial goal right now?",
      options: [
        { id: "a", text: "Building better financial habits", icon: <RefreshCw /> },
        { id: "b", text: "Learning about money management", icon: <Eye /> },
        { id: "c", text: "Getting rewarded for my progress", icon: <Award /> }
      ]
    },
    {
      id: 2,
      question: "How much time can you commit to learning each week?",
      options: [
        { id: "a", text: "Just a few minutes when I can", icon: <HelpCircle /> },
        { id: "b", text: "5-10 minutes a few times a week", icon: <HelpCircle /> },
        { id: "c", text: "15+ minutes several times a week", icon: <HelpCircle /> }
      ]
    },
    {
      id: 3,
      question: "Which financial topic interests you most?",
      options: [
        { id: "a", text: "Debt management", icon: <CreditCard /> },
        { id: "b", text: "Investing basics", icon: <TrendingUp /> },
        { id: "c", text: "Budgeting & saving", icon: <PiggyBank /> }
      ]
    },
    {
      id: 4,
      question: "What's your preferred way to learn?",
      options: [
        { id: "a", text: "Short articles & tips", icon: <HelpCircle /> },
        { id: "b", text: "Interactive lessons & quizzes", icon: <HelpCircle /> },
        { id: "c", text: "Visual guides & videos", icon: <HelpCircle /> }
      ]
    }
  ];
  
  const handleAnswer = (questionId: number, answerId: string) => {
    setAnswers({
      ...answers,
      [questionId]: answerId
    });
    
    if (step < questions.length) {
      setStep(step + 1);
    } else {
      // Calculate persona based on answers
      const calculatePersona = () => {
        // Simple calculation - count most frequent answers
        const counts: { [key: string]: number } = { a: 0, b: 0, c: 0 };
        
        Object.values(answers).forEach(answer => {
          if (counts[answer] !== undefined) {
            counts[answer]++;
          }
        });
        
        // Find max
        if (counts.a >= counts.b && counts.a >= counts.c) {
          return "careful";
        } else if (counts.b >= counts.a && counts.b >= counts.c) {
          return "balanced";
        } else {
          return "growth";
        }
      };
      
      setPersona(calculatePersona());
    }
  };
  
  const startQuiz = () => {
    setShowIntro(false);
  };
  
  const reset = () => {
    setStep(0);
    setAnswers({});
    setPersona(null);
    setShowIntro(true);
  };
  
  // Progress percentage
  const progress = step === 0 ? 0 : (step / questions.length) * 100;
  
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 md:p-8">
        <AnimatePresence mode="wait">
          {showIntro && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                  <BarChart2 className="h-8 w-8 text-indigo-600" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-4">Financial Personality Assessment</h3>
              <p className="text-gray-600 mb-6">
                Take this quick assessment to discover your financial personality
                and get personalized strategies for earning rewards!
              </p>
              <Button 
                size="lg" 
                onClick={startQuiz}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                Start Assessment <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          )}
          
          {!showIntro && step < questions.length && (
            <motion.div
              key={`question-${step}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Question {step + 1} of {questions.length}</h3>
                    <Progress value={progress} className="h-2 w-44 mt-2" />
                  </div>
                  {step > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setStep(step - 1)}
                      className="ml-4"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                  )}
                </div>
              </div>
              
              <h4 className="text-xl font-medium mb-6">{questions[step].question}</h4>
              
              <div className="space-y-3">
                {questions[step].options.map((option) => (
                  <label 
                    key={option.id}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all duration-200"
                  >
                    <input
                      type="radio"
                      name={`question-${questions[step].id}`}
                      value={option.id}
                      onChange={() => handleAnswer(questions[step].id, option.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3"
                    />
                    <span className="text-gray-700">{option.text}</span>
                  </label>
                ))}
              </div>
              
              {questions[step].explanation && (
                <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-lg">
                  <p className="text-sm font-medium">{questions[step].explanation}</p>
                </div>
              )}
            </motion.div>
          )}
          
          {!showIntro && step === questions.length && persona && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <div className="mb-6 flex justify-center">
                <div className={`w-20 h-20 ${FinancialPersona[persona].color} rounded-full flex items-center justify-center text-white`}>
                  {FinancialPersona[persona].icon}
                </div>
              </div>
              
              <h3 className="text-2xl font-bold mb-3">You're {FinancialPersona[persona].title}!</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {FinancialPersona[persona].description}
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium mb-2">Your Recommended Rewards Strategy:</h4>
                <ul className="text-left space-y-2 text-sm text-gray-600">
                  {persona === "careful" && (
                    <>
                      <li className="flex items-start">
                        <span className="bg-blue-100 p-1 rounded-full mr-2 text-blue-600 flex-shrink-0 mt-0.5">✓</span>
                        <span>Complete 2-3 short lessons per week to steadily accumulate tickets</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-100 p-1 rounded-full mr-2 text-blue-600 flex-shrink-0 mt-0.5">✓</span>
                        <span>Focus on completing lesson series for bonus tickets</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-100 p-1 rounded-full mr-2 text-blue-600 flex-shrink-0 mt-0.5">✓</span>
                        <span>Track your progress monthly to see your tier improvements</span>
                      </li>
                    </>
                  )}
                  
                  {persona === "balanced" && (
                    <>
                      <li className="flex items-start">
                        <span className="bg-blue-100 p-1 rounded-full mr-2 text-blue-600 flex-shrink-0 mt-0.5">✓</span>
                        <span>Mix quick daily tips with weekly deeper lessons</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-100 p-1 rounded-full mr-2 text-blue-600 flex-shrink-0 mt-0.5">✓</span>
                        <span>Refer 1-2 friends each month for tier boosting points</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-100 p-1 rounded-full mr-2 text-blue-600 flex-shrink-0 mt-0.5">✓</span>
                        <span>Balance learning with sharing your financial wins</span>
                      </li>
                    </>
                  )}
                  
                  {persona === "growth" && (
                    <>
                      <li className="flex items-start">
                        <span className="bg-green-100 p-1 rounded-full mr-2 text-green-600 flex-shrink-0 mt-0.5">✓</span>
                        <span>Take advantage of point multipliers by completing streaks</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-green-100 p-1 rounded-full mr-2 text-green-600 flex-shrink-0 mt-0.5">✓</span>
                        <span>Build your network through referrals for maximum points</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-green-100 p-1 rounded-full mr-2 text-green-600 flex-shrink-0 mt-0.5">✓</span>
                        <span>Share your financial progress regularly for tier bonuses</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={reset}
                >
                  Retake Quiz
                </Button>
                <Button 
                  className="bg-primary-500 hover:bg-primary-600"
                >
                  Get Started on Boosting Your Finances
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}