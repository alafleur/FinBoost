import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Settings, Plus, Edit, Trash2, Calendar, DollarSign, Users, Target } from 'lucide-react';

interface CycleSetting {
  id: number;
  cycleName: string;
  cycleType: string;
  cycleStartDate: Date;
  cycleEndDate: Date;
  paymentPeriodDays: number;
  membershipFee: number;
  rewardPoolPercentage: number;
  minimumPoolGuarantee: number;
  tier1Threshold: number;
  tier2Threshold: number;
  isActive: boolean;
  allowMidCycleJoining: boolean;
  midCycleJoinThresholdDays: number;
  status?: string; // "active", "completed", "archived"
  completedAt?: Date;
  completedBy?: number;
  createdAt: Date;
  createdBy?: number;
}

interface CycleManagementTabProps {
  cycleSettings: CycleSetting[];
  onRefresh: () => void;
}

export default function CycleManagementTab({ cycleSettings, onRefresh }: CycleManagementTabProps) {
  const { toast } = useToast();
  const [showCycleDialog, setShowCycleDialog] = useState(false);
  const [editingCycle, setEditingCycle] = useState<CycleSetting | null>(null);
  const [cycleForm, setCycleForm] = useState({
    cycleName: '',
    cycleType: 'monthly',
    cycleStartDate: '',
    cycleEndDate: '',
    paymentPeriodDays: 30,
    membershipFee: 2000,
    rewardPoolPercentage: 55,
    minimumPoolGuarantee: 0, // Default: no guarantee
    tier1Threshold: 33, // Top 33% percentile
    tier2Threshold: 67, // Up to 67% percentile 
    isActive: true,
    allowMidCycleJoining: true,
    midCycleJoinThresholdDays: 3
  });

  const handleSaveCycle = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const url = editingCycle ? `/api/admin/cycle-settings/${editingCycle.id}` : '/api/admin/cycle-settings';
      const method = editingCycle ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cycleForm)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Cycle ${editingCycle ? 'updated' : 'created'} successfully`
        });
        setShowCycleDialog(false);
        setEditingCycle(null);
        onRefresh();
      } else {
        throw new Error('Failed to save cycle');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save cycle",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCycle = async (cycleId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/admin/cycle-settings/${cycleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Cycle deleted successfully"
        });
        onRefresh();
      } else {
        throw new Error('Failed to delete cycle');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete cycle",
        variant: "destructive"
      });
    }
  };

  const handleCompleteCycle = async (cycleId: number, cycleName: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Confirm action with user
      if (!confirm(`Are you sure you want to complete "${cycleName}"? This will reset all user points to 0 for a fresh start.`)) {
        return;
      }

      const response = await fetch(`/api/admin/cycles/${cycleId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Cycle Completed",
          description: data.message || "Cycle completed successfully. All user tickets have been reset."
        });
        onRefresh();
      } else {
        throw new Error('Failed to complete cycle');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete cycle",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDateRange = (startDate: Date, endDate: Date) => {
    const start = new Date(startDate).toLocaleDateString();
    const end = new Date(endDate).toLocaleDateString();
    return `${start} - ${end}`;
  };

  return (
    <div className="space-y-6">
      {/* Workflow Breadcrumb */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm">
            <span className="bg-blue-600 text-white px-2 py-1 rounded">1. Setup</span>
            <span className="text-blue-600">→</span>
            <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded">2. Monitor</span>
            <span className="text-gray-400">→</span>
            <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded">3. Execute</span>
          </div>
          <div className="text-xs text-blue-600 font-medium">Setup Phase: Configure cycle parameters</div>
        </div>
      </div>

      {/* Cycle Configuration Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                Cycle Configuration
              </CardTitle>
              <CardDescription>
                Create and manage reward cycles with flexible durations and parameters
              </CardDescription>
            </div>
            <Button onClick={() => {
              setEditingCycle(null);
              setCycleForm({
                cycleName: '',
                cycleType: 'monthly',
                cycleStartDate: '',
                cycleEndDate: '',
                paymentPeriodDays: 30,
                membershipFee: 2000,
                rewardPoolPercentage: 55,
                minimumPoolGuarantee: 0,
                tier1Threshold: 33,
                tier2Threshold: 67,
                isActive: true,
                allowMidCycleJoining: true,
                midCycleJoinThresholdDays: 3
              });
              setShowCycleDialog(true);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Cycle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cycleSettings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No cycles configured yet. Create your first cycle to enable flexible reward periods.
              </div>
            ) : (
              <div className="space-y-4">
                {cycleSettings.map((cycle) => (
                  <div key={cycle.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{cycle.cycleName}</h3>
                          <Badge variant={
                            cycle.status === 'completed' ? "outline" : 
                            cycle.status === 'archived' ? "secondary" :
                            cycle.isActive ? "default" : "secondary"
                          }>
                            {cycle.status === 'completed' ? "Completed" :
                             cycle.status === 'archived' ? "Archived" :
                             cycle.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Type:</span>
                            <div className="font-medium capitalize">{cycle.cycleType || 'monthly'}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Duration:</span>
                            <div className="font-medium">
                              {formatDateRange(cycle.cycleStartDate, cycle.cycleEndDate)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-500">Membership Fee:</span>
                            <div className="font-medium">{formatCurrency(cycle.membershipFee)}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Pool Allocation:</span>
                            <div className="font-medium">{cycle.rewardPoolPercentage}%</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Mid-Cycle Joining:</span>
                            <div className="font-medium">
                              {cycle.allowMidCycleJoining ? "Allowed" : "Disabled"}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                          <div>
                            <span className="text-gray-500">Tier 1 (Top %):</span>
                            <div className="font-medium">Top {cycle.tier1Threshold}%</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Tier 2 (Up to %):</span>
                            <div className="font-medium">Up to {cycle.tier2Threshold}%</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Payment Period:</span>
                            <div className="font-medium">{cycle.paymentPeriodDays} days</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {cycle.status !== 'completed' && cycle.status !== 'archived' && cycle.isActive && (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleCompleteCycle(cycle.id, cycle.cycleName)}
                            title="Complete this cycle and reset all user tickets"
                          >
                            Complete Cycle
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingCycle(cycle);
                            setCycleForm({
                              cycleName: cycle.cycleName,
                              cycleType: cycle.cycleType || 'monthly',
                              cycleStartDate: new Date(cycle.cycleStartDate).toISOString().split('T')[0],
                              cycleEndDate: new Date(cycle.cycleEndDate).toISOString().split('T')[0],
                              paymentPeriodDays: cycle.paymentPeriodDays,
                              membershipFee: cycle.membershipFee,
                              rewardPoolPercentage: cycle.rewardPoolPercentage,
                              minimumPoolGuarantee: cycle.minimumPoolGuarantee || 0,
                              tier1Threshold: cycle.tier1Threshold,
                              tier2Threshold: cycle.tier2Threshold,
                              isActive: cycle.isActive,
                              allowMidCycleJoining: cycle.allowMidCycleJoining,
                              midCycleJoinThresholdDays: cycle.midCycleJoinThresholdDays
                            });
                            setShowCycleDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteCycle(cycle.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cycle Creation/Edit Dialog */}
      <Dialog open={showCycleDialog} onOpenChange={setShowCycleDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCycle ? 'Edit Cycle' : 'Create New Cycle'}
            </DialogTitle>
            <DialogDescription>
              Configure cycle parameters including duration, fees, and tier thresholds
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-medium">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cycleName">Cycle Name</Label>
                  <Input
                    id="cycleName"
                    value={cycleForm.cycleName}
                    onChange={(e) => setCycleForm({...cycleForm, cycleName: e.target.value})}
                    placeholder="e.g., December 2024 Cycle"
                  />
                </div>
                <div>
                  <Label htmlFor="cycleType">Cycle Type</Label>
                  <Select value={cycleForm.cycleType} onValueChange={(value) => setCycleForm({...cycleForm, cycleType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cycle type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paymentPeriodDays">Payment Period (Days)</Label>
                  <Input
                    id="paymentPeriodDays"
                    type="number"
                    value={cycleForm.paymentPeriodDays}
                    onChange={(e) => setCycleForm({...cycleForm, paymentPeriodDays: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cycleStartDate">Start Date</Label>
                  <Input
                    id="cycleStartDate"
                    type="date"
                    value={cycleForm.cycleStartDate}
                    onChange={(e) => setCycleForm({...cycleForm, cycleStartDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="cycleEndDate">End Date</Label>
                  <Input
                    id="cycleEndDate"
                    type="date"
                    value={cycleForm.cycleEndDate}
                    onChange={(e) => setCycleForm({...cycleForm, cycleEndDate: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Financial Settings */}
            <div className="space-y-4">
              <h3 className="font-medium">Financial Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="membershipFee">Membership Fee (cents)</Label>
                  <Input
                    id="membershipFee"
                    type="number"
                    value={cycleForm.membershipFee}
                    onChange={(e) => setCycleForm({...cycleForm, membershipFee: parseInt(e.target.value)})}
                  />
                  <span className="text-xs text-gray-500">
                    Current: {formatCurrency(cycleForm.membershipFee)}
                  </span>
                </div>
                <div>
                  <Label htmlFor="rewardPoolPercentage">Reward Pool Percentage</Label>
                  <Input
                    id="rewardPoolPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={cycleForm.rewardPoolPercentage}
                    onChange={(e) => setCycleForm({...cycleForm, rewardPoolPercentage: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="minimumPoolGuarantee">Minimum Pool Guarantee (cents)</Label>
                <Input
                  id="minimumPoolGuarantee"
                  type="number"
                  min="0"
                  value={cycleForm.minimumPoolGuarantee}
                  onChange={(e) => setCycleForm({...cycleForm, minimumPoolGuarantee: parseInt(e.target.value)})}
                />
                <span className="text-xs text-gray-500">
                  {cycleForm.minimumPoolGuarantee > 0 
                    ? `Guaranteed minimum: ${formatCurrency(cycleForm.minimumPoolGuarantee)}` 
                    : 'No minimum guarantee set'}
                </span>
              </div>
            </div>

            {/* Tier Configuration */}
            <div className="space-y-4">
              <h3 className="font-medium">Tier Thresholds (Percentile-Based)</h3>
              <p className="text-sm text-gray-600">Set percentiles that automatically calculate point thresholds based on community performance</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tier1Threshold">Tier 1 Threshold (%)</Label>
                  <Input
                    id="tier1Threshold"
                    type="number"
                    min="1"
                    max="99"
                    value={cycleForm.tier1Threshold}
                    onChange={(e) => setCycleForm({...cycleForm, tier1Threshold: parseInt(e.target.value)})}
                  />
                  <p className="text-xs text-gray-500 mt-1">Top performers (e.g., 33 = top 33%)</p>
                </div>
                <div>
                  <Label htmlFor="tier2Threshold">Tier 2 Threshold (%)</Label>
                  <Input
                    id="tier2Threshold"
                    type="number"
                    min="1"
                    max="99"
                    value={cycleForm.tier2Threshold}
                    onChange={(e) => setCycleForm({...cycleForm, tier2Threshold: parseInt(e.target.value)})}
                  />
                  <p className="text-xs text-gray-500 mt-1">Up to this percentile (e.g., 67 = top 67%)</p>
                </div>
              </div>
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                <strong>Example:</strong> If Tier 1 = 33% and Tier 2 = 67%, then:<br/>
                • Tier 1: Top 33% of performers<br/>
                • Tier 2: Next 34% (34th-67th percentile)<br/>
                • Tier 3: Bottom 33% (68th-100th percentile)
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="space-y-4">
              <h3 className="font-medium">Advanced Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={cycleForm.isActive}
                    onCheckedChange={(checked) => setCycleForm({...cycleForm, isActive: checked})}
                  />
                  <Label htmlFor="isActive">Active Cycle</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowMidCycleJoining"
                    checked={cycleForm.allowMidCycleJoining}
                    onCheckedChange={(checked) => setCycleForm({...cycleForm, allowMidCycleJoining: checked})}
                  />
                  <Label htmlFor="allowMidCycleJoining">Allow Mid-Cycle Joining</Label>
                </div>

                {cycleForm.allowMidCycleJoining && (
                  <div>
                    <Label htmlFor="midCycleJoinThresholdDays">Mid-Cycle Join Threshold (Days)</Label>
                    <Input
                      id="midCycleJoinThresholdDays"
                      type="number"
                      value={cycleForm.midCycleJoinThresholdDays}
                      onChange={(e) => setCycleForm({...cycleForm, midCycleJoinThresholdDays: parseInt(e.target.value)})}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCycleDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCycle}>
                {editingCycle ? 'Update Cycle' : 'Create Cycle'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}