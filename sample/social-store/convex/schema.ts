import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // ── Users (extends Convex Auth) ──────────────────────────────────────────
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    // RKYC fields — populated when user verifies via Oathstone
    rkycNullifier: v.optional(v.string()),   // jwt.sub — site-scoped, safe user ID
    rkycVerifiedAt: v.optional(v.number()),
    rkycApprovedFields: v.optional(v.array(v.string())),
    isRkycVerified: v.optional(v.boolean()),
  })
    .index("by_email", ["email"])
    .index("by_rkyc_nullifier", ["rkycNullifier"]),

  // ── Merchants ─────────────────────────────────────────────────────────────
  merchants: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    handle: v.string(),           // @handle
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    followerCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_handle", ["handle"]),

  // ── Products ──────────────────────────────────────────────────────────────
  products: defineTable({
    merchantId: v.id("merchants"),
    title: v.string(),
    description: v.string(),
    price: v.number(),            // in cents
    imageUrl: v.string(),
    category: v.string(),
    inStock: v.boolean(),
    likeCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_merchant", ["merchantId"])
    .index("by_category", ["category"]),

  // ── Likes (products) ─────────────────────────────────────────────────────
  likes: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_product", ["productId"])
    .index("by_user_and_product", ["userId", "productId"]),

  // ── Follows (merchants) ───────────────────────────────────────────────────
  follows: defineTable({
    followerId: v.id("users"),
    merchantId: v.id("merchants"),
    createdAt: v.number(),
  })
    .index("by_follower", ["followerId"])
    .index("by_merchant", ["merchantId"])
    .index("by_follower_and_merchant", ["followerId", "merchantId"]),

  // ── Cart ──────────────────────────────────────────────────────────────────
  cartItems: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    quantity: v.number(),
    addedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_product", ["userId", "productId"]),
});
