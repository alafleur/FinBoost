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
import { Input } from "@/components/ui/input";
import { useSubscribe } from "@/hooks/use-subscribe";
import { trackEvent } from "@/lib/analytics";
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
  RefreshCw,
  Mail
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
}

export default function QuizDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<number>(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [persona, setPersona] = useState<"careful" | "balanced" | "growth" | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const subscribeMutation = useSubscribe();
  
  const personaDetails = {
    careful: {
      title: "Careful Planner",
      description: "You're methodical about money and prefer stability. Regular learning sessions and steady progress will help you maximize your rewards.",
      icon: <PiggyBank className="h-8 w-8" />,
      color: "bg-blue-500"
    },
    balanced: {
      title: "Balanced Achiever",
      description: "You take a well-rounded approach to finances. A mix of learning and community engagement will help you earn consistent rewards.",
      icon: <BarChart2 className="h-8 w-8" />,
      color: "bg-purple-500"
    },
    growth: {
      title: "Growth Seeker",
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
    // After a short delay, show the email form
    setTimeout(() => {
      setShowEmailForm(true);
    }, 2000);
  };
  
  const startQuiz = () => {
    console.log("Starting quiz...");
    setShowIntro(false);
  };
  
  const reset = () => {
    setStep(0);
    setAnswers({});
    setPersona(null);
    setShowIntro(true);
    setShowEmailForm(false);
    setEmail("");
  };
  
  const handleSubscribe = () => {
    if (!email || !email.includes('@') || !email.includes('.')) {
      return; // Simple validation
    }
    
    setIsSubmitting(true);
    trackEvent("subscribe_attempt", "personality_assessment");
    
    subscribeMutation.mutate(
      { email },
      {
        onSuccess: () => {
          trackEvent("subscribe_success", "personality_assessment");
          setIsSubmitting(false);
          handleOpenChange(false); // Close the dialog
        },
        onError: () => {
          setIsSubmitting(false);
        }
      }
    );
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
  
  // Progress percentage
  const progress = step === 0 ? 0 : (step / questions.length) * 100;
  
  const renderContent = () => {
    if (showIntro) {
      return (
        <div className="text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading">Financial Personality Assessment</DialogTitle>
          </DialogHeader>
          
          <p className="text-gray-600 mt-4 mb-8">
            Take this quick 4-question assessment to discover your financial personality
            and get a personalized plan for maximizing your rewards.
          </p>
          
          <button 
            onClick={() => {
              console.log("Button clicked");
              setShowIntro(false);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow-md transition duration-300"
          >
            Start Assessment <ChevronRight className="ml-2 h-4 w-4 inline" />
          </button>
        </div>
      );
    }
    
    if (step < questions.length) {
      return (
        <div>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-heading">Question {step + 1} of {questions.length}</DialogTitle>
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white">
                <BarChart2 className="h-5 w-5" />
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
                <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center mr-4 text-primary-600">
                  {option.icon}
                </div>
                <span>{option.text}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    if (persona) {
      return (
        <div className="text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-heading">Your Financial Personality</DialogTitle>
          </DialogHeader>
          
          {!showEmailForm ? (
            <>
              <div className="my-8 flex justify-center">
                <div className={`w-16 h-16 ${personaDetails[persona].color} rounded-full flex items-center justify-center text-white mx-auto`}>
                  {personaDetails[persona].icon}
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">The {personaDetails[persona].title}</h3>
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
                        <div className="bg-blue-100 p-1 w-6 h-6 rounded-full mr-2 text-blue-600 flex-shrink-0 mt-0.5 flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span>Complete 2-3 short lessons per week to steadily accumulate points</span>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-blue-100 p-1 w-6 h-6 rounded-full mr-2 text-blue-600 flex-shrink-0 mt-0.5 flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span>Focus on completing lesson series for bonus points</span>
                      </li>
                    </>
                  )}
                  
                  {persona === "balanced" && (
                    <>
                      <li className="flex items-start">
                        <div className="bg-purple-100 p-1 w-6 h-6 rounded-full mr-2 text-purple-600 flex-shrink-0 mt-0.5 flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span>Mix quick daily tips with weekly deeper lessons</span>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-purple-100 p-1 w-6 h-6 rounded-full mr-2 text-purple-600 flex-shrink-0 mt-0.5 flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span>Refer 1-2 friends each month for tier boosting points</span>
                      </li>
                    </>
                  )}
                  
                  {persona === "growth" && (
                    <>
                      <li className="flex items-start">
                        <div className="bg-green-100 p-1 w-6 h-6 rounded-full mr-2 text-green-600 flex-shrink-0 mt-0.5 flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span>Take advantage of point multipliers by completing streaks</span>
                      </li>
                      <li className="flex items-start">
                        <div className="bg-green-100 p-1 w-6 h-6 rounded-full mr-2 text-green-600 flex-shrink-0 mt-0.5 flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
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
                  Retake Assessment
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="py-6 text-center">
              <h3 className="text-xl font-bold mb-4">Join the Waitlist to Get Started</h3>
              <p className="text-gray-600 mb-6">
                Sign up now to be among the first to use our platform and start earning rewards based on your {personaDetails[persona].title} personality.
              </p>
              
              <div className="max-w-md mx-auto mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-grow">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 py-6 border-gray-300"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleSubscribe}
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSubmitting ? "Joining..." : "Join the Waitlist"}
                  </Button>
                </div>
              </div>
              
              <p className="text-gray-500 text-sm mt-2">
                We'll never share your email. Unsubscribe anytime.
              </p>
              
              <div className="mt-6 pt-4 border-t border-gray-100">
                <Button 
                  variant="ghost"
                  onClick={reset}
                  className="text-gray-600"
                >
                  Retake Assessment
                </Button>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          className="border-primary-500 bg-white text-primary-600 hover:bg-primary-50 font-medium flex items-center px-4 py-2 rounded-lg"
        >
          <BarChart2 className="h-4 w-4 mr-2" />
          Take the Financial Personality Assessment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] p-6 bg-white">
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}