import React, { useEffect, useState } from 'react';

type Batch = {
  id: number | string;
  cycle_id?: number;
  status?: string;
  sender_batch_id?: string;
  provider?: string;
  created_at?: string;
  item_count?: number;
  total_amount?: number;
};

export default function DisbursementBatchesPanel({ cycleId }: { cycleId: number }) {
  const [batches, setBatches] = useState<Batch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`/api/admin/payout-batches?cycleId=${cycleId}`)
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: Batch[]) => {
        if (!mounted) return;
        setBatches(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e.message || 'Failed to load');
        setBatches([]);
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [cycleId]);

  if (loading) return <div className="text-sm text-gray-500">Loading…</div>;
  if (error) return <div className="text-sm text-red-600">Error: {error}</div>;
  if (!batches || batches.length === 0) return <div className="text-sm text-gray-500">No batches for this cycle yet.</div>;

  return (
    <div className="space-y-2">
      {batches.map((b) => (
        <div key={String(b.id)} className="border rounded-lg p-3">
          <div className="flex justify-between">
            <div>
              <div className="font-medium">Batch #{String(b.id)}</div>
              <div className="text-xs text-gray-500">
                {b.status ?? 'unknown'} • {b.provider ?? 'PayPal'} • {b.sender_batch_id ?? ''}
              </div>
            </div>
            <div className="text-right text-sm">
              <div>{b.item_count ?? 0} items</div>
              {typeof b.total_amount !== 'undefined' && (
                <div>Total: {String(b.total_amount)}</div>
              )}
              {b.created_at && (
                <div className="text-xs text-gray-500">{new Date(b.created_at).toLocaleString()}</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}