
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  Clock, 
  Star, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  Trophy,
  Target
} from 'lucide-react';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface Lesson {
  id: number;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeEstimate: string;
  points: number;
  content: string;
  quiz: QuizQuestion[];
  completed: boolean;
}

// Mock lesson data - this would come from your backend
const lessonData: { [key: string]: Lesson } = {
  '1': {
    id: 1,
    title: "Emergency Fund Basics",
    category: "Saving",
    difficulty: "Beginner",
    timeEstimate: "10 min",
    points: 50,
    completed: false,
    content: `
      <h2>What is an Emergency Fund?</h2>
      <p>An emergency fund is money you set aside specifically for unexpected expenses or financial emergencies. Think of it as your financial safety net.</p>
      
      <h3>Why You Need One</h3>
      <ul>
        <li><strong>Unexpected expenses:</strong> Car repairs, medical bills, or home maintenance</li>
        <li><strong>Job loss:</strong> Provides income replacement while you find new work</li>
        <li><strong>Peace of mind:</strong> Reduces stress and anxiety about money</li>
        <li><strong>Avoid debt:</strong> Prevents you from relying on credit cards or loans</li>
      </ul>

      <h3>How Much Should You Save?</h3>
      <p>Financial experts recommend saving 3-6 months' worth of living expenses. Start small:</p>
      <ol>
        <li><strong>Starter goal:</strong> $500-$1,000</li>
        <li><strong>Intermediate goal:</strong> 1 month of expenses</li>
        <li><strong>Full goal:</strong> 3-6 months of expenses</li>
      </ol>

      <h3>Where to Keep Your Emergency Fund</h3>
      <p>Your emergency fund should be easily accessible but separate from your daily spending money:</p>
      <ul>
        <li>High-yield savings account</li>
        <li>Money market account</li>
        <li>Short-term certificate of deposit (CD)</li>
      </ul>

      <div style="background: #f0f9ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
        <strong>💡 Pro Tip:</strong> Set up automatic transfers to build your emergency fund gradually. Even $25 per week adds up to $1,300 per year!
      </div>
    `,
    quiz: [
      {
        id: 1,
        question: "What is the primary purpose of an emergency fund?",
        options: [
          "To invest in the stock market",
          "To cover unexpected expenses and financial emergencies",
          "To buy luxury items",
          "To pay for vacation expenses"
        ],
        correctAnswer: 1,
        explanation: "An emergency fund is specifically designed to cover unexpected expenses like medical bills, car repairs, or job loss, providing financial security."
      },
      {
        id: 2,
        question: "How much should you ideally have in your emergency fund?",
        options: [
          "1 week of expenses",
          "1 month of expenses",
          "3-6 months of expenses",
          "1 year of expenses"
        ],
        correctAnswer: 2,
        explanation: "Most financial experts recommend 3-6 months of living expenses, though you can start with smaller goals like $500-$1,000."
      },
      {
        id: 3,
        question: "Where is the best place to keep your emergency fund?",
        options: [
          "Under your mattress",
          "In your checking account with daily expenses",
          "In a high-yield savings account",
          "Invested in stocks"
        ],
        correctAnswer: 2,
        explanation: "A high-yield savings account provides easy access while keeping the money separate from daily spending and earning interest."
      }
    ]
  }
};

export default function Lesson() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [currentStep, setCurrentStep] = useState<'content' | 'quiz'>('content');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    // Get lesson ID from URL params (you'd implement this based on your routing)
    const lessonId = window.location.pathname.split('/lesson/')[1] || '1';
    const lessonData1 = lessonData[lessonId];
    
    if (lessonData1) {
      setLesson(lessonData1);
    } else {
      setLocation('/education');
    }
  }, [setLocation]);

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < lesson!.quiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      finishQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const finishQuiz = () => {
    const correctAnswers = selectedAnswers.filter((answer, index) => 
      answer === lesson!.quiz[index].correctAnswer
    ).length;
    
    const finalScore = Math.round((correctAnswers / lesson!.quiz.length) * 100);
    setScore(finalScore);
    setShowResults(true);
    setQuizCompleted(true);

    // Award points if score is 70% or higher
    if (finalScore >= 70) {
      toast({
        title: "🎉 Lesson Completed!",
        description: `You earned ${lesson!.points} points! Great job!`,
      });
      
      // Here you would update the user's points in the database
      updateUserPoints(lesson!.points);
    }
  };

  const updateUserPoints = async (points: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ points, action: 'lesson_completed', lessonId: lesson!.id })
      });

      if (response.ok) {
        // Update local user data
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        userData.totalPoints = (userData.totalPoints || 0) + points;
        userData.currentMonthPoints = (userData.currentMonthPoints || 0) + points;
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error updating points:', error);
    }
  };

  const startQuiz = () => {
    setCurrentStep('quiz');
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowResults(false);
    setQuizCompleted(false);
  };

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const currentQuestion = lesson.quiz[currentQuestionIndex];
  const isAnswerSelected = selectedAnswers[currentQuestionIndex] !== undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/education')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Education
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <Badge className={getDifficultyColor(lesson.difficulty)}>
                  {lesson.difficulty}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {lesson.timeEstimate}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {lesson.points} points
                </Badge>
              </div>
              <h1 className="text-2xl font-bold mt-2">{lesson.title}</h1>
              <p className="text-gray-600">{lesson.category}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {currentStep === 'content' ? (
          /* Lesson Content */
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary-600" />
                  <CardTitle>Lesson Content</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: lesson.content }}
                />
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button 
                onClick={startQuiz}
                className="flex items-center gap-2"
                size="lg"
              >
                <Target className="h-5 w-5" />
                Start Quiz ({lesson.quiz.length} questions)
              </Button>
            </div>
          </div>
        ) : (
          /* Quiz Section */
          <div className="space-y-6">
            {!showResults ? (
              <>
                {/* Quiz Progress */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium">
                        Question {currentQuestionIndex + 1} of {lesson.quiz.length}
                      </span>
                      <span className="text-sm text-gray-600">
                        {Math.round(((currentQuestionIndex + 1) / lesson.quiz.length) * 100)}% Complete
                      </span>
                    </div>
                    <Progress 
                      value={((currentQuestionIndex + 1) / lesson.quiz.length) * 100} 
                      className="h-2"
                    />
                  </CardContent>
                </Card>

                {/* Current Question */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{currentQuestion.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {currentQuestion.options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelect(index)}
                          className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                            selectedAnswers[currentQuestionIndex] === index
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              selectedAnswers[currentQuestionIndex] === index
                                ? 'border-primary-500 bg-primary-500'
                                : 'border-gray-300'
                            }`}>
                              {selectedAnswers[currentQuestionIndex] === index && (
                                <div className="w-2 h-2 bg-white rounded-full" />
                              )}
                            </div>
                            <span>{option}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quiz Navigation */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={handleNextQuestion}
                    disabled={!isAnswerSelected}
                    className="flex items-center gap-2"
                  >
                    {currentQuestionIndex === lesson.quiz.length - 1 ? 'Finish Quiz' : 'Next'}
                  </Button>
                </div>
              </>
            ) : (
              /* Quiz Results */
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4">
                    {score >= 70 ? (
                      <Trophy className="h-16 w-16 text-yellow-500" />
                    ) : (
                      <Target className="h-16 w-16 text-gray-400" />
                    )}
                  </div>
                  <CardTitle className="text-2xl">
                    {score >= 70 ? 'Congratulations!' : 'Keep Learning!'}
                  </CardTitle>
                  <CardDescription>
                    You scored {score}% ({selectedAnswers.filter((answer, index) => 
                      answer === lesson.quiz[index].correctAnswer
                    ).length} out of {lesson.quiz.length} correct)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {score >= 70 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                        <p className="font-medium text-green-800">
                          🎉 You earned {lesson.points} points!
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          Great job completing this lesson!
                        </p>
                      </div>
                    )}

                    {/* Show correct answers */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Review Answers:</h4>
                      {lesson.quiz.map((question, index) => (
                        <div key={question.id} className="border rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            {selectedAnswers[index] === question.correctAnswer ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium mb-2">{question.question}</p>
                              <p className="text-sm text-gray-600 mb-2">
                                <strong>Correct answer:</strong> {question.options[question.correctAnswer]}
                              </p>
                              <p className="text-sm text-gray-700">{question.explanation}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setLocation('/education')}
                        className="flex-1"
                      >
                        Back to Education
                      </Button>
                      {score < 70 && (
                        <Button 
                          onClick={() => {
                            setCurrentStep('content');
                            setShowResults(false);
                            setSelectedAnswers([]);
                          }}
                          className="flex-1"
                        >
                          Review & Retry
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
