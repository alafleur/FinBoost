import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
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
  Upload,
  FileSpreadsheet,
  ExternalLink,
  ChevronLeft,
  ChevronRight
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

// Enhanced interface for the new 13-column Selected Winners table (Phase 3: Added cyclePoints)
interface EnhancedWinnerData {
  overallRank: number;
  tierRank: number;
  username: string;
  email: string;
  cyclePoints: number; // Phase 3: Added cycle points column
  tierSizeAmount: number;
  payoutPercentage: number;
  payoutCalculated: number;
  payoutOverride: number | null;
  payoutFinal: number;
  paypalEmail: string | null;
  payoutStatus: string;
  lastModified: Date;
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

  // === PHASE 3: ENHANCED SELECTED WINNERS STATE ===
  const [enhancedWinners, setEnhancedWinners] = useState([]);

  // Enhanced Winners pagination state
  const [enhancedWinnersPage, setEnhancedWinnersPage] = useState(1);
  const [enhancedWinnersData, setEnhancedWinnersData] = useState({
    winners: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 0
  });
  const enhancedWinnersPerPage = 50;
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      loadEnhancedWinners(); // Phase 3: Load enhanced winner data
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

  // === PHASE 3: ENHANCED WINNERS DATA LOADING ===
  const loadEnhancedWinners = async () => {
    if (!selectedCycle) return;

    try {
      const token = localStorage.getItem('token');
      console.log(`[Frontend] Loading enhanced winners for cycle ${selectedCycle.id}`);

      const response = await fetch(`/api/admin/winners/data/${selectedCycle.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const winnersData = await response.json();
        setEnhancedWinners(winnersData);
        console.log(`[Frontend] Loaded ${winnersData.length} enhanced winner records`);
      } else {
        console.log(`[Frontend] No enhanced winners data available (${response.status})`);
        setEnhancedWinners([]);
      }
    } catch (error) {
      console.error('Failed to load enhanced winners:', error);
      setEnhancedWinners([]);
    }
  };

   const loadEnhancedWinnersPaginated = async (page: number) => {
        if (!selectedCycle) return;

        try {
            const token = localStorage.getItem('token');
            console.log(`[Frontend] Loading enhanced winners for cycle ${selectedCycle.id}, page ${page}`);

            const response = await fetch(`/api/admin/cycle-winner-details/${selectedCycle.id}/paginated?page=${page}&pageSize=${enhancedWinnersPerPage}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setEnhancedWinnersData({
                    winners: data.winners || [],
                    totalCount: data.totalCount || 0,
                    currentPage: data.currentPage || 1,
                    totalPages: data.totalPages || 1
                });
                console.log(`[Frontend] Loaded ${data.winners.length} enhanced winner records (page ${page})`);
            } else {
                console.log(`[Frontend] No enhanced winners data available (${response.status})`);
                setEnhancedWinnersData({ winners: [], totalCount: 0, currentPage: 1, totalPages: 1 });
            }
        } catch (error) {
            console.error('Failed to load enhanced winners:', error);
            setEnhancedWinnersData({ winners: [], totalCount: 0, currentPage: 1, totalPages: 1 });
        }
    };

  // === TIER SIZE UPDATE HANDLER ===
  const handleTierSizeUpdate = (winnerEmail: string, newAmount: number) => {
    // Update the enhanced winners state
    setEnhancedWinners(prevWinners => 
      prevWinners.map(winner => 
        winner.email === winnerEmail 
          ? { ...winner, tierSizeAmount: newAmount }
          : winner
      )
    );

    // Also update paginated data if it exists
    setEnhancedWinnersData(prevData => ({
      ...prevData,
      winners: prevData.winners.map(winner => 
        winner.email === winnerEmail 
          ? { ...winner, tierSizeAmount: newAmount }
          : winner
      )
    }));

    toast({
      title: "Tier Size Updated",
      description: `Updated tier size to $${(newAmount / 100).toFixed(2)} for ${winnerEmail}`,
    });
  };

  // === PHASE 3: EXCEL EXPORT FUNCTIONALITY ===
  const handleExportWinners = async () => {
    if (!selectedCycle) {
      toast({
        title: "Error",
        description: "Please select a cycle first",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    try {
      const token = localStorage.getItem('token');
      console.log(`[Export] Starting export for cycle ${selectedCycle.id}`);

      const response = await fetch(`/api/admin/winners/export/${selectedCycle.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cycle-${selectedCycle.id}-winners-export.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        console.log(`[Export] Successfully downloaded Excel file`);
        toast({
          title: "Export Successful",
          description: `Winners data exported to Excel file`,
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export winners data",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  // === PHASE 3: EXCEL IMPORT FUNCTIONALITY ===
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportFile(file);

    // Read and preview the Excel file
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        setImportData(jsonData);
        setImportPreview(jsonData.slice(0, 5)); // Show first 5 rows for preview

        console.log(`[Import] Loaded ${jsonData.length} rows for preview`);
        toast({
          title: "File Loaded",
          description: `Ready to import ${jsonData.length} records`,
        });
      } catch (error) {
        console.error('File parsing failed:', error);
        toast({
          title: "File Error",
          description: "Failed to parse Excel file. Please check the file format.",
          variant: "destructive"
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportWinners = async (confirmOverwrite: boolean = false) => {
    if (!selectedCycle || importData.length === 0) {
      toast({
        title: "Error",
        description: "Please select a file and cycle first",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    try {
      const token = localStorage.getItem('token');
      console.log(`[Import] Starting import for cycle ${selectedCycle.id} with ${importData.length} records`);

      const response = await fetch(`/api/admin/winners/import/${selectedCycle.id}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          importData,
          confirmOverwrite
        })
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`[Import] Successfully imported ${result.updatedCount} records`);
        toast({
          title: "Import Successful",
          description: `Updated ${result.updatedCount} winner records`,
        });

        // Refresh the data and close dialog
        loadEnhancedWinners();
        setShowImportDialog(false);
        setImportFile(null);
        setImportData([]);
        setImportPreview([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else if (result.requiresConfirmation) {
        // Show confirmation dialog for overwrite
        const confirmed = window.confirm(result.message + "\n\nDo you want to proceed?");
        if (confirmed) {
          handleImportWinners(true); // Retry with confirmation
        }
      } else {
        throw new Error(result.error || 'Import failed');
      }
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import winners data",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleRunWinnerSelection = async () => {
    if (!selectedCycle) return;

    setIsRunningSelection(true);
    try {
      const token = localStorage.getItem('token');
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

      const data = await response.json();
      if (data.success) {
        // Don't store large winner arrays in state - causes memory issues
        // Instead, store only the selection summary and let tables load via API
        setPendingWinners([]); // Clear any previous selection

        toast({
          title: "Winner Selection Generated",
          description: `Generated ${data.totalWinners} winners using ${selectionMode} method and saved as draft. Ready to view or export.`
        });

        // Refresh the enhanced winners table to show the new selection
        loadEnhancedWinners();
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

  const handleSaveWinnerSelection = async () => {
    if (!selectedCycle) {
      toast({
        title: "Error",
        description: "Please select a cycle first.",
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
          selectionMode,
          totalPool: cycleAnalytics?.rewardPool || 0
        })
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Draft Confirmed",
          description: `Winner selection confirmed with ${data.winnerCount} winners. You can now export, modify, and import before sealing.`
        });
        setPendingWinners([]);
        loadWinners();
        loadEnhancedWinners(); // Phase 3: Also refresh enhanced winners
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
        loadEnhancedWinners(); // Phase 3: Also refresh enhanced winners
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
        loadEnhancedWinners(); // Phase 3: Also refresh enhanced winners
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
      const response = await fetch(`/api/admin/cycle-winner-selection/${selectedCycle.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast({
          title: "Selection Cleared",
          description: "Winner selection has been cleared"
        });
        // Clear local state immediately
        setWinners([]);
        setEnhancedWinners([]);
        setPendingWinners([]);
        loadWinners();
        loadEnhancedWinners(); // Phase 3: Also refresh enhanced winners
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

    const loadPaginatedWinnerDetails = async (cycleId: number, page: number, pageSize: number) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/admin/cycle-winner-details/${cycleId}/paginated?page=${page}&pageSize=${pageSize}`, {
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

          {/* === PHASE 3: ENHANCED SELECTED WINNERS TABLE === */}
          {enhancedWinners.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5" />
                      Selected Winners - Enhanced View
                    </CardTitle>
                    <CardDescription>
                      {enhancedWinners.length} winners with complete payout details and Excel export/import capabilities
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleExportWinners}
                      disabled={isExporting}
                      variant="outline"
                      size="sm"
                    >
                      {isExporting ? (
                        <>
                          <Timer className="w-4 h-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Export Excel
                        </>
                      )}
                    </Button>
                    <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Upload className="w-4 h-4 mr-2" />
                          Import Excel
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Import Winners Data from Excel</DialogTitle>
                          <DialogDescription>
                            Upload an Excel file to update winner payout information. The system will match records by email address.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="excel-file">Select Excel File</Label>
                            <Input
                              id="excel-file"
                              type="file"
                              accept=".xlsx,.xls"
                              onChange={handleFileSelect}
                              ref={fileInputRef}
                            />
                          </div>

                          {importPreview.length > 0 && (
                            <div>
                              <Label>Data Preview (First 5 Rows)</Label>
                              <div className="border rounded-lg p-4 bg-gray-50 max-h-64 overflow-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      {Object.keys(importPreview[0] || {}).map((key) => (
                                        <TableHead key={key} className="text-xs">{key}</TableHead>
                                      ))}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {importPreview.map((row, index) => (
                                      <TableRow key={index}>
                                        {Object.values(row).map((value: any, cellIndex) => (
                                          <TableCell key={cellIndex} className="text-xs">
                                            {String(value)}
                                          </TableCell>
                                        ))}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              onClick={() => setShowImportDialog(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() => handleImportWinners(false)}
                              disabled={importData.length === 0 || isImporting}
                            >
                              {isImporting ? (
                                <>
                                  <Timer className="w-4 h-4 mr-2 animate-spin" />
                                  Importing...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 mr-2" />
                                  Import Data ({importData.length} records)
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Overall Rank #</TableHead>
                        <TableHead className="w-20">Tier Rank #</TableHead>
                        <TableHead className="w-32">Username</TableHead>
                        <TableHead className="w-48">User Email</TableHead>
                        <TableHead className="w-24">Cycle Points</TableHead>
                        <TableHead className="w-24">Tier Size $</TableHead>
                        <TableHead className="w-24">% Payout of Tier</TableHead>
                        <TableHead className="w-24">Payout Calc $</TableHead>
                        <TableHead className="w-24">Payout Override $</TableHead>
                        <TableHead className="w-24">Payout Final</TableHead>
                        <TableHead className="w-48">PayPal Email</TableHead>
                        <TableHead className="w-20">Status</TableHead>
                        <TableHead className="w-32">Last Modified</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enhancedWinners.map((winner, index) => (
                        <TableRow key={`${winner.email}-${index}`}>
                          <TableCell className="font-medium text-center">
                            {winner.overallRank}
                          </TableCell>
                          <TableCell className="font-medium text-center">
                            {winner.tierRank}
                          </TableCell>
                          <TableCell className="font-medium">
                            {winner.username}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {winner.email}
                          </TableCell>
                          <TableCell className="font-medium text-center text-blue-600">
                            {winner.cyclePoints}
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            <Input
                              type="text"
                              value={(winner.tierSizeAmount / 100).toFixed(2)}
                              onChange={(e) => {
                                const newAmount = Math.round(parseFloat(e.target.value || '0') * 100);
                                handleTierSizeUpdate(winner.email, newAmount);
                              }}
                              className="w-20 h-8 text-sm text-center border-green-300 focus:border-green-500"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            {(winner.payoutPercentage / 100).toFixed(2)}%
                          </TableCell>
                          <TableCell className="font-medium">
                            ${(winner.payoutCalculated / 100).toFixed(2)}
                          </TableCell>
                          <TableCell className="font-medium text-blue-600">
                            {winner.payoutOverride ? `$${(winner.payoutOverride / 100).toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell className="font-bold text-green-700">
                            ${(winner.payoutFinal / 100).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {winner.paypalEmail ? (
                              <span className="text-green-600 text-sm">{winner.paypalEmail}</span>
                            ) : (
                              <span className="text-red-600 text-sm">Not configured</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              winner.payoutStatus === 'processed' ? 'default' : 
                              winner.payoutStatus === 'pending' ? 'outline' : 'secondary'
                            }>
                              {winner.payoutStatus}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {new Date(winner.lastModified).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-4 px-6 pb-6">
                <div className="text-sm text-gray-600">
                  Showing {Math.min((enhancedWinnersData.currentPage - 1) * enhancedWinnersPerPage + 1, enhancedWinnersData.totalCount)} to {Math.min(enhancedWinnersData.currentPage * enhancedWinnersPerPage, enhancedWinnersData.totalCount)} of {enhancedWinnersData.totalCount} winners
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newPage = Math.max(1, enhancedWinnersData.currentPage - 1);
                      setEnhancedWinnersPage(newPage);
                    }}
                    disabled={enhancedWinnersData.currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {enhancedWinnersData.currentPage} of {enhancedWinnersData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newPage = Math.min(enhancedWinnersData.totalPages, enhancedWinnersData.currentPage + 1);
                      setEnhancedWinnersPage(newPage);
                    }}
                    disabled={enhancedWinnersData.currentPage >= enhancedWinnersData.totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

          {/* Legacy Winners Table - Keep for fallback */}
          {winners.length > 0 && enhancedWinners.length === 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Selected Winners (Legacy View)</CardTitle>
                    <CardDescription>
                      {winners.length} winners selected for current cycle - Enhanced view loading...
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Timer className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Loading enhanced winner details...</p>
                </div>
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