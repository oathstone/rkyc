/**
 * POST /api/rkyc/register
 *
 * The Oathstone extension calls this endpoint after the user approves the RKYC popup.
 * Verifies the ES256 JWT using Oathstone's public JWKS — no API key required.
 *
 * This is the only server-side code you need to add to integrate RKYC.
 */
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";

const JWKS = createRemoteJWKSet(
  new URL(
    process.env.NEXT_PUBLIC_RKYC_JWKS_URL ??
      "https://enduring-salmon-903.convex.site/.well-known/rkyc-jwks.json"
  )
);

const ISSUER =
  process.env.NEXT_PUBLIC_RKYC_ISSUER ?? "https://business.oathstone.cloud";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const { jwt } = body as Record<string, unknown>;
  if (typeof jwt !== "string") {
    return NextResponse.json({ error: "Missing jwt." }, { status: 400 });
  }

  const siteOrigin =
    req.headers.get("origin") ??
    req.nextUrl.origin;

  try {
    const { payload } = await jwtVerify(jwt, JWKS, {
      issuer: ISSUER,
      audience: siteOrigin,
    });

    // payload.sub            → site-scoped nullifier (safe user ID, no PII)
    // payload.approvedFields → array of verified field names
    // payload.scope          → "identity.basic" | "identity.full" | ...

    return NextResponse.json({
      success: true,
      nullifier: payload.sub,
      approvedFields: (payload as Record<string, unknown>).approvedFields ?? [],
      scope: (payload as Record<string, unknown>).scope ?? "identity.basic",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "JWT verification failed.";
    return NextResponse.json({ success: false, error: message }, { status: 401 });
  }
}
