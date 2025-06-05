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
  id: string;
  name: string;
  basePoints: number;
  requiresProof: boolean;
  category: string;
  description: string;
  maxDaily?: number;
  maxTotal?: number;
  points?: number;
}

interface PointsActionsProps {
  onPointsEarned?: (points: number) => void;
  quickWinActions: PointAction[];
}

export default function PointsActions({ onPointsEarned, quickWinActions }: PointsActionsProps) {
  const [actions, setActions] = useState<PointAction[]>([]);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
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
        setActions(data.actions || []);
      }
    } catch (error) {
      console.error('Failed to fetch actions:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProofFile(file);
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
          actionId: selectedAction,
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
      case 'action': return 'bg-green-100 text-green-800';
      case 'achievement': return 'bg-purple-100 text-purple-800';
      default: return 'bg-blue-100 text-blue-800';
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
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedAction === action.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setSelectedAction(action.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{action.name}</CardTitle>
                <Badge className={getCategoryColor(action.category)}>
                  {action.basePoints} pts
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">{action.description}</p>
              {(action.maxDaily || action.maxTotal) && (
                <div className="text-xs text-gray-500">
                  {action.maxDaily && <span>Max {action.maxDaily}/day</span>}
                  {action.maxDaily && action.maxTotal && <span> • </span>}
                  {action.maxTotal && <span>Max {action.maxTotal} total</span>}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedAction && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Submit Proof for {actions.find(a => a.id === selectedAction)?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="proof-file">Upload Proof Document/Image</Label>
              <FileUpload setProofFile={setProofFile}/>
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
                className="flex-1"
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