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
      case 'action': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'achievement': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action) => (
          <Card 
            key={action.id} 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border-gray-200 ${
              selectedAction === action.id 
                ? 'ring-2 ring-blue-500 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50' 
                : 'hover:border-blue-200'
            }`}
            onClick={() => setSelectedAction(action.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{action.name}</CardTitle>
                <Badge className={getCategoryColor(action.category)}>
                  {action.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">{action.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedAction && (
        <Card className="bg-gradient-to-br from-blue-50 via-white to-purple-50 border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Upload className="h-5 w-5 text-blue-600" />
              Submit Proof for {actions.find(a => a.id === selectedAction)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="proof-file">Upload Proof Document/Image</Label>
              <FileUpload 
                onFileUploaded={(fileUrl, fileName, fileSize) => {
                  // Create a File-like object for backward compatibility
                  const file = new File([], fileName, { type: 'application/octet-stream' });
                  setProofFile(file);
                }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Accepted formats: Images, PDF, Word documents
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide details about your financial action (e.g., 'Paid $500 toward credit card debt', 'Invested $200 in my 401k')"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={submitProof}
                disabled={submitting || !proofFile || !description.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {submitting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
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
                className="border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

       
    </div>
  );
}