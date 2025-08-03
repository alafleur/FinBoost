import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Upload, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  TrendingUp,
  CreditCard,
  PiggyBank,
  Target,
  Users,
  Award,
  X,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import FileUpload from './FileUpload';

interface PointAction {
  id: number;
  actionId: string;
  name: string;
  basePoints: number;
  requiresProof: boolean;
  category: string;
  description: string;
  maxDaily?: number;
  maxMonthly?: number;
  maxTotal?: number;
  isActive: boolean;
  points?: number;
}

interface PointsActionsProps {
  onPointsEarned?: (points: number) => void;
  quickWinActions: PointAction[];
}

export default function PointsActions({ onPointsEarned, quickWinActions }: PointsActionsProps) {
  const [actions, setActions] = useState<PointAction[]>([]);
  const [selectedAction, setSelectedAction] = useState<number | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const [awardingPoints, setAwardingPoints] = useState<string | null>(null);

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/points/actions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out Investment Contribution actions
        const filteredActions = (data.actions || []).filter((action: PointAction) => 
          !action.name.toLowerCase().includes('investment contribution') &&
          !action.actionId.toLowerCase().includes('investment')
        );
        setActions(filteredActions);
      }
    } catch (error) {
      console.error('Failed to fetch actions:', error);
    }
  };

  const submitProof = async () => {
    if (!selectedAction || !proofFile || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select an action, upload proof, and add a description.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      // In a real app, you'd upload the file to cloud storage first
      // For now, we'll simulate with a placeholder URL
      const proofUrl = `uploaded/${proofFile.name}`;

      const token = localStorage.getItem('token');
      const response = await fetch('/api/points/submit-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          actionId: selectedAction.toString(),
          proofUrl,
          description,
          metadata: {
            fileName: proofFile.name,
            fileSize: proofFile.size
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Proof Submitted! 📋",
          description: data.message,
        });

        // Reset form
        setSelectedAction(null);
        setProofFile(null);
        setDescription('');
      } else {
        const error = await response.json();
        toast({
          title: "Submission Failed",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to submit proof:', error);
      toast({
        title: "Error",
        description: "Failed to submit proof. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'action': return 'bg-blue-100 text-blue-800 border border-blue-300 font-medium';
      case 'achievement': return 'bg-purple-100 text-purple-800 border border-purple-300 font-medium';
      default: return 'bg-gray-100 text-gray-800 border border-gray-300 font-medium';
    }
  };

  const getCategoryDisplayText = (category: string) => {
    switch (category) {
      case 'action': return 'Submit';
      case 'achievement': return 'Submit';
      default: return 'Submit';
    }
  };

    const handleActionClick = async (actionId: string) => {
    if (awardingPoints) return; // Prevent multiple clicks

    setAwardingPoints(actionId);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/points/award', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          actionId,
          metadata: { source: 'quick_wins' }
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Points Earned!",
          description: data.message,
        });

        if (onPointsEarned) {
          onPointsEarned(data.points);
        }

        // Refresh actions to update limits
        await fetchActions();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to award points",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error awarding points:', error);
      toast({
        title: "Error",
        description: "Failed to award points",
        variant: "destructive"
      });
    } finally {
      setAwardingPoints(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Inspirational Message */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <Upload className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Get Rewarded for Your Financial Progress!</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Get rewarded with more points by uploading proof of debt paydown!
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {actions.map((action) => (
          <Card 
            key={action.id} 
            className={`cursor-pointer transition-all duration-300 hover:shadow-xl group border ${
              selectedAction === action.id 
                ? 'ring-2 ring-blue-500 shadow-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-blue-300' 
                : 'border-gray-200 hover:border-blue-300 hover:shadow-lg bg-white'
            }`}
            onClick={() => setSelectedAction(action.id)}
          >
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start gap-3">
                <CardTitle className="text-lg font-semibold text-gray-900 leading-tight group-hover:text-blue-900 transition-colors">
                  {action.name}
                </CardTitle>
                <Badge className={`${getCategoryColor(action.category)} px-3 py-1 text-xs uppercase tracking-wide`}>
                  {getCategoryDisplayText(action.category)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {action.description && action.description.toLowerCase() !== action.name.toLowerCase() && (
                <p className="text-sm text-gray-600 leading-relaxed">{action.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedAction && (
        <Card className="bg-gradient-to-br from-blue-50 via-white to-purple-50 border-2 border-blue-300 shadow-xl">
          <CardHeader className="border-b border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-900">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <Upload className="h-5 w-5 text-white" />
              </div>
              Submit Proof of {actions.find(a => a.id === selectedAction)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="space-y-3">
              <Label htmlFor="proof-file" className="text-sm font-semibold text-gray-900">
                Upload Proof Document/Image
              </Label>
              <FileUpload 
                onFileUploaded={(fileUrl, fileName, fileSize) => {
                  // Create a File-like object for backward compatibility
                  const file = new File([], fileName, { type: 'application/octet-stream' });
                  setProofFile(file);
                }}
              />
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Accepted formats: Images, PDF, Word documents (max 10MB)
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-900">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Provide details about your financial action (e.g., 'Paid $500 toward credit card debt', 'Completed debt consolidation')"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 min-h-[100px] bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                onClick={submitProof}
                disabled={submitting || !proofFile || !description.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold py-3 px-6"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Clock className="h-5 w-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Submit for Review
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedAction(null);
                  setProofFile(null);
                  setDescription('');
                }}
                className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 px-4"
                size="lg"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

       
    </div>
  );
}