"use client";

import { useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface Props {
  merchant: Doc<"merchants">;
}

export function MerchantRow({ merchant }: Props) {
  const { isAuthenticated } = useConvexAuth();
  const isFollowing = useQuery(api.merchants.isFollowing, { merchantId: merchant._id });
  const toggleFollow = useMutation(api.merchants.toggleFollow);
  const router = useRouter();

  async function handleFollow() {
    if (!isAuthenticated) { router.push("/auth"); return; }
    await toggleFollow({ merchantId: merchant._id });
  }

  return (
    <div
      className="card flex items-center justify-between gap-4"
      style={{ padding: "14px 18px" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
        {/* Avatar */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "#1e293b",
            flexShrink: 0,
            overflow: "hidden",
            position: "relative",
          }}
        >
          {merchant.avatarUrl ? (
            <Image
              src={merchant.avatarUrl}
              alt={merchant.name}
              fill
              style={{ objectFit: "cover" }}
              sizes="44px"
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                color: "var(--gold)",
              }}
            >
              {merchant.name[0]}
            </div>
          )}
        </div>

        {/* Name + handle */}
        <div style={{ minWidth: 0 }}>
          <p className="font-bold truncate" style={{ fontSize: 14 }}>
            {merchant.name}
          </p>
          <p className="text-xs text-muted">@{merchant.handle}</p>
          {merchant.bio && (
            <p
              className="text-xs text-muted truncate"
              style={{ marginTop: 2, maxWidth: 280 }}
            >
              {merchant.bio}
            </p>
          )}
        </div>
      </div>

      {/* Right: follower count + follow button */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}
      >
        <span className="text-xs text-muted">
          {merchant.followerCount}{" "}
          {merchant.followerCount === 1 ? "follower" : "followers"}
        </span>
        <button
          className={`btn btn-sm ${isFollowing ? "btn-danger" : "btn-outline"}`}
          onClick={handleFollow}
        >
          {isFollowing ? "Unfollow" : "Follow"}
        </button>
      </div>
    </div>
  );
}
