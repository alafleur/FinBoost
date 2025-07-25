import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import UpgradePrompt from "@/components/UpgradePrompt";
import { getUserAccessInfo, canAccessModule, getUpgradeMessage, type UserForAccess } from "@shared/userAccess";
import { trackEvent } from "@/lib/analytics";
import { trackGTMEvent, trackGTMUserAction } from "@/lib/gtm";

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
  const params = useParams();
  const [currentStep, setCurrentStep] = useState<'content' | 'quiz'>('content');
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
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
  const [user, setUser] = useState<UserForAccess | null>(null);
  const [accessBlocked, setAccessBlocked] = useState(false);
  const [completionData, setCompletionData] = useState<{
    pointsEarned: number;
    streakBonus: number;
    newStreak: number;
  } | null>(null);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        console.log('🔄 LESSON: Starting lesson fetch...');
        // Get lesson ID from wouter URL params
        const lessonId = params.id;
        console.log('🔄 LESSON: Lesson ID from params:', lessonId);
        console.log('🔄 LESSON: Full params object:', params);
        
        if (!lessonId) {
          console.log('❌ LESSON: No lesson ID found in params, redirecting to education');
          console.log('❌ LESSON: Current pathname:', window.location.pathname);
          setLocation('/education');
          return;
        }

        // Fetch user data first
        const token = localStorage.getItem('token');
        console.log('🔄 LESSON: Token exists:', !!token);
        
        // Validate token format before using it
        if (!token) {
          console.log('❌ LESSON: No token, redirecting to auth');
          setLocation('/auth');
          return;
        }
        
        // Check if token is malformed (basic JWT validation)
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          console.log('❌ LESSON: Malformed token detected, cleaning up and redirecting');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setLocation('/auth');
          return;
        }

        console.log('🔄 LESSON: Fetching user data...');
        const userResponse = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('🔄 LESSON: User response status:', userResponse.status);
        if (!userResponse.ok) {
          console.log('❌ LESSON: User fetch failed, status:', userResponse.status);
          // Handle specific authentication errors
          if (userResponse.status === 401 || userResponse.status === 500) {
            console.log('❌ LESSON: Authentication error, cleaning up token and redirecting');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
          setLocation('/auth');
          return;
        }

        const userData = await userResponse.json();
        console.log('✅ LESSON: User data received:', userData);
        setUser(userData.user);

        // Fetch published modules from API
        console.log('🔄 LESSON: Fetching modules...');
        const response = await fetch('/api/modules');
        const data = await response.json();
        console.log('🔄 LESSON: Modules response:', data);
        
        if (data.success) {
          console.log('🔄 LESSON: Looking for module with ID:', lessonId);
          // Find the specific module by ID
          const moduleData = data.modules.find((m: any) => m.id.toString() === lessonId);
          console.log('🔄 LESSON: Found module data:', moduleData);
          
          if (moduleData) {
            // Check if user can access this module
            const canAccess = canAccessModule(userData.user, moduleData);
            console.log('🔄 LESSON: Can access module:', canAccess);
            
            if (!canAccess) {
              console.log('❌ LESSON: Access blocked for module');
              setAccessBlocked(true);
            }

            // Convert module data to lesson format
            console.log('🔄 LESSON: Parsing quiz data...');
            const quizData = moduleData.quiz ? JSON.parse(moduleData.quiz) : [];
            console.log('✅ LESSON: Quiz data parsed:', quizData);
            
            const lessonObj = {
              id: moduleData.id,
              title: moduleData.title,
              category: moduleData.category,
              difficulty: 'Beginner' as const,
              timeEstimate: '15 min',
              points: moduleData.pointsReward,
              content: moduleData.content || 'Content not available',
              quiz: quizData,
              completed: false
            };
            console.log('✅ LESSON: Setting lesson object:', lessonObj);
            setLesson(lessonObj);
          } else {
            console.log('❌ LESSON: Module not found, redirecting to education');
            setLocation('/education');
          }
        } else {
          console.log('❌ LESSON: API response not successful, redirecting to education');
          setLocation('/education');
        }
      } catch (error) {
        console.error('❌ LESSON: Error fetching lesson:', error);
        setLocation('/education');
      }
    };

    fetchLesson();
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

  const finishQuiz = async () => {
    const correctAnswers = selectedAnswers.filter((answer, index) => 
      answer === lesson!.quiz[index].correctAnswer
    ).length;

    const finalScore = Math.round((correctAnswers / lesson!.quiz.length) * 100);
    setScore(finalScore);
    setShowResults(true);
    setQuizCompleted(true);

    // Award points if score is 66% or higher
    if (finalScore >= 66) {
      try {
        const token = localStorage.getItem('token');

        // Mark lesson as complete in database using the lesson ID
        const completionResponse = await fetch(`/api/lessons/${lesson!.id}/complete`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (completionResponse.ok) {
          const completionResult = await completionResponse.json();

          // Store completion data for display in quiz results
          setCompletionData({
            pointsEarned: completionResult.pointsEarned,
            streakBonus: completionResult.streakBonus || 0,
            newStreak: completionResult.newStreak || 1
          });

          // Update completed lessons in localStorage
          const completedLessons = JSON.parse(localStorage.getItem('completedLessons') || '[]');

          console.log('Lesson completed successfully:', lesson!.id, completionResult);

          // Track lesson completion event
          trackEvent('lesson_complete', 'education', lesson!.category, completionResult.pointsEarned);
          trackGTMUserAction('lesson_completed', undefined, {
            lesson_id: lesson!.id,
            lesson_title: lesson!.title,
            category: lesson!.category,
            difficulty: lesson!.difficulty,
            points_earned: completionResult.pointsEarned,
            streak_bonus: completionResult.streakBonus
          });

          if (!completedLessons.includes(lesson!.id)) {
            completedLessons.push(lesson!.id);
            localStorage.setItem('completedLessons', JSON.stringify(completedLessons));
            console.log('Updated completed lessons in localStorage:', completedLessons);
          }

          // Update user data in localStorage with new points
          const userData = JSON.parse(localStorage.getItem('user') || '{}');
          userData.totalPoints = (userData.totalPoints || 0) + completionResult.pointsEarned + completionResult.streakBonus;
          localStorage.setItem('user', JSON.stringify(userData));

          toast({
            title: "🎉 Lesson Completed!",
            description: `You earned ${completionResult.pointsEarned} points! ${completionResult.streakBonus > 0 ? `Plus ${completionResult.streakBonus} streak bonus!` : ''}`,
          });

          // Show streak notification if there's a bonus
          if (completionResult.streakBonus > 0) {
            setStreakNotification({
              pointsEarned: completionResult.pointsEarned,
              streakBonus: completionResult.streakBonus,
              newStreak: completionResult.newStreak
            });
          }
        } else {
          // Handle specific error messages from the server
          try {
            const errorResult = await completionResponse.json();
            const errorMessage = errorResult.message || 'Failed to complete lesson';

            console.log('Lesson completion error:', errorMessage);

            toast({
              title: "⚠️ Lesson Already Completed",
              description: errorMessage,
              variant: "destructive",
            });

            // If lesson is already completed, update the UI state
            if (errorMessage.includes('already completed')) {
              setLesson(prevLesson => prevLesson ? { ...prevLesson, completed: true } : null);

              // Also update localStorage to reflect completion
              const completedLessons = JSON.parse(localStorage.getItem('completedLessons') || '[]');
              if (!completedLessons.includes(lesson!.id)) {
                completedLessons.push(lesson!.id);
                localStorage.setItem('completedLessons', JSON.stringify(completedLessons));
              }
            }
          } catch (parseError) {
            console.error('Error parsing completion response:', parseError);
            toast({
              title: "Error",
              description: "Failed to complete lesson - please try again",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('Error completing lesson:', error);
        toast({
          title: "Lesson completed but error updating progress",
          description: "Please refresh the page to see updated progress.",
          variant: "destructive",
        });
      }
    }
  };



  const startQuiz = async () => {
    // No points awarded here - points are only awarded upon successful completion
    // of both lesson content AND quiz with 70% or higher score
    
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

  // Show access blocked message for free users trying to access premium content
  if (accessBlocked && user) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button 
              onClick={() => setLocation('/education')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Lessons
            </Button>
          </div>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-6 w-6" />
                {lesson.title}
              </CardTitle>
              <CardDescription>
                This is premium content. Upgrade to access this lesson and earn points.
              </CardDescription>
            </CardHeader>
          </Card>

          <UpgradePrompt 
            theoreticalPoints={user.theoreticalPoints || 0}
            currentCyclePoints={0}
          />
        </div>
      </div>
    );
  }



  const currentQuestion = lesson.quiz[currentQuestionIndex];
  const isAnswerSelected = selectedAnswers[currentQuestionIndex] !== undefined;

  // Legacy awardPoints function removed - lesson completion now happens in finishQuiz() only

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
                          className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                            selectedAnswers[currentQuestionIndex] === index
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                              selectedAnswers[currentQuestionIndex] === index
                                ? 'border-blue-500 bg-blue-500'
                                : 'border-gray-300'
                            }`}>
                              {selectedAnswers[currentQuestionIndex] === index && (
                                <div className="w-2.5 h-2.5 bg-white rounded-full" />
                              )}
                            </div>
                            <span className={`${
                              selectedAnswers[currentQuestionIndex] === index
                                ? 'text-blue-900 font-medium'
                                : 'text-gray-700'
                            }`}>{option}</span>
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
                            <p className="text-blue-600 text-sm">
                              {completionData ? (
                                <>
                                  Total: +{completionData.pointsEarned} points
                                  {completionData.streakBonus > 0 && (
                                    <> | Streak bonus: +{completionData.streakBonus} points</>
                                  )}
                                </>
                              ) : (
                                `Total: +${lesson.points} points`
                              )}
                            </p>
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