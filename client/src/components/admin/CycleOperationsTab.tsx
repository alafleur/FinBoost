import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle, AlertCircle, History, RefreshCw, Users, DollarSign } from 'lucide-react';

interface CycleSetting {
  id: number;
  cycleName: string;
  cycleStartDate: Date;
  cycleEndDate: Date;
  isActive: boolean;
}

interface CycleOperationsTabProps {
  cycleSettings: CycleSetting[];
  onRefresh: () => void;
}

export default function CycleOperationsTab({ cycleSettings, onRefresh }: CycleOperationsTabProps) {
  const { toast } = useToast();
  
  const [selectedCycle, setSelectedCycle] = useState<CycleSetting | null>(null);
  const [isProcessingPayouts, setIsProcessingPayouts] = useState(false);
  const [showProcessingDialog, setShowProcessingDialog] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({
    phase: 'Initializing',
    progress: 0,
    message: 'Starting disbursement...',
    batchId: null as number | null,
    chunkCount: 0,
    currentChunk: 0
  });

  // History drawer state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<any>(null);
  const [lastCompletedBatch, setLastCompletedBatch] = useState<any>(null);
  const [activeBatchId, setActiveBatchId] = useState<number | null>(null);
  const [eligibleCount, setEligibleCount] = useState<number>(0);
  
  // Get active cycle on component mount
  useEffect(() => {
    const activeCycle = cycleSettings.find(cycle => cycle.isActive);
    if (activeCycle) {
      setSelectedCycle(activeCycle);
      loadHistory(activeCycle.id);
      loadEligibleCount(activeCycle.id);
    }
  }, [cycleSettings]);

  const loadHistory = async (cycleId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/payout-batches?cycleId=${cycleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const batches = await response.json();
        setHistory(batches);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const loadSummary = async (batchId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/payout-batches/${batchId}/summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const summary = await response.json();
        setSelectedSummary(summary);
      }
    } catch (error) {
      console.error('Failed to load summary:', error);
      toast({ title: "Error", description: "Failed to load batch summary", variant: "destructive" });
    }
  };

  const onRetryFailed = async (batchId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/payout-batches/${batchId}/retry-failed`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        toast({ title: "Success", description: `Created retry batch #${result.batchId}` });
        if (selectedCycle) {
          loadHistory(selectedCycle.id);
        }
        setSelectedSummary(null);
      }
    } catch (error) {
      console.error('Failed to retry failed:', error);
      toast({ title: "Error", description: "Failed to create retry batch", variant: "destructive" });
    }
  };

  const loadEligibleCount = async (cycleId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/cycle-winner-details/${cycleId}/paginated`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Count unpaid winners as eligible
        const eligible = (data.winners || []).filter((w: any) => !w.isProcessed).length;
        setEligibleCount(eligible);
      }
    } catch (error) {
      console.error('Failed to load eligible count:', error);
    }
  };

  const handleProcessDisbursements = async () => {
    if (!selectedCycle) return;
    
    try {
      setIsProcessingPayouts(true);
      setShowProcessingDialog(true);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/winner-cycles/${selectedCycle.id}/process-disbursements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Process failed: ${response.status}`);
      }

      const result = await response.json();
      const batchId = result.batchId;
      setActiveBatchId(batchId);
      
      // Start polling for progress
      pollBatchStatus(batchId);
      
    } catch (error) {
      console.error('Disbursement process failed:', error);
      toast({
        title: "Error",
        description: "Failed to start disbursement process",
        variant: "destructive"
      });
      setIsProcessingPayouts(false);
      setShowProcessingDialog(false);
    }
  };

  const pollBatchStatus = async (batchId: number) => {
    const token = localStorage.getItem('token');
    
    const poll = async () => {
      try {
        const response = await fetch(`/api/admin/payout-batches/${batchId}/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) return setTimeout(poll, 3000);
        
        const status = await response.json();
        
        // Update progress
        const progress = status.totalChunks > 0 
          ? Math.floor((status.completedChunks / status.totalChunks) * 100)
          : 10;
          
        setProcessingProgress({
          phase: status.status === 'completed' ? 'Completed' : 'Processing',
          progress: status.status === 'completed' ? 100 : Math.max(10, progress),
          message: `Chunk ${status.completedChunks || 0}/${status.totalChunks || 1} - ${status.processedItems || 0}/${status.totalItems || 0} items`,
          batchId,
          chunkCount: status.totalChunks || 1,
          currentChunk: status.completedChunks || 0
        });

        if (status.status === 'completed') {
          // Completion logic
          toast({ title: "✅ Disbursement Complete", description: `Batch ${batchId} finished successfully` });
          setTimeout(() => {
            setShowProcessingDialog(false);
            setIsProcessingPayouts(false);
            setActiveBatchId(null);
            
            // Load completion summary and refresh data
            if (selectedCycle) {
              loadHistory(selectedCycle.id);
              loadEligibleCount(selectedCycle.id);
              loadSummary(batchId).then(() => setLastCompletedBatch({ id: batchId }));
            }
          }, 2000);
          return;
        }

        if (status.status === 'failed') {
          toast({
            title: "🚨 Batch Failed",
            description: status.error || 'Processing failed',
            variant: "destructive"
          });
          setTimeout(() => {
            setShowProcessingDialog(false);
            setIsProcessingPayouts(false);
            setActiveBatchId(null);
          }, 2000);
          return;
        }

        // Continue polling
        setTimeout(poll, 2000);
        
      } catch (error) {
        console.error('Polling error:', error);
        setTimeout(poll, 3000);
      }
    };

    poll();
  };

  // Resume active disbursement on page load
  useEffect(() => {
    if (!selectedCycle) return;
    
    const resumeActive = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/payout-batches/active?cycleId=${selectedCycle.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const batch = await response.json();
          if (batch.batchId && batch.status !== 'completed') {
            setActiveBatchId(batch.batchId);
            setIsProcessingPayouts(true);
            setShowProcessingDialog(true);
            pollBatchStatus(batch.batchId);
          }
        }
      } catch (error) {
        console.error('Failed to resume active batch:', error);
      }
    };

    resumeActive();
  }, [selectedCycle]);

  if (!selectedCycle) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cycle Operations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No active cycle found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Disbursement Operations - {selectedCycle.cycleName}</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setHistoryOpen(true)}>
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
              <Button variant="outline" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="flex items-center p-6">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{eligibleCount}</p>
                  <p className="text-gray-600 text-sm">Eligible Winners</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center p-6">
                <Clock className="h-8 w-8 text-orange-500 mr-3" />
                <div>
                  <p className="text-sm font-medium">
                    {activeBatchId ? (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Processing</Badge>
                    ) : (
                      <Badge variant="outline">Ready</Badge>
                    )}
                  </p>
                  <p className="text-gray-600 text-sm">Status</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-center p-6">
                <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium">
                    {lastCompletedBatch ? `Batch #${lastCompletedBatch.id}` : 'None'}
                  </p>
                  <p className="text-gray-600 text-sm">Last Completed</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Last Disbursement Success Banner */}
          {lastCompletedBatch && selectedSummary && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-start justify-between">
                <div className="flex">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">
                      Last Disbursement Completed - Batch #{lastCompletedBatch.id}
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Success: {selectedSummary.success} • Failed: {selectedSummary.failed} • 
                      Unclaimed: {selectedSummary.unclaimed} • Pending: {selectedSummary.pending}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {selectedSummary.failed > 0 && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onRetryFailed(lastCompletedBatch.id)}
                    >
                      Retry Failed
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setHistoryOpen(true)}
                  >
                    View History
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Main Process Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleProcessDisbursements}
              disabled={isProcessingPayouts || eligibleCount === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
            >
              {isProcessingPayouts ? (
                <>
                  <Clock className="animate-spin h-4 w-4 mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Process Disbursements ({eligibleCount})
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Processing Dialog */}
      <Dialog open={showProcessingDialog} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[425px]" hideClose>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Clock className={processingProgress.phase === 'Completed' ? 'h-5 w-5 text-green-600 mr-2' : 'h-5 w-5 text-blue-600 mr-2 animate-spin'} />
              {processingProgress.phase === 'Completed' ? 'Disbursement Successful!' : 'Processing Disbursements...'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{processingProgress.progress}%</span>
                </div>
                <Progress value={processingProgress.progress} className="w-full" />
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium">Status: {processingProgress.phase}</p>
                <p>{processingProgress.message}</p>
                {processingProgress.batchId && (
                  <p className="mt-2">Batch ID: #{processingProgress.batchId}</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Drawer */}
      {historyOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50">
          <div className="bg-white w-full max-w-xl p-6 overflow-auto shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Disbursement History</h3>
              <Button variant="outline" onClick={() => setHistoryOpen(false)}>
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              {history.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No disbursement history found.</p>
              ) : (
                history.map((batch: any) => (
                  <div key={batch.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">Batch #{batch.id}</p>
                        <p className="text-sm text-gray-500">
                          Status: <Badge variant="outline">{batch.status}</Badge>
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => loadSummary(batch.id)}
                      >
                        View Details
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400">
                      Created: {new Date(batch.createdAt).toLocaleString()}
                    </p>
                    {batch.paypalBatchId && (
                      <p className="text-xs text-gray-400">
                        PayPal ID: {batch.paypalBatchId}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Summary Panel */}
            {selectedSummary && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold mb-3">Batch #{selectedSummary.id} Summary</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>Total Items: <span className="font-medium">{selectedSummary.totalItems}</span></div>
                  <div>Success: <span className="font-medium text-green-600">{selectedSummary.success}</span></div>
                  <div>Failed: <span className="font-medium text-red-600">{selectedSummary.failed}</span></div>
                  <div>Unclaimed: <span className="font-medium text-yellow-600">{selectedSummary.unclaimed}</span></div>
                  <div>Pending: <span className="font-medium text-blue-600">{selectedSummary.pending}</span></div>
                  <div>Total Paid: <span className="font-medium text-green-600">
                    ${(selectedSummary.totals?.success || 0).toFixed(2)}
                  </span></div>
                </div>
                
                {selectedSummary.failed > 0 && (
                  <div className="mt-4 pt-3 border-t">
                    <Button 
                      onClick={() => onRetryFailed(selectedSummary.id)}
                      className="w-full"
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Retry Failed Items as New Batch
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}