"use client";

import { useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import { formatPrice } from "@/lib/format";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Props {
  product: Doc<"products">;
}

export function ProductCard({ product }: Props) {
  const { isAuthenticated } = useConvexAuth();
  const isLiked = useQuery(api.products.isLiked, { productId: product._id });
  const toggleLike = useMutation(api.products.toggleLike);
  const addToCart = useMutation(api.cart.add);
  const router = useRouter();

  async function handleLike() {
    if (!isAuthenticated) { router.push("/auth"); return; }
    await toggleLike({ productId: product._id });
  }

  async function handleCart() {
    if (!isAuthenticated) { router.push("/auth"); return; }
    await addToCart({ productId: product._id });
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column" }}>
      {/* Image */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "4/3",
          background: "#131933",
          overflow: "hidden",
        }}
      >
        <Image
          src={product.imageUrl}
          alt={product.title}
          fill
          style={{ objectFit: "cover" }}
          sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 25vw"
        />
        {!product.inStock && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--muted)",
            }}
          >
            Out of stock
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "14px 14px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <p
          className="font-bold truncate"
          style={{ fontSize: 14 }}
          title={product.title}
        >
          {product.title}
        </p>

        <p
          className="text-sm text-muted"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {product.description}
        </p>

        <span
          className="badge badge-blue"
          style={{ alignSelf: "flex-start", textTransform: "capitalize" }}
        >
          {product.category}
        </span>

        <div
          className="flex items-center justify-between"
          style={{ marginTop: "auto", paddingTop: 8 }}
        >
          <span className="font-bold" style={{ fontSize: 15 }}>
            {formatPrice(product.price)}
          </span>

          {/* Like */}
          <button
            onClick={handleLike}
            style={{
              background: "none",
              border: "none",
              fontSize: 13,
              color: isLiked ? "var(--red)" : "var(--dim)",
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              borderRadius: 6,
              transition: "color 0.15s",
            }}
            aria-label={isLiked ? "Unlike" : "Like"}
          >
            {isLiked ? "♥" : "♡"} {product.likeCount}
          </button>
        </div>

        <button
          className="btn btn-primary w-full"
          onClick={handleCart}
          disabled={!product.inStock}
          style={{ marginTop: 4 }}
        >
          {product.inStock ? "Add to cart" : "Out of stock"}
        </button>
      </div>
    </div>
  );
}
