
import React, { useEffect, useState } from "react";

type Props = { emailVerified?: boolean; email?: string; };

export default function VerificationBanner(props: Props) {
  const [emailVerified, setEmailVerified] = useState<boolean | null>(props.emailVerified ?? null);
  const [email, setEmail] = useState<string | null>(props.email ?? null);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    if (props.emailVerified === undefined || props.email === undefined) {
      (async () => {
        try {
          const res = await fetch("/api/auth/me", { credentials: "include" });
          const data = await res.json().catch(() => ({}));
          if (!aborted && data?.user) {
            setEmailVerified(Boolean(data.user.emailVerified));
            setEmail(data.user.email || null);
          }
        } catch {}
      })();
    }
    return () => { aborted = true; };
  }, [props.emailVerified, props.email]);

  if (emailVerified === null || emailVerified) return null;

  async function onResend() {
    if (!email) { setNotice("No email found on your profile."); return; }
    try {
      setSending(true); setNotice(null);
      const res = await fetch("/api/auth/verify/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) setNotice("Verification email sent. Please check your inbox.");
      else setNotice(data?.message || "Could not send verification email.");
    } catch (e: any) {
      setNotice(String(e?.message || e));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-medium">Please verify your email</div>
          <div className="text-sm">We sent a verification link to your inbox. Some features are limited until you verify.</div>
          {notice && <div className="mt-2 text-sm">{notice}</div>}
        </div>
        <button
          onClick={onResend}
          disabled={sending}
          className="shrink-0 rounded-lg bg-amber-600 px-3 py-2 text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {sending ? "Sending…" : "Resend link"}
        </button>
      </div>
    </div>
  );
}
