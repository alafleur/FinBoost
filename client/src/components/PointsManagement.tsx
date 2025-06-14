
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Trophy, 
  Star, 
  Upload, 
  CheckCircle, 
  Clock, 
  XCircle,
  Target,
  TrendingUp,
  Award,
  DollarSign,
  Activity,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FileUpload from './FileUpload';

interface PointsAction {
  id: string;
  name: string;
  basePoints: number;
  maxDaily?: number;
  maxTotal?: number;
  requiresProof: boolean;
  category: 'education' | 'action' | 'social' | 'achievement';
  description: string;
}

interface PointsHistoryEntry {
  id: number;
  points: number;
  action: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  metadata?: any;
}

interface User {
  id: number;
  totalPoints: number;
  currentMonthPoints: number;
  tier: string;
}

export default function PointsManagement() {
  const [availableActions, setAvailableActions] = useState<PointsAction[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsHistoryEntry[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [proofDescription, setProofDescription] = useState('');
  const [uploadedFile, setUploadedFile] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    fetchPointsData();
  }, []);

  const fetchPointsData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch available actions
      const actionsResponse = await fetch('/api/points/actions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (actionsResponse.ok) {
        const actionsData = await actionsResponse.json();
        setAvailableActions(actionsData.actions);
      }

      // Fetch points history
      const historyResponse = await fetch('/api/points/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setPointsHistory(historyData.history);
      }

      // Get user data from localStorage
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }

    } catch (error) {
      console.error('Error fetching points data:', error);
      toast({
        title: "Error",
        description: "Failed to load points data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleActionSubmit = async (actionId: string, requiresProof: boolean) => {
    if (requiresProof && (!uploadedFile || !proofDescription)) {
      toast({
        title: "Missing Information",
        description: "Please upload proof and provide a description",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      let response;

      if (requiresProof) {
        // Submit proof-based action
        response = await fetch('/api/points/submit-proof', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            actionId,
            proofUrl: uploadedFile,
            description: proofDescription,
            metadata: { submittedAt: new Date().toISOString() }
          })
        });
      } else {
        // Submit regular action
        response = await fetch('/api/points/award', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            actionId,
            metadata: { submittedAt: new Date().toISOString() }
          })
        });
      }

      if (response.ok) {
        const data = await response.json();
        
        toast({
          title: "Success!",
          description: data.message,
        });

        // Update user data if points were awarded immediately
        if (data.totalPoints !== undefined) {
          const updatedUser = {
            ...user!,
            totalPoints: data.totalPoints,
            currentMonthPoints: data.currentMonthPoints,
            tier: data.tier
          };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }

        // Reset form
        setSelectedAction('');
        setProofDescription('');
        setUploadedFile('');

        // Refresh data
        fetchPointsData();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting action:', error);
      toast({
        title: "Error",
        description: "Failed to submit action",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'education': return <Trophy className="h-5 w-5 text-blue-600" />;
      case 'action': return <Target className="h-5 w-5 text-green-600" />;
      case 'social': return <Star className="h-5 w-5 text-purple-600" />;
      case 'achievement': return <Award className="h-5 w-5 text-yellow-600" />;
      default: return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTierProgress = () => {
    if (!user) return 0;
    
    // This will be dynamic based on actual tier thresholds from the server
    // For now, we'll use a simple calculation
    const currentPoints = user.currentMonthPoints || 0;
    
    // If already at tier3, show 100%
    if (user.tier === 'tier3') return 100;
    
    // For demonstration, we'll use a simple progress calculation
    // In reality, this should use the actual tier thresholds from the API
    return Math.min((currentPoints / 500) * 100, 100);
  };

  const groupActionsByCategory = () => {
    return availableActions.reduce((acc, action) => {
      if (!acc[action.category]) {
        acc[action.category] = [];
      }
      acc[action.category].push(action);
      return acc;
    }, {} as Record<string, PointsAction[]>);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedActionData = availableActions.find(action => action.id === selectedAction);
  const groupedActions = groupActionsByCategory();

  return (
    <div className="space-y-6">
      {/* Points Overview */}
      {user && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Points</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.totalPoints}</div>
              <p className="text-xs text-muted-foreground">Lifetime earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.currentMonthPoints}</div>
              <p className="text-xs text-muted-foreground">Current cycle</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Tier</CardTitle>
              <Trophy className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Badge className={`${user.tier === 'tier3' ? 'bg-yellow-500' : user.tier === 'tier2' ? 'bg-gray-400' : 'bg-orange-600'} text-white`}>
                  {user.tier === 'tier3' ? 'Tier 3' : user.tier === 'tier2' ? 'Tier 2' : 'Tier 1'}
                </Badge>
              </div>
              <Progress value={getTierProgress()} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="earn" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="earn">Earn Points</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="earn" className="space-y-6">
          {/* Action Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Choose an Action</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <Label htmlFor="action">Select Action Type</Label>
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an action to earn points" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(groupedActions).map(([category, actions]) => (
                      <div key={category}>
                        <div className="px-2 py-1 text-sm font-semibold text-gray-600 capitalize">
                          {category}
                        </div>
                        {actions.map((action) => (
                          <SelectItem key={action.id} value={action.id}>
                            <div className="flex items-center space-x-2">
                              {getCategoryIcon(action.category)}
                              <span>{action.name} ({action.basePoints} pts)</span>
                              {action.requiresProof && <Upload className="h-3 w-3" />}
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedActionData && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold flex items-center space-x-2">
                        {getCategoryIcon(selectedActionData.category)}
                        <span>{selectedActionData.name}</span>
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{selectedActionData.description}</p>
                      <div className="mt-2 flex items-center space-x-4 text-sm">
                        <span className="font-medium text-green-600">+{selectedActionData.basePoints} points</span>
                        {selectedActionData.maxDaily && (
                          <span className="text-orange-600">Max {selectedActionData.maxDaily}/day</span>
                        )}
                        {selectedActionData.maxTotal && (
                          <span className="text-blue-600">Max {selectedActionData.maxTotal} total</span>
                        )}
                      </div>
                    </div>
                    {selectedActionData.requiresProof && (
                      <Badge variant="outline" className="text-xs">
                        <Upload className="h-3 w-3 mr-1" />
                        Proof Required
                      </Badge>
                    )}
                  </div>

                  {selectedActionData.requiresProof && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe your achievement (e.g., 'Paid off $500 credit card debt')"
                          value={proofDescription}
                          onChange={(e) => setProofDescription(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Upload Proof</Label>
                        <FileUpload
                          onFileUploaded={(url) => setUploadedFile(url)}
                          onFileRemoved={() => setUploadedFile('')}
                          accept="image/*,.pdf"
                          maxSize={5 * 1024 * 1024} // 5MB
                        />
                      </div>
                    </div>
                  )}

                  <Button 
                    onClick={() => handleActionSubmit(selectedActionData.id, selectedActionData.requiresProof)}
                    disabled={submitting || (selectedActionData.requiresProof && (!uploadedFile || !proofDescription))}
                    className="w-full"
                  >
                    {submitting ? 'Submitting...' : selectedActionData.requiresProof ? 'Submit for Review' : 'Claim Points'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(groupedActions).map(([category, actions]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 capitalize">
                    {getCategoryIcon(category)}
                    <span>{category} Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {actions.slice(0, 3).map((action) => (
                      <div key={action.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{action.name}</span>
                        <Badge variant="secondary">{action.basePoints} pts</Badge>
                      </div>
                    ))}
                    {actions.length > 3 && (
                      <p className="text-xs text-gray-500">+{actions.length - 3} more...</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {pointsHistory.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No activity yet. Start earning points!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pointsHistory.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(entry.status)}
                        <div>
                          <p className="font-medium">{entry.description}</p>
                          <p className="text-sm text-gray-500">{formatDate(entry.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-lg font-bold ${entry.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {entry.points >= 0 ? '+' : ''}{entry.points}
                        </span>
                        {getStatusBadge(entry.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Achievement Badges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">First Points</p>
                  <p className="text-xs text-gray-500">Earned first points</p>
                </div>
                <div className="text-center p-4 border rounded-lg opacity-50">
                  <Star className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium">100 Points</p>
                  <p className="text-xs text-gray-500">Reach 100 points</p>
                </div>
                <div className="text-center p-4 border rounded-lg opacity-50">
                  <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium">Silver Tier</p>
                  <p className="text-xs text-gray-500">Reach silver tier</p>
                </div>
                <div className="text-center p-4 border rounded-lg opacity-50">
                  <DollarSign className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium">First Reward</p>
                  <p className="text-xs text-gray-500">Win monthly reward</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
