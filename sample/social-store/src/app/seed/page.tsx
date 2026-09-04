"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function SeedPage() {
  const seedData = useAction(api.seed.seedData);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSeed() {
    setStatus("loading");
    try {
      const result = await seedData();
      setMessage(result.message);
      setStatus("done");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Seed failed.");
      setStatus("error");
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      <div className="card" style={{ padding: 32 }}>
        <h1 className="font-black mb-2" style={{ fontSize: 22 }}>Seed demo data</h1>
        <p className="text-muted text-sm" style={{ marginBottom: 24 }}>
          Creates 3 demo merchants (Stride & Co, Urban Thread, Glow Lab) and
          6 products. Safe to run multiple times — skips existing records.
        </p>

        <button
          className="btn btn-primary w-full"
          onClick={handleSeed}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Seeding..." : "Run seed"}
        </button>

        {status === "done" && (
          <div
            style={{
              marginTop: 20,
              background: "rgba(16,185,129,0.07)",
              border: "1px solid rgba(16,185,129,0.2)",
              borderRadius: 8,
              padding: "12px 16px",
              fontSize: 13,
              color: "var(--green)",
            }}
          >
            ✓ {message}
          </div>
        )}
        {status === "error" && (
          <div
            style={{
              marginTop: 20,
              background: "rgba(248,113,113,0.07)",
              border: "1px solid rgba(248,113,113,0.2)",
              borderRadius: 8,
              padding: "12px 16px",
              fontSize: 13,
              color: "var(--red)",
            }}
          >
            ✗ {message}
          </div>
        )}
      </div>
    </div>
  );
}
