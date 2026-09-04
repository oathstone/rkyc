import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return ctx.db.get(userId);
  },
});

/** Link an RKYC verification to the current user, or record it standalone. */
export const linkRkycVerification = mutation({
  args: {
    nullifier: v.string(),
    approvedFields: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    // If user is signed in, update their record
    if (userId) {
      await ctx.db.patch(userId, {
        rkycNullifier: args.nullifier,
        rkycVerifiedAt: Date.now(),
        rkycApprovedFields: args.approvedFields,
        isRkycVerified: true,
      });
      return { linked: true, userId };
    }

    // Check if nullifier already has a user
    const existing = await ctx.db
      .query("users")
      .withIndex("by_rkyc_nullifier", (q) => q.eq("rkycNullifier", args.nullifier))
      .first();

    if (existing) {
      return { linked: true, userId: existing._id };
    }

    // No match — caller should prompt sign-up
    return { linked: false, nullifier: args.nullifier };
  },
});

export const getUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => ctx.db.get(args.userId),
});
