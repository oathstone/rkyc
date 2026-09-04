import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { merchantId: v.optional(v.id("merchants")) },
  handler: async (ctx, args) => {
    if (args.merchantId) {
      return ctx.db
        .query("products")
        .withIndex("by_merchant", (q) => q.eq("merchantId", args.merchantId!))
        .order("desc")
        .take(20);
    }
    return ctx.db.query("products").order("desc").take(40);
  },
});

export const getById = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => ctx.db.get(args.productId),
});

export const create = mutation({
  args: {
    merchantId: v.id("merchants"),
    title: v.string(),
    description: v.string(),
    price: v.number(),
    imageUrl: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required.");

    const merchant = await ctx.db.get(args.merchantId);
    if (!merchant || merchant.ownerId !== userId) {
      throw new Error("Not authorized for this merchant.");
    }

    return ctx.db.insert("products", {
      ...args,
      inStock: true,
      likeCount: 0,
      createdAt: Date.now(),
    });
  },
});

export const isLiked = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const like = await ctx.db
      .query("likes")
      .withIndex("by_user_and_product", (q) =>
        q.eq("userId", userId).eq("productId", args.productId)
      )
      .first();
    return !!like;
  },
});

export const toggleLike = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Authentication required.");

    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found.");

    const existing = await ctx.db
      .query("likes")
      .withIndex("by_user_and_product", (q) =>
        q.eq("userId", userId).eq("productId", args.productId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      await ctx.db.patch(args.productId, {
        likeCount: Math.max(0, product.likeCount - 1),
      });
      return { liked: false };
    } else {
      await ctx.db.insert("likes", {
        userId,
        productId: args.productId,
        createdAt: Date.now(),
      });
      await ctx.db.patch(args.productId, { likeCount: product.likeCount + 1 });
      return { liked: true };
    }
  },
});
