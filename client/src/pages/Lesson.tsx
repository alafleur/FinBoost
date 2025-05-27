import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import StreakNotification from "@/components/StreakNotification";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface Lesson {
  id: number | string;
  title: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeEstimate: string;
  points: number;
  content: string;
  quiz: QuizQuestion[];
  completed: boolean;
}

import { educationContent } from '../data/educationContent';

export default function Lesson() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<'content' | 'quiz'>('content');
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [hasEarnedLessonPoints, setHasEarnedLessonPoints] = useState(false);
  const [hasEarnedQuizPoints, setHasEarnedQuizPoints] = useState(false);
  const { toast } = useToast();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [streakNotification, setStreakNotification] = useState<{
    pointsEarned: number;
    streakBonus: number;
    newStreak: number;
  } | null>(null);

  useEffect(() => {
    // Get lesson ID from URL params
    const lessonId = window.location.pathname.split('/lesson/')[1] || 'emergency-fund';
    const lessonData1 = educationContent[lessonId];

    if (lessonData1) {
      setLesson({
        ...lessonData1,
        id: parseInt(lessonId.replace(/\D/g, '')) || 1,
        timeEstimate: lessonData1.estimatedTime
      });
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

  const awardPoints = async (actionId: string, relatedId?: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/points/award', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          actionId,
          relatedId,
          metadata: { lessonId: 'emergency-fund' }
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Points Earned! 🎉",
          description: data.message,
        });
        return data;
      }
    } catch (error) {
      console.error('Failed to award points:', error);
    }
  };

  const handleNextStep = async () => {
    if (!hasEarnedLessonPoints) {
      await awardPoints('lesson_complete', 'emergency-fund');
      setHasEarnedLessonPoints(true);
    }
    setCurrentStep('quiz');
  };

  const handleSubmitQuiz = async () => {
    setShowResults(true);

    // Award points for quiz completion if passed
    const score = calculateScore();
    if (score >= 70 && !hasEarnedQuizPoints) {
      await awardPoints('quiz_complete', 'emergency-fund-quiz');
      setHasEarnedQuizPoints(true);
    }
  };

  const calculateScore = () => {
      const correctAnswers = selectedAnswers.filter((answer, index) =>
          answer === lesson!.quiz[index].correctAnswer
      ).length;
      return Math.round((correctAnswers / lesson!.quiz.length) * 100);
  };

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
                <p className="text-green-600 mb-4">🎉 Great job! You scored {score}%</p>
                      {score >= 70 ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <p className="text-green-800 font-medium">Congratulations! You passed the quiz.</p>
                          <p className="text-green-600 text-sm mt-1">You've successfully completed this lesson.</p>
                          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-blue-800 font-medium">🎁 Points Earned!</p>
                            <p className="text-blue-600 text-sm">Lesson completion: +10 points | Quiz completion: +15 points</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <p className="text-orange-800 font-medium">Keep practicing!</p>
                          <p className="text-orange-600 text-sm mt-1">You need 70% or higher to pass. Review the lesson and try again.</p>
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
                  </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}