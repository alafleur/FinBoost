import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  RefreshCw, 
  Users, 
  Zap,
  AlertTriangle,
  Timer
} from 'lucide-react';

interface BatchStatus {
  id: number;
  cycleSettingId: number;
  cycleName?: string;
  senderBatchId: string;
  paypalBatchId?: string;
  status: string;
  statusLabel: string;
  totalAmount: number;
  amountFormatted: string;
  totalRecipients: number;
  successfulCount: number;
  failedCount: number;
  pendingCount: number;
  progressPercentage: number;
  retryCount?: number;
  canRetry: boolean;
  isStale: boolean;
  createdAt: string;
  updatedAt: string;
  lastRetryAt?: string;
  lastRetryError?: string;
  errorDetails?: string;
}

interface DashboardSummary {
  totalBatches: number;
  activeBatches: number;
  completedBatches: number;
  failedBatches: number;
  totalPayouts: number;
  totalRecipients: number;
  retryableBatches: number;
}

interface DashboardData {
  summary: DashboardSummary;
  recentBatches: BatchStatus[];
  activeLocks: Array<{
    key: string;
    resetTime: number;
    remainingSeconds: number;
  }>;
  lastUpdated: string;
}

export default function DisbursementStatusDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { toast } = useToast();

  const loadDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/disbursements/status-dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setDashboardData(data.dashboard);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast({
        title: 'Dashboard Error',
        description: 'Failed to load disbursement status dashboard',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadDashboard();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusBadge = (status: string, isStale: boolean) => {
    if (isStale) {
      return <Badge variant="destructive" className="animate-pulse">Stale</Badge>;
    }

    switch (status) {
      case 'intent':
        return <Badge variant="secondary">Preparing</Badge>;
      case 'processing':
        return <Badge variant="default" className="animate-pulse">Processing</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'partially_completed':
        return <Badge variant="outline">Partial</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string, isStale: boolean) => {
    if (isStale) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }

    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 animate-spin" />
            Loading Dashboard...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!dashboardData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Dashboard Unavailable
          </CardTitle>
          <CardDescription>
            Failed to load disbursement status information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={loadDashboard} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Loading
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Batches</p>
                <p className="text-2xl font-bold">{dashboardData.summary.activeBatches}</p>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Payouts</p>
                <p className="text-2xl font-bold">
                  ${(dashboardData.summary.totalPayouts / 100).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recipients</p>
                <p className="text-2xl font-bold">{dashboardData.summary.totalRecipients}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed/Retryable</p>
                <p className="text-2xl font-bold text-red-600">
                  {dashboardData.summary.retryableBatches}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Batches */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Disbursement Batches</CardTitle>
              <CardDescription>
                Last updated: {new Date(dashboardData.lastUpdated).toLocaleTimeString()}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto Refresh
              </Button>
              <Button onClick={loadDashboard} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Now
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.recentBatches.map((batch) => (
              <div 
                key={batch.id} 
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(batch.status, batch.isStale)}
                    <div>
                      <h4 className="font-medium">{batch.cycleName || `Cycle ${batch.cycleSettingId}`}</h4>
                      <p className="text-sm text-muted-foreground">
                        Batch #{batch.id} • {batch.amountFormatted} • {batch.totalRecipients} recipients
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(batch.status, batch.isStale)}
                    {batch.canRetry && (
                      <Badge variant="outline" className="text-blue-600">
                        Can Retry
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{batch.progressPercentage}%</span>
                  </div>
                  <Progress value={batch.progressPercentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>✅ {batch.successfulCount} successful</span>
                    <span>❌ {batch.failedCount} failed</span>
                    <span>⏳ {batch.pendingCount} pending</span>
                  </div>
                </div>

                {/* Error Details */}
                {batch.errorDetails && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-sm text-red-800">
                      <strong>Error:</strong> {batch.errorDetails}
                    </p>
                  </div>
                )}

                {/* Retry Information */}
                {(batch.retryCount || 0) > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Retry attempts: {batch.retryCount} 
                    {batch.lastRetryAt && (
                      <span> • Last retry: {new Date(batch.lastRetryAt).toLocaleString()}</span>
                    )}
                  </div>
                )}

                {/* Timestamps */}
                <div className="flex justify-between text-xs text-muted-foreground border-t pt-2">
                  <span>Created: {new Date(batch.createdAt).toLocaleString()}</span>
                  <span>Updated: {new Date(batch.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            ))}

            {dashboardData.recentBatches.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent disbursement batches found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Locks */}
      {dashboardData.activeLocks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Active Processing Locks
            </CardTitle>
            <CardDescription>
              These cycles are currently locked to prevent concurrent processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboardData.activeLocks.map((lock, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded">
                  <span className="font-medium">{lock.key}</span>
                  <Badge variant="outline" className="text-amber-700">
                    Expires in {lock.remainingSeconds}s
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}