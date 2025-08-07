import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
  Activity,
  X
} from 'lucide-react';

interface PredictionQuestion {
  id: number;
  cycleSettingId: number;
  questionText: string;
  options: string[];
  submissionDeadline: string;
  resultDeterminationTime: string;
  pointAwards: number[];
  isPublished: boolean;
  publishedAt?: string;
  isResultDetermined: boolean;
  pointsDistributed?: boolean;
  correctOptionIndex?: number;
  resultDeterminedAt?: string;
  createdAt: string;
  updatedAt: string;
  cycle?: {
    cycleName: string;
  };
}

interface PredictionStats {
  totalSubmissions: number;
  optionCounts: number[];
}

interface CycleSetting {
  id: number;
  cycleName: string;
  cycleType: string;
  isActive: boolean;
}

interface PredictionsTabProps {
  cycleSettings: CycleSetting[];
  onRefresh: () => void;
}

export default function PredictionsTab({ cycleSettings, onRefresh }: PredictionsTabProps) {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<PredictionQuestion[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<PredictionQuestion | null>(null);
  const [questionStats, setQuestionStats] = useState<PredictionStats | null>(null);

  // Form state for creating/editing questions
  const [questionForm, setQuestionForm] = useState({
    cycleSettingId: '',
    questionText: '',
    options: ['', ''], // Start with 2 options
    submissionDeadline: '',
    resultDeterminationTime: ''
  });

  // Result determination form
  const [resultForm, setResultForm] = useState({
    correctOptionIndex: 0,
    pointsPerOption: [] as number[],
    notes: ''
  });

  // Get active cycle on load
  useEffect(() => {
    const activeCycle = cycleSettings.find(c => c.isActive);
    if (activeCycle && !selectedCycle) {
      setSelectedCycle(activeCycle.id);
    }
  }, [cycleSettings, selectedCycle]);

  // Fetch questions when cycle changes
  useEffect(() => {
    if (selectedCycle) {
      fetchQuestions();
    }
  }, [selectedCycle]);

  const fetchQuestions = async () => {
    if (!selectedCycle) return;
    
    setLoading(true);
    try {
      // Add timestamp to bust cache
      const timestamp = Date.now();
      const response = await fetch(`/api/admin/prediction-questions/cycle/${selectedCycle}?t=${timestamp}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch prediction questions",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to fetch prediction questions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createQuestion = async () => {
    try {
      const response = await fetch('/api/admin/prediction-questions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...questionForm,
          cycleSettingId: parseInt(questionForm.cycleSettingId)
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Prediction question created successfully"
        });
        setShowCreateDialog(false);
        resetForm();
        fetchQuestions();
      } else {
        const error = await response.text();
        toast({
          title: "Error",
          description: `Failed to create question: ${error}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create prediction question",
        variant: "destructive"
      });
    }
  };

  const updateQuestion = async () => {
    if (!selectedQuestion) return;
    
    try {
      const response = await fetch(`/api/admin/prediction-questions/${selectedQuestion.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...questionForm,
          cycleSettingId: parseInt(questionForm.cycleSettingId)
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Prediction question updated successfully"
        });
        setShowEditDialog(false);
        setSelectedQuestion(null);
        resetForm();
        fetchQuestions();
      } else {
        const error = await response.text();
        toast({
          title: "Error",
          description: `Failed to update question: ${error}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update prediction question",
        variant: "destructive"
      });
    }
  };

  const publishQuestion = async (questionId: number) => {
    try {
      const response = await fetch(`/api/admin/prediction-questions/${questionId}/publish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Question published successfully"
        });
        fetchQuestions();
      } else {
        toast({
          title: "Error",
          description: "Failed to publish question",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish question",
        variant: "destructive"
      });
    }
  };

  const determineResult = async () => {
    if (!selectedQuestion) return;
    
    try {
      const response = await fetch(`/api/admin/prediction-questions/${selectedQuestion.id}/results`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          correctAnswerIndex: resultForm.correctOptionIndex,
          pointsPerOption: resultForm.pointsPerOption,
          notes: resultForm.notes
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Result determined and tickets awarded"
        });
        setShowResultDialog(false);
        fetchQuestions();
      } else {
        const error = await response.text();
        toast({
          title: "Error",
          description: `Failed to determine result: ${error}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to determine result",
        variant: "destructive"
      });
    }
  };

  const distributePoints = async (questionId: number) => {
    try {
      const response = await fetch(`/api/admin/prediction-questions/${questionId}/distribute-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: `Tickets distributed successfully! ${data.distributionResult.usersAwarded} users received ${data.distributionResult.totalPointsAwarded} total tickets.`
        });
        fetchQuestions();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to distribute tickets",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to distribute tickets",
        variant: "destructive"
      });
    }
  };

  const fetchQuestionStats = async (questionId: number) => {
    try {
      const response = await fetch(`/api/admin/prediction-questions/${questionId}/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQuestionStats(data.stats);
        setShowStatsDialog(true);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch question statistics",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch question statistics",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setQuestionForm({
      cycleSettingId: selectedCycle?.toString() || '',
      questionText: '',
      options: ['', ''],
      submissionDeadline: '',
      resultDeterminationTime: ''
    });
  };

  const addOption = () => {
    setQuestionForm(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index: number) => {
    if (questionForm.options.length <= 2) return; // Minimum 2 options
    
    setQuestionForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const updateOption = (index: number, value: string) => {
    setQuestionForm(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { timeZone: 'America/New_York' }) + 
           ' at ' + 
           date.toLocaleTimeString('en-US', { 
             hour: '2-digit', 
             minute: '2-digit',
             timeZone: 'America/New_York'
           }) + ' EST';
  };

  const getStatusBadge = (question: PredictionQuestion) => {
    if (question.isResultDetermined) {
      return <Badge variant="secondary">Result Determined</Badge>;
    } else if (question.isPublished) {
      return <Badge variant="default">Published</Badge>;
    } else {
      return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Prediction System</h2>
          <p className="text-gray-600">Manage prediction questions and track engagement</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Question
        </Button>
      </div>

      {/* Cycle Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Cycle</CardTitle>
          <CardDescription>Choose which cycle to manage prediction questions for</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCycle?.toString()} onValueChange={(value) => setSelectedCycle(parseInt(value))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a cycle" />
            </SelectTrigger>
            <SelectContent>
              {cycleSettings.map((cycle) => (
                <SelectItem key={cycle.id} value={cycle.id.toString()}>
                  {cycle.cycleName} {cycle.isActive && '(Active)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Questions Overview */}
      {selectedCycle && (
        <Card>
          <CardHeader>
            <CardTitle>Prediction Questions</CardTitle>
            <CardDescription>
              Questions for {cycleSettings.find(c => c.id === selectedCycle)?.cycleName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading questions...</div>
            ) : questions.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
                <p className="text-gray-600 mb-4">Create your first prediction question to get started.</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Question
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Options</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell>
                        <div className="max-w-xs truncate" title={question.questionText}>
                          {question.questionText}
                        </div>
                      </TableCell>
                      <TableCell>{question.options.length} options</TableCell>
                      <TableCell>{getStatusBadge(question)}</TableCell>
                      <TableCell>{formatDate(question.submissionDeadline)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => fetchQuestionStats(question.id)}
                          >
                            <BarChart3 className="w-4 h-4" />
                          </Button>
                          
                          {!question.isPublished && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedQuestion(question);
                                  setQuestionForm({
                                    cycleSettingId: question.cycleSettingId.toString(),
                                    questionText: question.questionText,
                                    options: [...question.options],
                                    submissionDeadline: new Date(question.submissionDeadline).toISOString().slice(0, 16),
                                    resultDeterminationTime: new Date(question.resultDeterminationTime).toISOString().slice(0, 16)
                                  });
                                  setShowEditDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => publishQuestion(question.id)}
                              >
                                Publish
                              </Button>
                            </>
                          )}
                          
                          {question.isPublished && !question.isResultDetermined && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setSelectedQuestion(question);
                                setResultForm({
                                  correctOptionIndex: 0,
                                  pointsPerOption: new Array(question.options.length).fill(10),
                                  notes: ''
                                });
                                setShowResultDialog(true);
                              }}
                            >
                              Set Result
                            </Button>
                          )}
                          
                          {question.isResultDetermined && !question.pointsDistributed && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => distributePoints(question.id)}
                            >
                              Distribute Points
                            </Button>
                          )}
                          
                          {question.pointsDistributed && (
                            <Badge variant="secondary" className="text-xs">
                              Points Distributed
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Question Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Prediction Question</DialogTitle>
            <DialogDescription>
              Create a new prediction question for user engagement
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="cycle">Cycle</Label>
              <Select value={questionForm.cycleSettingId} onValueChange={(value) => 
                setQuestionForm(prev => ({ ...prev, cycleSettingId: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select cycle" />
                </SelectTrigger>
                <SelectContent>
                  {cycleSettings.map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id.toString()}>
                      {cycle.cycleName} {cycle.isActive && '(Active)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="questionText">Question</Label>
              <Textarea
                id="questionText"
                value={questionForm.questionText}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, questionText: e.target.value }))}
                placeholder="What prediction question do you want to ask?"
                rows={3}
              />
            </div>

            <div>
              <Label>Answer Options</Label>
              <div className="space-y-2">
                {questionForm.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1"
                    />
                    {questionForm.options.length > 2 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeOption(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addOption}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="submissionDeadline">Submission Deadline</Label>
                <Input
                  type="datetime-local"
                  id="submissionDeadline"
                  value={questionForm.submissionDeadline}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, submissionDeadline: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1">Enter time in EST timezone</p>
              </div>
              <div>
                <Label htmlFor="resultDeterminationTime">Result Determination</Label>
                <Input
                  type="datetime-local"
                  id="resultDeterminationTime"
                  value={questionForm.resultDeterminationTime}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, resultDeterminationTime: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1">Enter time in EST timezone</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createQuestion}>
                Create Question
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Prediction Question</DialogTitle>
            <DialogDescription>
              Update the prediction question details
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="cycle">Cycle</Label>
              <Select value={questionForm.cycleSettingId} onValueChange={(value) => 
                setQuestionForm(prev => ({ ...prev, cycleSettingId: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select cycle" />
                </SelectTrigger>
                <SelectContent>
                  {cycleSettings.map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id.toString()}>
                      {cycle.cycleName} {cycle.isActive && '(Active)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="questionText">Question</Label>
              <Textarea
                id="questionText"
                value={questionForm.questionText}
                onChange={(e) => setQuestionForm(prev => ({ ...prev, questionText: e.target.value }))}
                placeholder="What prediction question do you want to ask?"
                rows={3}
              />
            </div>

            <div>
              <Label>Answer Options</Label>
              <div className="space-y-2">
                {questionForm.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1"
                    />
                    {questionForm.options.length > 2 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeOption(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addOption}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="submissionDeadline">Submission Deadline</Label>
                <Input
                  type="datetime-local"
                  id="submissionDeadline"
                  value={questionForm.submissionDeadline}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, submissionDeadline: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1">Enter time in EST timezone</p>
              </div>
              <div>
                <Label htmlFor="resultDeterminationTime">Result Determination</Label>
                <Input
                  type="datetime-local"
                  id="resultDeterminationTime"
                  value={questionForm.resultDeterminationTime}
                  onChange={(e) => setQuestionForm(prev => ({ ...prev, resultDeterminationTime: e.target.value }))}
                />
                <p className="text-xs text-gray-500 mt-1">Enter time in EST timezone</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={updateQuestion}>
                Update Question
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Statistics Dialog */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Question Statistics</DialogTitle>
            <DialogDescription>
              User engagement and response distribution
            </DialogDescription>
          </DialogHeader>
          
          {questionStats && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{questionStats.totalSubmissions}</div>
                <div className="text-gray-600">Total Submissions</div>
              </div>
              
              <div className="space-y-2">
                <Label>Response Distribution</Label>
                {questionStats.optionCounts.map((count, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span>{String.fromCharCode(65 + index)}</span>
                    <span>{count} responses</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Result Determination Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Determine Result</DialogTitle>
            <DialogDescription>
              Select the correct answer to award points to users
            </DialogDescription>
          </DialogHeader>
          
          {selectedQuestion && (
            <div className="space-y-4">
              <div>
                <Label>Question</Label>
                <p className="text-sm text-gray-600">{selectedQuestion.questionText}</p>
              </div>
              
              <div>
                <Label>Correct Answer</Label>
                <Select 
                  value={resultForm.correctOptionIndex.toString()} 
                  onValueChange={(value) => setResultForm(prev => ({ ...prev, correctOptionIndex: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedQuestion.options.map((option, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {String.fromCharCode(65 + index)}: {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Point Allocation per Option</Label>
                <div className="space-y-2">
                  {selectedQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1">
                        <span className="text-sm font-medium">{String.fromCharCode(65 + index)}:</span>
                        <span className="text-sm text-gray-600 ml-2">{option}</span>
                      </div>
                      <Input
                        type="number"
                        value={resultForm.pointsPerOption[index] || 0}
                        onChange={(e) => {
                          const newPoints = [...resultForm.pointsPerOption];
                          newPoints[index] = parseInt(e.target.value) || 0;
                          setResultForm(prev => ({ ...prev, pointsPerOption: newPoints }));
                        }}
                        placeholder="Points"
                        className="w-20"
                        min="0"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Set how many points users who selected each option will receive. Allows for nuanced scoring (e.g., partial credit for close predictions).
                </p>
              </div>
              
              <div>
                <Label htmlFor="notes">Admin Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={resultForm.notes}
                  onChange={(e) => setResultForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any notes about this result determination..."
                  rows={2}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowResultDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={determineResult}>
                  Determine Result
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}