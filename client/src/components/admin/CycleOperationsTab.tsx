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
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  BarChart3,
  Save,
  Lock,
  Download,
  Upload
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
  const [isSavingSelection, setIsSavingSelection] = useState(false);
  const [isSealingSelection, setIsSealingSelection] = useState(false);
  const [pendingWinners, setPendingWinners] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

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
      const response = await fetch(`/api/admin/cycle-winner-details/${selectedCycle.id}/paginated`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWinners(data.winners || []);
      } else {
        console.error('Failed to load winners:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to load winners:', error);
    }
  };

  const handleRunWinnerSelection = async () => {
    if (!selectedCycle) return;

    console.log("Starting winner selection for cycle:", selectedCycle.id);
    setIsRunningSelection(true);
    setError(null);
    setAuthError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setAuthError("No authentication token found. Please log in again.");
        return;
      }

      console.log("Making API call to /api/admin/cycle-winner-selection/execute");
      const response = await fetch(`/api/admin/cycle-winner-selection/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          cycleSettingId: selectedCycle.id,
          selectionMode: selectionMode 
        })
      });

      console.log("API response status:", response.status);
      
      if (response.status === 401 || response.status === 403) {
        setAuthError("Authentication failed. Please log in again.");
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error response:", errorText);
        setError(`API Error (${response.status}): ${errorText}`);
        return;
      }

      const data = await response.json();
      console.log("API response data:", data);

      // Handle the actual API response format (not checking data.success)
      if (data && typeof data.winnersSelected === 'number') {
        // Store pending winners for save operation
        setPendingWinners(data.winners || []);
        toast({
          title: "Winner Selection Generated",
          description: `Generated ${data.winnersSelected} winners using ${selectionMode} method. Pool: $${(data.totalRewardPool / 100).toFixed(2)}. Ready to save as draft.`
        });
      } else if (data.error) {
        setError(data.error);
        toast({
          title: "Selection Failed",
          description: data.error,
          variant: "destructive"
        });
      } else {
        console.log("Unexpected API response format:", data);
        setError("Unexpected API response format");
      }
    } catch (error) {
      console.error("Winner selection error:", error);
      setError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast({
        title: "Error",
        description: "Failed to run winner selection due to network error",
        variant: "destructive"
      });
    } finally {
      setIsRunningSelection(false);
      console.log("Winner selection completed");
    }
  };

  const handleSaveWinnerSelection = async () => {
    if (!selectedCycle || pendingWinners.length === 0) {
      toast({
        title: "Error",
        description: "No winner selection to save. Please run selection first.",
        variant: "destructive"
      });
      return;
    }

    setIsSavingSelection(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/cycle-winner-selection/${selectedCycle.id}/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          winners: pendingWinners,
          selectionMode,
          totalPool: cycleAnalytics?.rewardPool || 0
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Winners Saved as Draft",
          description: "Winner selection saved. You can now export, modify, and import before sealing."
        });
        setPendingWinners([]);
        loadWinners();
        loadCycleAnalytics();
      } else {
        toast({
          title: "Save Failed",
          description: data.error || "Failed to save winner selection",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save winner selection",
        variant: "destructive"
      });
    } finally {
      setIsSavingSelection(false);
    }
  };

  const handleSealWinnerSelection = async () => {
    if (!selectedCycle) return;

    setIsSealingSelection(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/cycle-winner-selection/${selectedCycle.id}/seal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Winner Selection Sealed",
          description: "Winner selection is now final and cannot be modified."
        });
        loadWinners();
        loadCycleAnalytics();
      } else {
        toast({
          title: "Seal Failed",
          description: data.error || "Failed to seal winner selection",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to seal winner selection",
        variant: "destructive"
      });
    } finally {
      setIsSealingSelection(false);
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

  const handleExportWinners = () => {
    if (!winners.length) {
      toast({
        title: "No Data to Export",
        description: "No winners selected to export",
        variant: "destructive"
      });
      return;
    }

    const csvData = winners.map(winner => ({
      username: winner.username,
      email: winner.email,
      tier: winner.tier,
      rewardAmount: (winner.rewardAmount / 100).toFixed(2),
      paypalEmail: winner.paypalEmail || '',
      status: winner.isProcessed ? 'Processed' : 'Pending',
      selectionDate: formatDate(winner.selectionDate)
    }));

    const headers = ['username', 'email', 'tier', 'rewardAmount', 'paypalEmail', 'status', 'selectionDate'];
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(key => `"${row[key] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `winners_${selectedCycle?.cycleName || 'export'}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Winners Exported",
      description: `Exported ${winners.length} winners to CSV file`
    });
  };

  const handleImportWinners = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      const importedData = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.replace(/"/g, '').trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      // Here you would typically validate and process the imported data
      // For now, we'll just show a success message
      toast({
        title: "Import Successful",
        description: `Imported ${importedData.length} winner records. Note: Import processing not yet implemented.`
      });

      console.log('Imported winner data:', importedData);
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to parse CSV file",
        variant: "destructive"
      });
    }

    // Reset file input
    event.target.value = '';
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

      {/* Error Alerts */}
      {authError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <strong>Authentication Error:</strong> {authError}
            <Button 
              variant="link" 
              className="text-red-600 p-0 h-auto ml-2"
              onClick={() => window.location.href = '/auth'}
            >
              Log in again
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-700">
            <strong>Error:</strong> {error}
            <Button 
              variant="link" 
              className="text-orange-600 p-0 h-auto ml-2"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

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
                          Generate Winners
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

                {/* NEW: Save/Seal Workflow Controls */}
                {pendingWinners.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">
                        Winner selection generated ({pendingWinners.length} winners)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        onClick={handleSaveWinnerSelection}
                        disabled={isSavingSelection}
                        size="sm"
                      >
                        {isSavingSelection ? (
                          <>
                            <Timer className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save as Draft
                          </>
                        )}
                      </Button>
                      <span className="text-xs text-blue-700">
                        Save to enable export/import workflow
                      </span>
                    </div>
                  </div>
                )}

                {/* Seal Selection Controls (only show if executed but not sealed) */}
                {winners.length > 0 && selectedCycle && (
                  <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-900">
                          Selection Status: Draft (can be modified)
                        </span>
                      </div>
                      <Button 
                        onClick={handleSealWinnerSelection}
                        disabled={isSealingSelection}
                        variant="destructive"
                        size="sm"
                      >
                        {isSealingSelection ? (
                          <>
                            <Timer className="w-4 h-4 mr-2 animate-spin" />
                            Sealing...
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Seal Final Selection
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-orange-700 mt-2">
                      Sealing will lock the selection permanently - no further modifications allowed
                    </p>
                  </div>
                )}
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
                      onClick={handleExportWinners}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button
                      onClick={() => document.getElementById('import-file')?.click()}
                      variant="outline"
                      size="sm"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import CSV
                    </Button>
                    <input
                      id="import-file"
                      type="file"
                      accept=".csv"
                      style={{ display: 'none' }}
                      onChange={handleImportWinners}
                    />
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
                    {cycleAnalytics.tierThresholds && (
                      <div className="text-xs text-gray-400 mt-1">
                        {cycleAnalytics.tierThresholds.tier1}+ points
                      </div>
                    )}
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {cycleAnalytics.tier2Count || 0}
                    </div>
                    <div className="text-sm text-gray-500">Tier 2 Members</div>
                    {cycleAnalytics.tierThresholds && (
                      <div className="text-xs text-gray-400 mt-1">
                        {cycleAnalytics.tierThresholds.tier2}-{cycleAnalytics.tierThresholds.tier1 - 1} points
                      </div>
                    )}
                  </div>
                  <div className="text-center p-4 border rounded">
                    <div className="text-2xl font-bold text-yellow-600">
                      {cycleAnalytics.tier3Count || 0}
                    </div>
                    <div className="text-sm text-gray-500">Tier 3 Members</div>
                    {cycleAnalytics.tierThresholds && (
                      <div className="text-xs text-gray-400 mt-1">
                        {cycleAnalytics.tierThresholds.tier3}-{cycleAnalytics.tierThresholds.tier2 - 1} points
                      </div>
                    )}
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