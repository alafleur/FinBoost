import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Trophy,
  Calendar,
  Activity,
  Star,
  Users
} from 'lucide-react';

interface PredictionQuestion {
  id: number;
  questionText: string;
  options: string[];
  submissionDeadline: string;
  resultDeterminationTime: string;
  pointAwards: number[];
  isPublished: boolean;
  isResultDetermined: boolean;
  correctOptionIndex?: number;
  userPrediction?: {
    id: number;
    selectedOptionIndex: number;
    submittedAt: string;
    pointsAwarded?: number;
  };
}

interface UserPrediction {
  id: number;
  predictionQuestionId: number;
  selectedOptionIndex: number;
  submittedAt: string;
  pointsAwarded?: number;
  question: {
    questionText: string;
    options: string[];
    isResultDetermined: boolean;
    correctOptionIndex?: number;
  };
}

interface UserStats {
  totalPredictions: number;
  correctPredictions: number;
  totalPointsEarned: number;
  accuracyRate: number;
}

interface PredictionsContentProps {
  user: any;
  onUpgradeClick: () => void;
}

export default function PredictionsContent({ user, onUpgradeClick }: PredictionsContentProps) {
  console.log('PredictionsContent rendered with user:', user);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeQuestions, setActiveQuestions] = useState<PredictionQuestion[]>([]);
  const [userPredictions, setUserPredictions] = useState<UserPrediction[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<PredictionQuestion | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.subscriptionStatus === 'active') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch active questions, user predictions, and stats in parallel
      const [activeResponse, historyResponse, statsResponse] = await Promise.all([
        fetch('/api/predictions/active', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/predictions/my-predictions', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/predictions/my-stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (activeResponse.ok) {
        const activeData = await activeResponse.json();
        setActiveQuestions(activeData.questions || []);
      }

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setUserPredictions(historyData.predictions || []);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setUserStats(statsData.stats);
      }
    } catch (error) {
      console.error('Failed to fetch prediction data:', error);
      toast({
        title: "Error",
        description: "Failed to load prediction data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const submitPrediction = async () => {
    if (!selectedQuestion || selectedOptionIndex === null) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/predictions/${selectedQuestion.id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          selectedOptionIndex
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Your prediction has been submitted!"
        });
        setShowSubmissionDialog(false);
        setSelectedQuestion(null);
        setSelectedOptionIndex(null);
        await fetchData(); // Refresh data
      } else {
        const error = await response.text();
        toast({
          title: "Error",
          description: `Failed to submit prediction: ${error}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit prediction",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    return 'Less than 1 hour remaining';
  };

  const isPredictionExpired = (deadline: string) => {
    return new Date(deadline) <= new Date();
  };

  const hasUserPredicted = (questionId: number) => {
    return activeQuestions.find(q => q.id === questionId)?.userPrediction;
  };

  const getResultBadge = (prediction: UserPrediction) => {
    if (!prediction.question.isResultDetermined) {
      return <Badge variant="outline">Pending</Badge>;
    }
    
    const pointsEarned = prediction.pointsAwarded || 0;
    const badgeVariant = pointsEarned > 0 ? "default" : "secondary";
    
    return (
      <Badge variant={badgeVariant}>
        Earned: {pointsEarned} pts
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading predictions...</p>
        </div>
      </div>
    );
  }

  // Non-premium user content
  if (user?.subscriptionStatus !== 'active') {
    console.log('User not premium, showing upgrade prompt. User status:', user?.subscriptionStatus);
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-12">
            <Star className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
            <p className="text-gray-600 mb-6">
              Upgrade to premium to access prediction questions and earn bonus points
            </p>
            <Button onClick={onUpgradeClick}>
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('User is premium, rendering main component. Stats:', userStats, 'Active questions:', activeQuestions.length);

  return (
    <div className="space-y-6">
      {/* User Stats Overview */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.totalPredictions}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Tickets</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userStats.totalPredictions > 0 ? Math.round(userStats.totalPointsEarned / userStats.totalPredictions) : 0}
              </div>
              <p className="text-xs text-muted-foreground">Tickets per prediction</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tickets Earned</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.totalPointsEarned}</div>
              <p className="text-xs text-muted-foreground">From predictions</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Questions</TabsTrigger>
          <TabsTrigger value="history">My Predictions</TabsTrigger>
        </TabsList>

        {/* Active Questions Tab */}
        <TabsContent value="active" className="space-y-6">
          {activeQuestions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Questions</h3>
                <p className="text-gray-600">
                  New prediction questions will appear here when they become available.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {activeQuestions.map((question) => {
                const userPrediction = hasUserPredicted(question.id);
                const isExpired = isPredictionExpired(question.submissionDeadline);
                
                return (
                  <Card key={question.id} className={userPrediction ? 'border-green-200 bg-green-50' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{question.questionText}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {getTimeRemaining(question.submissionDeadline)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Results: {formatDate(question.resultDeterminationTime)}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {userPrediction && (
                            <Badge variant="default">Submitted</Badge>
                          )}
                          {isExpired && !userPrediction && (
                            <Badge variant="secondary">Expired</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      {userPrediction ? (
                        <div className="space-y-4">
                          <div className="bg-white p-4 rounded-lg border">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">Your Prediction:</span>
                              <span className="text-sm text-gray-600">
                                {formatDate(userPrediction.submittedAt)}
                              </span>
                            </div>
                            <p className="text-lg">
                              {question.options?.[userPrediction.selectedOptionIndex] || 'Unknown option'}
                            </p>
                            {userPrediction.pointsAwarded && (
                              <p className="text-sm text-green-600 mt-2">
                                +{userPrediction.pointsAwarded} points awarded
                              </p>
                            )}
                          </div>
                          
                          {question.isResultDetermined && question.correctOptionIndex !== undefined && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-blue-900">Correct Answer:</span>
                              </div>
                              <p className="text-blue-900">
                                {question.options?.[question.correctOptionIndex] || 'Unknown option'}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="grid gap-3">
                            {question.options?.map((option, index) => (
                              <div
                                key={index}
                                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                  isExpired 
                                    ? 'bg-gray-100 cursor-not-allowed' 
                                    : 'hover:bg-blue-50 hover:border-blue-300'
                                }`}
                                onClick={() => {
                                  if (!isExpired) {
                                    setSelectedQuestion(question);
                                    setSelectedOptionIndex(index);
                                    setShowSubmissionDialog(true);
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={isExpired ? 'text-gray-500' : ''}>{option}</span>
                                  <span className="text-sm text-gray-600">
                                    +{question.pointAwards?.[index] || 0} pts
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {isExpired && (
                            <div className="text-center text-gray-500 py-4">
                              <AlertCircle className="w-5 h-5 mx-auto mb-2" />
                              Submission deadline has passed
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Prediction History Tab */}
        <TabsContent value="history" className="space-y-6">
          {userPredictions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Predictions Yet</h3>
                <p className="text-gray-600">
                  Your prediction history will appear here after you submit your first prediction.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {userPredictions.map((prediction) => (
                <Card key={prediction.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-medium mb-2">{prediction.question.questionText}</h3>
                        <p className="text-gray-600 mb-2">
                          Your prediction: <span className="font-medium">{prediction.question.options?.[prediction.selectedOptionIndex] || 'Unknown option'}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Submitted {formatDate(prediction.submittedAt)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getResultBadge(prediction)}
                      </div>
                    </div>
                    
                    {prediction.question.isResultDetermined && prediction.question.correctOptionIndex !== undefined && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm">
                          <span className="text-gray-600">Correct answer:</span>{' '}
                          <span className="font-medium">{prediction.question.options?.[prediction.question.correctOptionIndex] || 'Unknown option'}</span>
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Submission Confirmation Dialog */}
      <Dialog open={showSubmissionDialog} onOpenChange={setShowSubmissionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Your Prediction</DialogTitle>
            <DialogDescription>
              Once submitted, you cannot change your prediction for this question.
            </DialogDescription>
          </DialogHeader>
          
          {selectedQuestion && selectedOptionIndex !== null && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Question:</h4>
                <p className="text-gray-700">{selectedQuestion.questionText}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Your Prediction:</h4>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="font-medium text-blue-900">
                    {selectedQuestion.options?.[selectedOptionIndex] || 'Unknown option'}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Potential reward: +{selectedQuestion.pointAwards?.[selectedOptionIndex] || 0} points
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSubmissionDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={submitPrediction} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Prediction'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}