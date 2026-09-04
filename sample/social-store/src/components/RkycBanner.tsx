"use client";

import Link from "next/link";

interface Props {
  state: "probing" | "verified" | "idle";
  firstName?: string;
}

export function RkycBanner({ state, firstName }: Props) {
  if (state === "probing") return null;

  if (state === "verified") {
    return (
      <div className="rkyc-banner">
        <div>
          <div className="rkyc-banner-name">
            Welcome back, {firstName ?? "User"} ✓
          </div>
          <div className="rkyc-banner-sub">
            Verified via Oathstone · No sign-up required · Zero PII shared
          </div>
        </div>
        <span className="badge badge-gold">◈ Identity Verified</span>
      </div>
    );
  }

  return (
    <div className="rkyc-verify-prompt">
      <span>
        Have an Oathstone Passport?{" "}
        <a
          href="https://business.oathstone.cloud/oathstone-extension.zip"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--gold)" }}
        >
          Install the extension
        </a>{" "}
        to skip sign-up forever.
      </span>
      <Link href="/auth" className="btn btn-outline btn-sm">
        Sign in →
      </Link>
    </div>
  );
}
