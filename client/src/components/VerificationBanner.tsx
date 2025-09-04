import React from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type Props = {
  emailVerified?: boolean;
  email?: string;
};

/**
 * VerificationBanner
 * - Renders until `emailVerified` is true.
 * - "Resend verification email" -> POST /api/auth/resend-verification (adjust path if backend differs).
 * - "I've verified — refresh" re-checks /api/auth/me and reloads once verified.
 */
export default function VerificationBanner({ emailVerified, email }: Props) {
  const { toast } = useToast();
  if (emailVerified) return null;

  const resend = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/auth/verify/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        toast({
          title: "Verification email sent",
          description: `We sent a new link to ${email || "your email address"}. Please check your inbox.`,
        });
      } else {
        const err = await res.json().catch(() => ({}));
        toast({
          title: "Couldn't send email",
          description: err?.message || "Please try again shortly.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Network error",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    }
  };

  const refresh = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.reload();
        return;
      }
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const me = await res.json();
        if (me?.user?.emailVerified) {
          localStorage.setItem("user", JSON.stringify(me.user));
          window.location.reload();
          return;
        }
      }
      toast({
        title: "Still waiting for verification",
        description: "Open the link in the email we sent you, then click Refresh.",
      });
    } catch {
      window.location.reload();
    }
  };

  return (
    <div className="mt-4 mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 mt-0.5" aria-hidden="true" />
        <div className="flex-1">
          <p className="font-semibold">Verify your email to unlock everything</p>
          <p className="text-sm mt-1">
            We sent a verification link to{" "}
            <span className="font-medium">{email || "your email"}</span>. Until you verify,
            some features may be limited.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              onClick={resend}
            >
              Resend verification email
            </Button>
            <Button size="sm" variant="outline" onClick={refresh}>
              I've verified — refresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}