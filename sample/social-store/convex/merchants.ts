import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("merchants").order("desc").take(20);
  },
});

export const getByHandle = query({
  args: { handle: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("merchants")
      .withIndex("by_handle", (q) => q.eq("handle", args.handle))
      .first();
  },
});

export const getById = query({
  args: { merchantId: v.id("merchants") },
  handler: async (ctx, args) => ctx.db.get(args.merchantId),
});

export const create = mutation({
  args: {
    name: v.string(),
    handle: v.string(),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required.");

    const existing = await ctx.db
      .query("merchants")
      .withIndex("by_handle", (q) => q.eq("handle", args.handle))
      .first();
    if (existing) throw new Error("Handle already taken.");

    return ctx.db.insert("merchants", {
      ownerId: userId,
      name: args.name,
      handle: args.handle,
      bio: args.bio,
      avatarUrl: args.avatarUrl,
      followerCount: 0,
      createdAt: Date.now(),
    });
  },
});

export const isFollowing = query({
  args: { merchantId: v.id("merchants") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const follow = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_merchant", (q) =>
        q.eq("followerId", userId).eq("merchantId", args.merchantId)
      )
      .first();
    return !!follow;
  },
});

export const toggleFollow = mutation({
  args: { merchantId: v.id("merchants") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required.");

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_follower_and_merchant", (q) =>
        q.eq("followerId", userId).eq("merchantId", args.merchantId)
      )
      .first();

    const merchant = await ctx.db.get(args.merchantId);
    if (!merchant) throw new Error("Merchant not found.");

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.merchantId, {
        followerCount: Math.max(0, merchant.followerCount - 1),
      });
      return { following: false };
    } else {
      await ctx.db.insert("follows", {
        followerId: userId,
        merchantId: args.merchantId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.merchantId, {
        followerCount: merchant.followerCount + 1,
      });
      return { following: true };
    }
  },
});
