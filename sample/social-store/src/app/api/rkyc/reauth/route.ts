/**
 * POST /api/rkyc/reauth
 *
 * Called by the Oathstone extension for silent re-login when the user's
 * session has expired. Same JWT verification, just issues a fresh session.
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

  const b = body as Record<string, unknown>;
  const jwt = (b.jwt ?? b.signedPassportToken) as string | undefined;

  if (typeof jwt !== "string") {
    return NextResponse.json({ error: "Missing jwt." }, { status: 400 });
  }

  const siteOrigin = req.headers.get("origin") ?? req.nextUrl.origin;

  try {
    const { payload } = await jwtVerify(jwt, JWKS, {
      issuer: ISSUER,
      audience: siteOrigin,
    });

    return NextResponse.json({
      success: true,
      nullifier: payload.sub,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "JWT verification failed.";
    return NextResponse.json({ success: false, error: message }, { status: 401 });
  }
}
