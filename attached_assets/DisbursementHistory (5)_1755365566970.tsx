import React, { useEffect, useMemo, useState } from "react";

type Cycle = { id: number; title?: string; name?: string };
type BatchRow = {
  id: number;
  status: string;
  createdAt?: string;
  completedAt?: string | null;
  paypalBatchId?: string | null;
};
type Summary = {
  id: number;
  totalItems: number;
  success: number;
  failed: number;
  unclaimed: number;
  pending?: number;
  processing?: number;
  totals?: {
    success?: number; // paid amount
    failed?: number;
    unclaimed?: number;
    pending?: number;
    processing?: number;
  };
};

const numberFmt = (n: any) => {
  const v = Number(n ?? 0);
  return isFinite(v) ? v.toLocaleString() : "0";
};
const money = (n: any) => {
  const v = Number(n ?? 0);
  return isFinite(v) ? `$${v.toFixed(2)}` : "$0.00";
};

export default function DisbursementHistory() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [cycleId, setCycleId] = useState<number | null>(null);
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<number | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [hintCompletedBatch, setHintCompletedBatch] = useState<number | null>(null);

  const token = useMemo(() => localStorage.getItem("token") || "", []);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/cycles", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) {
          const rows = await r.json();
          setCycles(rows || []);
          if (rows?.[0]?.id && !cycleId) setCycleId(rows[0].id);
        }
      } catch (e) {
        console.warn("load cycles failed", e);
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!cycleId) return;
    (async () => {
      setLoading(true);
      setSelectedBatch(null);
      setSummary(null);
      setHintCompletedBatch(null);
      try {
        const r = await fetch(`/api/admin/payout-batches?cycleId=${cycleId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const rows = r.ok ? await r.json() : [];
        setBatches(rows || []);

        // Empty-state detector: check /active for a completed batch that isn't listed
        if (!rows || rows.length === 0) {
          const a = await fetch(`/api/admin/payout-batches/active?cycleId=${cycleId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (a.ok) {
            const info = await a.json();
            if (String(info.status).toLowerCase() === "completed" && info.batchId) {
              setHintCompletedBatch(Number(info.batchId));
            }
          }
        }
      } catch (e) {
        console.warn("load batches failed", e);
        setBatches([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [cycleId, token]);

  useEffect(() => {
    if (!selectedBatch) return;
    (async () => {
      try {
        const r = await fetch(`/api/admin/payout-batches/${selectedBatch}/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const s = r.ok ? await r.json() : null;
        setSummary(s);
      } catch (e) {
        console.warn("load summary failed", e);
        setSummary(null);
      }
    })();
  }, [selectedBatch, token]);

  const onExportCSV = async (id: number) => {
    try {
      const r = await fetch(`/api/admin/payout-batches/${id}/items.csv`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(`export failed: ${r.status}`);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payout-batch-${id}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Export failed. See console for details.");
      console.error(e);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Disbursement History</h1>

      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm">Cycle:</label>
        <select
          className="rounded border px-2 py-1"
          value={cycleId ?? ""}
          onChange={(e) => setCycleId(Number(e.target.value) || null)}
        >
          {cycles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title || c.name || `Cycle #${c.id}`}
            </option>
          ))}
        </select>
      </div>

      {hintCompletedBatch && (
        <div className="mb-4 rounded border border-yellow-300 bg-yellow-50 px-3 py-2 text-yellow-900 text-sm">
          A completed batch <span className="font-medium">#{hintCompletedBatch}</span> was detected for this cycle via
          <code className="mx-1">/active</code>, but no history was returned.
          Ensure the <code>admin-payout-history</code> routes are registered on the server,
          then refresh.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border rounded p-3">
          <div className="mb-2 font-medium">Batches</div>
          {loading ? (
            <div className="text-sm text-gray-500">Loading…</div>
          ) : batches.length === 0 ? (
            <div className="text-sm text-gray-500">No batches for this cycle yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-1">Batch</th>
                  <th className="py-1">Status</th>
                  <th className="py-1">Created</th>
                  <th className="py-1">Completed</th>
                  <th className="py-1">PayPal ID</th>
                  <th className="py-1"></th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id} className="border-t">
                    <td className="py-1">#{b.id}</td>
                    <td className="py-1 capitalize">{b.status}</td>
                    <td className="py-1">{b.createdAt ? new Date(b.createdAt).toLocaleString() : "—"}</td>
                    <td className="py-1">{b.completedAt ? new Date(b.completedAt).toLocaleString() : "—"}</td>
                    <td className="py-1">{b.paypalBatchId || "—"}</td>
                    <td className="py-1 text-right">
                      <button className="mr-2 underline" onClick={() => setSelectedBatch(b.id)}>
                        View
                      </button>
                      <button className="underline" onClick={() => onExportCSV(b.id)}>
                        Export CSV
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="border rounded p-3">
          <div className="mb-2 font-medium">Batch Summary</div>
          {!selectedBatch ? (
            <div className="text-sm text-gray-500">Select a batch to view its summary.</div>
          ) : !summary ? (
            <div className="text-sm text-gray-500">Loading summary…</div>
          ) : (
            <div className="text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>Total Items: {numberFmt(summary.totalItems)}</div>
                <div>Success: {numberFmt(summary.success)}</div>
                <div>Unclaimed: {numberFmt(summary.unclaimed)}</div>
                <div>Failed: {numberFmt(summary.failed)}</div>
                <div>Pending: {numberFmt(summary.pending)}</div>
                <div>Processing: {numberFmt(summary.processing)}</div>
                <div>Paid Total: {money(summary.totals?.success)}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
