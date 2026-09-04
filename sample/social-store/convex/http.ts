import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

// ── CORS helper ──────────────────────────────────────────────────────────────
function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
  };
}

/**
 * POST /api/rkyc/register
 *
 * Called by the Oathstone extension after the user approves the RKYC popup.
 * Verifies the ES256 JWT using Oathstone's public JWKS — no API key needed.
 * Links the verified nullifier to the currently signed-in Convex Auth user,
 * or creates a session for the nullifier if the user is not yet signed in.
 */
http.route({
  path: "/api/rkyc/register",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const origin = req.headers.get("Origin");
    const headers = corsHeaders(origin);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON." }), { status: 400, headers });
    }
    const b = body as Record<string, unknown>;
    if (typeof b?.jwt !== "string") {
      return new Response(JSON.stringify({ error: "Missing jwt." }), { status: 400, headers });
    }

    // Verify JWT against Oathstone's public JWKS — no API key needed
    const verifyRes = await fetch(
      "https://enduring-salmon-903.convex.site/api/rkyc/verify-jwt",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jwt: b.jwt, siteOrigin: origin ?? req.url }),
      }
    );
    const verified = await verifyRes.json() as {
      success: boolean;
      nullifier?: string;
      approvedFields?: string[];
      error?: string;
    };

    if (!verified.success || !verified.nullifier) {
      return new Response(
        JSON.stringify({ error: verified.error ?? "JWT verification failed." }),
        { status: 401, headers }
      );
    }

    // Store the RKYC verification on the user record
    const result = await ctx.runMutation(api.users.linkRkycVerification, {
      nullifier: verified.nullifier,
      approvedFields: verified.approvedFields ?? [],
    });

    return new Response(JSON.stringify({ success: true, ...result }), { status: 200, headers });
  }),
});

// OPTIONS preflight
http.route({
  path: "/api/rkyc/register",
  method: "OPTIONS",
  handler: httpAction(async (_, req) => {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(req.headers.get("Origin")),
    });
  }),
});

export default http;
