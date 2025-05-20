import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  HelpCircle, 
  Award, 
  ChevronRight, 
  BarChart2, 
  TrendingUp, 
  PiggyBank, 
  CreditCard,
  Home,
  RefreshCw 
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

interface QuizOption {
  id: string;
  text: string;
  icon: React.ReactNode;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: QuizOption[];
}

export default function QuizDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<number>(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [persona, setPersona] = useState<"careful" | "balanced" | "growth" | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  
  const personaDetails = {
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
      color: "bg-purple-500"
    },
    growth: {
      title: "The Growth Seeker",
      description: "You're motivated by opportunities and growth. Frequent participation and referring others will help you reach top reward tiers.",
      icon: <TrendingUp className="h-8 w-8" />,
      color: "bg-green-500"
    }
  };
  
  const questions: QuizQuestion[] = [
    {
      id: 1,
      question: "What's your main financial goal right now?",
      options: [
        { id: "a", text: "Building better financial habits", icon: <RefreshCw className="h-5 w-5" /> },
        { id: "b", text: "Learning about money management", icon: <Home className="h-5 w-5" /> },
        { id: "c", text: "Getting rewarded for my progress", icon: <Award className="h-5 w-5" /> }
      ]
    },
    {
      id: 2,
      question: "How much time can you commit to learning each week?",
      options: [
        { id: "a", text: "Just a few minutes when I can", icon: <HelpCircle className="h-5 w-5" /> },
        { id: "b", text: "5-10 minutes a few times a week", icon: <HelpCircle className="h-5 w-5" /> },
        { id: "c", text: "15+ minutes several times a week", icon: <HelpCircle className="h-5 w-5" /> }
      ]
    },
    {
      id: 3,
      question: "Which financial topic interests you most?",
      options: [
        { id: "a", text: "Debt management", icon: <CreditCard className="h-5 w-5" /> },
        { id: "b", text: "Investing basics", icon: <TrendingUp className="h-5 w-5" /> },
        { id: "c", text: "Budgeting & saving", icon: <PiggyBank className="h-5 w-5" /> }
      ]
    },
    {
      id: 4,
      question: "What's your preferred way to learn?",
      options: [
        { id: "a", text: "Short articles & tips", icon: <HelpCircle className="h-5 w-5" /> },
        { id: "b", text: "Interactive lessons & quizzes", icon: <HelpCircle className="h-5 w-5" /> },
        { id: "c", text: "Visual guides & videos", icon: <HelpCircle className="h-5 w-5" /> }
      ]
    }
  ];
  
  const handleAnswer = (questionId: number, answerId: string) => {
    setAnswers({
      ...answers,
      [questionId]: answerId
    });
    
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      // Calculate persona based on answers
      calculatePersona();
    }
  };
  
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
      setPersona("careful");
    } else if (counts.b >= counts.a && counts.b >= counts.c) {
      setPersona("balanced");
    } else {
      setPersona("growth");
    }
    
    setStep(questions.length);
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
  
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset quiz state when dialog is closed
      setTimeout(() => {
        reset();
      }, 300);
    }
  };
  
  // Character component
  const Character = ({ mood = "happy" }: { mood?: "happy" | "thinking" | "excited" }) => {
    return (
      <div className="w-20 h-20 bg-yellow-400 rounded-full border-4 border-yellow-500 flex items-center justify-center relative">
        {/* Eyes */}
        {mood === "happy" && (
          <>
            <div className="absolute top-6 left-6 w-2 h-3 bg-gray-800 rounded-full"></div>
            <div className="absolute top-6 right-6 w-2 h-3 bg-gray-800 rounded-full"></div>
            {/* Happy mouth */}
            <div className="absolute top-12 w-8 h-4 border-b-2 border-gray-800 rounded-full"></div>
          </>
        )}
        {mood === "thinking" && (
          <>
            <div className="absolute top-6 left-6 w-2 h-3 bg-gray-800 rounded-full"></div>
            <div className="absolute top-6 right-6 w-2 h-3 bg-gray-800 rounded-full"></div>
            {/* Thinking mouth */}
            <div className="absolute top-12 w-4 h-1 bg-gray-800 rounded-full"></div>
          </>
        )}
        {mood === "excited" && (
          <>
            <div className="absolute top-6 left-6 w-2 h-3 bg-gray-800 rounded-full"></div>
            <div className="absolute top-6 right-6 w-2 h-3 bg-gray-800 rounded-full"></div>
            {/* Excited mouth */}
            <div className="absolute top-11 w-6 h-6 border-2 border-gray-800 rounded-full"></div>
          </>
        )}
      </div>
    );
  };
  
  // Progress percentage
  const progress = step === 0 ? 0 : (step / questions.length) * 100;
  
  // Character mood
  const characterMood = persona ? "excited" : step < 2 ? "happy" : "thinking";
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost"
          className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
        >
          <span className="mr-1 text-xl">🪙</span>
          Take the Financial Personality Quiz
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-6 bg-white">
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
              <DialogHeader>
                <DialogTitle className="text-2xl font-heading">Meet Coiny, Your Financial Guide</DialogTitle>
              </DialogHeader>
              
              <div className="my-8 flex justify-center">
                <div className="relative">
                  <Character mood="happy" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
                    $
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 mb-8">
                Take this quick 4-question quiz to discover your financial personality
                and get a personalized plan for earning rewards!
              </p>
              
              <Button 
                onClick={startQuiz}
                className="bg-primary-500 hover:bg-primary-600"
              >
                Start Quiz <ChevronRight className="ml-2 h-4 w-4" />
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
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl font-heading">Question {step + 1} of {questions.length}</DialogTitle>
                  <div className="relative">
                    <Character mood={characterMood} />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                      $
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="my-6">
                <Progress value={progress} className="h-2" />
              </div>
              
              <h4 className="text-xl font-medium mb-6">{questions[step].question}</h4>
              
              <div className="space-y-4 mb-6">
                {questions[step].options.map((option) => (
                  <div 
                    key={option.id}
                    onClick={() => handleAnswer(questions[step].id, option.id)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 cursor-pointer transition-all duration-200 flex items-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                      {option.icon}
                    </div>
                    <span>{option.text}</span>
                  </div>
                ))}
              </div>
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
              <DialogHeader>
                <DialogTitle className="text-2xl font-heading">Your Financial Personality</DialogTitle>
              </DialogHeader>
              
              <div className="my-8 flex justify-center">
                <div className="relative">
                  <Character mood="excited" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
                    $
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <div className={`w-16 h-16 ${personaDetails[persona].color} rounded-full flex items-center justify-center text-white mx-auto mb-4`}>
                  {personaDetails[persona].icon}
                </div>
                <h3 className="text-2xl font-bold mb-2">You're {personaDetails[persona].title}!</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {personaDetails[persona].description}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium mb-2">Your Recommended Rewards Strategy:</h4>
                <ul className="text-left space-y-2 text-sm text-gray-600">
                  {persona === "careful" && (
                    <>
                      <li className="flex items-start">
                        <span className="bg-blue-100 p-1 rounded-full mr-2 text-blue-600 flex-shrink-0 mt-0.5">✓</span>
                        <span>Complete 2-3 short lessons per week to steadily accumulate points</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-blue-100 p-1 rounded-full mr-2 text-blue-600 flex-shrink-0 mt-0.5">✓</span>
                        <span>Focus on completing lesson series for bonus points</span>
                      </li>
                    </>
                  )}
                  
                  {persona === "balanced" && (
                    <>
                      <li className="flex items-start">
                        <span className="bg-purple-100 p-1 rounded-full mr-2 text-purple-600 flex-shrink-0 mt-0.5">✓</span>
                        <span>Mix quick daily tips with weekly deeper lessons</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-purple-100 p-1 rounded-full mr-2 text-purple-600 flex-shrink-0 mt-0.5">✓</span>
                        <span>Refer 1-2 friends each month for tier boosting points</span>
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
                    </>
                  )}
                </ul>
              </div>
              
              <DialogFooter className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  variant="outline" 
                  onClick={reset}
                >
                  Retake Quiz
                </Button>
                <Button 
                  className="bg-primary-500 hover:bg-primary-600"
                  onClick={() => handleOpenChange(false)}
                >
                  Join the Waitlist
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}