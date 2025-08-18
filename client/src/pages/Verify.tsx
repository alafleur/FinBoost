import React, { useEffect, useMemo, useState } from "react";

type State = "idle" | "verifying" | "success" | "error";

export default function Verify() {
  const params = new URLSearchParams(window.location.search);
  const token = useMemo(() => params.get("token") || "", [params.toString()]);
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("Missing verification token.");
      return;
    }
    let aborted = false;
    (async () => {
      setState("verifying");
      try {
        const res = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`, {
          method: "GET",
          credentials: "include"
        });
        const data = await res.json().catch(() => ({}));
        if (!aborted) {
          if (res.ok && data?.success) {
            setState("success");
            setMessage(data?.message || "Email verified! You can now use your account.");
          } else {
            setState("error");
            setMessage(data?.message || "Verification failed.");
          }
        }
      } catch (e: any) {
        if (!aborted) {
          setState("error");
          setMessage(String(e?.message || e));
        }
      }
    })();
    return () => { aborted = true; };
  }, [token]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Verify your email</h1>
        <p className="mt-1 text-sm text-gray-600">We're confirming your email address.</p>

        <div className="mt-6">
          {state === "idle" || state === "verifying" ? (
            <div className="text-gray-700">Verifying…</div>
          ) : state === "success" ? (
            <div className="text-green-700">{message}</div>
          ) : (
            <div className="text-red-700">{message}</div>
          )}
        </div>

        <div className="mt-6">
          <a href="/" className="inline-block rounded-xl border px-4 py-2 hover:bg-gray-50">Back to Home</a>
        </div>
      </div>
    </div>
  );
}