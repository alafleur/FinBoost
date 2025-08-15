import React, { useEffect, useState } from "react";

/**
 * CycleOperationsTab
 * - Fixes "completed on refresh still shows Processing…" by seeding the ribbon from /summary
 * - Integrates Disbursement History in the same tab (list, per-batch summary, retry-failed)
 * - Uses backend endpoints:
 *    GET  /api/admin/payout-batches/active?cycleId={id}
 *    GET  /api/admin/payout-batches/{batchId}/status
 *    GET  /api/admin/payout-batches?cycleId={id}
 *    GET  /api/admin/payout-batches/{batchId}/summary
 *    POST /api/admin/payout-batches/{batchId}/retry-failed
 */

type BatchSummary = {
  id: number;
  totalItems: number;
  success: number;
  failed: number;
  unclaimed: number;
  pending?: number;
  processing?: number;
  totals?: {
    success?: number;
    failed?: number;
    unclaimed?: number;
    pending?: number;
    processing?: number;
  };
};

type ActiveBatchPayload = {
  batchId: number;
  status: string; // completed | processing | failed
  totalChunks: number;
  completedChunks: number;
  processedItems: number;
  totalItems: number;
  paypalBatchId?: string | null;
  pollVersion?: number;
};

type ProcessingProgress = {
  phase: "Processing" | "Completed" | "Error";
  progress: number;
  message: string;
  batchId: number | null;
  chunkCount: number;
  currentChunk: number;
};

type Cycle = { id: number; title?: string };

type Props = {
  selectedCycle?: Cycle;
  refreshAllCycleData?: (opts?: { forceFresh?: boolean }) => Promise<void>;
  setIsProcessingPayouts?: (v: boolean) => void;
  setShowProcessingDialog?: (v: boolean) => void;
  setProcessingProgress?: (p: ProcessingProgress) => void;
  setSelectedForDisbursement?: (s: Set<number>) => void;
  children?: React.ReactNode;
};

const noopAsync = async () => {};
const noop = () => {};
const defaultSetProcessing = (_p: ProcessingProgress) => {};

const CycleOperationsTab: React.FC<Props> = ({
  selectedCycle,
  refreshAllCycleData = noopAsync,
  setIsProcessingPayouts = noop,
  setShowProcessingDialog = noop,
  setProcessingProgress = defaultSetProcessing,
  setSelectedForDisbursement = () => {},
  children,
}) => {
  const [lastCompletedBatch, setLastCompletedBatch] = useState<(BatchSummary & { completedAt?: string | Date }) | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<BatchSummary | null>(null);

  async function openHistoryDrawer() {
    if (!selectedCycle) return;
    setHistoryOpen(true);
    const token = localStorage.getItem("token") || "";
    const rows = await fetch(`/api/admin/payout-batches?cycleId=${selectedCycle.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());
    setHistory(rows || []);

    if (!lastCompletedBatch && Array.isArray(rows)) {
      const recentCompleted = rows.find((x: any) => String(x.status).toLowerCase() === "completed");
      if (recentCompleted) {
        try {
          const summary = await fetch(`/api/admin/payout-batches/${recentCompleted.id}/summary`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((r) => (r.ok ? r.json() : null));
          if (summary) {
            setLastCompletedBatch({
              ...summary,
              id: recentCompleted.id,
              completedAt: recentCompleted.completedAt || new Date().toISOString(),
            });
          } else {
            setLastCompletedBatch({
              id: recentCompleted.id,
              totalItems: 0,
              success: 0,
              failed: 0,
              unclaimed: 0,
              completedAt: recentCompleted.completedAt || new Date().toISOString(),
            });
          }
        } catch {/* non-fatal */}
      }
    }
  }

  async function loadSummary(batchId: number) {
    const token = localStorage.getItem("token") || "";
    const sum = await fetch(`/api/admin/payout-batches/${batchId}/summary`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json());
    setSelectedSummary(sum);
  }

  async function onRetryFailed(batchId: number) {
    const token = localStorage.getItem("token") || "";
    const r = await fetch(`/api/admin/payout-batches/${batchId}/retry-failed`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.ok) {
      await openHistoryDrawer();
    } else {
      const data = await r.json().catch(() => ({}));
      console.warn("Retry failed:", data);
    }
  }

  useEffect(() => {
    const resumeActiveDisbursement = async () => {
      if (!selectedCycle) return;

      try {
        const token = localStorage.getItem("token") || "";
        const r = await fetch(`/api/admin/payout-batches/active?cycleId=${selectedCycle.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!r.ok) return;

        const b: ActiveBatchPayload = await r.json();
        if (!b?.batchId) return;

        if (String(b.status).toLowerCase() === "completed") {
          try {
            const sr = await fetch(`/api/admin/payout-batches/${b.batchId}/summary`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (sr.ok) {
              const summary: BatchSummary = await sr.json();
              setLastCompletedBatch({
                ...summary,
                id: b.batchId,
                completedAt: new Date(),
              });
            }
          } catch (e) {
            console.warn("Failed to load completion summary on resume:", e);
          }

          setIsProcessingPayouts(false);
          setShowProcessingDialog(false);
          setProcessingProgress({
            phase: "Completed",
            progress: 100,
            message: "Disbursement Successful!",
            batchId: null,
            chunkCount: b.totalChunks || 1,
            currentChunk: b.totalChunks || 1,
          });

          await refreshAllCycleData({ forceFresh: true });
          return;
        }

        setShowProcessingDialog(true);
        setIsProcessingPayouts(true);
        setProcessingProgress({
          phase: "Processing",
          progress: Math.max(5, Math.floor(((b.completedChunks ?? 0) / (b.totalChunks || 1)) * 100)),
          message: `Resuming batch ${b.batchId}...`,
          batchId: b.batchId,
          chunkCount: b.totalChunks || 1,
          currentChunk: b.completedChunks || 0,
        });

        const pollStatus = async () => {
          try {
            const statusResponse = await fetch(`/api/admin/payout-batches/${b.batchId}/status`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!statusResponse.ok) throw new Error(`status ${statusResponse.status}`);
            const s: ActiveBatchPayload = await statusResponse.json();

            const totalChunks = s.totalChunks || 1;
            const completedChunks = s.completedChunks ?? 0;
            const processedItems = s.processedItems ?? 0;
            const totalItems = s.totalItems ?? 0;

            if (s.status === "completed") {
              setProcessingProgress((prev) => ({
                ...prev,
                phase: "Completed",
                progress: 100,
                message: `Disbursement Successful! Processed ${processedItems}/${totalItems} items`,
                batchId: null,
                chunkCount: totalChunks,
                currentChunk: totalChunks,
              }));

              try {
                const summaryResponse = await fetch(`/api/admin/payout-batches/${b.batchId}/summary`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (summaryResponse.ok) {
                  const summary: BatchSummary = await summaryResponse.json();
                  setLastCompletedBatch({
                    ...summary,
                    id: b.batchId,
                    completedAt: new Date(),
                  });
                }
              } catch { /* non-fatal */ }

              setTimeout(() => setShowProcessingDialog(false), 1200);
              await refreshAllCycleData({ forceFresh: true });
              setIsProcessingPayouts(false);
              setSelectedForDisbursement(new Set());
              return;
            }

            if (s.status === "failed") {
              setProcessingProgress((prev) => ({
                ...prev,
                phase: "Error",
                progress: 0,
                message: "Batch failed",
                batchId: b.batchId,
                chunkCount: totalChunks,
                currentChunk: completedChunks,
              }));
              setTimeout(() => setShowProcessingDialog(false), 1200);
              setIsProcessingPayouts(false);
              return;
            }

            const pct = Math.max(10, Math.min(99, Math.floor((completedChunks / totalChunks) * 100)));
            setProcessingProgress((prev) => ({
              ...prev,
              phase: "Processing",
              progress: pct,
              message: `Chunk ${completedChunks}/${totalChunks} processed — ${processedItems}/${totalItems} items`,
              batchId: b.batchId,
              chunkCount: totalChunks,
              currentChunk: completedChunks,
            }));
            setTimeout(pollStatus, 2000);
          } catch {
            setTimeout(pollStatus, 3000);
          }
        };

        pollStatus();
      } catch {
        // non-fatal
      }
    };

    resumeActiveDisbursement();
  }, [
    selectedCycle,
    refreshAllCycleData,
    setIsProcessingPayouts,
    setShowProcessingDialog,
    setProcessingProgress,
    setSelectedForDisbursement,
  ]);

  return (
    <>
      {lastCompletedBatch && (
        <div className="mb-3 rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-900">
          <div className="font-medium">Last disbursement completed</div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <span>Batch #{lastCompletedBatch.id}</span>
            {typeof lastCompletedBatch.totalItems === "number" && (
              <>
                <span>Total: {lastCompletedBatch.totalItems}</span>
                <span>Success: {lastCompletedBatch.success}</span>
                <span>Unclaimed: {lastCompletedBatch.unclaimed}</span>
                <span>Failed: {lastCompletedBatch.failed}</span>
              </>
            )}
            <button className="underline" onClick={() => openHistoryDrawer()}>
              View history
            </button>
            {lastCompletedBatch?.failed > 0 && (
              <button className="underline" onClick={() => onRetryFailed(lastCompletedBatch.id)}>
                Retry failed
              </button>
            )}
          </div>
        </div>
      )}

      {children}

      {historyOpen && (
        <div className="fixed inset-0 bg-black/30 z-50">
          <aside className="absolute right-0 top-0 h-full w-full max-w-xl bg-white p-4 overflow-auto shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Disbursement History</h3>
              <button onClick={() => setHistoryOpen(false)}>✕</button>
            </div>

            <ul className="space-y-2">
              {history.map((b: any) => (
                <li key={b.id} className="border rounded p-2 flex items-center justify-between">
                  <div>
                    <div className="font-medium">Batch #{b.id}</div>
                    <div className="text-xs text-gray-500">
                      Status: {b.status} • Created: {b.createdAt ? new Date(b.createdAt).toLocaleString() : "—"}
                    </div>
                  </div>
                  <button className="underline" onClick={() => loadSummary(b.id)}>
                    View
                  </button>
                </li>
              ))}
            </ul>

            {selectedSummary && (
              <div className="mt-4 border-t pt-3">
                <div className="font-medium">Batch #{selectedSummary.id} — Summary</div>
                <div className="text-sm mt-1 grid grid-cols-2 gap-2">
                  <div>Total Items: {selectedSummary.totalItems}</div>
                  <div>Success: {selectedSummary.success}</div>
                  <div>Unclaimed: {selectedSummary.unclaimed}</div>
                  <div>Failed: {selectedSummary.failed}</div>
                  <div>Pending: {selectedSummary.pending ?? 0}</div>
                  <div>Paid Total: ${Number(selectedSummary.totals?.success || 0).toFixed(2)}</div>
                </div>
                {selectedSummary.failed > 0 && (
                  <button
                    className="mt-3 rounded bg-blue-600 px-3 py-1 text-white"
                    onClick={() => onRetryFailed(selectedSummary.id!)}
                  >
                    Retry failed as new batch
                  </button>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
};

export default CycleOperationsTab;
