"use client";

import { useState, useEffect, FormEvent } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { probeExtension, registerWithBackend } from "@/lib/rkyc";

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rkycState, setRkycState] = useState<"probing" | "verified" | "idle">("probing");
  const [rkycFirstName, setRkycFirstName] = useState("");

  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  // Probe for extension on mount
  useEffect(() => {
    const cleanup = probeExtension(
      ({ firstName }) => {
        setRkycFirstName(firstName);
        setRkycState("verified");
      },
      () => setRkycState("idle")
    );
    return cleanup;
  }, []);

  // Listen for JWT from extension approval
  useEffect(() => {
    async function handler(event: MessageEvent) {
      const msg = event.data as Record<string, unknown>;
      if (msg?.type !== "OATHSTONE_JWT" && msg?.type !== "OATHSTONE_KYC_APPROVED") return;

      const jwt = msg.jwt as string | undefined;
      if (!jwt) return;

      setLoading(true);
      try {
        const result = await registerWithBackend(jwt);
        if (result.success) {
          router.replace("/");
        } else {
          setError(result.error ?? "RKYC verification failed.");
        }
      } finally {
        setLoading(false);
      }
    }
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "signup") {
        await signIn("password", { email, password, name, flow: "signUp" });
      } else {
        await signIn("password", { email, password, flow: "signIn" });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <div className="card" style={{ padding: 32 }}>
        {/* RKYC one-tap option */}
        {rkycState === "verified" && (
          <div
            style={{
              background: "rgba(16,185,129,0.07)",
              border: "1px solid rgba(16,185,129,0.2)",
              borderRadius: 10,
              padding: "14px 18px",
              marginBottom: 24,
            }}
          >
            <div className="font-bold" style={{ fontSize: 14, marginBottom: 4 }}>
              ◈ Oathstone Passport detected
            </div>
            <div className="text-muted text-sm" style={{ marginBottom: 12 }}>
              Welcome back, {rkycFirstName}. Continue instantly — no password needed.
            </div>
            <button
              className="btn btn-green w-full"
              onClick={() =>
                window.postMessage(
                  { type: "OATHSTONE_PROBE", action: "request_kyc" },
                  "*"
                )
              }
            >
              Continue with Oathstone ✓
            </button>
          </div>
        )}

        {rkycState === "idle" && (
          <div
            style={{
              background: "rgba(230,176,66,0.05)",
              border: "1px solid rgba(230,176,66,0.15)",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 20,
              fontSize: 12,
              color: "var(--muted)",
            }}
          >
            ◈{" "}
            <a
              href="https://business.oathstone.cloud/oathstone-extension.zip"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--gold)" }}
            >
              Install Oathstone Passport
            </a>{" "}
            to sign in without a password next time.
          </div>
        )}

        {/* Mode tabs */}
        <div className="flex gap-2 mb-4">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              className={`btn btn-sm ${mode === m ? "btn-primary" : "btn-outline"}`}
              onClick={() => { setMode(m); setError(""); }}
            >
              {m === "signin" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="form-group">
              <label className="form-label">Your name</label>
              <input
                className="form-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First Last"
                required
                name="name"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              name="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              name="password"
            />
          </div>

          {error && (
            <p style={{ color: "var(--red)", fontSize: 12, marginBottom: 12 }}>{error}</p>
          )}

          <button className="btn btn-primary w-full" type="submit" disabled={loading}>
            {loading ? "Loading..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
