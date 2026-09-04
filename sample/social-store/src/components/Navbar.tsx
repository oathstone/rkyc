"use client";

import Link from "next/link";
import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";

export function Navbar() {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.currentUser);
  const { signOut } = useAuthActions();

  const cartItems = useQuery(api.cart.get);
  const cartCount = cartItems?.reduce((n, i) => n + i.quantity, 0) ?? 0;

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: "rgba(11,14,27,0.96)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "13px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        {/* Brand */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "var(--gold)", fontSize: 20 }}>◈</span>
          <span style={{ fontWeight: 800, fontSize: 16 }}>Oasis</span>
        </Link>

        {/* Nav links */}
        <nav
          style={{ display: "flex", gap: 20, fontSize: 13, color: "var(--muted)" }}
        >
          <Link href="/">Products</Link>
          <Link href="/merchants">Merchants</Link>
        </nav>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Cart */}
          <Link
            href="/cart"
            style={{
              fontSize: 13,
              color: "var(--muted)",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            🛒
            {cartCount > 0 && (
              <span
                style={{
                  background: "var(--gold)",
                  color: "#0b0e1b",
                  borderRadius: "50%",
                  fontSize: 10,
                  fontWeight: 800,
                  width: 16,
                  height: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {cartCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--green)",
                  background: "rgba(16,185,129,0.1)",
                  padding: "4px 10px",
                  borderRadius: 100,
                }}
              >
                {user?.name ?? user?.email?.split("@")[0] ?? "User"}
                {user?.isRkycVerified && " ◈"}
              </span>
              <button
                onClick={() => signOut()}
                className="btn btn-outline btn-sm"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link href="/auth" className="btn btn-primary btn-sm">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
