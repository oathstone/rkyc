/**
 * RKYC client helpers.
 * Listens for the Oathstone extension probe/approval messages and posts
 * the JWT to the local /api/rkyc/register endpoint.
 */

export type RkycState = "idle" | "probing" | "verified" | "unverified";

export interface RkycUser {
  firstName: string;
  tier: string;
  nullifier: string;
  approvedFields: string[];
}

/** Send a JWT to your own backend for verification. */
export async function registerWithBackend(jwt: string): Promise<{
  success: boolean;
  nullifier?: string;
  approvedFields?: string[];
  error?: string;
}> {
  const res = await fetch("/api/rkyc/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jwt }),
  });
  return res.json();
}

/** Probe the extension. Returns a cleanup function. */
export function probeExtension(
  onVerified: (data: { firstName: string; tier: string }) => void,
  onNotFound: () => void,
  timeoutMs = 400
): () => void {
  let found = false;

  function handler(event: MessageEvent) {
    if (event.source !== window) return;
    const msg = event.data as Record<string, unknown>;
    if (
      msg?.type === "OATHSTONE_SESSION_ACTIVE" ||
      msg?.type === "OATHSTONE_KYC_APPROVED"
    ) {
      found = true;
      onVerified({
        firstName: (msg.firstName as string) || "User",
        tier: (msg.tier as string) || "STANDARD",
      });
    }
  }

  window.addEventListener("message", handler);
  window.postMessage({ type: "OATHSTONE_PROBE" }, "*");

  const timer = setTimeout(() => {
    if (!found) onNotFound();
  }, timeoutMs);

  return () => {
    clearTimeout(timer);
    window.removeEventListener("message", handler);
  };
}
