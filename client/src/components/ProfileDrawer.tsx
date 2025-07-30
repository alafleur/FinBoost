import { useState, useEffect } from 'react';
import { X, Mail, CreditCard, Save, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useProfileDrawer } from '@/hooks/useProfileDrawer';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  username: string;
  email: string;
  subscriptionStatus: 'active' | 'inactive';
  subscriptionAmount?: number;
  subscriptionCurrency?: string;
  subscriptionPaymentMethod?: string;
  subscriptionStartDate?: string;
  nextBillingDate?: string;
  paypalEmail?: string;
  totalPoints?: number;
  currentStreak?: number;
}

interface ProfileDrawerProps {
  user: User | null;
  onUserUpdate?: () => void;
}

export function ProfileDrawer({ user, onUserUpdate }: ProfileDrawerProps) {
  const { isOpen, initialSection, closeProfileDrawer } = useProfileDrawer();
  const { toast } = useToast();
  
  const [paypalEmail, setPaypalEmail] = useState(user?.paypalEmail || '');
  const [payoutMethod, setPayoutMethod] = useState('paypal');
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    if (user?.paypalEmail) {
      setPaypalEmail(user.paypalEmail);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && initialSection === 'paypal') {
      setTimeout(() => {
        document.getElementById('paypal-config')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen, initialSection]);

  const handleSavePaymentInfo = async () => {
    if (!paypalEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a valid PayPal email address',
        variant: 'destructive',
      });
      return;
    }

    setSavingPayment(true);
    try {
      await apiRequest('/api/user/payment-info', 'POST', {
        paypalEmail: paypalEmail.trim(),
        payoutMethod,
      });

      toast({
        title: 'Success',
        description: 'Payment information saved successfully',
      });

      onUserUpdate?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save payment information',
        variant: 'destructive',
      });
    } finally {
      setSavingPayment(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={closeProfileDrawer}
      />
      
      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <UserIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeProfileDrawer}
              className="p-2 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Account Information
                </CardTitle>
                <CardDescription>
                  Manage your account details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Username</label>
                    <p className="text-sm text-gray-900 mt-1">{user?.username}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900 mt-1">{user?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Subscription Status</label>
                    <div className="mt-1">
                      <Badge variant={user?.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                        {user?.subscriptionStatus === 'active' ? 'Premium Member' : 'Free User'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Payment Details */}
            {user?.subscriptionStatus === 'active' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Subscription Details
                  </CardTitle>
                  <CardDescription>
                    Your current membership plan and payment information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subscription Amount</label>
                      <p className="text-lg font-semibold text-gray-900">
                        ${((user?.subscriptionAmount || 2000) / 100).toFixed(2)} {(user?.subscriptionCurrency || 'USD').toUpperCase()}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Payment Method</label>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {user?.subscriptionPaymentMethod || 'Card'}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Member Since</label>
                      <p className="text-sm font-medium text-gray-900">
                        {user?.subscriptionStartDate 
                          ? new Date(user.subscriptionStartDate).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Next Billing</label>
                      <p className="text-sm font-medium text-gray-900">
                        {user?.nextBillingDate 
                          ? new Date(user.nextBillingDate).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })
                          : 'End of month'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* PayPal Payment Configuration */}
            <Card id="paypal-config">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
                <CardDescription>
                  Configure your PayPal email for reward disbursements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">PayPal Email</label>
                  <input
                    type="email"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    placeholder="Enter your PayPal email address"
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This email will be used for reward payouts
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Payout Method</label>
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="paypal">PayPal</option>
                    <option value="bank_transfer" disabled>Bank Transfer (Coming Soon)</option>
                  </select>
                </div>
                
                <Button 
                  className="w-full" 
                  size="sm" 
                  onClick={handleSavePaymentInfo}
                  disabled={savingPayment}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {savingPayment ? 'Saving...' : 'Save Payment Information'}
                </Button>
              </CardContent>
            </Card>

            {/* Account Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{user?.totalPoints || 0}</div>
                    <div className="text-sm text-gray-600">Total Points</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{user?.currentStreak || 0}</div>
                    <div className="text-sm text-gray-600">Day Streak</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}