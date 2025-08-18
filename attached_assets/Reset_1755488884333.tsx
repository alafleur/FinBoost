import React, { useMemo, useState } from "react";

type State = "idle" | "submitting" | "success" | "error";

export default function Reset() {
  const params = new URLSearchParams(window.location.search);
  const token = useMemo(() => params.get("token") || "", [params.toString()]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setState("error");
      setMessage("Missing reset token.");
      return;
    }
    if (password.length < 8) {
      setState("error");
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setState("error");
      setMessage("Passwords do not match.");
      return;
    }
    try {
      setState("submitting");
      const res = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, password })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        setState("success");
        setMessage("Password updated. You can log in now.");
      } else {
        setState("error");
        setMessage(data?.message || "Reset failed.");
      }
    } catch (e: any) {
      setState("error");
      setMessage(String(e?.message || e));
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Reset your password</h1>
        <p className="mt-1 text-sm text-gray-600">Enter a new password for your account.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700">New password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm password</label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          {state === "error" && <div className="text-sm text-red-700">{message}</div>}
          {state === "success" && <div className="text-sm text-green-700">{message}</div>}

          <button
            type="submit"
            disabled={state === "submitting"}
            className="rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {state === "submitting" ? "Updating…" : "Update password"}
          </button>
        </form>

        <div className="mt-6">
          <a href="/" className="inline-block rounded-xl border px-4 py-2 hover:bg-gray-50">Back to Home</a>
        </div>
      </div>
    </div>
  );
}
