"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ProductCard } from "@/components/ProductCard";
import { MerchantRow } from "@/components/MerchantRow";
import { RkycBanner } from "@/components/RkycBanner";
import { probeExtension } from "@/lib/rkyc";

export default function HomePage() {
  const products = useQuery(api.products.list, {});
  const merchants = useQuery(api.merchants.list);
  const [rkycState, setRkycState] = useState<"probing" | "verified" | "idle">("probing");
  const [rkycFirstName, setRkycFirstName] = useState("");

  useEffect(() => {
    const cleanup = probeExtension(
      ({ firstName }) => {
        setRkycFirstName(firstName);
        setRkycState("verified");
      },
      () => setRkycState("idle")
    );
    return cleanup;
  }, []);

  return (
    <div>
      {/* RKYC status banner */}
      <RkycBanner state={rkycState} firstName={rkycFirstName} />

      {/* Merchants */}
      <section className="mb-4">
        <h2 className="font-bold mb-4" style={{ fontSize: 18 }}>Merchants</h2>
        <div className="merchant-list">
          {merchants === undefined ? (
            <p className="text-muted text-sm">Loading merchants...</p>
          ) : merchants.length === 0 ? (
            <p className="text-muted text-sm">
              No merchants yet.{" "}
              <a href="/seed" className="text-gold">Run the seed</a> to add demo data.
            </p>
          ) : (
            merchants.slice(0, 3).map((m) => (
              <MerchantRow key={m._id} merchant={m} />
            ))
          )}
        </div>
      </section>

      <hr className="divider" />

      {/* Products */}
      <section>
        <h2 className="font-bold mb-4" style={{ fontSize: 18 }}>Products</h2>
        {products === undefined ? (
          <p className="text-muted text-sm">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-muted text-sm">
            No products yet.{" "}
            <a href="/seed" className="text-gold">Run the seed</a> to add demo data.
          </p>
        ) : (
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
