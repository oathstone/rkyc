import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { api } from "./_generated/api";

const SEED_MERCHANTS = [
  {
    name: "Stride & Co",
    handle: "stride-co",
    bio: "Premium footwear for every occasion.",
    avatarUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=80&h=80&fit=crop",
  },
  {
    name: "Urban Thread",
    handle: "urban-thread",
    bio: "Streetwear that tells your story.",
    avatarUrl:
      "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=80&h=80&fit=crop",
  },
  {
    name: "Glow Lab",
    handle: "glow-lab",
    bio: "Clean beauty, real results.",
    avatarUrl:
      "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=80&h=80&fit=crop",
  },
];

const SEED_PRODUCTS = [
  {
    merchantHandle: "stride-co",
    title: "Air Runner Pro",
    description:
      "Lightweight training shoe with carbon-fibre midsole. Zero-drop heel, breathable mesh upper.",
    price: 12999,
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
    category: "footwear",
  },
  {
    merchantHandle: "stride-co",
    title: "Urban Hike Boot",
    description:
      "Waterproof leather boot. Vibram sole. Ready for city streets and trail paths.",
    price: 18900,
    imageUrl:
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80",
    category: "footwear",
  },
  {
    merchantHandle: "urban-thread",
    title: "Oversized Utility Jacket",
    description: "4-pocket cargo silhouette. 100% organic cotton canvas. Unisex fit.",
    price: 8900,
    imageUrl:
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80",
    category: "clothing",
  },
  {
    merchantHandle: "urban-thread",
    title: "Essential Hoodie",
    description:
      "400gsm French terry. Oversized hood, ribbed cuffs. Available in 6 colourways.",
    price: 6500,
    imageUrl:
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=80",
    category: "clothing",
  },
  {
    merchantHandle: "glow-lab",
    title: "Vitamin C Serum",
    description:
      "15% L-ascorbic acid. Brightens, firms, and evens tone. Suitable for all skin types.",
    price: 3900,
    imageUrl:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
    category: "beauty",
  },
  {
    merchantHandle: "glow-lab",
    title: "Hydra-Boost Moisturiser",
    description:
      "72-hour hydration with hyaluronic acid complex. Fragrance-free, dermatologist tested.",
    price: 4500,
    imageUrl:
      "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80",
    category: "beauty",
  },
];

export const seedData = action({
  args: {},
  handler: async (ctx): Promise<{ ok: boolean; message: string }> => {
    for (const m of SEED_MERCHANTS) {
      await ctx.runMutation(api.seed.insertMerchantIfNotExists, m);
    }
    for (const p of SEED_PRODUCTS) {
      await ctx.runMutation(api.seed.insertProductIfNotExists, p);
    }
    return {
      ok: true,
      message: `Seeded ${SEED_MERCHANTS.length} merchants and ${SEED_PRODUCTS.length} products.`,
    };
  },
});

export const insertMerchantIfNotExists = internalMutation({
  args: {
    name: v.string(),
    handle: v.string(),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("merchants")
      .withIndex("by_handle", (q) => q.eq("handle", args.handle))
      .first();
    if (existing) return existing._id;

    const ownerId = await ctx.db.insert("users", { name: args.name });

    return ctx.db.insert("merchants", {
      ownerId,
      name: args.name,
      handle: args.handle,
      bio: args.bio,
      avatarUrl: args.avatarUrl,
      followerCount: 0,
      createdAt: Date.now(),
    });
  },
});

export const insertProductIfNotExists = internalMutation({
  args: {
    merchantHandle: v.string(),
    title: v.string(),
    description: v.string(),
    price: v.number(),
    imageUrl: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    const merchant = await ctx.db
      .query("merchants")
      .withIndex("by_handle", (q) => q.eq("handle", args.merchantHandle))
      .first();
    if (!merchant) return null;

    const existing = await ctx.db
      .query("products")
      .withIndex("by_merchant", (q) => q.eq("merchantId", merchant._id))
      .filter((q) => q.eq(q.field("title"), args.title))
      .first();
    if (existing) return existing._id;

    return ctx.db.insert("products", {
      merchantId: merchant._id,
      title: args.title,
      description: args.description,
      price: args.price,
      imageUrl: args.imageUrl,
      category: args.category,
      inStock: true,
      likeCount: 0,
      createdAt: Date.now(),
    });
  },
});
