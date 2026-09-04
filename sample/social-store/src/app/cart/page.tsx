"use client";

import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { formatPrice } from "@/lib/format";
import { Id } from "../../../convex/_generated/dataModel";

export default function CartPage() {
  const { isAuthenticated } = useConvexAuth();
  const cartItems = useQuery(api.cart.get);
  const removeItem = useMutation(api.cart.remove);
  const clearCart = useMutation(api.cart.clear);

  if (!isAuthenticated) {
    return (
      <div className="card" style={{ padding: 32, textAlign: "center" }}>
        <p className="text-muted">Sign in to view your cart.</p>
        <a href="/auth" className="btn btn-primary mt-4" style={{ display: "inline-flex" }}>
          Sign in
        </a>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="card" style={{ padding: 32, textAlign: "center" }}>
        <p className="text-muted">Your cart is empty.</p>
        <a href="/" className="btn btn-outline mt-4" style={{ display: "inline-flex" }}>
          Browse products
        </a>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-black" style={{ fontSize: 24 }}>Cart</h1>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => clearCart()}
        >
          Clear all
        </button>
      </div>

      <div className="card">
        {cartItems.map((item, i) => (
          <CartItemRow
            key={item._id}
            cartItemId={item._id}
            productId={item.productId}
            quantity={item.quantity}
            isLast={i === cartItems.length - 1}
            onRemove={() => removeItem({ cartItemId: item._id })}
          />
        ))}
      </div>

      <div
        className="flex items-center justify-between mt-4 card"
        style={{ padding: "16px 20px" }}
      >
        <span className="text-muted text-sm">{cartItems.length} item(s)</span>
        <button className="btn btn-primary">Checkout →</button>
      </div>
    </div>
  );
}

function CartItemRow({
  cartItemId,
  productId,
  quantity,
  isLast,
  onRemove,
}: {
  cartItemId: Id<"cartItems">;
  productId: Id<"products">;
  quantity: number;
  isLast: boolean;
  onRemove: () => void;
}) {
  const product = useQuery(api.products.getById, { productId });

  if (!product) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 20px",
        borderBottom: isLast ? "none" : "1px solid var(--border)",
      }}
    >
      <img
        src={product.imageUrl}
        alt={product.title}
        style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="font-bold truncate">{product.title}</p>
        <p className="text-sm text-muted">Qty: {quantity}</p>
      </div>
      <div style={{ textAlign: "right" }}>
        <p className="font-bold">{formatPrice(product.price * quantity)}</p>
        <button className="btn btn-danger btn-sm mt-2" onClick={onRemove}>
          Remove
        </button>
      </div>
    </div>
  );
}
