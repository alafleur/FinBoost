import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Target, 
  Activity, 
  TrendingUp,
  Play,
  CheckCircle,
  AlertCircle,
  Crown,
  Timer,
  BarChart3
} from 'lucide-react';

interface CycleSetting {
  id: number;
  cycleName: string;
  cycleStartDate: Date;
  cycleEndDate: Date;
  paymentPeriodDays: number;
  membershipFee: number;
  rewardPoolPercentage: number;
  minimumPoolGuarantee?: number;
  tier1Threshold: number;
  tier2Threshold: number;
  isActive: boolean;
  allowMidCycleJoining: boolean;
  midCycleJoinThresholdDays: number;
  createdAt: Date;
  createdBy?: number;
}

interface WinnerSelection {
  id: number;
  cycleSettingId: number;
  userId: number;
  tier: string;
  rewardAmount: number;
  isProcessed: boolean;
  processedAt?: Date;
  selectionDate: Date;
  username?: string;
  email?: string;
  paypalEmail?: string;
}

interface CycleOperationsTabProps {
  cycleSettings: CycleSetting[];
  onRefresh: () => void;
}

export default function CycleOperationsTab({ cycleSettings, onRefresh }: CycleOperationsTabProps) {
  const { toast } = useToast();
  const [selectedCycle, setSelectedCycle] = useState<CycleSetting | null>(null);
  const [cycleAnalytics, setCycleAnalytics] = useState<any>(null);
  const [winners, setWinners] = useState<WinnerSelection[]>([]);
  const [isRunningSelection, setIsRunningSelection] = useState(false);
  const [isProcessingPayouts, setIsProcessingPayouts] = useState(false);
  const [selectionMode, setSelectionMode] = useState('weighted_random');
  const [selectedForDisbursement, setSelectedForDisbursement] = useState<Set<number>>(new Set());

  // Get active cycle on component mount
  useEffect(() => {
    const activeCycle = cycleSettings.find(cycle => cycle.isActive);
    if (activeCycle) {
      setSelectedCycle(activeCycle);
    }
  }, [cycleSettings]);

  // Load analytics when cycle is selected
  useEffect(() => {
    if (selectedCycle) {
      loadCycleAnalytics();
      loadWinners();
    }
  }, [selectedCycle]);

  const loadCycleAnalytics = async () => {
    if (!selectedCycle) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/cycles/${selectedCycle.id}/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCycleAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to load cycle analytics:', error);
    }
  };

  const loadWinners = async () => {
    if (!selectedCycle) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/winner-cycles/${selectedCycle.id}/winners`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWinners(data.winners || []);
      }
    } catch (error) {
      console.error('Failed to load winners:', error);
    }
  };

  const handleRunWinnerSelection = async () => {
    if (!selectedCycle) return;

    setIsRunningSelection(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/winner-cycles/${selectedCycle.id}/execute-selection`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ selectionMode })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Winner Selection Complete",
          description: `Selected ${data.totalWinners} winners using ${selectionMode} method`
        });
        loadWinners();
        loadCycleAnalytics();
      } else {
        toast({
          title: "Selection Failed",
          description: data.error || "Failed to run winner selection",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to run winner selection",
        variant: "destructive"
      });
    } finally {
      setIsRunningSelection(false);
    }
  };

  const handleProcessPayouts = async () => {
    if (!selectedCycle || selectedForDisbursement.size === 0) {
      toast({
        title: "Error",
        description: "Please select winners to process payouts for",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingPayouts(true);
    try {
      const token = localStorage.getItem('token');
      const selectedWinnerIds = Array.from(selectedForDisbursement);
      
      const response = await fetch(`/api/admin/winner-cycles/${selectedCycle.id}/process-disbursements`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ selectedWinnerIds })
      });
      
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Payouts Processed",
          description: `Successfully processed ${selectedWinnerIds.length} payouts`
        });
        setSelectedForDisbursement(new Set());
        loadWinners();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to process payouts",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to process payouts",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPayouts(false);
    }
  };

  const handleClearWinnerSelection = async () => {
    if (!selectedCycle) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/winner-cycles/${selectedCycle.id}/clear-selection`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast({
          title: "Selection Cleared",
          description: "Winner selection has been cleared"
        });
        loadWinners();
        loadCycleAnalytics();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear selection",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const activeCycle = cycleSettings.find(cycle => cycle.isActive);

  return (
    <div className="space-y-6">
      {/* Workflow Breadcrumb */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm">
            <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded">1. Setup</span>
            <span className="text-gray-400">→</span>
            <span className="bg-green-600 text-white px-2 py-1 rounded">2. Monitor</span>
            <span className="text-green-600">→</span>
            <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded">3. Execute</span>
          </div>
          <div className="text-xs text-green-600 font-medium">Monitor Phase: Track cycle performance and execute operations</div>
        </div>
      </div>

      {/* Current Cycle Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cycle</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeCycle ? activeCycle.cycleName : 'No Active Cycle'}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeCycle ? 
                `${formatDate(activeCycle.cycleStartDate)} - ${formatDate(activeCycle.cycleEndDate)}` :
                'Create a cycle to begin operations'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cycleAnalytics?.participantCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active in current cycle
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reward Pool</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(cycleAnalytics?.totalRewardPool || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Available for distribution
            </p>
            {selectedCycle?.minimumPoolGuarantee && selectedCycle.minimumPoolGuarantee > 0 && (
              <div className="mt-2 text-xs text-blue-600 font-medium">
                Minimum guarantee: {formatCurrency(selectedCycle.minimumPoolGuarantee)}
                {selectedCycle.minimumPoolGuarantee > (cycleAnalytics?.totalRewardPool || 0) && (
                  <span className="text-orange-600 ml-1">(Active)</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cycle Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Cycle Operations</CardTitle>
          <CardDescription>
            Monitor and execute operations for reward cycles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cycleSelect">Select Cycle</Label>
              <Select
                value={selectedCycle?.id.toString() || ""}
                onValueChange={(value) => {
                  const cycle = cycleSettings.find(c => c.id === parseInt(value));
                  setSelectedCycle(cycle || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a cycle to manage" />
                </SelectTrigger>
                <SelectContent>
                  {cycleSettings.map((cycle) => (
                    <SelectItem key={cycle.id} value={cycle.id.toString()}>
                      {cycle.cycleName} {cycle.isActive && <Badge className="ml-2">Active</Badge>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedCycle && (
        <>
          {/* Winner Selection Interface */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5" />
                Winner Selection
              </CardTitle>
              <CardDescription>
                Run winner selection algorithm and manage results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="selectionMode">Selection Method</Label>
                    <Select value={selectionMode} onValueChange={setSelectionMode}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weighted_random">Point-Weighted Random</SelectItem>
                        <SelectItem value="top_performers">Top Performers</SelectItem>
                        <SelectItem value="random">Pure Random</SelectItem>
                        <SelectItem value="manual">Manual Selection</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button 
                      onClick={handleRunWinnerSelection}
                      disabled={isRunningSelection}
                      className="flex-1"
                    >
                      {isRunningSelection ? (
                        <>
                          <Timer className="w-4 h-4 mr-2 animate-spin" />
                          Running Selection...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Run Selection
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleClearWinnerSelection}
                      disabled={winners.length === 0}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Winners Table */}
          {winners.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Selected Winners</CardTitle>
                    <CardDescription>
                      {winners.length} winners selected for current cycle
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        if (selectedForDisbursement.size === winners.length) {
                          setSelectedForDisbursement(new Set());
                        } else {
                          setSelectedForDisbursement(new Set(winners.map(w => w.id)));
                        }
                      }}
                      variant="outline"
                      size="sm"
                    >
                      {selectedForDisbursement.size === winners.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <Button
                      onClick={handleProcessPayouts}
                      disabled={isProcessingPayouts || selectedForDisbursement.size === 0}
                    >
                      {isProcessingPayouts ? (
                        <>
                          <Timer className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Process Selected ({selectedForDisbursement.size})
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead>Winner</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Reward Amount</TableHead>
                      <TableHead>PayPal Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Selected Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {winners.map((winner) => (
                      <TableRow key={winner.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedForDisbursement.has(winner.id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedForDisbursement);
                              if (e.target.checked) {
                                newSet.add(winner.id);
                              } else {
                                newSet.delete(winner.id);
                              }
                              setSelectedForDisbursement(newSet);
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{winner.username}</div>
                            <div className="text-sm text-gray-500">{winner.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            winner.tier === 'tier1' ? 'default' : 
                            winner.tier === 'tier2' ? 'secondary' : 'outline'
                          }>
                            {winner.tier === 'tier1' ? 'Tier 1' : 
                             winner.tier === 'tier2' ? 'Tier 2' : 'Tier 3'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(winner.rewardAmount)}
                        </TableCell>
                        <TableCell>
                          {winner.paypalEmail ? (
                            <span className="text-green-600">{winner.paypalEmail}</span>
                          ) : (
                            <span className="text-red-600">Not configured</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {winner.isProcessed ? (
                            <Badge variant="default">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Processed
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatDate(winner.selectionDate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Cycle Analytics */}
          {cycleAnalytics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Cycle Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {cycleAnalytics.tier1Count || 0}
                    </div>
                    <div className="text-sm text-gray-500">Tier 1 Members</div>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {cycleAnalytics.tier2Count || 0}
                    </div>
                    <div className="text-sm text-gray-500">Tier 2 Members</div>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-yellow-600">
                      {cycleAnalytics.tier3Count || 0}
                    </div>
                    <div className="text-sm text-gray-500">Tier 3 Members</div>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-purple-600">
                      {cycleAnalytics.averagePoints || 0}
                    </div>
                    <div className="text-sm text-gray-500">Avg Points</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}