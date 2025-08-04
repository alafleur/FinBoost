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
  const [quizStarted, setQuizStarted] = useState(false);
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

  const goBackToLesson = () => {
    setCurrentStep('content');
    // Preserve quiz progress when going back to lesson
    // Only reset results if actually completed
    if (showResults) {
      setShowResults(false);
      setQuizCompleted(false);
      setScore(0);
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
    // of both lesson content AND quiz with 66% or higher score
    
    setCurrentStep('quiz');
    setCurrentQuestionIndex(0);
    setQuizStarted(true);
    // Only reset answers if starting fresh, preserve if returning to quiz
    if (selectedAnswers.length === 0) {
      setSelectedAnswers(new Array(lesson!.quiz.length).fill(undefined));
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/education')}
              className="flex items-center gap-2 hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Education
            </Button>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 px-3 py-1 flex items-center gap-1.5 shadow-sm">
                  <Star className="h-3 w-3" />
                  {lesson.points} points
                </Badge>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{lesson.title}</h1>
                <p className="text-blue-600 font-medium mt-1">{lesson.category}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Module Navigation Progress */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant={currentStep === 'content' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentStep('content')}
                className={`flex items-center gap-2 transition-all duration-200 ${
                  currentStep === 'content' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md hover:from-blue-600 hover:to-purple-700' 
                    : 'hover:bg-blue-50 text-gray-600 hover:text-blue-700'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Lesson Content</span>
                <span className="sm:hidden">Content</span>
              </Button>
              <div className="w-6 sm:w-8 h-px bg-gradient-to-r from-blue-300 to-purple-300"></div>
              <Button
                variant={currentStep === 'quiz' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setCurrentStep('quiz');
                  if (currentQuestionIndex === -1) setCurrentQuestionIndex(0);
                }}
                className={`flex items-center gap-2 transition-all duration-200 ${
                  currentStep === 'quiz' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md hover:from-blue-600 hover:to-purple-700' 
                    : 'hover:bg-blue-50 text-gray-600 hover:text-blue-700'
                }`}
                disabled={!quizStarted}
              >
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Quiz ({lesson.quiz.length} questions)</span>
                <span className="sm:hidden">Quiz ({lesson.quiz.length})</span>
              </Button>
            </div>
            {currentStep === 'quiz' && !showResults && (
              <div className="text-sm font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full border">
                Question {currentQuestionIndex + 1} of {lesson.quiz.length}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {currentStep === 'content' ? (
          /* Lesson Content */
          <div className="space-y-8">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">Lesson Content</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div 
                  className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700 prose-p:leading-relaxed prose-li:text-gray-700 prose-strong:text-gray-900 prose-ul:space-y-2 prose-li:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: lesson.content }}
                />
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button 
                onClick={startQuiz}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3 text-lg font-semibold flex items-center gap-3"
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
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-800">
                        Question {currentQuestionIndex + 1} of {lesson.quiz.length}
                      </span>
                      <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        {Math.round(((currentQuestionIndex + 1) / lesson.quiz.length) * 100)}% Complete
                      </span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={((currentQuestionIndex + 1) / lesson.quiz.length) * 100} 
                        className="h-3 bg-gray-200"
                      />
                      <div 
                        className="absolute top-0 left-0 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${((currentQuestionIndex + 1) / lesson.quiz.length) * 100}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Current Question */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg border-b border-gray-100">
                    <CardTitle className="text-xl font-bold text-gray-900 leading-relaxed">{currentQuestion.question}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {currentQuestion.options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => handleAnswerSelect(index)}
                          className={`w-full p-5 text-left rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
                            selectedAnswers[currentQuestionIndex] === index
                              ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg transform scale-[1.02]'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                              selectedAnswers[currentQuestionIndex] === index
                                ? 'border-blue-500 bg-gradient-to-r from-blue-500 to-purple-600 shadow-sm'
                                : 'border-gray-300 hover:border-blue-400'
                            }`}>
                              {selectedAnswers[currentQuestionIndex] === index && (
                                <div className="w-3 h-3 bg-white rounded-full" />
                              )}
                            </div>
                            <span className={`text-base leading-relaxed ${
                              selectedAnswers[currentQuestionIndex] === index
                                ? 'text-blue-900 font-semibold'
                                : 'text-gray-700 font-medium'
                            }`}>{option}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quiz Navigation */}
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={goBackToLesson}
                      className="flex items-center gap-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span className="hidden sm:inline">Back to Lesson</span>
                      <span className="sm:hidden">Lesson</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </Button>
                  </div>
                  <Button
                    onClick={handleNextQuestion}
                    disabled={!isAnswerSelected}
                    className={`flex items-center gap-2 px-6 py-2 font-semibold transition-all duration-200 ${
                      currentQuestionIndex === lesson.quiz.length - 1
                        ? 'bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl'
                        : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg`}
                  >
                    {currentQuestionIndex === lesson.quiz.length - 1 ? 'Finish Quiz' : 'Next Question'}
                  </Button>
                </div>
              </>
            ) : (
              /* Quiz Results */
              <Card className="shadow-lg border-0 bg-white">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto mb-6 relative">
                    {score >= 70 ? (
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <Trophy className="h-10 w-10 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <Target className="h-10 w-10 text-white" />
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {score >= 70 ? 'Congratulations!' : 'Keep Learning!'}
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600 mt-2">
                    You scored {score}% ({selectedAnswers.filter((answer, index) => 
                      answer === lesson.quiz[index].correctAnswer
                    ).length} out of {lesson.quiz.length} correct)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {score >= 70 ? (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm font-bold">✓</span>
                          </div>
                          <p className="text-gray-800 font-semibold text-lg">Great job! You scored {score}%</p>
                        </div>
                        <p className="text-blue-700 font-medium mb-2">Congratulations! You passed the quiz.</p>
                        <p className="text-gray-600 text-sm">You've successfully completed this lesson.</p>
                      </div>
                      
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <Trophy className="h-4 w-4 text-white" />
                          </div>
                          <p className="text-purple-800 font-semibold text-lg">Points Earned!</p>
                        </div>
                        <p className="text-purple-700 font-medium">
                          {completionData ? (
                            <>
                              Total: +{completionData.pointsEarned} points
                              {completionData.streakBonus > 0 && (
                                <span className="block text-sm text-purple-600 mt-1">
                                  Streak bonus: +{completionData.streakBonus} points
                                </span>
                              )}
                            </>
                          ) : (
                            `Total: +${lesson.points} points`
                          )}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                          <Target className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-orange-800 font-semibold text-lg">Keep practicing!</p>
                      </div>
                      <p className="text-orange-700 text-sm">You need 70% or higher to pass. Review the lesson and try again.</p>
                    </div>
                  )}

                  {/* Show correct answers */}
                  <div className="space-y-4 mt-6">
                    <h4 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-3 w-3 text-white" />
                      </div>
                      Review Answers:
                    </h4>
                    {lesson.quiz.map((question, index) => (
                      <div key={question.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            {selectedAnswers[index] === question.correctAnswer ? (
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                                <CheckCircle className="h-4 w-4 text-white" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-sm">
                                <XCircle className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-3">
                            <p className="font-semibold text-gray-800 leading-relaxed">{question.question}</p>
                            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 border border-gray-200">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium text-gray-800">Correct answer:</span> {question.options[question.correctAnswer]}
                              </p>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed bg-purple-50 rounded-lg p-3 border border-purple-100">
                              {question.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    </div>

                  <div className="flex gap-4 pt-6">
                    <Button 
                      variant="outline" 
                      onClick={() => setLocation('/education')}
                      className="flex-1 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
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
                        className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
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