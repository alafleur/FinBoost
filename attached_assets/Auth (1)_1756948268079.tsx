
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Gift } from "lucide-react";
import { FinBoostLogo } from "@/components/ui/finboost-logo";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation, Link } from "wouter";
import { trackEvent } from "@/lib/analytics";
import { trackGTMConversion, trackGTMUserAction } from "@/lib/gtm";

interface RegisterForm {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
  referralCode?: string;
}

interface LoginForm {
  email: string;
  password: string;
}

export default function Auth() {
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const registerForm = useForm<RegisterForm>();
  const loginForm = useForm<LoginForm>();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    if (mode === 'signup') setActiveTab('register');

    const refCode = urlParams.get('ref');
    if (refCode) setReferralCode(refCode);

    const initGoogle = () => {
      if ((window as any).google) {
        (window as any).google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
          callback: handleGoogleResponse,
        });
        setIsGoogleLoaded(true);
      } else setTimeout(initGoogle, 100);
    };
    initGoogle();
  }, []);

  const registerMutation = useMutation({
    mutationFn: async (data: Omit<RegisterForm,'confirmPassword'>) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const text = await res.text();
      let json: any = null;
      try { json = JSON.parse(text); } catch {}
      if (!res.ok) throw new Error(json?.message || `Registration failed (${res.status})`);
      return json;
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || 'Login failed');
      }
      return res.json();
    },
  });

  const persistAndRoute = (data: any, isNew = false) => {
    if (data?.token) localStorage.setItem('token', data.token);
    if (data?.user) localStorage.setItem('user', JSON.stringify(data.user));

    if (isNew) {
      localStorage.setItem('fb.onboard.start', '1');
    }

    trackEvent('login', 'user_engagement', isNew ? 'registration_auto_login' : 'login_complete');
    trackGTMUserAction('user_logged_in', data?.user?.id, {
      username: data?.user?.username,
      login_method: 'email',
      new_user: isNew
    });

    const DASHBOARD_ROUTE = import.meta.env.VITE_DASHBOARD_ROUTE || '/dashboard';
    const url = isNew ? `${DASHBOARD_ROUTE}?onboard=1` : DASHBOARD_ROUTE;
    setLocation(url);
  };

  const handleGoogleResponse = (payload: any) => {
    console.warn('Implement Google auth here', payload);
  };

  const onRegister = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    const { confirmPassword, ...registerData } = data;
    if (referralCode) registerData.referralCode = referralCode;

    try {
      const reg = await registerMutation.mutateAsync(registerData);
      if (reg?.token && reg?.user) {
        trackEvent('sign_up', 'user_engagement', 'registration_complete');
        trackGTMConversion('registration', 0);
        persistAndRoute(reg, true);
        return;
      }
      const login = await loginMutation.mutateAsync({ email: registerData.email, password: data.password });
      trackEvent('sign_up', 'user_engagement', 'registration_complete');
      trackGTMConversion('registration', 0);
      persistAndRoute(login, true);
    } catch (e: any) {
      toast({ title: "Registration failed", description: String(e?.message || e), variant: "destructive" });
    }
  };

  const onLogin = async (data: LoginForm) => {
    try {
      const res = await loginMutation.mutateAsync(data);
      persistAndRoute(res, false);
    } catch (e: any) {
      toast({ title: "Login failed", description: String(e?.message || e), variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Link href="/" className="cursor-pointer hover:opacity-80 transition-opacity">
              <FinBoostLogo size="lg" />
            </Link>
          </div>
          <p className="text-gray-600">Your financial education journey starts here</p>
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block">
            ← Back to Home
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome to FinBoost</CardTitle>
            <CardDescription>
              {activeTab === 'register' ? "Sign up to get your free financial assessment and start learning" : "Join thousands learning to earn with financial education"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" placeholder="Enter your email" {...loginForm.register("email", { required: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Input id="login-password" type={showPassword ? "text" : "password"} placeholder="Enter your password" {...loginForm.register("password", { required: true })} />
                      <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
                <div className="text-center">
                  <Link href="/forgot-password">
                    <Button variant="ghost" className="text-sm text-gray-600 hover:text-primary-600">Forgot your password?</Button>
                  </Link>
                </div>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First Name</Label>
                      <Input id="first-name" placeholder="First name" {...registerForm.register("firstName")} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input id="last-name" placeholder="Last name" {...registerForm.register("lastName")} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input id="register-email" type="email" placeholder="Enter your email" {...registerForm.register("email", { required: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" placeholder="Choose a username" {...registerForm.register("username", { required: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input id="register-password" type="password" placeholder="Create a password" {...registerForm.register("password", { required: true, minLength: 6 })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input id="confirm-password" type="password" placeholder="Confirm your password" {...registerForm.register("confirmPassword", { required: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referralCode" className="flex items-center space-x-2">
                      <Gift className="h-4 w-4" /><span>Referral Code (Optional)</span>
                    </Label>
                    <Input id="referralCode" type="text" placeholder="Enter referral code" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} className={referralCode ? "border-green-300 bg-green-50" : ""} {...registerForm.register("referralCode")} />
                    {referralCode && <p className="text-sm text-green-600">🎉 You'll earn bonus tickets with this referral!</p>}
                  </div>
                  <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0" disabled={registerMutation.isPending || loginMutation.isPending}>
                    {registerMutation.isPending || loginMutation.isPending ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
