import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Edit3,
  Save,
  Trophy,
  Target,
  Star,
  Calendar,
  Mail,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  Crown,
  Medal,
  Gem
} from 'lucide-react';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  bio?: string;
  location?: string;
  occupation?: string;
  financialGoals?: string;
  totalPoints: number;
  currentMonthPoints: number;
  tier: string;
  joinedAt: string;
  lastLoginAt?: string;
  profilePicture?: string;
}

interface TierInfo {
  name: string;
  threshold: number;
  color: string;
  icon: any;
  benefits: string[];
  nextTier?: {
    name: string;
    threshold: number;
    pointsNeeded: number;
  };
}

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    location: '',
    occupation: '',
    financialGoals: ''
  });

  const tierConfig: Record<string, TierInfo> = {
    tier1: {
      name: 'Tier 1 (Gold)',
      threshold: 500, // Now highest tier
      color: 'from-yellow-400 to-yellow-600',
      icon: Crown,
      benefits: [
        'All Tier 2 benefits',
        'Premium lesson content',
        'Personal finance coaching calls',
        'Tier 1 exclusive webinars',
        'Maximum monthly reward potential',
        'Early access to new features'
      ]
    },
    tier2: {
      name: 'Tier 2 (Silver)',
      threshold: 250,
      color: 'from-gray-400 to-gray-600',
      icon: Trophy,
      benefits: [
        'All Tier 3 benefits',
        'Advanced lesson modules',
        'Priority community support',
        'Tier 2 exclusive content',
        'Enhanced monthly rewards'
      ],
      nextTier: {
        name: 'Tier 1 (Gold)',
        threshold: 500,
        pointsNeeded: 250
      }
    },
    tier3: {
      name: 'Tier 3 (Bronze)',
      threshold: 0, // Now lowest tier
      color: 'from-orange-400 to-orange-600',
      icon: Medal,
      benefits: [
        'Access to basic financial lessons',
        'Monthly point tracking',
        'Community forum access',
        'Basic achievement badges'
      ],
      nextTier: {
        name: 'Tier 2 (Silver)',
        threshold: 250,
        pointsNeeded: 250
      }
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (!token || !userData) {
        setLocation('/auth');
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setEditForm({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          bio: data.user.bio || '',
          location: data.user.location || '',
          occupation: data.user.occupation || '',
          financialGoals: data.user.financialGoals || ''
        });
      } else {
        setLocation('/auth');
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      setLocation('/auth');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsEditing(false);
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated."
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getCurrentTierInfo = (): TierInfo => {
    return tierConfig[user?.tier || 'tier1'];
  };

  const getProgressToNextTier = (): number => {
    if (!user) return 0;
    const currentTier = getCurrentTierInfo();
    if (!currentTier.nextTier) return 100;

    // Calculate progress from current tier threshold to next tier threshold
    const currentThreshold = currentTier.threshold;
    const nextThreshold = currentTier.nextTier.threshold;
    const pointsInCurrentTier = user.currentMonthPoints - currentThreshold;
    const pointsNeededForNextTier = nextThreshold - currentThreshold;

    const progress = (pointsInCurrentTier / pointsNeededForNextTier) * 100;
    return Math.max(0, Math.min(progress, 100));
  };

  const getPointsToNextTier = (): number => {
    if (!user) return 0;
    const currentTier = getCurrentTierInfo();
    if (!currentTier.nextTier) return 0;

    return Math.max(0, currentTier.nextTier.threshold - user.currentMonthPoints);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const currentTier = getCurrentTierInfo();
  const TierIcon = currentTier.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => setLocation('/dashboard')}>
                ← Back to Dashboard
              </Button>
              <div className="flex items-center space-x-3">
                <User className="h-8 w-8 text-primary-600" />
                <h1 className="font-heading font-bold text-2xl text-dark-800">My Profile</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.profilePicture} alt="Profile" />
                  <AvatarFallback>
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-gray-600">@{user.username}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`bg-gradient-to-r ${currentTier.color} text-white`}>
                      <TierIcon className="h-3 w-3 mr-1" />
                      {currentTier.name} Tier
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">{user.totalPoints}</div>
                  <div className="text-sm text-gray-600">Total Points</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{user.currentMonthPoints}</div>
                  <div className="text-sm text-gray-600">This Month</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.floor((new Date().getTime() - new Date(user.joinedAt).getTime()) / (1000 * 60 * 60 * 24))}
                  </div>
                  <div className="text-sm text-gray-600">Days Active</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tier-progress">Tier Progress</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Information */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Your personal details and bio</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? <Save className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                    {isEditing ? 'Save' : 'Edit'}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={editForm.firstName}
                            onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={editForm.lastName}
                            onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={editForm.location}
                          onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                          placeholder="City, State/Country"
                        />
                      </div>
                      <div>
                        <Label htmlFor="occupation">Occupation</Label>
                        <Input
                          id="occupation"
                          value={editForm.occupation}
                          onChange={(e) => setEditForm({...editForm, occupation: e.target.value})}
                          placeholder="Your job title or field"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          value={editForm.bio}
                          onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                          placeholder="Tell us about yourself..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="goals">Financial Goals</Label>
                        <Textarea
                          id="goals"
                          value={editForm.financialGoals}
                          onChange={(e) => setEditForm({...editForm, financialGoals: e.target.value})}
                          placeholder="What are your financial objectives?"
                          rows={3}
                        />
                      </div>
                      <Button onClick={handleSaveProfile} className="w-full">
                        Save Changes
                      </Button>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{user.email}</span>
                      </div>
                      {user.location && (
                        <div className="flex items-center gap-3">
                          <Target className="h-4 w-4 text-gray-500" />
                          <span>{user.location}</span>
                        </div>
                      )}
                      {user.occupation && (
                        <div className="flex items-center gap-3">
                          <Award className="h-4 w-4 text-gray-500" />
                          <span>{user.occupation}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Joined {new Date(user.joinedAt).toLocaleDateString()}</span>
                      </div>
                      {user.bio && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">About Me</h4>
                          <p className="text-gray-600">{user.bio}</p>
                        </div>
                      )}
                      {user.financialGoals && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">Financial Goals</h4>
                          <p className="text-gray-600">{user.financialGoals}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Activity Summary</CardTitle>
                  <CardDescription>Your recent Additive activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-medium">Lessons Completed</span>
                      </div>
                      <span className="text-green-600 font-bold">12</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Star className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">Points This Week</span>
                      </div>
                      <span className="text-blue-600 font-bold">85</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-purple-500" />
                        <span className="font-medium">Learning Streak</span>
                      </div>
                      <span className="text-purple-600 font-bold">7 days</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-orange-500" />
                        <span className="font-medium">Last Activity</span>
                      </div>
                      <span className="text-orange-600 font-bold">2 hours ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tier Progress Tab */}
          <TabsContent value="tier-progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TierIcon className="h-6 w-6" />
                  {currentTier.name} Tier Progress
                </CardTitle>
                <CardDescription>
                  Track your progress towards the next tier and unlock more benefits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Current Tier Status */}
                  <div className={`p-6 rounded-lg bg-gradient-to-r ${currentTier.color} text-white`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold">Current: {currentTier.name} Tier</h3>
                        <p className="opacity-90">{user.currentMonthPoints} points this month</p>
                      </div>
                      <TierIcon className="h-12 w-12 opacity-80" />
                    </div>
                  </div>

                  {/* Progress to Next Tier */}
                  {currentTier.nextTier && (
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">Progress to {currentTier.nextTier.name}</span>
                        <span className="text-sm text-gray-600">
                          {getPointsToNextTier()} points needed
                        </span>
                      </div>
                      <Progress value={getProgressToNextTier()} className="h-3" />
                      <p className="text-sm text-gray-600 mt-2">
                        {user.currentMonthPoints} / {currentTier.nextTier.threshold} points
                      </p>
                    </div>
                  )}

                  {/* Current Tier Benefits */}
                  <div>
                    <h4 className="font-semibold mb-3">Your Current Benefits</h4>
                    <ul className="space-y-2">
                      {currentTier.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Next Tier Preview */}
                  {currentTier.nextTier && (
                    <div className="border-t pt-6">
                      <h4 className="font-semibold mb-3">Unlock at {currentTier.nextTier.name} Tier</h4>
                      <ul className="space-y-2">
                        {tierConfig[currentTier.nextTier.name.toLowerCase()]?.benefits.slice(-2).map((benefit, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Gem className="h-4 w-4 text-primary-500" />
                            <span className="text-sm text-gray-600">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Achievements & Badges</CardTitle>
                <CardDescription>Your accomplishments and milestones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Sample achievements - would be dynamic in real app */}
                  <div className="p-4 border rounded-lg text-center">
                    <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <h4 className="font-medium">First Steps</h4>
                    <p className="text-sm text-gray-600">Completed your first lesson</p>
                    <Badge className="mt-2 bg-green-100 text-green-700">Earned</Badge>
                  </div>

                  <div className="p-4 border rounded-lg text-center">
                    <Star className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <h4 className="font-medium">Point Collector</h4>
                    <p className="text-sm text-gray-600">Earned 100+ points</p>
                    <Badge className="mt-2 bg-green-100 text-green-700">Earned</Badge>
                  </div>

                  <div className="p-4 border rounded-lg text-center opacity-60">
                    <Crown className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <h4 className="font-medium">Tier Climber</h4>
                    <p className="text-sm text-gray-600">Reach Silver tier</p>
                    <Badge variant="outline" className="mt-2">Locked</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-gray-600">Receive updates about points and rewards</p>
                    </div>
                    <input type="checkbox" defaultChecked className="toggle" />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Weekly Progress Reports</h4>
                      <p className="text-sm text-gray-600">Get summaries of your weekly activity</p>
                    </div>
                    <input type="checkbox" defaultChecked className="toggle" />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Public Profile</h4>
                      <p className="text-sm text-gray-600">Show your profile on leaderboards</p>
                    </div>
                    <input type="checkbox" defaultChecked className="toggle" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}