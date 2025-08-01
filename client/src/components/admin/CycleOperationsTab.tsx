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
  ChevronRight,
  RefreshCw
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

// Enhanced interface for the new 13-column Selected Winners table (Phase 3: Added cyclePoints, Phase 2A: Added audit fields)
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
  // Phase 2A: Enhanced save/seal workflow audit fields (Issue #2 Resolution)
  isSealed?: boolean;
  sealedAt?: Date;
  sealedBy?: number;
  savedAt?: Date;
  savedBy?: number;
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
  const [isUnsealingSelection, setIsUnsealingSelection] = useState(false);
  const [showUnsealConfirmation, setShowUnsealConfirmation] = useState(false);
  const [pendingWinners, setPendingWinners] = useState<any[]>([]);
  
  // PHASE 2C: Seal Workflow Refinement - Additional state for confirmation workflow
  const [showSealConfirmation, setShowSealConfirmation] = useState(false);
  const [sealConfirmationStep, setSealConfirmationStep] = useState(1);
  const [sealConfirmationChecks, setSealConfirmationChecks] = useState({
    reviewedData: false,
    confirmedFinal: false,
    understoodIrreversible: false
  });

  // === PHASE 3: ENHANCED SELECTED WINNERS STATE ===
  const [enhancedWinners, setEnhancedWinners] = useState<EnhancedWinnerData[]>([]);
  const [loadingEnhanced, setLoadingEnhanced] = useState(false);

  // Removed pagination - showing all enhanced winners in one scrollable table
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

  // PHASE 4 STEP 4: Enhanced Cycle Analytics Loading with Cache Busting
  const loadCycleAnalytics = async (forceFresh = false) => {
    if (!selectedCycle) return;

    try {
      const token = localStorage.getItem('token');
      
      // Add cache-busting timestamp if forcing fresh data
      const url = forceFresh 
        ? `/api/admin/cycles/${selectedCycle.id}/analytics?t=${Date.now()}`
        : `/api/admin/cycles/${selectedCycle.id}/analytics`;

      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCycleAnalytics(data);
        console.log(`[FRONTEND] Cycle analytics refreshed - forceFresh: ${forceFresh}`);
      } else {
        console.error('Failed to load cycle analytics:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to load cycle analytics:', error);
    }
  };

  // PHASE 4 STEP 4: Enhanced Winners Loading with Cache Busting
  const loadWinners = async (forceFresh = false) => {
    if (!selectedCycle) return;

    try {
      const token = localStorage.getItem('token');
      
      // Add cache-busting timestamp if forcing fresh data
      const url = forceFresh 
        ? `/api/admin/cycle-winner-details/${selectedCycle.id}/paginated?t=${Date.now()}`
        : `/api/admin/cycle-winner-details/${selectedCycle.id}/paginated`;

      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWinners(data.winners || []);
        console.log(`[FRONTEND] Winners data refreshed - forceFresh: ${forceFresh}`);
      } else {
        console.error('Failed to load winners:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to load winners:', error);
    }
  };

  // === PHASE 3: ENHANCED WINNERS DATA LOADING ===
  const loadEnhancedWinners = async (forceFresh = false) => {
    if (!selectedCycle) return;

    try {
      setLoadingEnhanced(true);
      const token = localStorage.getItem('token');
      console.log(`[FRONTEND] Loading enhanced winners for cycle ${selectedCycle.id} - forceFresh: ${forceFresh}`);

      // Add cache-busting timestamp if forcing fresh data
      const url = forceFresh 
        ? `/api/admin/winners/data/${selectedCycle.id}?t=${Date.now()}`
        : `/api/admin/winners/data/${selectedCycle.id}`;

      const response = await fetch(url, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });

      if (response.status === 403) {
        console.warn('[FRONTEND] Admin session expired or insufficient permissions');
        toast({
          title: "Session Expired",
          description: "Please refresh the page and log in again",
          variant: "destructive"
        });
        return;
      }

      if (response.ok) {
        const winnersData = await response.json();
        console.log(`[FRONTEND] Successfully loaded ${winnersData.length} enhanced winner records`);
        setEnhancedWinners(winnersData);
        
        // Validate data integrity - check for key fields
        const sampleRecord = winnersData[0];
        if (sampleRecord) {
          console.log(`[FRONTEND] Sample record fields:`, Object.keys(sampleRecord));
          console.log(`[FRONTEND] Sample pointsAtSelection:`, sampleRecord.pointsAtSelection);
        }
      } else {
        console.log(`[FRONTEND] No enhanced winners data available (${response.status})`);
        setEnhancedWinners([]);
      }
    } catch (error) {
      console.error('[FRONTEND] Failed to load enhanced winners:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to load winner data. Please try refreshing the page.",
        variant: "destructive"
      });
      setEnhancedWinners([]);
    } finally {
      setLoadingEnhanced(false);
    }
  };

  // Removed paginated loader - using single loadEnhancedWinners() for all records

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

    // Pagination removed - only updating main enhanced winners state

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
          description: `Updated ${result.updatedCount} winner records - Refreshing all data...`,
        });

        // PHASE 4 STEP 4: Use comprehensive state refresh for complete UI consistency
        console.log(`[IMPORT] SUCCESS: Using comprehensive state refresh for cycle ${selectedCycle.id}`);
        setEnhancedWinners([]);
        setWinners([]);
        
        await refreshAllCycleData({ forceFresh: true, showToast: false });
        console.log(`[IMPORT] COMPLETE: All data refreshed successfully with comprehensive refresh`);
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

        // PHASE 4 STEP 4: Use comprehensive state refresh for complete UI consistency
        await refreshAllCycleData({ forceFresh: true, showToast: false });
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
        
        // PHASE 4 STEP 4: Use comprehensive state refresh for complete UI consistency
        await refreshAllCycleData({ forceFresh: true, showToast: false });
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

  // PHASE 2C: Enhanced seal workflow with multi-step confirmation
  const handleSealWinnerSelection = async () => {
    setShowSealConfirmation(true);
    setSealConfirmationStep(1);
    setSealConfirmationChecks({
      reviewedData: false,
      confirmedFinal: false,
      understoodIrreversible: false
    });
  };

  const proceedWithSealing = async () => {
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
          title: "Winner Selection Sealed Successfully",
          description: `Selection for ${selectedCycle.cycleName} is now permanently locked and ready for payout processing.`
        });
        setShowSealConfirmation(false);
        
        // PHASE 4 STEP 4: Use comprehensive state refresh for complete UI consistency
        await refreshAllCycleData({ forceFresh: true, showToast: false });
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

  // PHASE 4 STEP 4: Comprehensive State Refresh for UI Consistency
  const refreshAllCycleData = async (options: { forceFresh?: boolean; showToast?: boolean } = {}) => {
    const { forceFresh = false, showToast = false } = options;
    
    if (!selectedCycle) return;

    try {
      console.log(`[FRONTEND] Starting comprehensive data refresh - forceFresh: ${forceFresh}`);
      
      // Start all refresh operations simultaneously for better performance
      const refreshPromises = [
        loadCycleAnalytics(forceFresh),
        loadWinners(forceFresh),
        loadEnhancedWinners(forceFresh)
      ];

      // Wait for all refresh operations to complete
      await Promise.all(refreshPromises);

      console.log(`[FRONTEND] Comprehensive data refresh completed successfully`);
      
      if (showToast) {
        toast({
          title: "Data Refreshed",
          description: "All cycle data has been updated to reflect the latest changes.",
        });
      }
    } catch (error) {
      console.error('[FRONTEND] Error during comprehensive data refresh:', error);
      
      if (showToast) {
        toast({
          title: "Refresh Error",
          description: "Some data may not have refreshed properly. Please try again if needed.",
          variant: "destructive"
        });
      }
    }
  };

  // PHASE 4 STEP 3: Reversible Seal - Unseal Handler with Safety Confirmation
  const handleUnsealWinnerSelection = async () => {
    setShowUnsealConfirmation(true);
  };

  const proceedWithUnsealing = async () => {
    if (!selectedCycle) return;

    setIsUnsealingSelection(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/cycle-winner-selection/${selectedCycle.id}/unseal`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Winner Selection Unsealed Successfully",
          description: `Selection for ${selectedCycle.cycleName} has been reopened for modifications. This action has been logged for audit.`
        });
        setShowUnsealConfirmation(false);
        
        // PHASE 4 STEP 4: Use comprehensive state refresh for complete UI consistency
        await refreshAllCycleData({ forceFresh: true, showToast: false });
      } else {
        toast({
          title: "Unseal Failed",
          description: data.error || "Failed to unseal winner selection. Check if payouts have been processed.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unseal winner selection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUnsealingSelection(false);
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
        
        // PHASE 4 STEP 4: Use comprehensive state refresh for complete UI consistency
        await refreshAllCycleData({ forceFresh: true, showToast: false });
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
        
        // PHASE 4 STEP 4: Use comprehensive state refresh for complete UI consistency
        await refreshAllCycleData({ forceFresh: true, showToast: false });
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
      {/* PHASE 2B: Enhanced Workflow Progress Indicator */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3 text-sm">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-gray-400" />
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">1. Setup</span>
            </div>
            <div className="w-8 h-px bg-green-300"></div>
            <div className="flex items-center gap-1">
              <Activity className="w-4 h-4 text-green-600" />
              <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium">2. Operations</span>
            </div>
            <div className="w-8 h-px bg-gray-200"></div>
            <div className="flex items-center gap-1">
              <Timer className="w-4 h-4 text-gray-400" />
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">3. Execute</span>
            </div>
          </div>
          <div className="text-xs text-green-700 font-medium bg-green-100 px-2 py-1 rounded">
            🎯 Operations Phase: Generate & manage winner selections
          </div>
        </div>
        {/* PHASE 2B: Dynamic Status Based on Current State */}
        {selectedCycle && (
          <div className="text-xs text-gray-600 mt-2 flex items-center gap-4">
            <span>Selected: <strong>{selectedCycle.cycleName}</strong></span>
            {enhancedWinners.some(w => w.isSealed) ? (
              <span className="text-green-600">✅ Selection sealed and final</span>
            ) : winners.length > 0 ? (
              <span className="text-amber-600">📝 Selection in draft mode</span>
            ) : pendingWinners.length > 0 ? (
              <span className="text-blue-600">⏳ Selection generated, needs saving</span>
            ) : (
              <span className="text-gray-500">🎲 Ready for winner selection</span>
            )}
          </div>
        )}
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
                Winner Selection Management
              </CardTitle>
              <CardDescription>
                Generate, save, and finalize winner selections with full audit trail
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

                {/* PHASE 2B: Enhanced UX Indicators - Save/Seal Workflow Controls */}
                {pendingWinners.length > 0 && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
                        <AlertCircle className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-semibold text-blue-900">
                        Step 1: Winner Selection Complete ({pendingWinners.length} winners generated)
                      </span>
                      <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-800">
                        Temporary
                      </Badge>
                    </div>
                    <div className="bg-white rounded-md p-3 mb-3">
                      <p className="text-xs text-gray-600 mb-2">
                        <strong>Next Action Required:</strong> Save as draft to persist data and enable export/import workflow
                      </p>
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={handleSaveWinnerSelection}
                          disabled={isSavingSelection}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {isSavingSelection ? (
                            <>
                              <Timer className="w-4 h-4 mr-2 animate-spin" />
                              Saving Draft...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save as Draft
                            </>
                          )}
                        </Button>
                        <div className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">
                          💡 This creates a recoverable draft you can modify later
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-blue-600">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span>Data is temporary until saved</span>
                    </div>
                  </div>
                )}

                {/* PHASE 2B: Enhanced Seal Selection Controls with UX Indicators */}
                {winners.length > 0 && selectedCycle && !enhancedWinners.some(w => w.isSealed) && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 bg-amber-100 rounded-full">
                          <Lock className="w-4 h-4 text-amber-600" />
                        </div>
                        <span className="text-sm font-semibold text-amber-900">
                          Step 2: Review & Finalize Selection
                        </span>
                        <Badge variant="outline" className="border-amber-300 text-amber-700">
                          Draft Mode
                        </Badge>
                      </div>
                      <Button 
                        onClick={handleSealWinnerSelection}
                        disabled={isSealingSelection}
                        variant="destructive"
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
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
                    <div className="bg-white rounded-md p-3 mb-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="font-medium text-gray-700 mb-1">✅ What you can do now:</p>
                          <ul className="text-gray-600 space-y-1">
                            <li>• Export winner data to Excel</li>
                            <li>• Modify payout amounts</li>
                            <li>• Import updated data</li>
                            <li>• Review all selections</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium text-red-700 mb-1">⚠️ After sealing:</p>
                          <ul className="text-red-600 space-y-1">
                            <li>• No modifications allowed</li>
                            <li>• Selection becomes permanent</li>
                            <li>• Ready for payout processing</li>
                            <li>• Cannot regenerate winners</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-amber-600">
                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                        <span>Selection is modifiable in draft mode</span>
                      </div>
                      <span className="text-red-600 font-medium">
                        ⚠️ Sealing is irreversible
                      </span>
                    </div>
                  </div>
                )}

                {/* PHASE 2B: Sealed Status Indicator with PHASE 4 STEP 3: Reversible Seal Controls */}
                {enhancedWinners.some(w => w.isSealed) && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-sm font-semibold text-green-900">
                          Selection Sealed & Finalized
                        </span>
                        <Badge className="ml-2 bg-green-100 text-green-800">
                          Locked
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-green-700">
                          {enhancedWinners.find(w => w.sealedAt) && (
                            `Sealed: ${new Date(enhancedWinners.find(w => w.sealedAt)?.sealedAt || '').toLocaleDateString()}`
                          )}
                        </div>
                        {/* PHASE 4 STEP 3: Unseal Button with Warning Style */}
                        <Button 
                          onClick={handleUnsealWinnerSelection}
                          disabled={isUnsealingSelection}
                          variant="outline"
                          size="sm"
                          className="border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400"
                        >
                          {isUnsealingSelection ? (
                            <>
                              <Timer className="w-4 h-4 mr-2 animate-spin" />
                              Unsealing...
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 mr-2" />
                              Unseal for Testing
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-green-700 bg-green-50 p-2 rounded">
                      🔒 This selection is permanently locked and ready for payout processing
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* PHASE 2B: ENHANCED SELECTED WINNERS TABLE WITH UX INDICATORS */}
          {enhancedWinners.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5" />
                      Selected Winners - Enhanced Management
                      {enhancedWinners.some(w => w.isSealed) && (
                        <Badge className="ml-2 bg-green-100 text-green-800">
                          <Lock className="w-3 h-3 mr-1" />
                          Sealed
                        </Badge>
                      )}
                      {!enhancedWinners.some(w => w.isSealed) && winners.length > 0 && (
                        <Badge variant="outline" className="ml-2 border-amber-300 text-amber-700">
                          <Save className="w-3 h-3 mr-1" />
                          Draft
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4">
                      <span>{enhancedWinners.length} winners with complete payout details and Excel export/import capabilities</span>
                      {/* PHASE 2B: Save/Seal Status in table header */}
                      {enhancedWinners.some(w => w.isSealed) ? (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Final & Locked
                        </span>
                      ) : winners.length > 0 ? (
                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Draft - Modifiable
                        </span>
                      ) : null}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {/* PHASE 4 STEP 4: Enhanced Force Refresh with Comprehensive State Management */}
                    <Button
                      onClick={() => refreshAllCycleData({ forceFresh: true, showToast: true })}
                      disabled={loadingEnhanced}
                      variant="outline"
                      size="sm"
                    >
                      {loadingEnhanced ? (
                        <>
                          <Timer className="w-4 h-4 mr-2 animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Force Refresh
                        </>
                      )}
                    </Button>
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
                        <TableHead className="w-20">Payout Status</TableHead>
                        <TableHead className="w-32">Save/Seal Status</TableHead>
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
                            {winner.cyclePoints || '-'}
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            <Input
                              type="text"
                              value={(winner.tierSizeAmount / 100).toFixed(2)}
                              onChange={(e) => {
                                const newAmount = Math.round(parseFloat(e.target.value || '0') * 100);
                                handleTierSizeUpdate(winner.email, newAmount);
                              }}
                              className="h-8 text-sm"
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
                          <TableCell>
                            {/* Phase 2A: Save/Seal Status Column - resolves Issue #2 UX confusion */}
                            <div className="flex flex-col gap-1">
                              <Badge 
                                variant={winner.isSealed ? 'default' : 'outline'}
                                className={winner.isSealed ? 'bg-green-100 text-green-800 border-green-300' : 'bg-yellow-100 text-yellow-800 border-yellow-300'}
                              >
                                {winner.isSealed ? (
                                  <>
                                    <Lock className="w-3 h-3 mr-1" />
                                    Sealed
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-3 h-3 mr-1" />
                                    Draft
                                  </>
                                )}
                              </Badge>
                              {winner.savedAt && (
                                <span className="text-xs text-gray-500">
                                  Saved: {new Date(winner.savedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              )}
                            </div>
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

              {/* Showing all winners in scrollable table - no pagination needed */}
              <div className="mt-4 px-6 pb-6">
                <div className="text-sm text-gray-600 text-center">
                  Showing all {enhancedWinners.length} winners
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

      {/* PHASE 2C: Enhanced Seal Confirmation Dialog */}
      <Dialog open={showSealConfirmation} onOpenChange={setShowSealConfirmation}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Seal Winner Selection - Confirmation Required
            </DialogTitle>
            <DialogDescription>
              This action will permanently lock the selection for <strong>{selectedCycle?.cycleName}</strong>. 
              Please complete all confirmation steps below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Step 1: Data Review */}
            <div className={`p-4 rounded-lg border ${sealConfirmationStep >= 1 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                  sealConfirmationChecks.reviewedData ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {sealConfirmationChecks.reviewedData ? '✓' : '1'}
                </div>
                <span className="font-medium">Review Selection Data</span>
              </div>
              <div className="text-sm text-gray-600 mb-3">
                Confirm you have reviewed all winner data, payout amounts, and PayPal email addresses.
              </div>
              <div className="bg-white p-3 rounded border text-xs">
                <div className="grid grid-cols-3 gap-4 mb-2">
                  <div><strong>Total Winners:</strong> {enhancedWinners.length}</div>
                  <div><strong>Total Payout:</strong> ${enhancedWinners.reduce((sum, w) => sum + w.payoutFinal, 0) / 100}</div>
                  <div><strong>Cycle:</strong> {selectedCycle?.cycleName}</div>
                </div>
                <div className="text-gray-500">
                  Missing PayPal: {enhancedWinners.filter(w => !w.paypalEmail).length} winners
                </div>
              </div>
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sealConfirmationChecks.reviewedData}
                  onChange={(e) => setSealConfirmationChecks(prev => ({
                    ...prev,
                    reviewedData: e.target.checked
                  }))}
                  className="w-4 h-4"
                />
                <span className="text-sm">I have reviewed all selection data and amounts</span>
              </label>
            </div>

            {/* Step 2: Final Confirmation */}
            <div className={`p-4 rounded-lg border ${sealConfirmationStep >= 2 || sealConfirmationChecks.reviewedData ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                  sealConfirmationChecks.confirmedFinal ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {sealConfirmationChecks.confirmedFinal ? '✓' : '2'}
                </div>
                <span className="font-medium">Confirm Final Selection</span>
              </div>
              <div className="text-sm text-gray-600 mb-3">
                This selection is final and ready for payout processing.
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sealConfirmationChecks.confirmedFinal}
                  onChange={(e) => setSealConfirmationChecks(prev => ({
                    ...prev,
                    confirmedFinal: e.target.checked
                  }))}
                  disabled={!sealConfirmationChecks.reviewedData}
                  className="w-4 h-4"
                />
                <span className="text-sm">This selection is accurate and final</span>
              </label>
            </div>

            {/* Step 3: Irreversible Warning */}
            <div className={`p-4 rounded-lg border ${sealConfirmationChecks.confirmedFinal ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
                  sealConfirmationChecks.understoodIrreversible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {sealConfirmationChecks.understoodIrreversible ? '✓' : '⚠'}
                </div>
                <span className="font-medium text-red-800">Understand Irreversible Action</span>
              </div>
              <div className="text-sm text-red-700 mb-3 bg-red-100 p-2 rounded">
                <strong>⚠️ WARNING:</strong> Once sealed, you cannot modify winners, amounts, or regenerate the selection. 
                The data becomes permanently locked for payout processing.
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sealConfirmationChecks.understoodIrreversible}
                  onChange={(e) => setSealConfirmationChecks(prev => ({
                    ...prev,
                    understoodIrreversible: e.target.checked
                  }))}
                  disabled={!sealConfirmationChecks.confirmedFinal}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">I understand this action is irreversible</span>
              </label>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowSealConfirmation(false)}
              disabled={isSealingSelection}
            >
              Cancel
            </Button>
            <Button
              onClick={proceedWithSealing}
              disabled={
                !sealConfirmationChecks.reviewedData || 
                !sealConfirmationChecks.confirmedFinal || 
                !sealConfirmationChecks.understoodIrreversible ||
                isSealingSelection
              }
              variant="destructive"
              className="bg-red-600 hover:bg-red-700"
            >
              {isSealingSelection ? (
                <>
                  <Timer className="w-4 h-4 mr-2 animate-spin" />
                  Sealing Selection...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Seal Final Selection
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PHASE 4 STEP 3: Unseal Confirmation Dialog with Safety Warning */}
      <Dialog open={showUnsealConfirmation} onOpenChange={setShowUnsealConfirmation}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Unseal Winner Selection - Testing Mode
            </DialogTitle>
            <DialogDescription>
              This will reopen the sealed selection for <strong>{selectedCycle?.cycleName}</strong> for testing purposes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Warning Box */}
            <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-amber-800 mb-2">⚠️ Important Safety Notes</div>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• This action will reopen the selection for modifications</li>
                    <li>• Winner celebration banners will be reset for fresh testing</li>
                    <li>• Cannot unseal if payouts have already been processed</li>
                    <li>• This action is logged for audit trail purposes</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Audit Trail Notice */}
            <div className="p-3 rounded border border-blue-200 bg-blue-50">
              <div className="text-sm text-blue-700">
                <strong>🔍 Audit Trail:</strong> This unseal operation will be logged with your admin ID and timestamp 
                for complete accountability and testing workflow documentation.
              </div>
            </div>

            {/* Current Status Summary */}
            <div className="p-3 rounded border border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-700">
                <div className="font-medium mb-1">Current Selection Status:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Winners: {enhancedWinners.length}</div>
                  <div>Sealed: {enhancedWinners.some(w => w.isSealed) ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowUnsealConfirmation(false)}
              disabled={isUnsealingSelection}
            >
              Cancel
            </Button>
            <Button
              onClick={proceedWithUnsealing}
              disabled={isUnsealingSelection}
              variant="outline"
              className="border-amber-400 text-amber-700 hover:bg-amber-50"
            >
              {isUnsealingSelection ? (
                <>
                  <Timer className="w-4 h-4 mr-2 animate-spin" />
                  Unsealing...
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Proceed with Unseal
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}